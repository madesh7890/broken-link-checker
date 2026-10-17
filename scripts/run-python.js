#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const pythonPath = isWin
  ? path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe')
  : path.join(__dirname, '..', 'backend', 'venv', 'bin', 'python');

const proc = spawn(pythonPath, ['app.py'], {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit',
  shell: false
});

proc.on('error', (err) => {
  console.error('[BACKEND] Failed to start Python:', err.message);
  console.error('[BACKEND] Run start.bat first to create the venv.');
  process.exit(1);
});

proc.on('exit', (code) => process.exit(code ?? 0));
