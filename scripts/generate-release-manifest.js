#!/usr/bin/env node
/**
 * OB-031A: 生成机器可读的多仓发布 manifest（JSON + Markdown）。
 *
 * 采集内容：
 *   - 各仓 branch / HEAD / dirty 状态
 *   - 本地依赖覆盖层（node_modules 中来自本地仓库的包）聚合 sha256
 *   - GUI 生产构建、VM dist、Desktop Linux 产物、固件的校验和
 *   - registry 版本与本地覆盖层的对应关系
 *   - 兼容矩阵与测试矩阵（由 --extra 注入的 JSON 提供动态结果）
 *
 * 用法：
 *   node scripts/generate-release-manifest.js \
 *     --release-id OB-031-RC1 \
 *     [--out release/manifest-OB-031-RC1.json] \
 *     [--md release/manifest-OB-031-RC1.md] \
 *     [--extra /path/extra.json]
 *
 * 退出码 0 = 成功生成；任何仓库 dirty 会在 manifest 中如实标注。
 */


const {execFileSync} = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const GUI_ROOT = path.resolve(__dirname, '..');
const OB_ROOT = path.resolve(process.env.OPENBLOCK_ROOT || path.join(GUI_ROOT, '..'));

const argv = process.argv.slice(2);
const argValue = (flag, dflt) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : dflt;
};
const RELEASE_ID = argValue('--release-id', 'OB-031-RC1');
const OUT_JSON = path.resolve(GUI_ROOT, argValue('--out', `release/manifest-${RELEASE_ID}.json`));
const OUT_MD = path.resolve(GUI_ROOT, argValue('--md', `release/manifest-${RELEASE_ID}.md`));
const EXTRA = argValue('--extra', null);

const REPOS = [
    {name: 'openblock-gui', branch: 'dev-local'},
    {name: 'openblock-vm', branch: 'main'},
    {name: 'openblock-blocks', branch: 'main'},
    {name: 'openblock-l10n', branch: 'main'},
    {name: 'openblock-resource', branch: 'main-haoxue'},
    {name: 'openblock-link', branch: 'main-haoxue'},
    {name: 'openblock-desktop', branch: 'main'},
    {name: 'external-resources-v3', branch: 'main'},
    {name: 'firmware-esp32-ble', branch: 'master'},
    {name: 'openblock-link-desktop', branch: 'main'},
    {name: 'openblock-gui.worktrees/desktop', branch: 'desktop-haoxue', label: 'openblock-gui (desktop worktree)'}
];

const git = (dir, args) => execFileSync('git', ['-C', dir].concat(args), {
    maxBuffer: 16 * 1024 * 1024
}).toString()
    .trim();

const sha256File = file => crypto.createHash('sha256')
    .update(fs.readFileSync(file))
    .digest('hex');

const walk = (base, dir, list) => {
    for (const e of fs.readdirSync(path.join(base, dir), {withFileTypes: true})) {
        const rel = dir ? `${dir}/${e.name}` : e.name;
        if (e.isDirectory()) walk(base, rel, list);
        else if (e.isFile()) list.push(rel);
    }
    return list;
};

const aggregate = base => {
    const files = walk(base, '', []).sort();
    const hash = crypto.createHash('sha256');
    for (const rel of files) {
        hash.update(rel);
        hash.update('\0');
        hash.update(fs.readFileSync(path.join(base, rel)));
        hash.update('\0');
    }
    return {sha256: hash.digest('hex'), fileCount: files.length};
};

/* -------------------------- 采集 -------------------------- */

const manifest = {
    releaseId: RELEASE_ID,
    generatedAt: new Date().toISOString(),
    generator: 'openblock-gui/scripts/generate-release-manifest.js',
    note: 'openblock-gui 的 HEAD 为生成时代码状态；manifest 提交本身会在其上新增一个 commit。',
    toolchain: {
        nodeWebAndTests: process.version,
        nodeDesktopCompile: 'v16.20.2',
        electron: '22.3.27',
        webpackGui: '4.x (--openssl-legacy-provider)',
        npmLocalDeps: 'scripts/setup-local-deps.js (postinstall 自动同步本地多仓依赖)'
    },
    repos: [],
    localDependencyOverlay: [],
    artifacts: {},
    registry: {},
    compatibilityMatrix: {},
    testMatrix: {},
    hardwareAcceptance: {},
    platformDeployment: {}
};

for (const repo of REPOS) {
    const dir = path.join(OB_ROOT, repo.name);
    if (!fs.existsSync(path.join(dir, '.git'))) {
        manifest.repos.push({name: repo.label || repo.name, error: 'missing'});
        continue;
    }
    const head = git(dir, ['rev-parse', 'HEAD']);
    const branch = git(dir, ['branch', '--show-current']);
    const dirty = git(dir, ['status', '--short']).length > 0;
    const subject = git(dir, ['log', '-1', '--format=%s']);
    manifest.repos.push({
        name: repo.label || repo.name,
        branch,
        expectedBranch: repo.branch,
        head,
        dirty,
        lastCommitSubject: subject
    });
}

// 本地依赖覆盖层（读 setup-local-deps 的核对逻辑：直接聚合 node_modules 内容）
for (const pkg of ['hxblock-blocks', 'hxblock-l10n', 'openblock-vm']) {
    const dir = path.join(GUI_ROOT, 'node_modules', pkg);
    if (!fs.existsSync(dir)) continue;
    const agg = aggregate(dir);
    manifest.localDependencyOverlay.push({
        package: pkg,
        installedVersion: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version,
        aggregateSha256: agg.sha256,
        fileCount: agg.fileCount
    });
}

// GUI 构建
const buildDir = path.join(GUI_ROOT, 'build');
if (fs.existsSync(path.join(buildDir, 'index.html'))) {
    const agg = aggregate(buildDir);
    manifest.artifacts.guiBuild = {
        path: 'openblock-gui/build',
        aggregateSha256: agg.sha256,
        fileCount: agg.fileCount,
        keyFiles: {
            'index.html': sha256File(path.join(buildDir, 'index.html')),
            'static/lib.min.js': sha256File(path.join(buildDir, 'static', 'lib.min.js'))
        }
    };
}

// VM dist
const vmDist = path.join(OB_ROOT, 'openblock-vm', 'dist', 'web');
if (fs.existsSync(vmDist)) {
    manifest.artifacts.vmDistWeb = {
        path: 'openblock-vm/dist/web',
        keyFiles: Object.fromEntries(fs.readdirSync(vmDist)
            .filter(f => f.endsWith('.js'))
            .map(f => [f, sha256File(path.join(vmDist, f))]))
    };
}

// Desktop Linux 产物
const desktopBin = path.join(OB_ROOT, 'openblock-desktop', 'dist', 'linux-unpacked', 'hxblock-desktop');
if (fs.existsSync(desktopBin)) {
    const asar = path.join(OB_ROOT, 'openblock-desktop', 'dist', 'linux-unpacked', 'resources', 'app.asar');
    manifest.artifacts.desktopLinux = {
        path: 'openblock-desktop/dist/linux-unpacked',
        binarySha256: sha256File(desktopBin),
        appAsarSha256: fs.existsSync(asar) ? sha256File(asar) : null,
        platforms: {
            linux: 'dir 模式已构建（electron-builder --linux dir，compression=store）',
            windows: '未构建（OB-031D 明确记录：需 Windows 构建环境）',
            macos: '未构建（OB-031D 明确记录：需 macOS 构建环境）'
        }
    };
}

// 固件
const fwDist = path.join(OB_ROOT, 'firmware-esp32-ble', 'dist');
if (fs.existsSync(fwDist)) {
    manifest.artifacts.firmware = {
        path: 'firmware-esp32-ble/dist',
        files: Object.fromEntries(fs.readdirSync(fwDist)
            .filter(f => f.endsWith('.bin'))
            .map(f => [f, sha256File(path.join(fwDist, f))]))
    };
    const obble = path.join(OB_ROOT, 'firmware-esp32-ble', 'modules', 'obble.py');
    if (fs.existsSync(obble)) {
        manifest.artifacts.firmware.files['modules/obble.py'] = sha256File(obble);
    }
}

// 外部资源静态快照（GUI 内置副本）
const extStatic = path.join(GUI_ROOT, 'external-resources-static', 'external-resources');
if (fs.existsSync(extStatic)) {
    const agg = aggregate(extStatic);
    manifest.artifacts.externalResourcesStatic = {
        path: 'openblock-gui/external-resources-static/external-resources',
        aggregateSha256: agg.sha256,
        fileCount: agg.fileCount
    };
}

// 积木能力注册表（AI-032：external-resources-v3 生成产物，与 RC 关联的 checksum）
const capRegistryDir = path.join(OB_ROOT, 'external-resources-v3', 'registry');
if (fs.existsSync(capRegistryDir)) {
    manifest.blockCapabilityRegistry = {};
    const capRegistryFiles = fs.readdirSync(capRegistryDir)
        .filter(n => n.endsWith('.json'))
        .sort();
    for (const f of capRegistryFiles) {
        const file = path.join(capRegistryDir, f);
        const entry = {path: `external-resources-v3/registry/${f}`, sha256: sha256File(file)};
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (data.registryId) {
                entry.registryId = data.registryId;
                entry.schemaVersion = data.schemaVersion;
                entry.sourceCommit = data.source && data.source.commit;
                entry.extensionCount = data.extensionCount;
                entry.blockCount = data.blockCount;
            }
        } catch (e) { /* schema 文件等非注册表 JSON 只记 checksum */ }
        manifest.blockCapabilityRegistry[f] = entry;
    }
}

// registry 信息（本地覆盖层 vs registry 版本）
try {
    for (const pkg of ['hxblock-blocks', 'hxblock-l10n']) {
        const out = execFileSync('npm', ['view', pkg, 'version', 'dist.shasum', '--json'], {
            timeout: 20000
        }).toString();
        manifest.registry[pkg] = JSON.parse(out);
    }
    manifest.registry.note = '本地构建以 setup-local-deps 覆盖层为准；registry 记录仅用于对照。';
} catch (e) {
    manifest.registry.error = `npm view 失败（离线？）: ${e.message.split('\n')[0]}`;
}

// 附加动态数据（测试矩阵等）
if (EXTRA && fs.existsSync(EXTRA)) {
    Object.assign(manifest, JSON.parse(fs.readFileSync(EXTRA, 'utf8')));
}

/* -------------------------- 输出 -------------------------- */

fs.mkdirSync(path.dirname(OUT_JSON), {recursive: true});
fs.writeFileSync(OUT_JSON, `${JSON.stringify(manifest, null, 2)}\n`);

const mdRepoRows = manifest.repos.map(r =>
    `| ${r.name} | ${r.branch || '-'} | \`${(r.head || '').slice(0, 12)}\` | ` +
    `${r.dirty ? '**dirty**' : 'clean'} | ${r.lastCommitSubject || r.error || ''} |`).join('\n');

const mdOverlayRows = manifest.localDependencyOverlay.map(o =>
    `| ${o.package} | ${o.installedVersion} | \`${o.aggregateSha256.slice(0, 16)}…\` | ${o.fileCount} |`).join('\n');

const md = `# ${RELEASE_ID} 发布清单（自动生成）

生成时间：${manifest.generatedAt}
生成器：\`${manifest.generator}\`
完整机器可读版本：\`${path.relative(GUI_ROOT, OUT_JSON)}\`

> ${manifest.note}

## 1. 各仓 commit

| 仓库 | 分支 | HEAD | 状态 | 最近提交 |
| --- | --- | --- | --- | --- |
${mdRepoRows}

## 2. 本地依赖覆盖层（node_modules）

| 包 | 版本 | 聚合 sha256 | 文件数 |
| --- | --- | --- | --- |
${mdOverlayRows}

## 3. 构建产物校验和

${JSON.stringify(manifest.artifacts, null, 2)
        .split('\n')
        .map(l => `    ${l}`)
        .join('\n')}

## 3.1 积木能力注册表（AI-032）

${JSON.stringify(manifest.blockCapabilityRegistry || {}, null, 2)
        .split('\n')
        .map(l => `    ${l}`)
        .join('\n')}

## 4. 兼容矩阵

${JSON.stringify(manifest.compatibilityMatrix, null, 2)
        .split('\n')
        .map(l => `    ${l}`)
        .join('\n')}

## 5. 测试矩阵

${JSON.stringify(manifest.testMatrix, null, 2)
        .split('\n')
        .map(l => `    ${l}`)
        .join('\n')}

## 6. 真实硬件验收状态

${JSON.stringify(manifest.hardwareAcceptance, null, 2)
        .split('\n')
        .map(l => `    ${l}`)
        .join('\n')}

## 7. 平台部署

${JSON.stringify(manifest.platformDeployment, null, 2)
        .split('\n')
        .map(l => `    ${l}`)
        .join('\n')}
`;

fs.writeFileSync(OUT_MD, md);
process.stdout.write(`manifest 写入:\n  ${OUT_JSON}\n  ${OUT_MD}\n`);
