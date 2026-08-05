#!/usr/bin/env node
/**
 * OB-031B: 从本地兄弟仓库同步多仓依赖到 node_modules（替代手工复制）。
 *
 * 背景：npm install 会把 hxblock-blocks / hxblock-l10n 装成 registry 快照、
 * openblock-vm 装成 github 快照，与本地仓库提交不一致。本脚本在安装后用
 * 本地仓库实体覆盖这三个包，使 GUI 构建产物与本地多仓 commit 一一对应。
 *
 * 用法：
 *   node scripts/setup-local-deps.js            # 同步（postinstall 自动执行）
 *   node scripts/setup-local-deps.js --check    # 只校验是否同步，不修改
 *   OPENBLOCK_SKIP_LOCAL_DEPS=1 npm install     # 跳过（如纯 registry 构建）
 *   OPENBLOCK_ROOT=/path/to/openblock           # 显式指定多仓根目录
 *
 * 同步内容：
 *   hxblock-blocks  ← ../openblock-blocks   （git 跟踪文件 + dist/ + msg/）
 *   hxblock-l10n    ← ../openblock-l10n     （git 跟踪文件 + dist/ + locales/）
 *   openblock-vm    ← ../openblock-vm       （git 跟踪文件 + 嵌套 htmlparser2 闭包）
 *
 * openblock-vm 的嵌套闭包说明：GUI 顶层 htmlparser2 为 v10（ESM），webpack 4
 * 无法解析；openblock-vm 依赖 htmlparser2@3.10，必须嵌套安装在
 * node_modules/openblock-vm/node_modules 下。闭包从 VM 仓库自身的
 * node_modules 递归解析复制，无需网络。
 */
'use strict';

const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const GUI_ROOT = path.resolve(__dirname, '..');
const OB_ROOT = path.resolve(process.env.OPENBLOCK_ROOT || path.join(GUI_ROOT, '..'));
const CHECK_ONLY = process.argv.includes('--check');

const LOCAL_DEPS = [
    {
        pkg: 'hxblock-blocks',
        repo: 'openblock-blocks',
        // dist/ 由 `npm run prepublish`（python build.py && webpack）产出，未进 git
        extraDirs: ['dist', 'msg'],
        requiredFiles: ['dist/vertical.js', 'media/dropdown-arrow.svg'],
        buildHint: 'cd <repo> && npm ci && npm run prepublish  (需要 python3)'
    },
    {
        pkg: 'hxblock-l10n',
        repo: 'openblock-l10n',
        // dist/ 与 locales/ 由 `npm run build` 产出，未进 git
        extraDirs: ['dist', 'locales'],
        requiredFiles: ['dist/l10n.js', 'locales/editor-msgs.js'],
        buildHint: 'cd <repo> && npm ci && npm run build'
    },
    {
        pkg: 'openblock-vm',
        repo: 'openblock-vm',
        extraDirs: [],
        requiredFiles: ['src/index.js'],
        // GUI webpack 直接编译 VM src，无需 VM dist；但需要嵌套 htmlparser2 闭包
        nestedClosure: ['htmlparser2'],
        buildHint: 'cd <repo> && npm ci'
    }
];

const log = msg => process.stdout.write(`[setup-local-deps] ${msg}\n`);
const fail = msg => {
    process.stderr.write(`[setup-local-deps] ERROR: ${msg}\n`);
    process.exit(1);
};

if (process.env.OPENBLOCK_SKIP_LOCAL_DEPS === '1') {
    log('OPENBLOCK_SKIP_LOCAL_DEPS=1，跳过本地依赖同步');
    process.exit(0);
}

/** 列出源仓库 git 跟踪文件（相对路径） */
function gitTrackedFiles (repoDir) {
    const out = execFileSync('git', ['-C', repoDir, 'ls-files', '-z'], {
        maxBuffer: 64 * 1024 * 1024
    });
    return out.toString('utf8').split('\0').filter(Boolean);
}

/** 递归收集目录下所有文件（相对 base 的路径） */
function walkDir (base, dir, list) {
    const entries = fs.readdirSync(path.join(base, dir), {withFileTypes: true});
    for (const e of entries) {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) {
            walkDir(base, rel, list);
        } else if (e.isFile()) {
            list.push(rel);
        }
    }
    return list;
}

function copyFileWithDir (srcFile, destFile) {
    fs.mkdirSync(path.dirname(destFile), {recursive: true});
    fs.copyFileSync(srcFile, destFile);
}

/** 从 VM 仓库 node_modules 解析包的生产依赖闭包（含自身） */
function resolveClosure (repoNodeModules, rootPkgs) {
    const resolved = new Map();
    const queue = [...rootPkgs];
    while (queue.length > 0) {
        const name = queue.shift();
        if (resolved.has(name)) continue;
        const pkgDir = path.join(repoNodeModules, name);
        const pkgJsonPath = path.join(pkgDir, 'package.json');
        if (!fs.existsSync(pkgJsonPath)) {
            fail(`嵌套闭包缺少 ${name}（请先在 VM 仓库 npm ci）: ${pkgDir}`);
        }
        resolved.set(name, pkgDir);
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        for (const dep of Object.keys(pkgJson.dependencies || {})) {
            queue.push(dep);
        }
    }
    return resolved;
}

/** 计算一组文件的聚合 sha256（路径 + 内容，顺序稳定） */
function aggregateSha256 (baseDir, relFiles) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    for (const rel of [...relFiles].sort()) {
        hash.update(rel.replace(/\\/g, '/'));
        hash.update('\0');
        hash.update(fs.readFileSync(path.join(baseDir, rel)));
        hash.update('\0');
    }
    return hash.digest('hex');
}

/** 收集一个本地依赖应同步的文件清单（相对源仓库） */
function collectSourceFiles (dep, repoDir) {
    const files = new Set(gitTrackedFiles(repoDir).filter(f => !f.startsWith('.git')));
    for (const dir of dep.extraDirs) {
        if (fs.existsSync(path.join(repoDir, dir))) {
            walkDir(repoDir, dir, []).forEach(f => files.add(f));
        }
    }
    return [...files].filter(f => fs.existsSync(path.join(repoDir, f)));
}

function syncDep (dep) {
    const repoDir = path.join(OB_ROOT, dep.repo);
    const destDir = path.join(GUI_ROOT, 'node_modules', dep.pkg);

    if (!fs.existsSync(path.join(repoDir, 'package.json'))) {
        log(`跳过 ${dep.pkg}：本地仓库不存在 (${repoDir})，保留 npm 安装版本`);
        return {pkg: dep.pkg, status: 'repo-missing'};
    }

    for (const req of dep.requiredFiles) {
        if (!fs.existsSync(path.join(repoDir, req))) {
            fail(`${dep.repo} 缺少构建产物 ${req}。请先构建源仓库：${dep.buildHint.replace('<repo>', repoDir)}`);
        }
    }

    const srcFiles = collectSourceFiles(dep, repoDir);
    const srcHash = aggregateSha256(repoDir, srcFiles);

    // --check：对比现有 node_modules 内容
    const destExists = fs.existsSync(path.join(destDir, 'package.json'));
    let inSync = false;
    if (destExists) {
        const destFilesPresent = srcFiles.filter(f => fs.existsSync(path.join(destDir, f)));
        if (destFilesPresent.length === srcFiles.length) {
            inSync = aggregateSha256(destDir, srcFiles) === srcHash;
        }
    }

    const head = execFileSync('git', ['-C', repoDir, 'rev-parse', 'HEAD']).toString().trim();
    const dirty = execFileSync('git', ['-C', repoDir, 'status', '--short']).toString().trim().length > 0;
    const commitLabel = `${head.slice(0, 12)}${dirty ? '+dirty' : ''}`;

    if (CHECK_ONLY) {
        log(`${dep.pkg}: ${inSync ? 'in-sync' : 'OUT-OF-SYNC'} (source ${dep.repo}@${commitLabel}, files=${srcFiles.length}, sha256=${srcHash.slice(0, 16)}…)`);
        return {pkg: dep.pkg, status: inSync ? 'in-sync' : 'out-of-sync', commit: commitLabel, hash: srcHash};
    }

    if (inSync && !dep.nestedClosure) {
        log(`${dep.pkg}: 已同步，跳过 (source ${dep.repo}@${commitLabel})`);
        return {pkg: dep.pkg, status: 'in-sync', commit: commitLabel, hash: srcHash};
    }

    // 重建目标目录
    fs.rmSync(destDir, {recursive: true, force: true});
    for (const rel of srcFiles) {
        copyFileWithDir(path.join(repoDir, rel), path.join(destDir, rel));
    }

    // 嵌套依赖闭包（openblock-vm 的 htmlparser2@3.x）
    if (dep.nestedClosure) {
        const repoNodeModules = path.join(repoDir, 'node_modules');
        const closure = resolveClosure(repoNodeModules, dep.nestedClosure);
        const nestedRoot = path.join(destDir, 'node_modules');
        for (const [name, pkgDir] of closure) {
            const nestedFiles = walkDir(pkgDir, '.', []).filter(f => !f.split(path.sep).includes('node_modules'));
            for (const rel of nestedFiles) {
                copyFileWithDir(path.join(pkgDir, rel), path.join(nestedRoot, name, rel));
            }
        }
        log(`${dep.pkg}: 嵌套闭包 ${[...closure.keys()].join(', ')}`);
    }

    log(`${dep.pkg}: 已从 ${dep.repo}@${commitLabel} 同步 ${srcFiles.length} 个文件 (sha256=${srcHash.slice(0, 16)}…)`);
    return {pkg: dep.pkg, status: 'synced', commit: commitLabel, hash: srcHash};
}

const results = LOCAL_DEPS.map(syncDep);

if (CHECK_ONLY) {
    const bad = results.filter(r => r.status === 'out-of-sync');
    if (bad.length > 0) {
        fail(`以下本地依赖与 node_modules 不一致：${bad.map(r => r.pkg).join(', ')}（运行 npm run setup:local-deps 修复）`);
    }
}
log('done');
