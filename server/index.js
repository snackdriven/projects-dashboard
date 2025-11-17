import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, normalize } from 'path';
import { readdir, access } from 'fs/promises';
import { constants } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Projects directory (one level up from projects-dashboard)
const PROJECTS_DIR = resolve(join(__dirname, '..', '..', 'projects'));

// Sanitize project name to prevent path traversal and command injection
function sanitizeProjectName(name) {
  // Remove any path separators, dots that could be used for traversal
  // Only allow alphanumeric, hyphens, underscores
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '');
  // Ensure it's not empty and not just dots
  if (!sanitized || sanitized.length === 0 || sanitized.length > 100) {
    throw new Error('Invalid project name');
  }
  return sanitized;
}

// Validate project path is within PROJECTS_DIR (prevent path traversal)
function validateProjectPath(projectPath) {
  const normalized = normalize(resolve(projectPath));
  const baseDir = normalize(PROJECTS_DIR);
  if (!normalized.startsWith(baseDir)) {
    throw new Error('Invalid project path');
  }
  return normalized;
}

app.use(express.json());
app.use(express.static('dist'));

// CORS middleware - restrict to localhost for security
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow localhost and 127.0.0.1 for local development
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Get list of projects
app.get('/api/projects', async (req, res) => {
  try {
    const entries = await readdir(PROJECTS_DIR, { withFileTypes: true });
    const projects = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        name: entry.name,
        path: join(PROJECTS_DIR, entry.name),
      }));
    res.json(projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects directory' });
  }
});

// Check if a project is running (check if port is in use)
async function isPortInUse(port) {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      return stdout.trim().length > 0;
    } else {
      const { stdout } = await execAsync(`lsof -i :${port}`);
      return stdout.trim().length > 0;
    }
  } catch {
    return false;
  }
}

// Get project status
app.get('/api/projects/:name/status', async (req, res) => {
  try {
    let name;
    try {
      name = sanitizeProjectName(req.params.name);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid project name' });
    }
    
    const projectPath = validateProjectPath(join(PROJECTS_DIR, name));
    
    // Check if the dev server process is running by looking for node processes
    // that have the project name in their command line
    let isRunning = false;
    
    if (process.platform === 'win32') {
      try {
        // Escape the name for use in WMIC query to prevent injection
        const escapedName = name.replace(/'/g, "''");
        // Use timeout to prevent hanging
        const { stdout } = await Promise.race([
          execAsync(
            `wmic process where "commandline like '%${escapedName}%' and (name='node.exe' or name='node')" get processid`,
            { timeout: 5000 }
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        isRunning = stdout.trim().length > 0 && 
                   !stdout.includes('No Instance(s)') && 
                   stdout.includes('ProcessId');
      } catch {
        // Fallback: check if port 5173 (default Vite port) is in use
        // This is a simple heuristic - projects might use different ports
        try {
          isRunning = await isPortInUse(5173);
        } catch {
          isRunning = false;
        }
      }
    } else {
      try {
        // Escape name for shell safety
        const escapedName = name.replace(/[^a-zA-Z0-9_-]/g, '');
        const { stdout } = await Promise.race([
          execAsync(
            `ps aux | grep -i "[n]ode.*${escapedName}" | grep -v grep`,
            { timeout: 5000 }
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        isRunning = stdout.trim().length > 0;
      } catch {
        isRunning = false;
      }
    }
    
    res.json({ running: isRunning });
  } catch (error) {
    console.error('Error checking project status:', error);
    res.status(500).json({ error: 'Failed to check project status' });
  }
});

// Launch a project
app.post('/api/projects/:name/launch', async (req, res) => {
  try {
    let name;
    try {
      name = sanitizeProjectName(req.params.name);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid project name' });
    }
    
    const projectPath = validateProjectPath(join(PROJECTS_DIR, name));
    
    // Check if project directory exists and is accessible
    try {
      await access(projectPath, constants.F_OK);
      await readdir(projectPath);
    } catch {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if package.json exists
    try {
      await access(join(projectPath, 'package.json'), constants.F_OK);
    } catch {
      return res.status(400).json({ error: 'Project does not have package.json' });
    }
    
    // Launch the project in a new terminal window
    // Use the validated path (already normalized and safe)
    let command;
    if (process.platform === 'win32') {
      // Windows: open new cmd window and run npm run dev
      // Path is already validated, but escape quotes for cmd
      const safePath = projectPath.replace(/"/g, '""');
      command = `start cmd.exe /K "cd /d "${safePath}" && npm run dev"`;
    } else if (process.platform === 'darwin') {
      // macOS: open new terminal window
      // Escape single quotes and special chars for osascript
      const safePath = projectPath.replace(/'/g, "'\\''");
      command = `osascript -e 'tell app "Terminal" to do script "cd '${safePath}' && npm run dev"'`;
    } else {
      // Linux: open new terminal
      // Escape for bash
      const safePath = projectPath.replace(/'/g, "'\\''");
      command = `gnome-terminal -- bash -c "cd '${safePath}' && npm run dev; exec bash"`;
    }
    
    exec(command, { timeout: 10000 }, (error) => {
      if (error) {
        console.error('Error launching project:', error);
        return res.status(500).json({ error: 'Failed to launch project' });
      }
      res.json({ success: true, message: `Launching ${name}...` });
    });
  } catch (error) {
    console.error('Error launching project:', error);
    res.status(500).json({ error: 'Failed to launch project' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Dashboard server running on http://localhost:${PORT}`);
  console.log(`📁 Projects directory: ${PROJECTS_DIR}`);
});

