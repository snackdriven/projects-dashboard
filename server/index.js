import express from 'express';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, normalize } from 'path';
import { readdir, access, readFile, writeFile, unlink } from 'fs/promises';
import { constants, existsSync } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Metadata cache
const metadataCache = new Map();
const METADATA_CACHE_TTL = 10000; // 10 seconds
const GIT_CACHE_TTL = 30000; // 30 seconds for git status

// Process tracking for uptime and resource monitoring
const processTracker = new Map(); // projectName -> { startTime, pid }

// Detect if running in WSL (Windows Subsystem for Linux)
async function isWSL() {
  if (process.platform !== 'linux') return false;

  try {
    // Check for WSL-specific files
    if (existsSync('/proc/version')) {
      const version = await readFile('/proc/version', 'utf8');
      const lowerVersion = version.toLowerCase();
      return lowerVersion.includes('microsoft') || lowerVersion.includes('wsl');
    }
  } catch {
    // Ignore errors
  }

  return false;
}

// Cache WSL detection result at startup
const runningInWSL = await isWSL();
console.log(`🖥️  Platform: ${process.platform}, WSL: ${runningInWSL}`);

// Projects directory (within projects-dashboard)
const PROJECTS_DIR = resolve(join(__dirname, '..', 'projects'));

// Port assignments for each project (for status checking)
const PROJECT_PORTS = {
  'google-calendar-clone': 5173,
  'jira-wrapper': 5174,
  'lastfm-clone': 5175,
  'livejournal-clone': 5176,
  'react-ts-templates': 5177,
  'task-manager': 5178,
  'quantified-life': 5179,
};

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

// Cache management functions
function getCachedMetadata(projectName, cacheType = 'metadata') {
  const cacheKey = `${projectName}:${cacheType}`;
  const cached = metadataCache.get(cacheKey);
  const ttl = cacheType === 'git' ? GIT_CACHE_TTL : METADATA_CACHE_TTL;

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}

function setCachedMetadata(projectName, data, cacheType = 'metadata') {
  const cacheKey = `${projectName}:${cacheType}`;
  metadataCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

function invalidateCache(projectName) {
  // Remove all cache entries for this project
  const keysToDelete = [];
  for (const [key] of metadataCache) {
    if (key.startsWith(`${projectName}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => metadataCache.delete(key));
}

// Get git information for a project
async function getGitStatus(projectPath, projectName) {
  // Check cache first
  const cached = getCachedMetadata(projectName, 'git');
  if (cached) {
    return cached;
  }

  try {
    // Set timeout for all git operations
    const GIT_TIMEOUT = 5000;

    // Run git commands in parallel for speed
    const [branchResult, statusResult, lastCommitResult] = await Promise.allSettled([
      // Get current branch
      execAsync('git branch --show-current', {
        cwd: projectPath,
        timeout: GIT_TIMEOUT
      }),

      // Get uncommitted changes count
      execAsync('git status --porcelain', {
        cwd: projectPath,
        timeout: GIT_TIMEOUT
      }),

      // Get last commit info (hash|message|timestamp)
      execAsync('git log -1 --format="%H|%s|%at"', {
        cwd: projectPath,
        timeout: GIT_TIMEOUT
      })
    ]);

    const branch = branchResult.status === 'fulfilled'
      ? branchResult.value.stdout.trim()
      : 'unknown';

    const uncommittedChanges = statusResult.status === 'fulfilled'
      ? statusResult.value.stdout.trim().split('\n').filter(line => line.trim()).length
      : 0;

    let lastCommit = null;
    if (lastCommitResult.status === 'fulfilled') {
      const parts = lastCommitResult.value.stdout.trim().split('|');
      if (parts.length === 3) {
        lastCommit = {
          hash: parts[0].substring(0, 7), // Short hash
          message: parts[1],
          timestamp: new Date(parseInt(parts[2]) * 1000).toISOString()
        };
      }
    }

    // Get ahead/behind count (if remote tracking exists)
    let ahead = 0;
    let behind = 0;
    try {
      const { stdout: revListOut } = await execAsync(
        `git rev-list --left-right --count HEAD...origin/${branch}`,
        { cwd: projectPath, timeout: GIT_TIMEOUT }
      );
      const counts = revListOut.trim().split('\t');
      if (counts.length === 2) {
        ahead = parseInt(counts[0]) || 0;
        behind = parseInt(counts[1]) || 0;
      }
    } catch {
      // No remote tracking or other error - use defaults (0, 0)
    }

    const gitInfo = {
      branch,
      uncommittedChanges,
      ahead,
      behind,
      lastCommit
    };

    // Cache the result
    setCachedMetadata(projectName, gitInfo, 'git');

    return gitInfo;
  } catch (error) {
    // Not a git repo or git command failed
    console.log(`Git status failed for ${projectName}:`, error.message);
    return null;
  }
}

// Get process information for a running project
async function getProcessInfo(projectName, port) {
  const tracked = processTracker.get(projectName);

  if (!tracked || !tracked.startTime) {
    return null;
  }

  const uptime = Math.floor((Date.now() - tracked.startTime) / 1000);

  // Try to get memory usage (this is approximate - we can't easily get child process memory)
  let memory = null;

  if (process.platform === 'win32') {
    try {
      // Try to get memory from the PID if we have it
      if (tracked.pid) {
        const { stdout } = await execAsync(
          `tasklist /FI "PID eq ${tracked.pid}" /FO CSV /NH`,
          { timeout: 2000 }
        );
        const match = stdout.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
        if (match && match[5]) {
          // Memory is in KB format like "12,345 K"
          const memStr = match[5].replace(/[^\d]/g, '');
          memory = parseInt(memStr) * 1024; // Convert KB to bytes
        }
      }
    } catch {
      // Ignore - memory info is optional
    }
  } else {
    // Linux/Mac - try to get memory from port's process
    try {
      const { stdout } = await execAsync(`lsof -ti :${port}`, { timeout: 2000 });
      const pid = stdout.trim().split('\n')[0];
      if (pid && !isNaN(pid)) {
        const { stdout: psOut } = await execAsync(
          `ps -o rss= -p ${pid}`,
          { timeout: 2000 }
        );
        const rssKb = parseInt(psOut.trim());
        if (!isNaN(rssKb)) {
          memory = rssKb * 1024; // Convert KB to bytes
        }
      }
    } catch {
      // Ignore - memory info is optional
    }
  }

  return {
    uptime,
    memory
  };
}

// Get complete project metadata
async function getProjectMetadata(projectName) {
  // Check cache first
  const cached = getCachedMetadata(projectName, 'metadata');
  if (cached) {
    return cached;
  }

  const projectPath = validateProjectPath(join(PROJECTS_DIR, projectName));
  const port = PROJECT_PORTS[projectName] || 5173;

  // Check if project is running
  const isRunning = await isPortInUse(port);
  const state = isRunning ? 'running' : 'stopped';

  // Get tracking info
  const tracked = processTracker.get(projectName);
  const lastStarted = tracked?.startTime ? new Date(tracked.startTime).toISOString() : null;
  const since = isRunning && lastStarted ? lastStarted : null;

  // Build base metadata
  const metadata = {
    name: projectName,
    path: projectPath,
    port,
    status: {
      state,
      ...(since && { since })
    },
    url: `http://localhost:${port}`,
    ...(lastStarted && { lastStarted })
  };

  // Get process info if running (uptime, memory)
  if (isRunning) {
    const processInfo = await getProcessInfo(projectName, port);
    if (processInfo) {
      if (processInfo.uptime !== undefined) {
        metadata.uptime = processInfo.uptime;
      }
      if (processInfo.memory !== null) {
        metadata.memory = processInfo.memory;
      }
    }
  }

  // Get git status (runs in parallel with process info, cached separately)
  const gitInfo = await getGitStatus(projectPath, projectName);
  if (gitInfo) {
    metadata.git = gitInfo;
  }

  // Cache the complete metadata
  setCachedMetadata(projectName, metadata, 'metadata');

  return metadata;
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

// Get project metadata (comprehensive information)
app.get('/api/projects/:name/metadata', async (req, res) => {
  try {
    let name;
    try {
      name = sanitizeProjectName(req.params.name);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid project name' });
    }

    // Verify project exists
    const projectPath = validateProjectPath(join(PROJECTS_DIR, name));
    try {
      await access(projectPath, constants.F_OK);
    } catch {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get comprehensive metadata
    const metadata = await getProjectMetadata(name);
    res.json(metadata);
  } catch (error) {
    console.error('Error getting project metadata:', error);
    res.status(500).json({ error: 'Failed to get project metadata' });
  }
});

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
        // Fallback: check if project's assigned port is in use
        const port = PROJECT_PORTS[name] || 5173;
        try {
          isRunning = await isPortInUse(port);
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

    // Invalidate cache for this project
    invalidateCache(name);

    // Track process start time
    processTracker.set(name, {
      startTime: Date.now(),
      pid: null // Will be updated if we can get it
    });

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
    
    // Get the port for this project
    const port = PROJECT_PORTS[name] || 5173;

    // Launch the project in a new terminal window
    // Use the validated path (already normalized and safe)
    let command;

    if (process.platform === 'win32' || runningInWSL) {
      // Windows or WSL: use batch file approach to avoid quote escaping issues
      let windowsPath = projectPath;

      // Convert WSL path to Windows path if necessary
      if (runningInWSL) {
        // Use wslpath for reliable path conversion
        try {
          windowsPath = execSync(`wslpath -w "${projectPath}"`).toString().trim();
        } catch (pathError) {
          console.error('Error converting path:', pathError);
          return res.status(500).json({ error: 'Failed to convert path' });
        }
      }

      // Create a temporary batch file to avoid all quote escaping issues
      // Run through WSL to use the Linux bindings that were installed
      // Use explicit npm path to avoid Windows PATH pollution (nvm4w interference)
      const wslPath = projectPath; // Keep the WSL path for execution
      const nodeDir = '/home/kg/.nvm/versions/node/v22.20.0/bin'; // Node.js bin directory
      const npmPath = `${nodeDir}/npm`; // Explicit WSL npm
      const batchContent = `@echo off
title ${name}
echo Starting ${name} via WSL...
wsl bash -c "cd '${wslPath}' && PATH=${nodeDir}:\\$PATH ${npmPath} run dev"
pause
`;

      const batchPath = join(projectPath, `.launch-${name}.bat`);

      // Write batch file and launch it
      writeFile(batchPath, batchContent)
        .then(() => {
          // Convert batch file path to Windows format for execution
          let batchWindowsPath = batchPath;
          if (runningInWSL) {
            try {
              batchWindowsPath = execSync(`wslpath -w "${batchPath}"`).toString().trim();
            } catch (e) {
              batchWindowsPath = batchPath;
            }
          }

          // Launch the batch file in a new window
          if (runningInWSL) {
            command = `cmd.exe /c start "" "${batchWindowsPath}"`;
          } else {
            command = `start "" "${batchWindowsPath}"`;
          }

          exec(command, { timeout: 10000, windowsHide: false }, (error) => {
            // Clean up batch file after a delay
            setTimeout(() => {
              unlink(batchPath).catch(() => {/* ignore cleanup errors */});
            }, 5000);

            // The 'start' command returns immediately, which can cause SIGTERM
            // This is expected behavior, not an actual error
            if (error && error.signal !== 'SIGTERM') {
              console.error('Error launching project:', error);
              return res.status(500).json({ error: 'Failed to launch project' });
            }

            // Auto-open browser after a delay (wait for dev server to start)
            setTimeout(() => {
              const url = `http://localhost:${port}`;
              let browserCommand;

              if (process.platform === 'win32' || runningInWSL) {
                // Windows or WSL: use Windows start command
                if (runningInWSL) {
                  browserCommand = `cmd.exe /c start "" "${url}"`;
                } else {
                  browserCommand = `start "" "${url}"`;
                }
              } else if (process.platform === 'darwin') {
                browserCommand = `open "${url}"`;
              } else {
                browserCommand = `xdg-open "${url}"`;
              }

              exec(browserCommand, (browserError) => {
                if (browserError) {
                  console.error('Error opening browser:', browserError);
                }
              });
            }, 4000); // Wait 4 seconds for dev server to start

            res.json({ success: true, message: `Launching ${name}...`, port });
          });
        })
        .catch((writeError) => {
          console.error('Error creating batch file:', writeError);
          return res.status(500).json({ error: 'Failed to create launch script' });
        });
    } else if (process.platform === 'darwin') {
      // macOS: open new terminal window
      const safePath = projectPath.replace(/'/g, "'\\''");
      command = `osascript -e 'tell app "Terminal" to do script "cd '${safePath}' && npm run dev"'`;

      exec(command, { timeout: 10000 }, (error) => {
        if (error) {
          console.error('Error launching project:', error);
          return res.status(500).json({ error: 'Failed to launch project' });
        }

        setTimeout(() => {
          exec(`open "http://localhost:${port}"`, (browserError) => {
            if (browserError) console.error('Error opening browser:', browserError);
          });
        }, 4000);

        res.json({ success: true, message: `Launching ${name}...`, port });
      });
    } else {
      // Native Linux: open new terminal
      const safePath = projectPath.replace(/'/g, "'\\''");
      command = `which gnome-terminal > /dev/null 2>&1 && gnome-terminal -- bash -c "cd '${safePath}' && npm run dev; exec bash" || which xterm > /dev/null 2>&1 && xterm -e "cd '${safePath}' && npm run dev; bash" || x-terminal-emulator -e "cd '${safePath}' && npm run dev; bash"`;

      exec(command, { timeout: 10000 }, (error) => {
        if (error) {
          console.error('Error launching project:', error);
          return res.status(500).json({ error: 'Failed to launch project' });
        }

        setTimeout(() => {
          exec(`xdg-open "http://localhost:${port}"`, (browserError) => {
            if (browserError) console.error('Error opening browser:', browserError);
          });
        }, 4000);

        res.json({ success: true, message: `Launching ${name}...`, port });
      });
    }
  } catch (error) {
    console.error('Error launching project:', error);
    res.status(500).json({ error: 'Failed to launch project' });
  }
});

// Force close a project
app.post('/api/projects/:name/close', async (req, res) => {
  try {
    let name;
    try {
      name = sanitizeProjectName(req.params.name);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid project name' });
    }

    // Invalidate cache and clear process tracking
    invalidateCache(name);
    processTracker.delete(name);

    const projectPath = validateProjectPath(join(PROJECTS_DIR, name));
    const port = PROJECT_PORTS[name] || 5173;
    const normalizedPath = normalize(projectPath).replace(/\\/g, '\\\\');
    
    let killedCount = 0;
    
    try {
      if (process.platform === 'win32') {
        // Windows: Multiple methods for reliability
        const pids = new Set();
        
        // Method 1: Find by port using netstat (most reliable for dev servers)
        try {
          const { stdout: netstatOut } = await execAsync(
            `netstat -ano | findstr ":${port}"`,
            { timeout: 5000 }
          );
          
          // Parse netstat output: TCP    0.0.0.0:5173    0.0.0.0:0    LISTENING    12345
          const lines = netstatOut.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            const match = line.match(/\s+(\d+)\s*$/);
            if (match) {
              const pid = match[1].trim();
              if (pid && !isNaN(pid) && pid !== '0') {
                pids.add(pid);
              }
            }
          });
        } catch (netstatError) {
          console.log(`Netstat method failed for ${name}:`, netstatError.message);
        }
        
        // Method 2: Find by project path in commandline (catches npm/vite processes)
        try {
          // Escape backslashes and quotes for WMIC
          const escapedPath = normalizedPath.replace(/\\/g, '\\\\').replace(/'/g, "''");
          const { stdout: wmicOut } = await execAsync(
            `wmic process where "commandline like '%${escapedPath}%' and (name='node.exe' or name='npm.cmd' or name='npm')" get processid,parentprocessid /format:value`,
            { timeout: 5000 }
          );
          
          const lines = wmicOut.split('\n').filter(line => line.trim());
          let currentPid = null;
          lines.forEach(line => {
            if (line.startsWith('ProcessId=')) {
              currentPid = line.replace('ProcessId=', '').trim();
            } else if (line.startsWith('ParentProcessId=') && currentPid) {
              // Add both parent and child PIDs
              const parentPid = line.replace('ParentProcessId=', '').trim();
              if (currentPid && !isNaN(currentPid) && currentPid !== '0') {
                pids.add(currentPid);
              }
              if (parentPid && !isNaN(parentPid) && parentPid !== '0') {
                pids.add(parentPid);
              }
              currentPid = null;
            }
          });
        } catch (wmicError) {
          console.log(`WMIC method failed for ${name}:`, wmicError.message);
        }
        
        // Method 3: Find by project name in commandline (fallback)
        try {
          const escapedName = name.replace(/'/g, "''");
          const { stdout: wmicNameOut } = await execAsync(
            `wmic process where "commandline like '%${escapedName}%' and (name='node.exe' or name='npm.cmd' or name='npm')" get processid /format:value`,
            { timeout: 5000 }
          );
          
          wmicNameOut.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('ProcessId='))
            .forEach(line => {
              const pid = line.replace('ProcessId=', '').trim();
              if (pid && !isNaN(pid) && pid !== '0') {
                pids.add(pid);
              }
            });
        } catch (wmicNameError) {
          console.log(`WMIC name method failed for ${name}:`, wmicNameError.message);
        }
        
        // Kill all found PIDs and their children
        if (pids.size > 0) {
          const killPromises = Array.from(pids).map(async (pid) => {
            try {
              // Kill the process and its children
              await execAsync(`taskkill /F /T /PID ${pid}`, { timeout: 3000 });
              killedCount++;
              return true;
            } catch (killError) {
              // Process might already be dead, try without /T flag
              try {
                await execAsync(`taskkill /F /PID ${pid}`, { timeout: 3000 });
                killedCount++;
                return true;
              } catch {
                // Ignore - process might not exist
                return false;
              }
            }
          });
          
          await Promise.allSettled(killPromises);
        }
      } else if (process.platform === 'darwin') {
        // macOS: Kill by port and process tree
        try {
          // Kill by port (gets the process tree)
          const { stdout: lsofOut } = await execAsync(`lsof -ti :${port}`, { timeout: 5000 });
          const portPids = lsofOut.trim().split('\n').filter(pid => pid && !isNaN(pid));
          
          for (const pid of portPids) {
            try {
              // Kill process and its children
              await execAsync(`pkill -P ${pid} -9 2>/dev/null || kill -9 ${pid} 2>/dev/null || true`, { timeout: 3000 });
              killedCount++;
            } catch {
              // Ignore
            }
          }
        } catch {
          // Ignore
        }
        
        // Also try by project name
        const escapedName = name.replace(/[^a-zA-Z0-9_-]/g, '');
        try {
          await execAsync(`pkill -f "node.*${escapedName}" || true`, { timeout: 5000 });
          killedCount++;
        } catch {
          // Ignore
        }
      } else {
        // Linux: Kill by port and process tree
        try {
          // Kill by port using fuser (kills process tree)
          await execAsync(`fuser -k ${port}/tcp 2>/dev/null || true`, { timeout: 5000 });
          killedCount++;
        } catch {
          try {
            // Alternative: use lsof and kill process tree
            const { stdout: lsofOut } = await execAsync(`lsof -ti :${port}`, { timeout: 5000 });
            const portPids = lsofOut.trim().split('\n').filter(pid => pid && !isNaN(pid));
            
            for (const pid of portPids) {
              try {
                await execAsync(`pkill -P ${pid} -9 2>/dev/null || kill -9 ${pid} 2>/dev/null || true`, { timeout: 3000 });
                killedCount++;
              } catch {
                // Ignore
              }
            }
          } catch {
            // Ignore
          }
        }
        
        // Also try by project name
        const escapedName = name.replace(/[^a-zA-Z0-9_-]/g, '');
        try {
          await execAsync(`pkill -f "node.*${escapedName}" || true`, { timeout: 5000 });
          killedCount++;
        } catch {
          // Ignore
        }
      }
      
      console.log(`Force closed ${name}: killed ${killedCount} process(es)`);
      res.json({ success: true, message: `Force closed ${name}`, killed: killedCount });
    } catch (error) {
      console.error('Error force closing project:', error);
      res.json({ success: true, message: `Attempted to force close ${name}`, killed: killedCount });
    }
  } catch (error) {
    console.error('Error force closing project:', error);
    res.status(500).json({ error: 'Failed to force close project' });
  }
});

// ============================================================================
// MCP Proxy Endpoint - Memory Shack Operations
// ============================================================================

/**
 * Valid MCP tool names for memory-shack server
 * Timeline tools: store, query, update, delete events
 * Memory tools: KV storage operations
 */
const VALID_MCP_TOOLS = {
  // Timeline tools
  'store_timeline_event': { category: 'timeline', description: 'Store a new timeline event' },
  'get_timeline': { category: 'timeline', description: 'Get events for a specific date' },
  'get_event': { category: 'timeline', description: 'Get a single event by ID' },
  'expand_event': { category: 'timeline', description: 'Store full event data' },
  'get_timeline_range': { category: 'timeline', description: 'Get events across date range' },
  'delete_event': { category: 'timeline', description: 'Delete a timeline event' },
  'update_event': { category: 'timeline', description: 'Update an existing event' },
  'get_timeline_summary': { category: 'timeline', description: 'Get event statistics' },
  'get_event_types': { category: 'timeline', description: 'Get all event types' },

  // Memory (KV) tools
  'store_memory': { category: 'memory', description: 'Store a key-value memory' },
  'retrieve_memory': { category: 'memory', description: 'Retrieve a memory by key' },
  'delete_memory': { category: 'memory', description: 'Delete a memory by key' },
  'list_memories': { category: 'memory', description: 'List all memories' },
  'search_memories': { category: 'memory', description: 'Search memories by content' },
  'bulk_store_memories': { category: 'memory', description: 'Store multiple memories' },
  'bulk_delete_memories': { category: 'memory', description: 'Delete memories by pattern' },
  'has_memory': { category: 'memory', description: 'Check if memory exists' },
  'update_memory_ttl': { category: 'memory', description: 'Update memory TTL' },
  'get_memory_stats': { category: 'memory', description: 'Get memory statistics' },
  'clean_expired_memories': { category: 'memory', description: 'Clean expired memories' },
};

/**
 * Call MCP tool by spawning the memory-shack server process
 *
 * @param {string} toolName - Name of the MCP tool to call
 * @param {Record<string, any>} args - Tool arguments
 * @returns {Promise<any>} Tool execution result
 */
async function callMCPTool(toolName, args = {}) {
  const { spawn } = await import('child_process');
  const mcpServerPath = resolve(join(__dirname, '..', 'projects', 'memory-shack', 'dist', 'mcp-server.js'));
  const dbPath = resolve(join(__dirname, '..', '.swarm', 'memory.db'));

  return new Promise((resolve, reject) => {
    // Spawn MCP server process
    const mcpProcess = spawn('node', [mcpServerPath], {
      env: {
        ...process.env,
        MEMORY_DB_PATH: dbPath,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timeoutHandle;

    // Set timeout (30 seconds for MCP operations)
    timeoutHandle = setTimeout(() => {
      mcpProcess.kill();
      reject(new Error('MCP operation timed out after 30 seconds'));
    }, 30000);

    // Collect stdout (MCP protocol uses JSON-RPC over stdio)
    mcpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr (for logging)
    mcpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process exit
    mcpProcess.on('close', (code) => {
      clearTimeout(timeoutHandle);

      if (code !== 0 && code !== null) {
        console.error(`MCP process exited with code ${code}`);
        console.error('stderr:', stderr);
        return reject(new Error(`MCP process failed with exit code ${code}`));
      }

      try {
        // Parse JSON-RPC responses from stdout
        // MCP server uses JSON-RPC 2.0 protocol
        const lines = stdout.trim().split('\n').filter(line => line.trim());

        // Find the tool response (skip initialization messages)
        let toolResponse = null;
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            // Look for result with content array (MCP tool response format)
            if (parsed.result && Array.isArray(parsed.result.content)) {
              toolResponse = parsed.result;
              break;
            }
          } catch {
            // Skip non-JSON lines
            continue;
          }
        }

        if (!toolResponse) {
          return reject(new Error('No valid MCP response received'));
        }

        // Parse the content text (which contains the actual tool result)
        const content = toolResponse.content[0];
        if (content && content.type === 'text') {
          const result = JSON.parse(content.text);

          // Check if it's an error response
          if (toolResponse.isError || result.error || result.success === false) {
            return reject(new Error(result.error || result.message || 'MCP tool execution failed'));
          }

          resolve(result);
        } else {
          reject(new Error('Invalid MCP response format'));
        }
      } catch (parseError) {
        console.error('Failed to parse MCP response:', parseError);
        console.error('stdout:', stdout);
        reject(new Error(`Failed to parse MCP response: ${parseError.message}`));
      }
    });

    // Handle spawn errors
    mcpProcess.on('error', (error) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`Failed to spawn MCP process: ${error.message}`));
    });

    // Send JSON-RPC request to MCP server
    try {
      // JSON-RPC 2.0 format for MCP
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      }) + '\n';

      mcpProcess.stdin.write(request);
      mcpProcess.stdin.end();
    } catch (writeError) {
      clearTimeout(timeoutHandle);
      mcpProcess.kill();
      reject(new Error(`Failed to write to MCP process: ${writeError.message}`));
    }
  });
}

/**
 * POST /api/mcp/memory-shack
 * Proxy endpoint for memory-shack MCP server operations
 *
 * Request body:
 * {
 *   tool: string,        // Tool name (e.g., 'store_timeline_event')
 *   arguments: object    // Tool-specific arguments
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: any           // Tool result data
 * }
 *
 * Error response:
 * {
 *   error: string       // Error message
 * }
 */
app.post('/api/mcp/memory-shack', async (req, res) => {
  const startTime = Date.now();

  try {
    const { tool, arguments: args } = req.body;

    // Validate request body
    if (!tool || typeof tool !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid "tool" parameter',
        hint: 'Request body must include { tool: string, arguments?: object }'
      });
    }

    // Validate tool name
    if (!VALID_MCP_TOOLS[tool]) {
      return res.status(400).json({
        error: `Unknown tool: ${tool}`,
        hint: 'Valid tools: ' + Object.keys(VALID_MCP_TOOLS).join(', '),
        availableTools: Object.entries(VALID_MCP_TOOLS).map(([name, info]) => ({
          name,
          category: info.category,
          description: info.description,
        })),
      });
    }

    // Validate arguments
    if (args !== undefined && (typeof args !== 'object' || Array.isArray(args))) {
      return res.status(400).json({
        error: 'Invalid "arguments" parameter',
        hint: 'Arguments must be an object (or omitted for tools with no parameters)'
      });
    }

    // Log request
    console.log(`[MCP] Calling tool: ${tool}`, args ? JSON.stringify(args).substring(0, 100) : '(no args)');

    // Call MCP tool
    const result = await callMCPTool(tool, args || {});

    const duration = Date.now() - startTime;
    console.log(`[MCP] Tool ${tool} completed in ${duration}ms`);

    // Return success response
    res.json({
      success: true,
      data: result,
      meta: {
        tool,
        category: VALID_MCP_TOOLS[tool].category,
        duration,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[MCP] Error after ${duration}ms:`, error.message);

    // Return error response
    res.status(500).json({
      error: error.message || 'MCP operation failed',
      meta: {
        tool: req.body?.tool,
        duration,
      },
    });
  }
});

/**
 * GET /api/mcp/memory-shack/tools
 * List all available MCP tools with descriptions
 */
app.get('/api/mcp/memory-shack/tools', (req, res) => {
  const tools = Object.entries(VALID_MCP_TOOLS).map(([name, info]) => ({
    name,
    category: info.category,
    description: info.description,
  }));

  const byCategory = {
    timeline: tools.filter(t => t.category === 'timeline'),
    memory: tools.filter(t => t.category === 'memory'),
  };

  res.json({
    tools,
    byCategory,
    totalCount: tools.length,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Dashboard server running on http://localhost:${PORT}`);
  console.log(`📁 Projects directory: ${PROJECTS_DIR}`);
  console.log(`🏠 MCP Proxy: /api/mcp/memory-shack (${Object.keys(VALID_MCP_TOOLS).length} tools)`);
});

