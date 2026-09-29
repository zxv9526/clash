# 🚀 Clash & Mihomo 12节点自动聚合 GitHub 工作流

[![Update Clash Config](https://github.com/actions/setup-python/actions/workflows/update.yml/badge.svg)](../../actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nodes](https://img.shields.io/badge/Nodes-12%20Active-emerald.svg)](#)
[![Clash Meta](https://img.shields.io/badge/Client-Clash%20%7C%20Mihomo%20%7C%20Shadowrocket-indigo.svg)](#)

> 基于 **GitHub Actions** 的全自动订阅聚合工作流。定时从 `urls.txt` 中的 12 个远端源抓取最新节点配置，自动容灾切换、自动重命名防重名冲突，并合并到 `template.yaml` 模板中，生成标准完整的 `config.yaml` 配置文件。

---

## 🌟 核心特性

- ⚡ **全自动定时构建**：内置 GitHub Actions 调度（默认每天定时自动抓取一次最新节点）。
- 🛡️ **双镜像容灾**：每个节点均支持 GitLab 主地址 + 备用直连镜像源，主源异常自动切换。
- 🔄 **防止节点重名**：自动重命名为 `节点 01 [HYSTERIA2] (IP)` 等唯一名称，杜绝客户端配置冲突。
- 🎯 **完整策略组支持**：自动注入 `🚀 节点选择`、`♻️ 自动选择`、`🌍 国外媒体`、`📲 电报信息`、`Ⓜ️ 微软服务`、`🍎 苹果服务`、`🐟 漏网之鱼`。
- 📱 **多格式分发**：同时输出 `config.yaml` 与 Base64 编码的 `config.b64`，支持小火箭、Surge、Stash 等。

---

## 📁 仓库文件结构

```text
├── .github/
│   └── workflows/
│       └── update.yml          # GitHub Actions 自动化工作流调度
├── scripts/
│   └── update_clash.py         # 核心提取与模板合并脚本
├── urls.txt                    # 存放 12 个节点源的订阅地址 (支持主|备格式)
├── template.yaml               # Clash / Meta YAML 配置文件模板
├── requirements.txt            # Python 运行依赖库
├── local_test.bat              # Windows 本地一键测试脚本
├── local_test.sh               # Linux/macOS 本地一键测试脚本
├── LICENSE                     # 开源协议
├── config.yaml                 # 自动生成的 Clash 配置文件
└── README.md                   # 使用与订阅说明
```

---

## 🚀 极速部署指南 (3 分钟)

### 1. 同步 / 创建 GitHub 仓库
通过 Google AI Studio 直接同步到你的 GitHub 仓库（或使用 Git 提交推送）。

### 2. 开启 Actions 写入权限 (⚠️ 必须配置)
为了让 GitHub Actions 能够将更新后的 `config.yaml` 提交回你的仓库，必须开启写入权限：
1. 进入你的仓库页面，点击 **`Settings`**（设置）。
2. 在左侧菜单点击 **`Actions`** -> **`General`**。
3. 滚动到页面底部的 **`Workflow permissions`**。
4. 勾选 **`Read and write permissions`**（读写权限）。
5. 点击 **`Save`** 保存。

### 3. 手动触发首次运行测试
1. 进入仓库顶部的 **`Actions`** 标签页。
2. 点击左侧工作流名称 **`🔄 自动更新 Clash 12节点订阅配置`**。
3. 点击右侧 **`Run workflow`** 按钮。
4. 执行完毕后，根目录会自动更新 **`config.yaml`**！

---

## 🔗 获取订阅直链

将以下链接填入 **Clash Verge Rev / Mihomo Party / Clash Meta / Shadowrocket / Stash**：

### 1. 国内免翻墙加速代理链接（推荐⭐）
```text
https://ghfast.top/https://raw.githubusercontent.com/<你的用户名>/<你的仓库名>/main/config.yaml
```

### 2. GitHub Raw 原生直链
```text
https://raw.githubusercontent.com/<你的用户名>/<你的仓库名>/main/config.yaml
```

### 3. jsDelivr 全球 CDN 链接
```text
https://cdn.jsdelivr.net/gh/<你的用户名>/<你的仓库名>@main/config.yaml
```

---

## 💻 本地运行与调试

如果在本地电脑测试，直接运行：
- **Windows**：双击运行 `local_test.bat`。
- **macOS / Linux**：终端运行 `bash local_test.sh`。
