# 🚀 Clash 节点自动聚合 GitHub 三工作流系统

> 基于 **GitHub Actions** 的全自动节点聚合工作流。内置 **三个完全独立通道**，分别维护 Hysteria 2 (HY2)、Hysteria 1 (HY1) 以及 Clash Meta 混合主订阅。三通道完全物理隔离、互不干扰、各自定时自动更新！

---

## 🌟 三独立工作流架构

| 独立通道 | 定时自动触发时间 | 数据源文件 | 核心解析脚本 | 纯净输出订阅文件 | 协议类型 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **🟣 通道 1：Hysteria 2 (HY2)** | **每天 04:20** (北京时间) | `urls_hy2.txt` | `scripts/update_hy2.py` | **`hy2_config.yaml`** | 纯净 Hysteria 2 协议 |
| **🟢 通道 2：Hysteria 1 (HY1)** | **每天 04:10** (北京时间) | `urls_hy1.txt` | `scripts/update_hy1.py` | **`hy1_config.yaml`** | 纯净 Hysteria 1 协议 |
| **🔵 通道 3：Clash Meta 混合** | **每天 04:00** (北京时间) | `urls.txt` | `scripts/update_clash.py` | **`config.yaml`** | 多协议混合解析 |

---

## 📱 客户端订阅链接汇总 (公开仓库国内免翻墙直连)

### 🟣 1. Hysteria 2 (HY2) 纯净独立订阅
```text
https://ghfast.top/https://raw.githubusercontent.com/zxv9526/clash/main/hy2_config.yaml
```

### 🟢 2. Hysteria 1 (HY1) 纯净独立订阅
```text
https://ghfast.top/https://raw.githubusercontent.com/zxv9526/clash/main/hy1_config.yaml
```

### 🔵 3. Clash Meta 混合主订阅
```text
https://ghfast.top/https://raw.githubusercontent.com/zxv9526/clash/main/config.yaml
```

*(如果主分支是 master，只需将链接中的 `main` 改为 `master`)*

---

## 📁 仓库文件结构

```text
├── .github/
│   └── workflows/
│       ├── update_hy2.yml      # 工作流 1: 自动更新 Hysteria 2 订阅 (hy2_config.yaml)
│       ├── update_hy1.yml      # 工作流 2: 自动更新 Hysteria 1 订阅 (hy1_config.yaml)
│       └── update.yml          # 工作流 3: 自动更新 Clash Meta 订阅 (config.yaml)
├── scripts/
│   ├── update_hy2.py           # HY2 JSON 提取与 Clash 节点转换引擎
│   ├── update_hy1.py           # HY1 JSON 提取与 Clash 节点转换引擎
│   └── update_clash.py         # Clash Meta 混合节点提取与合并引擎
├── urls_hy2.txt                # HY2 的 12 个 Hysteria 2 JSON 数据源
├── urls_hy1.txt                # HY1 的 12 个 Hysteria 1 JSON 数据源
├── urls.txt                    # Clash Meta 的 12 个混合数据源
├── hy2_config.yaml             # 自动生成的 Hysteria 2 配置文件
├── hy1_config.yaml             # 自动生成的 Hysteria 1 配置文件
├── config.yaml                 # 自动生成的 Clash Meta 混合配置文件
├── template.yaml               # Clash 基础策略组模板
└── README.md                   # 系统说明文档
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
