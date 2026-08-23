#!/usr/bin/env node
/**
 * OB-031B: 将 openblock-gui/build 部署到 kids-code-platform/scratch3。
 *
 * 特性：
 *   --dry-run        只打印将执行的变更（复制/删除/保护），不写任何文件
 *   --rollback [tar] 从备份回滚（缺省用最新备份）
 *   --list-backups   列出可用备份
 *   --no-backup      跳过部署前备份（不推荐）
 *
 * 流程（正式部署）：
 *   1. 前置检查：build/ 完整、目标存在；
 *   2. 备份：整个 scratch3 打包为 tar.gz（含 editor.html），写入
 *      <openblock>/.ob-deploy-backups/，附 meta.json 记录校验和；
 *   3. 暂存：build → scratch3.__staging-<ts>，再把受保护文件
 *      （editor.html 等）从现有 scratch3 原样复制进暂存目录；
 *   4. 校验：暂存目录（排除受保护文件）聚合 sha256 必须等于 build 聚合值；
 *   5. 原子切换：scratch3 → scratch3.__old-<ts>；暂存 → scratch3（两次 rename）；
 *   6. 部署后校验：再算一次聚合值 + 受保护文件逐一比对；任一失败自动回滚
 *      （rename 还原旧目录）；
 *   7. 成功后清理 __old 目录并按 --keep-backups（默认 5）修剪历史备份。
 *
 * 环境变量：
 *   DEPLOY_DEST    覆盖部署目标（默认 ../../kids-code-platform/scratch3）
 *   PROTECT_FILES  逗号分隔的顶层受保护文件/目录
 *                  （默认 editor.html,.DS_Store,mediapipe：mediapipe/ 是
 *                  kids-code-platform 侧用 fetch-mediapipe.sh 部署的模型镜像，
 *                  不属于 gui 构建产物，镜像式部署不得删除）
 *   BACKUP_DIR     覆盖备份目录（默认 <openblock>/.ob-deploy-backups）
 */
'use strict';

const {execFileSync} = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'build');
const DEST = path.resolve(
    process.env.DEPLOY_DEST ||
    path.join(__dirname, '..', '..', '..', 'kids-code-platform', 'scratch3')
);
const BACKUP_DIR = path.resolve(
    process.env.BACKUP_DIR || path.join(__dirname, '..', '..', '.ob-deploy-backups')
);

const PROTECTED_FILES = new Set(
    (process.env.PROTECT_FILES || 'editor.html,.DS_Store,mediapipe')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
);

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const NO_BACKUP = argv.includes('--no-backup');
const LIST_BACKUPS = argv.includes('--list-backups');
const ROLLBACK = argv.includes('--rollback');
const keepIdx = argv.indexOf('--keep-backups');
const KEEP_BACKUPS = keepIdx >= 0 ? parseInt(argv[keepIdx + 1], 10) : 5;

const ts = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const log = msg => process.stdout.write(`${msg}\n`);
const die = msg => {
    process.stderr.write(`ERROR: ${msg}\n`);
    process.exit(1);
};

/** 递归收集目录下所有文件相对路径 */
function walk (base, dir = '', list = []) {
    for (const e of fs.readdirSync(path.join(base, dir), {withFileTypes: true})) {
        const rel = dir ? `${dir}/${e.name}` : e.name;
        if (e.isDirectory()) walk(base, rel, list);
        else if (e.isFile()) list.push(rel);
    }
    return list;
}

/** 聚合 sha256（路径+内容，顺序稳定；可排除顶层受保护文件） */
function aggregateHash (base, excludeProtected) {
    const files = walk(base).filter(rel => {
        if (!excludeProtected) return true;
        return !PROTECTED_FILES.has(rel.split('/')[0]);
    });
    const hash = crypto.createHash('sha256');
    for (const rel of files.sort()) {
        hash.update(rel);
        hash.update('\0');
        hash.update(fs.readFileSync(path.join(base, rel)));
        hash.update('\0');
    }
    return {hash: hash.digest('hex'), fileCount: files.length};
}

function sha256File (file) {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function copyTree (srcBase, destBase, rels) {
    for (const rel of rels) {
        const to = path.join(destBase, rel);
        fs.mkdirSync(path.dirname(to), {recursive: true});
        fs.copyFileSync(path.join(srcBase, rel), to);
    }
}

function listBackups () {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    return fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.tar.gz'))
        .sort()
        .map(f => path.join(BACKUP_DIR, f));
}

/* ------------------------------------------------------------------ */

if (LIST_BACKUPS) {
    const backups = listBackups();
    if (backups.length === 0) {
        log(`(无备份: ${BACKUP_DIR})`);
    } else {
        for (const b of backups) {
            const meta = `${b}.meta.json`;
            let extra = '';
            if (fs.existsSync(meta)) {
                const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
                extra = `  contentHash=${(m.contentHashExclProtected || '').slice(0, 16)}…  files=${m.fileCount}`;
            }
            log(`${b}${extra}`);
        }
    }
    process.exit(0);
}

if (ROLLBACK) {
    if (!fs.existsSync(DEST)) die(`部署目标不存在: ${DEST}`);
    const backups = listBackups();
    const explicit = argv[argv.indexOf('--rollback') + 1];
    const tarFile = (explicit && !explicit.startsWith('--')) ? path.resolve(explicit) : backups[backups.length - 1];
    if (!tarFile || !fs.existsSync(tarFile)) die(`找不到备份文件${tarFile ? `: ${tarFile}` : ''}`);

    log(`Rollback from: ${tarFile}`);
    if (DRY_RUN) {
        log('[dry-run] 将执行：解包备份 → 暂存目录 → 原子切换回 scratch3');
        process.exit(0);
    }
    const staging = `${DEST}.__rollback-${ts()}`;
    fs.mkdirSync(staging, {recursive: true});
    execFileSync('tar', ['xzf', tarFile, '-C', staging, '--strip-components=1']);

    const old = `${DEST}.__old-${ts()}`;
    fs.renameSync(DEST, old);
    try {
        fs.renameSync(staging, DEST);
    } catch (e) {
        fs.renameSync(old, DEST); // 切换失败，还原
        die(`回滚切换失败已还原: ${e.message}`);
    }
    fs.rmSync(old, {recursive: true, force: true});

    const meta = `${tarFile}.meta.json`;
    if (fs.existsSync(meta)) {
        const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
        const {hash} = aggregateHash(DEST, true);
        if (m.contentHashExclProtected && m.contentHashExclProtected !== hash) {
            die(`回滚后校验不一致: 期望 ${m.contentHashExclProtected} 实际 ${hash}`);
        }
        log(`回滚后校验一致 (${hash.slice(0, 16)}…)`);
    }
    log('Rollback done.');
    process.exit(0);
}

/* ---------------------------- 正式部署 ---------------------------- */

if (!fs.existsSync(SRC)) die(`构建目录不存在: ${SRC}\n请先执行 npm run build`);
if (!fs.existsSync(path.join(SRC, 'index.html'))) die(`构建产物不完整（缺 index.html）: ${SRC}`);
if (!fs.existsSync(DEST)) die(`部署目标不存在: ${DEST}`);

const srcAgg = aggregateHash(SRC, false);
log(`Source:  ${SRC}`);
log(`  files=${srcAgg.fileCount}  sha256=${srcAgg.hash}`);
log(`Dest:    ${DEST}`);
log(`Protected: ${[...PROTECTED_FILES].join(', ')}`);

const srcFiles = new Set(walk(SRC));
const destFiles = new Set(fs.existsSync(DEST) ? walk(DEST) : []);

const toCopy = [];
const toRemove = [];
const skippedProtected = [];
for (const rel of srcFiles) {
    if (PROTECTED_FILES.has(rel.split('/')[0])) {
        skippedProtected.push(rel);
        continue;
    }
    toCopy.push(rel);
}
for (const rel of destFiles) {
    if (PROTECTED_FILES.has(rel.split('/')[0])) continue;
    if (!srcFiles.has(rel)) toRemove.push(rel);
}

log(`Plan: copy ${toCopy.length}, remove ${toRemove.length}, protect ${
    [...destFiles].filter(rel => PROTECTED_FILES.has(rel.split('/')[0])).length}`);

if (DRY_RUN) {
    for (const rel of toRemove) log(`  [dry-run] remove ${rel}`);
    const changed = toCopy.filter(rel => {
        const destFile = path.join(DEST, rel);
        if (!fs.existsSync(destFile)) return true;
        return sha256File(destFile) !== sha256File(path.join(SRC, rel));
    });
    log(`  [dry-run] changed/new files: ${changed.length} (unchanged ${toCopy.length - changed.length})`);
    for (const rel of changed.slice(0, 50)) log(`  [dry-run] copy ${rel}`);
    if (changed.length > 50) log(`  [dry-run] … 其余 ${changed.length - 50} 个略`);
    log('[dry-run] 未做任何修改。');
    process.exit(0);
}

// 1. 备份
let backupTar = null;
if (NO_BACKUP) {
    log('跳过备份 (--no-backup)');
} else {
    fs.mkdirSync(BACKUP_DIR, {recursive: true});
    backupTar = path.join(BACKUP_DIR, `scratch3-${ts()}.tar.gz`);
    const destAgg = aggregateHash(DEST, true);
    execFileSync('tar', ['czf', backupTar, '-C', path.dirname(DEST), path.basename(DEST)]);
    fs.writeFileSync(`${backupTar}.meta.json`, `${JSON.stringify({
        createdAt: new Date().toISOString(),
        dest: DEST,
        fileCount: destAgg.fileCount,
        contentHashExclProtected: destAgg.hash,
        protectedFiles: [...PROTECTED_FILES]
    }, null, 2)}\n`);
    log(`Backup: ${backupTar}`);
}

// 2. 暂存目录 = build 内容 + 受保护文件
const staging = `${DEST}.__staging-${ts()}`;
const protectedSnapshot = new Map();
try {
    fs.rmSync(staging, {recursive: true, force: true});
    fs.mkdirSync(staging, {recursive: true});
    copyTree(SRC, staging, toCopy);

    for (const rel of destFiles) {
        if (!PROTECTED_FILES.has(rel.split('/')[0])) continue;
        const from = path.join(DEST, rel);
        protectedSnapshot.set(rel, sha256File(from));
        const to = path.join(staging, rel);
        fs.mkdirSync(path.dirname(to), {recursive: true});
        fs.copyFileSync(from, to);
        log(`  keep protected ${rel}`);
    }

    // 3. 切换前校验
    const stagingAgg = aggregateHash(staging, true);
    if (stagingAgg.hash !== srcAgg.hash) {
        throw new Error(`暂存校验不一致: build=${srcAgg.hash} staging=${stagingAgg.hash}`);
    }
    log(`Staging verified (${stagingAgg.hash.slice(0, 16)}…)`);
} catch (e) {
    fs.rmSync(staging, {recursive: true, force: true});
    die(`暂存阶段失败（未触碰线上目录）: ${e.message}`);
}

// 4. 原子切换 + 部署后校验 + 失败自动回滚
const oldDir = `${DEST}.__old-${ts()}`;
fs.renameSync(DEST, oldDir);
let switched = false;
try {
    fs.renameSync(staging, DEST);
    switched = true;

    const postAgg = aggregateHash(DEST, true);
    if (postAgg.hash !== srcAgg.hash) {
        throw new Error(`部署后聚合校验不一致: 期望 ${srcAgg.hash} 实际 ${postAgg.hash}`);
    }
    for (const [rel, expected] of protectedSnapshot) {
        const actual = sha256File(path.join(DEST, rel));
        if (actual !== expected) {
            throw new Error(`受保护文件被改动: ${rel}`);
        }
    }
} catch (e) {
    // 自动回滚
    if (switched) {
        fs.rmSync(DEST, {recursive: true, force: true});
    } else {
        fs.rmSync(staging, {recursive: true, force: true});
    }
    fs.renameSync(oldDir, DEST);
    die(`部署失败已自动回滚: ${e.message}`);
}
fs.rmSync(oldDir, {recursive: true, force: true});

// 5. 修剪历史备份
if (!NO_BACKUP && Number.isFinite(KEEP_BACKUPS) && KEEP_BACKUPS > 0) {
    const backups = listBackups();
    for (const b of backups.slice(0, Math.max(0, backups.length - KEEP_BACKUPS))) {
        fs.rmSync(b, {force: true});
        fs.rmSync(`${b}.meta.json`, {force: true});
        log(`Pruned old backup: ${path.basename(b)}`);
    }
}

log(`Deploy done. content sha256(excl protected) = ${srcAgg.hash}`);
if (backupTar) log(`回滚命令: node scripts/deploy-to-kids-platform.js --rollback ${backupTar}`);
// 原子切换通过目录 rename 实现，运行中容器的 bind mount 仍指向旧 inode，
// 部署后必须重启挂载 scratch3 的容器，否则容器内看到空目录（404）。
log('注意: 原子切换会使运行中容器的 scratch3 bind mount 失效，' +
    '需重启相关容器（如 docker restart kidscode-nginx kidscode-e2e-nginx）。');
