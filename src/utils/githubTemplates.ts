import { NamingConfig, UrlItem, WorkflowOptions } from '../types';
import { formatUrlsToTxt } from './urlExtractor';

/**
 * Generates the Python script for the GitHub Actions workflow
 */
export function generatePythonScript(
  namingConfig: NamingConfig,
  _options: WorkflowOptions
): string {
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
Clash / Mihomo 12节点订阅自动聚合与配置文件生成器
- 自动从 urls.txt 中逐行读取 12 个订阅 URL
- 支持 GitLab 主地址 + 备用镜像双源容灾
- 自动提取 proxies 节点信息并规范化重命名
- 自动合并到 template.yaml 并同步策略组
- 额外输出 Base64 编码订阅文件 (config.b64) 便于小火箭等移动端导入
====================================================================
"""

import os
import sys
import time
import base64
import re
import urllib.request
import urllib.error

# 尝试导入 requests 与 yaml
try:
    import yaml
except ImportError:
    print("[!] 正在自动安装 PyYAML 依赖...")
    os.system(f"{sys.executable} -m pip install pyyaml")
    import yaml

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# ==================== 配置参数 ====================
URLS_FILE = "urls.txt"
TEMPLATE_FILE = "template.yaml"
OUTPUT_FILE = "config.yaml"
OUTPUT_B64_FILE = "config.b64"
TIMEOUT = 15
MAX_RETRIES = 2
USER_AGENT = "ClashForWindows/0.20.39 mihomo ClashMeta Wget/1.21"

def fetch_url_content(url, retries=MAX_RETRIES):
    """通用网络请求函数，优先 requests 备用 urllib"""
    if not url or not url.startswith("http"):
        return None

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "*/*",
        "Connection": "close"
    }

    for attempt in range(1, retries + 1):
        try:
            if HAS_REQUESTS:
                resp = requests.get(url, headers=headers, timeout=TIMEOUT, verify=False)
                if resp.status_code == 200:
                    resp.encoding = resp.apparent_encoding or "utf-8"
                    text = resp.text.strip()
                    if len(text) > 10:
                        return text
            else:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
                    if response.status == 200:
                        content = response.read().decode("utf-8", errors="ignore").strip()
                        if len(content) > 10:
                            return content
        except Exception as e:
            if attempt < retries:
                time.sleep(1)
    return None

def fallback_regex_extract_node(content, index):
    """正则兜底提取节点参数"""
    try:
        server_match = re.search(r'server:\\s*["\\']?([^\\s"\\\'\\n]+)', content, re.I)
        port_match = re.search(r'port:\\s*(\\d+)', content, re.I)
        type_match = re.search(r'type:\\s*["\\']?([^\\s"\\\'\\n]+)', content, re.I)
        
        if server_match and port_match and type_match:
            password_match = re.search(r'password:\\s*["\\']?([^\\s"\\\'\\n]+)', content, re.I)
            sni_match = re.search(r'sni:\\s*["\\']?([^\\s"\\\'\\n]+)', content, re.I)
            skip_match = re.search(r'skip-cert-verify:\\s*(true|false)', content, re.I)
            up_match = re.search(r'up:\\s*["\\']?([^"\\\'\\n]+)["\\']?', content, re.I)
            down_match = re.search(r'down:\\s*["\\']?([^"\\\'\\n]+)["\\']?', content, re.I)
            
            node = {
                "name": f"节点 {index:02d}",
                "type": type_match.group(1).strip().lower(),
                "server": server_match.group(1).strip(),
                "port": int(port_match.group(1).strip()),
                "skip-cert-verify": True if not skip_match else (skip_match.group(1).lower() == "true")
            }
            if password_match:
                node["password"] = password_match.group(1).strip()
            if sni_match:
                node["sni"] = sni_match.group(1).strip()
            if up_match:
                node["up"] = up_match.group(1).strip()
            if down_match:
                node["down"] = down_match.group(1).strip()
            return node
    except Exception:
        pass
    return None

def extract_proxy_from_yaml(content, index):
    """从下载的 YAML 中解析节点信息"""
    if not content:
        return None
    try:
        data = yaml.safe_load(content)
        if not data:
            return fallback_regex_extract_node(content, index)
            
        proxies = []
        if isinstance(data, dict):
            if "proxies" in data and isinstance(data["proxies"], list) and len(data["proxies"]) > 0:
                proxies = data["proxies"]
            elif "server" in data and "type" in data:
                proxies = [data]
                
        if proxies:
            node = proxies[0]
            pad_index = f"{index:02d}"
            protocol = str(node.get("type", "HYSTERIA2")).upper()
            server_ip = str(node.get("server", ""))
            
            prefix = "${namingConfig.prefix}"
            include_proto = ${namingConfig.includeProtocol ? 'True' : 'False'}
            include_ip = ${namingConfig.includeIp ? 'True' : 'False'}
            
            node_name = f"{prefix} {pad_index}"
            if include_proto:
                node_name += f" [{protocol}]"
            if include_ip and server_ip:
                node_name += f" ({server_ip})"
                
            node["name"] = node_name
            return node
    except Exception:
        return fallback_regex_extract_node(content, index)
    return None

def main():
    print("=" * 65)
    print(">>> 开始执行 Clash 12节点订阅聚合与工作流生成任务")
    print(f">>> 当前时间: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}")
    print("=" * 65)
    
    if not os.path.exists(URLS_FILE):
        print(f"[!] 找不到 URL 列表文件: {URLS_FILE}")
        sys.exit(1)
        
    if not os.path.exists(TEMPLATE_FILE):
        print(f"[!] 找不到 YAML 模板文件: {TEMPLATE_FILE}")
        sys.exit(1)
        
    # 读取 urls.txt
    url_lines = []
    with open(URLS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                url_lines.append(line)
                
    print(f"[*] 从 {URLS_FILE} 中读取到 {len(url_lines)} 个订阅 URL 源\\n")
    
    extracted_nodes = []
    
    for idx, line in enumerate(url_lines, start=1):
        parts = [p.strip() for p in line.split("|") if p.strip()]
        primary_url = parts[0] if len(parts) > 0 else None
        mirror_url = parts[1] if len(parts) > 1 else None
        
        print(f"[{idx:02d}/{len(url_lines):02d}] 正在提取节点 #{idx:02d}...")
        content = None
        used_src = "主地址"
        
        if primary_url:
            content = fetch_url_content(primary_url)
            
        if not content and mirror_url:
            print(f"   [~] 主地址无响应，尝试备用镜像源: {mirror_url}")
            content = fetch_url_content(mirror_url)
            used_src = "备用镜像"
            
        if content:
            node = extract_proxy_from_yaml(content, idx)
            if node:
                print(f"   [✓] 提取成功 ({used_src}): {node.get('name')} -> {node.get('server')}:{node.get('port')} [{node.get('type').upper()}]")
                extracted_nodes.append(node)
            else:
                print(f"   [✗] 提取失败: 未能在返回内容中找到有效 proxies 节点")
        else:
            print(f"   [✗] 提取失败: 节点 URL 连接超时或无法访问")

    print("\\n" + "-" * 65)
    print(f"[*] 节点提取总结: 成功 {len(extracted_nodes)} / {len(url_lines)} 个有效节点")
    print("-" * 65)
    
    if not extracted_nodes:
        print("[!] 错误: 未提取到任何有效节点，取消写入以防止破坏现有配置文件")
        sys.exit(1)
        
    # 读取模板
    with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
        template_data = yaml.safe_load(f)
        
    # 1. 替换 proxies
    template_data["proxies"] = extracted_nodes
    node_names = [n["name"] for n in extracted_nodes]
    
    # 2. 注入到 proxy-groups
    if "proxy-groups" in template_data and isinstance(template_data["proxy-groups"], list):
        for group in template_data["proxy-groups"]:
            group_name = group.get("name", "")
            group_type = group.get("type", "")
            current_proxies = group.get("proxies", [])
            
            if group_type in ["select", "fallback", "url-test", "load-balance"]:
                static_items = [
                    p for p in current_proxies
                    if not p.startswith("${namingConfig.prefix}")
                    and not "fanqiang" in p
                    and not "github.com" in p
                ]
                group["proxies"] = list(dict.fromkeys(static_items + node_names))
                print(f"   [+] 策略组已同步: {group_name} ({len(group['proxies'])} 项)")

    # 3. 写入输出文件 config.yaml
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        yaml.dump(template_data, f, allow_unicode=True, sort_keys=False, default_flow_style=False)
        
    # 4. 生成 Base64 编码文件 config.b64 便于特定客户端导入
    with open(OUTPUT_FILE, "rb") as f:
        encoded_b64 = base64.b64encode(f.read()).decode("utf-8")
    with open(OUTPUT_B64_FILE, "w", encoding="utf-8") as f:
        f.write(encoded_b64)
        
    print(f"\\n[✓] 成功生成配置文件: {OUTPUT_FILE} (文件大小: {os.path.getsize(OUTPUT_FILE)} 字节)")
    print(f"[✓] 成功生成 Base64 文件: {OUTPUT_B64_FILE} (文件大小: {os.path.getsize(OUTPUT_B64_FILE)} 字节)")
    print("=" * 65)

if __name__ == "__main__":
    main()
`;
}

/**
 * Generates the GitHub Actions Workflow YAML (.github/workflows/update.yml)
 */
export function generateWorkflowYaml(options: WorkflowOptions): string {
  return `name: 🔄 自动更新 Clash 12节点订阅配置

on:
  # 定时调度更新 (Cron)
  schedule:
    - cron: '${options.cronSchedule}'
  # 支持在 GitHub 网页上直接点击按钮手动执行
  workflow_dispatch:
  # 推送修改时也可以触发
  push:
    paths:
      - 'urls.txt'
      - 'template.yaml'
      - 'scripts/**'

# 设置操作权限以允许推送更新后的 config.yaml
permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  update-clash-config:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE20: true
    steps:
      - name: 📥 检出仓库代码
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: 🐍 设置 Python 3 环境
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'
          cache: 'pip'

      - name: 📦 安装依赖项 (PyYAML & requests)
        run: |
          python -m pip install --upgrade pip
          pip install pyyaml requests urllib3

      - name: 🚀 执行节点抓取与合并脚本
        run: |
          python scripts/update_clash.py

      - name: 🔍 检查文件变动
        id: check_changes
        run: |
          git status --porcelain
          if [[ -n $(git status --porcelain ${options.outputFileName}) ]]; then
            echo "has_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_changes=false" >> $GITHUB_OUTPUT
          fi

      - name: 📤 提交并推送到 GitHub 仓库
        if: steps.check_changes.outputs.has_changes == 'true'
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add ${options.outputFileName} config.b64
          git commit -m "chore(auto): 自动更新 12 节点订阅配置 [skip ci] ($(date +'%Y-%m-%d %H:%M:%S'))"
          git push origin HEAD || git push

      ${options.enableGitHubPages ? `
      - name: 🌐 部署至 GitHub Pages (提供高速订阅访问)
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          publish_branch: gh-pages
          destination_dir: ./
      ` : ''}

      ${options.enableReleaseUpload ? `
      - name: 🏷️ 发布 Release 附件 (永久直链)
        uses: softprops/action-gh-release@v1
        if: steps.check_changes.outputs.has_changes == 'true'
        with:
          tag_name: latest
          name: "最新 Clash 12节点配置 ($(date +'%Y-%m-%d'))"
          body: "由 GitHub Actions 自动聚合构建，包含 12 个实时可用节点。"
          files: |
            ${options.outputFileName}
            config.b64
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      ` : ''}
`;
}

/**
 * Generates local test batch script for Windows (local_test.bat)
 */
export function generateLocalTestBat(): string {
  return `@echo off
chcp 65001 >nul
title Clash 12节点工作流本地测试
echo ====================================================
echo  Clash 12节点自动聚合生成器 - 本地运行测试
echo ====================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] 未检测到 Python，请先安装 Python 3.8+ 并添加环境变量！
    pause
    exit /b 1
)

echo [*] 检查并安装 Python 依赖项...
python -m pip install -q pyyaml requests urllib3

echo.
echo [*] 开始执行脚本...
python scripts/update_clash.py

if exist "config.yaml" (
    echo.
    echo ====================================================
    echo [✓] 本地测试成功！已生成 config.yaml
    echo ====================================================
) else (
    echo.
    echo [!] 生成失败，请查看上方日志。
)

echo.
pause
`;
}

/**
 * Generates local test shell script for macOS/Linux (local_test.sh)
 */
export function generateLocalTestSh(): string {
  return `#!/bin/bash
set -e

echo "===================================================="
echo " Clash 12节点自动聚合生成器 - 本地运行测试"
echo "===================================================="
echo ""

if ! command -v python3 &> /dev/null; then
    echo "[!] 未检测到 python3，请先安装 Python 3.8+！"
    exit 1
fi

echo "[*] 安装 Python 依赖 (pyyaml, requests)..."
python3 -m pip install -q pyyaml requests urllib3

echo ""
echo "[*] 启动节点抓取与合并脚本..."
python3 scripts/update_clash.py

if [ -f "config.yaml" ]; then
    echo ""
    echo "===================================================="
    echo "[✓] 本地测试成功！已生成 config.yaml"
    echo "===================================================="
fi
`;
}

/**
 * Generates MIT License
 */
export function generateLicense(): string {
  return `MIT License

Copyright (c) ${new Date().getFullYear()} Clash 12Node Workflow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

/**
 * Generates README.md documentation
 */
export function generateReadme(
  _options: WorkflowOptions,
  urlsCount: number
): string {
  return `# 🚀 Clash & Mihomo 12节点自动聚合 GitHub 工作流

[![Update Clash Config](https://github.com/actions/setup-python/actions/workflows/update.yml/badge.svg)](../../actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nodes](https://img.shields.io/badge/Nodes-${urlsCount}%20Active-emerald.svg)](#)
[![Clash Meta](https://img.shields.io/badge/Client-Clash%20%7C%20Mihomo%20%7C%20Shadowrocket-indigo.svg)](#)

> 基于 **GitHub Actions** 的全自动订阅聚合工作流。定时从 \`urls.txt\` 中的 ${urlsCount} 个远端源抓取最新节点配置，自动去重、重命名并合并到 \`template.yaml\` 模板中，生成标准完整的 \`config.yaml\` 配置文件。

---

## 🌟 核心特性

- ⚡ **全自动定时构建**：内置 GitHub Actions 调度（默认每 6 小时自动抓取一次最新节点）。
- 🛡️ **双镜像容灾**：每个节点均支持 GitLab 主地址 + 备用直连镜像源，主源异常自动切换。
- 🔄 **防止节点重名**：自动重命名为 \`节点 01 [HYSTERIA2] (IP)\` 等唯一名称，杜绝客户端配置冲突。
- 🎯 **完整策略组支持**：自动注入 \`🚀 节点选择\`、\`♻️ 自动选择\`、\`🌍 国外媒体\`、\`📲 电报信息\`、\`Ⓜ️ 微软服务\`、\`🍎 苹果服务\`、\`🐟 漏网之鱼\`。
- 📱 **多格式分发**：同时输出 \`config.yaml\` 与 Base64 编码的 \`config.b64\`，支持小火箭、Surge、Stash 等。

---

## 📁 仓库文件结构

\`\`\`text
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
\`\`\`

---

## 🚀 极速部署指南 (3 分钟)

### 1. 创建 GitHub 仓库
1. 打开 GitHub，点击右上角 **\`+\`** -> **\`New repository\`**。
2. 填写仓库名（例如 \`clash-sub\`），选择 **Public（公开）** 或 **Private（私有）**。
3. 将本项目下载的文件解压并上传（或者使用 \`git push\` 推送到该仓库）。

### 2. 开启 Actions 写入权限 (⚠️ 必须配置)
为了让 GitHub Actions 能够将更新后的 \`config.yaml\` 提交回你的仓库，必须开启写入权限：
1. 进入你的仓库页面，点击 **\`Settings\`**（设置）。
2. 在左侧菜单点击 **\`Actions\`** -> **\`General\`**。
3. 滚动到页面底部的 **\`Workflow permissions\`**。
4. 勾选 **\`Read and write permissions\`**（读写权限）。
5. 点击 **\`Save\`** 保存。

### 3. 手动触发测试
1. 进入仓库顶部的 **\`Actions\`** 标签页。
2. 点击左侧工作流名称 **\`🔄 自动更新 Clash 12节点订阅配置\`**。
3. 点击右侧 **\`Run workflow\`** 按钮。
4. 执行完毕后，根目录会自动更新 **\`config.yaml\`**！

---

## 🔗 获取订阅直链

将以下链接填入 **Clash Verge Rev / Mihomo Party / Clash Meta / Shadowrocket / Stash**：

### 1. 国内免翻墙加速代理链接（推荐⭐）
\`\`\`text
https://ghfast.top/https://raw.githubusercontent.com/<你的用户名>/<你的仓库名>/main/config.yaml
\`\`\`

### 2. GitHub Raw 原生直链
\`\`\`text
https://raw.githubusercontent.com/<你的用户名>/<你的仓库名>/main/config.yaml
\`\`\`

### 3. jsDelivr 全球 CDN 链接
\`\`\`text
https://cdn.jsdelivr.net/gh/<你的用户名>/<你的仓库名>@main/config.yaml
\`\`\`

---

## 💻 本地运行与调试

如果在本地电脑测试，直接运行：
- **Windows**：双击运行 \`local_test.bat\`。
- **macOS / Linux**：终端运行 \`bash local_test.sh\`。

---

## ⚙️ 常见问题 FAQ

- **Q: 为什么 Actions 运行报错 \`Permission denied to github-actions[bot]\`？**  
  A: 这是没有开启写入权限。请到仓库 Settings -> Actions -> General -> Workflow permissions 勾选 **Read and write permissions**。
- **Q: 如何增加更多节点？**  
  A: 直接在 \`urls.txt\` 中添加新的 URL 即可，每行一个。
`;
}

/**
 * Generates requirements.txt for Python workflow
 */
export function generateRequirementsTxt(): string {
  return `pyyaml>=6.0.1
requests>=2.31.0
urllib3>=2.0.0
`;
}

/**
 * Returns all generated files for the GitHub repo bundle
 */
export function generateAllProjectFiles(
  urls: UrlItem[],
  templateYaml: string,
  namingConfig: NamingConfig,
  workflowOptions: WorkflowOptions
) {
  const pythonScript = generatePythonScript(namingConfig, workflowOptions);
  const workflowYaml = generateWorkflowYaml(workflowOptions);
  const urlsTxt = formatUrlsToTxt(urls);
  const readme = generateReadme(workflowOptions, urls.length);
  const requirementsTxt = generateRequirementsTxt();
  const localBat = generateLocalTestBat();
  const localSh = generateLocalTestSh();
  const license = generateLicense();

  return {
    '.github/workflows/update.yml': workflowYaml,
    'scripts/update_clash.py': pythonScript,
    'urls.txt': urlsTxt,
    'template.yaml': templateYaml,
    'requirements.txt': requirementsTxt,
    'local_test.bat': localBat,
    'local_test.sh': localSh,
    'LICENSE': license,
    'README.md': readme,
  };
}
