#!/usr/bin/env node
/**
 * Start the production build:kids pipeline fully detached so callers with
 * a bounded execution window (MCP bridge, CI step timeouts) can poll the
 * log instead of holding the process. Streams stdout/stderr to
 * /tmp/gui-build.log and appends a final "=== EXIT <code> ===" marker.
 */
'use strict';

const {spawn} = require('child_process');
const fs = require('fs');
const path = require('path');

const logPath = '/tmp/gui-build.log';
const out = fs.openSync(logPath, 'w');

const nodeBin = path.dirname(process.execPath);
const env = Object.assign({}, process.env, {
    PATH: `${nodeBin}:${process.env.PATH}`,
    NODE_ENV: 'production',
    NODE_OPTIONS: '--max-old-space-size=8192 --openssl-legacy-provider'
});

const child = spawn('bash', ['-c', 'npm run build:kids; echo "=== EXIT $? ==="'], {
    cwd: path.join(__dirname, '..'),
    env,
    detached: true,
    stdio: ['ignore', out, out]
});
child.unref();

process.stdout.write(`started build pid=${child.pid}, log=${logPath}\n`);
