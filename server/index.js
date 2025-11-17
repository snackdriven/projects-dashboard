import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Projects directory (one level up from projects-dashboard)
const PROJECTS_DIR = join(__dirname, '..', '..', 'projects');

app.use(express.json());
app.use(express.static('dist'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
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
    const { name } = req.params;
    const projectPath = join(PROJECTS_DIR, name);
    
    // Default Vite port is 5173, but projects might use different ports
    // For now, we'll check if the dev server process is running
    let isRunning = false;
    
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync(`tasklist /FI "WINDOWTITLE eq *${name}*" /FO CSV`);
        isRunning = stdout.includes('node.exe') || stdout.includes('vite');
      } catch {
        // Try checking for node processes with the project name
        try {
          const { stdout } = await execAsync(`wmic process where "commandline like '%${name}%' and name='node.exe'" get processid`);
          isRunning = stdout.trim().length > 0 && !stdout.includes('No Instance(s)');
        } catch {
          isRunning = false;
        }
      }
    } else {
      try {
        const { stdout } = await execAsync(`ps aux | grep -i "${name}" | grep -v grep`);
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
    const { name } = req.params;
    const projectPath = join(PROJECTS_DIR, name);
    
    // Check if project directory exists
    try {
      await readdir(projectPath);
    } catch {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Launch the project in a new terminal window
    let command;
    if (process.platform === 'win32') {
      // Windows: open new cmd window and run npm run dev
      command = `start cmd.exe /K "cd /d "${projectPath}" && npm run dev"`;
    } else if (process.platform === 'darwin') {
      // macOS: open new terminal window
      command = `osascript -e 'tell app "Terminal" to do script "cd ${projectPath} && npm run dev"'`;
    } else {
      // Linux: open new terminal
      command = `gnome-terminal -- bash -c "cd ${projectPath} && npm run dev; exec bash"`;
    }
    
    exec(command, (error) => {
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

