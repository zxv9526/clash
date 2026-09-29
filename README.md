# 🚀 Clash 节点自动聚合 GitHub 双工作流系统

> 基于 **GitHub Actions** 的全自动节点聚合工作流。内置 **两个独立通道**，分别维护 Clash Meta 混合订阅与 Hysteria 1 (HY1) 专用订阅，双通道互不干扰、各自独立定时更新！

---

## 🌟 双工作流架构

| 工作流名称 | 数据源文件 | 核心脚本 | 输出配置文件 | 特点 |
| :--- | :--- | :--- | :--- | :--- |
| **1. Clash Meta 订阅** | `urls.txt` | `scripts/update_clash.py` | `config.yaml` / `config.b64` | 支持 Hysteria2 等多协议混合解析 |
| **2. Hysteria 1 独立订阅** | `urls_hy1.txt` | `scripts/update_hy1.py` | `hy1_config.yaml` / `hy1_config.b64` | 专门抓取 12 个 HY1 JSON 源并生成 Clash 专属配置 |

---

## 📱 客户端订阅链接直链汇总 (公开仓库免翻墙直连)

### 🟣 通道 A：Hysteria 1 (HY1) 专属订阅
- **国内高速加速直链 (推荐 ⭐)**:
  ```text
  https://ghfast.top/https://raw.githubusercontent.com/zxv9526/clash/main/hy1_config.yaml
  ```
- **GitMirror 备用直链**:
  ```text
  https://raw.gitmirror.com/zxv9526/clash/main/hy1_config.yaml
  ```

---

### 🔵 通道 B：Clash Meta 混合主订阅
- **国内高速加速直链 (推荐 ⭐)**:
  ```text
  https://ghfast.top/https://raw.githubusercontent.com/zxv9526/clash/main/config.yaml
  ```
- **GitMirror 备用直链**:
  ```text
  https://raw.gitmirror.com/zxv9526/clash/main/config.yaml
  ```

---

## 📁 仓库文件结构

```text
├── .github/
│   └── workflows/
│       ├── update.yml          # 工作流 1: 自动更新 Clash Meta 订阅 (config.yaml)
│       └── update_hy1.yml      # 工作流 2: 自动更新 Hysteria 1 订阅 (hy1_config.yaml)
├── scripts/
│   ├── update_clash.py         # 工作流 1 核心抓取与合并脚本
│   └── update_hy1.py           # 工作流 2 HY1 JSON 转换与生成脚本
├── urls.txt                    # 工作流 1 的 12 个节点源 (支持主|备)
├── urls_hy1.txt                # 工作流 2 的 12 个 Hysteria 1 JSON 数据源
├── config.yaml                 # 自动生成的 Clash Meta 配置文件
├── hy1_config.yaml             # 自动生成的 Hysteria 1 专属配置文件
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
