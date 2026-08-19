import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import getPort from 'get-port';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('workspace');

export class WorkspaceService {
  private baseDir = path.join(process.cwd(), 'workspaces');
  private runningProcesses = new Map<string, any>();

  constructor() {
    fs.mkdir(this.baseDir, { recursive: true }).catch(console.error);
  }

  getWorkspaceDir(sessionId: string) {
    return path.join(this.baseDir, sessionId);
  }

  async deployProject(sessionId: string, files: { path: string, content: string }[]) {
    const workspaceDir = this.getWorkspaceDir(sessionId);
    
    // Clean existing workspace
    try { await fs.rm(workspaceDir, { recursive: true, force: true }); } catch {}
    await fs.mkdir(workspaceDir, { recursive: true });

    let hasPackageJson = false;

    // Write all files
    for (const file of files) {
      // Prevent directory traversal attacks
      const safePath = file.path.replace(/^(\.\.(\/|\\|$))+/, '');
      const filePath = path.join(workspaceDir, safePath);
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf8');
      
      if (safePath === 'package.json') {
        hasPackageJson = true;
      }
    }

    // Kill any existing process for this session
    if (this.runningProcesses.has(sessionId)) {
      this.runningProcesses.get(sessionId).kill();
      this.runningProcesses.delete(sessionId);
    }

    if (hasPackageJson) {
      const port = await getPort();
      
      // Try to determine the start script
      let pkg: any = {};
      try {
        pkg = JSON.parse(await fs.readFile(path.join(workspaceDir, 'package.json'), 'utf8'));
      } catch (e) {}

      let startCmd = 'node index.js'; // fallback
      if (pkg.scripts && pkg.scripts.start) startCmd = 'npm start';
      else if (pkg.scripts && pkg.scripts.dev) startCmd = 'npm run dev';

            return new Promise((resolve, reject) => {
        logger.info({ sessionId }, 'Installing dependencies...');
        const install = spawn('npm', ['install'], { cwd: workspaceDir, shell: true });
        
        let errorLogs = '';
        install.stderr.on('data', (data) => {
           errorLogs += data.toString();
        });

        install.on('close', (code) => {
          if (code !== 0) {
             const shortError = errorLogs.substring(errorLogs.length - 1000); // Send last 1000 chars to AI
             return reject(new Error(`npm install failed. Logs: ${shortError}`));
          }
          
          logger.info({ sessionId, port }, 'Starting app...');
          const [cmd, ...args] = startCmd.split(' ');
          const app = spawn(cmd, args, { 
            cwd: workspaceDir, 
            env: { ...process.env, PORT: port.toString() },
            shell: true 
          });
          
          this.runningProcesses.set(sessionId, app);
          
          // Wait a bit for the server to start
          setTimeout(() => {
            resolve({ url: `http://localhost:${port}` });
          }, 2000);
        });
      });
    } else {
      // Static files
      return { url: `/preview/${sessionId}/index.html` };
    }
  }
}

export const workspaceService = new WorkspaceService();

