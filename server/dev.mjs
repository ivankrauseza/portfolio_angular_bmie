import { spawn } from 'node:child_process';

const commands = [
  {
    name: 'api',
    command: process.execPath,
    args: ['--watch', 'server/api.mjs']
  },
  {
    name: 'angular',
    command: 'npx',
    args: ['ng', 'serve', '--host', '0.0.0.0', '--port', '4200', '--watch', '--live-reload', '--hmr']
  }
];

const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    env: process.env,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    console.error(`[${name}] exited with ${signal ?? code}`);
    shutdown(code ?? 1);
  });

  return child;
});

let shuttingDown = false;

function shutdown(code = 0) {
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(code), 250);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
