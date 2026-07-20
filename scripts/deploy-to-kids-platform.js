#!/usr/bin/env node
/**
 * 将 openblock-gui/build 同步到 kids-code-platform/scratch3。
 * 只覆盖构建产物，绝不删除/覆盖受保护文件（如 editor.html）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'build');
const DEST = path.resolve(
    process.env.DEPLOY_DEST ||
    path.join(__dirname, '..', '..', '..', 'kids-code-platform', 'scratch3')
);

/** 顶层受保护文件：不同步、不删除 */
const PROTECTED_FILES = new Set(
    (process.env.PROTECT_FILES || 'editor.html,.DS_Store')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
);

function ensureDir(dir) {
    fs.mkdirSync(dir, {recursive: true});
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

/**
 * 递归同步：用 src 覆盖 dest 中同名文件；
 * 删除 dest 中「本次构建应产出但已不存在」的文件；
 * 跳过受保护路径。
 */
function syncDir(srcDir, destDir, relBase) {
    ensureDir(destDir);

    const srcEntries = new Map(
        fs.readdirSync(srcDir, {withFileTypes: true}).map(e => [e.name, e])
    );
    const destEntries = fs.existsSync(destDir)
        ? fs.readdirSync(destDir, {withFileTypes: true})
        : [];

    // 删除 dest 多余文件（不在 src，且不受保护）
    for (const entry of destEntries) {
        const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
        const topName = rel.split('/')[0];
        if (PROTECTED_FILES.has(entry.name) || PROTECTED_FILES.has(rel) || PROTECTED_FILES.has(topName)) {
            continue;
        }
        // 顶层受保护文件名（即使在子路径同名也不误伤，仅按相对路径/顶层名判断）
        if (!relBase && PROTECTED_FILES.has(entry.name)) {
            continue;
        }
        if (!srcEntries.has(entry.name)) {
            const full = path.join(destDir, entry.name);
            fs.rmSync(full, {recursive: true, force: true});
            console.log(`  remove ${rel}`);
        }
    }

    // 复制/覆盖 src → dest
    for (const [name, entry] of srcEntries) {
        const rel = relBase ? `${relBase}/${name}` : name;
        if (!relBase && PROTECTED_FILES.has(name)) {
            console.log(`  skip protected ${name}`);
            continue;
        }
        const from = path.join(srcDir, name);
        const to = path.join(destDir, name);
        if (entry.isDirectory()) {
            syncDir(from, to, rel);
        } else {
            copyFile(from, to);
            console.log(`  copy ${rel}`);
        }
    }
}

function main() {
    if (!fs.existsSync(SRC)) {
        console.error(`构建目录不存在: ${SRC}\n请先执行 npm run build`);
        process.exit(1);
    }
    if (!fs.existsSync(DEST)) {
        console.error(`部署目标不存在: ${DEST}`);
        process.exit(1);
    }

    console.log(`Deploy: ${SRC}`);
    console.log(`    -> ${DEST}`);
    console.log(`Protected: ${[...PROTECTED_FILES].join(', ')}`);
    syncDir(SRC, DEST, '');
    console.log('Done. editor.html 等受保护文件已保留。');
}

main();
