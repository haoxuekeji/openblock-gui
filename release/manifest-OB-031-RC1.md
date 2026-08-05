# OB-031-RC1 发布清单（自动生成）

生成时间：2026-08-05T10:18:59.361Z
生成器：`openblock-gui/scripts/generate-release-manifest.js`
完整机器可读版本：`release/manifest-OB-031-RC1.json`

> openblock-gui 的 HEAD 为生成时代码状态；manifest 提交本身会在其上新增一个 commit。

## 1. 各仓 commit

| 仓库 | 分支 | HEAD | 状态 | 最近提交 |
| --- | --- | --- | --- | --- |
| openblock-gui | dev-local | `bdfd50e2e262` | **dirty** | fix: setup-local-deps 通用嵌套依赖自愈——版本比对后从源仓复制闭包（mqtt/immutable/htmlparser2） |
| openblock-vm | main | `d2af4c278702` | clean | test+fix: 恢复 tap 测试门禁并修复 sb2 扩展安装（OB-031C） |
| openblock-blocks | main | `885a6542adab` | clean | fix: MicroPython Python 代码生成修复 + Node 构建脚本 |
| openblock-l10n | main | `83851892c7dc` | clean | feat: 板载文件与硬件终端四语言翻译补全 |
| openblock-resource | main-haoxue | `fae2c8079773` | clean | test: 外部资源静态快照契约测试（OB-031C） |
| openblock-link | main-haoxue | `84b79bd50cab` | clean | test: 补充服务启动烟测替代空 test 脚本（OB-031C） |
| openblock-desktop | main | `695261827d4f` | clean | style: setup-local-deps 符合 desktop eslint 规则 |
| external-resources-v3 | main | `a7cc8ca73956` | clean | fix: oled 图标引用大小写与文件名一致（OB-031，Linux 部署 404 修复） |
| firmware-esp32-ble | master | `2da74d758c6e` | clean | fix: BLE UART 请求更大 ATT MTU |
| openblock-link-desktop | main | `5f0dfea7e67c` | clean | fix build |
| openblock-gui (desktop worktree) | desktop-haoxue | `083a54636417` | clean | Merge branch 'dev-local' into desktop-haoxue |

## 2. 本地依赖覆盖层（node_modules）

| 包 | 版本 | 聚合 sha256 | 文件数 |
| --- | --- | --- | --- |
| hxblock-blocks | 0.1.0-20260313161300 | `b37809101f7233b2…` | 333 |
| hxblock-l10n | 3.15.20260320201700 | `9347e9ff6724f1b4…` | 4332 |
| openblock-vm | 0.2.0 | `722abb989d653c2f…` | 1040 |

## 3. 构建产物校验和

    {
      "guiBuild": {
        "path": "openblock-gui/build",
        "aggregateSha256": "8729c5719f52a1d959e8cf85f57ec683b83574f3d7acd153b59bd75592bca51b",
        "fileCount": 4306,
        "keyFiles": {
          "index.html": "6ebd7a78df4a19b4981ca927318ef65b9a1f6a808f0e67cf601f3f6c8550b34b",
          "static/lib.min.js": "314b059c0fdf6ceef16df4eb00ff5ce3c8420d58e393eebcbd69c451ee2b84d4"
        }
      },
      "vmDistWeb": {
        "path": "openblock-vm/dist/web",
        "keyFiles": {
          "extension-worker.js": "60c92606bc11346e1d44f7b26a4f58e26e6152d415f43dd625aae1709466f13c",
          "openblock-vm.js": "0ba5cab267a1eb91c917082164a0bf1ef1adc818e2533ea265df61da065c60db",
          "openblock-vm.min.js": "3eeaaeea6d21abb71fae42dea002d9beacf4687ad609fd4a95ee0d253f682a47"
        }
      },
      "desktopLinux": {
        "path": "openblock-desktop/dist/linux-unpacked",
        "binarySha256": "361acca89a56d047ced1023774038832381f2d362a5327b12210891e34641321",
        "appAsarSha256": "ff6270fa997341ec0e0490c848549d67b2294fbb3ff2b30ef73072e52da41c9d",
        "platforms": {
          "linux": "dir 模式已构建（electron-builder --linux dir，compression=store）",
          "windows": "未构建（OB-031D 明确记录：需 Windows 构建环境）",
          "macos": "未构建（OB-031D 明确记录：需 macOS 构建环境）"
        }
      },
      "firmware": {
        "path": "firmware-esp32-ble/dist",
        "files": {
          "esp32-ble-openblock-v1.24.1.bin": "b96d8ba10ebcd5a84615516859893c775c61205559fc5ba76fdd928485acd1ad",
          "esp32c3-ble-openblock-v1.24.1.bin": "5d4c06cdadb7abab6420de474a5ff534d10220377224f78076fac36a6bb6c2bf",
          "modules/obble.py": "2e70116f20b39ec51cdb90da5c70f9f42fd307f639186b40fd770e873a4c9220"
        }
      },
      "externalResourcesStatic": {
        "path": "openblock-gui/external-resources-static/external-resources",
        "aggregateSha256": "14c90569a92aef97fa47ce3a8496cd822605ee2ae326464a8d26b1bb5aed3c57",
        "fileCount": 341
      }
    }

## 3.1 积木能力注册表（AI-032）

    {
      "block-capability-registry-esp32.json": {
        "path": "external-resources-v3/registry/block-capability-registry-esp32.json",
        "sha256": "d53f2b63011024eea5e2a5049c89a6e7db39e7a56529002334fd4d958630e1a0",
        "registryId": "openblock-esp32-pilot",
        "schemaVersion": 1,
        "sourceCommit": "a7cc8ca739562acc494ae4342df44b3fc135e029",
        "extensionCount": 15,
        "blockCount": 59
      },
      "block-capability-registry.schema.json": {
        "path": "external-resources-v3/registry/block-capability-registry.schema.json",
        "sha256": "f73e239f97bb2607415f36c8e65919579938c4b10740ef7c33dbd3fd3e7947d3"
      }
    }

生成/校验：`node external-resources-v3/scripts/generate-block-registry.js [--check]`（产物可复现，`--check` 供 CI 校验注册表与扩展源码一致）。平台消费副本：`kids-code-platform/backend/app/data/block_registry/`（sha256 必须与本节一致）。

## 4. 兼容矩阵

    {
      "guiWebBuild": {
        "node": "24.16.0",
        "nodeOptions": "--openssl-legacy-provider --max-old-space-size=8192",
        "webpack": "4.x",
        "localDeps": "hxblock-blocks / hxblock-l10n / openblock-vm 由 setup-local-deps 覆盖为本地仓库实体"
      },
      "vmTests": {
        "node": "24.16.0",
        "tap": "12.7.0 --no-esm（esm loader 在 Node 24 崩溃）"
      },
      "guiTests": {
        "node": "24.16.0",
        "jest": "21.2.1",
        "cheerio": "1.0.0-rc.3（锁定，1.2.0 需 Node20+ 语法且 jest21 无法解析 node: 前缀）"
      },
      "desktop": {
        "nodeCompile": "16.20.2",
        "electron": "22.3.27",
        "electronBuilder": "22.14.13",
        "babel": "强制 optional-chaining/nullish-coalescing 转换（webpack4 解析器限制）",
        "gui": "openblock-gui.worktrees/desktop @ desktop-haoxue（已合并 dev-local 全部批次）"
      },
      "browserTargets": "GUI browserslist（webpack babel preset-env），@xterm 5.x 经 babel 转译",
      "firmware": "esp32/esp32c3 BLE v1.24.1（与 OB-030 相同，无变更）"
    }

## 5. 测试矩阵

    {
      "openblock-vm": {
        "tap:unit": "59/59 通过（含 devices_micropython_multi_transport 传输切换/raw REPL/终端捕获、devices_micropython_mqtt_hat）",
        "tap:integration": "46/46 通过（含旧 sb2/sb3 加载、monitor、serialization 全套）",
        "tap:known-upstream-failures": "execute.js 22 子测试 + pen.js 2 子测试失败——已在上游 openblockcc 合并基线 4513d0e1 复现完全相同失败，属上游行为差异，非本仓回归；CI 中非门禁运行",
        "本批新修复": "sb2 项目扩展自动安装（pen/music/videoSensing/wedo2）、sb3 monitor-only 扩展安装（music/ev3）、extension_conversion/internal-extension 契约更新"
      },
      "openblock-gui": {
        "test:unit": "39 套件全过，252 通过 2 跳过（Node 24 + jest 21）",
        "test:unit:known-divergence": "project-saver-hoc.test.jsx（上游 scratch 网站保存流，本发行版不使用，属实现分歧）",
        "production build": "连续两次构建聚合 sha256 一致（逐字节可复现）",
        "本批新修复": ".sb 文件名标题解析回归修复"
      },
      "openblock-resource": {
        "test:contract": "静态快照契约通过：extensions en/zh-cn 46 条目、引用文件 0 缺失、espDht/espRgbLedStrip/espTm1650 在位；devices 索引为空是既定架构（设备内置 GUI/VM）",
        "本批新修复": "external-resources-v3 oled 图标大小写引用修复（Linux 部署 404）"
      },
      "openblock-link": {
        "test": "启动烟测通过（HTTP 200 + 服务名，随机高位端口）"
      },
      "openblock-desktop": {
        "compile": "electron-webpack 主/渲染进程通过（Node 16.20.2）",
        "package": "Linux dir 模式打包通过（dist/linux-unpacked，4.6G，二进制 163MB）",
        "windows/macos": "未构建——需对应平台构建环境（明确记录）"
      },
      "deployScript": {
        "dry-run": "对沙箱与真实平台目录均验证（真实目录 0 变更预览，未写入）",
        "deploy+protect": "沙箱验证：4306 文件复制、旧文件清除、editor.html 保留、部署前后聚合校验一致",
        "rollback": "沙箱验证：从备份 tar 恢复 + meta 校验一致",
        "auto-rollback": "部署后校验失败路径已实现（rename 还原旧目录）"
      }
    }

## 6. 真实硬件验收状态

    {
      "status": "本轮无真机接入，以下项与 OB-030 相同保持待验收",
      "pending": [
        "USB WebSerial 连接、板载文件浏览/删除、终端交互（未插板子）",
        "BLE 连接（需刷 firmware-esp32-ble v1.24.1）（未插板子）",
        "上传中断、hardReset、扩展 realtime（DHT/RGB/TM1650 等外设）（未插板子/外设）",
        "Link 桌面串口真机上传（需真机）",
        "bodySensing / mlClassifier 摄像头懒加载与失败空态（需浏览器+摄像头）",
        "Electron GUI 窗口启动冒烟（本机无 X display/xvfb）",
        "旧项目加载兼容（legacy transport 设备 id 迁移）需在部署环境用旧作品验证"
      ]
    }

## 7. 平台部署

    {
      "executed": false,
      "reason": "任务约束：不覆盖 kids-code-platform 当前 scratch3，平台部署由独立验证步骤执行",
      "currentPlatformState": "kids-code-platform/scratch3 与 OB-030 构建逐字节一致（dry-run 0 变更，2026-08-05 复核）",
      "newBuildReady": "openblock-gui/build 为 OB-031 新构建（聚合 8729c5719f52a1d9…），部署时执行 npm run deploy:kids（自动备份+校验+原子切换）",
      "rollback": "node scripts/deploy-to-kids-platform.js --rollback（自动选最新备份）；历史备份 openblock/.ob030-backup/scratch3-pre-ob030-20260804-2218.tar.gz 仍可用"
    }
