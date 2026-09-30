#!/usr/bin/env python3
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
    try:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyyaml"])
        import yaml
    except Exception:
        yaml = None

try:
    import requests
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
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
        except Exception:
            if attempt < retries:
                time.sleep(1)
    return None

def fallback_regex_extract_node(content, index):
    """正则兜底提取节点参数"""
    try:
        server_match = re.search(r'server:\s*["\']?([^\s"\'\n]+)', content, re.I)
        port_match = re.search(r'port:\s*(\d+)', content, re.I)
        type_match = re.search(r'type:\s*["\']?([^\s"\'\n]+)', content, re.I)
        
        if server_match and port_match and type_match:
            password_match = re.search(r'password:\s*["\']?([^\s"\'\n]+)', content, re.I)
            sni_match = re.search(r'sni:\s*["\']?([^\s"\'\n]+)', content, re.I)
            skip_match = re.search(r'skip-cert-verify:\s*(true|false)', content, re.I)
            up_match = re.search(r'up:\s*["\']?([^"\'\n]+)["\']?', content, re.I)
            down_match = re.search(r'down:\s*["\']?([^"\'\n]+)["\']?', content, re.I)
            
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
            
            node_name = f"节点 {pad_index} [{protocol}] ({server_ip})"
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
                
    print(f"[*] 从 {URLS_FILE} 中读取到 {len(url_lines)} 个订阅 URL 源\n")
    
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

    print("\n" + "-" * 65)
    print(f"[*] 节点提取总结: 成功 {len(extracted_nodes)} / {len(url_lines)} 个有效节点")
    print("-" * 65)
    
    if not extracted_nodes:
        print("[!] 错误: 未提取到任何有效节点，取消写入以防止破坏现有配置文件")
        sys.exit(1)
        
    # 读取并处理模板写入输出文件
    if yaml is not None:
        with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
            template_data = yaml.safe_load(f)
            
        template_data["proxies"] = extracted_nodes
        node_names = [n["name"] for n in extracted_nodes]
        
        if "proxy-groups" in template_data and isinstance(template_data["proxy-groups"], list):
            for group in template_data["proxy-groups"]:
                group_name = group.get("name", "")
                group_type = group.get("type", "")
                current_proxies = group.get("proxies", [])
                
                if group_type in ["select", "fallback", "url-test", "load-balance"]:
                    static_items = [
                        p for p in current_proxies
                        if not p.startswith("节点")
                        and not "fanqiang" in p
                        and not "github.com" in p
                    ]
                    group["proxies"] = list(dict.fromkeys(static_items + node_names))
                    print(f"   [+] 策略组已同步: {group_name} ({len(group['proxies'])} 项)")

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            yaml.dump(template_data, f, allow_unicode=True, sort_keys=False, default_flow_style=False)
    else:
        # 无 PyYAML 时的纯 Python 规则拼接兜底写入
        proxy_names = [n["name"] for n in extracted_nodes]
        def yaml_indent(items, spaces=6):
            pad = " " * spaces
            return "\n".join(f"{pad}- \"{item}\"" for item in items)

        yaml_proxies_block = ""
        for p in extracted_nodes:
            yaml_proxies_block += f"  - name: \"{p.get('name')}\"\n"
            yaml_proxies_block += f"    type: {p.get('type', 'hysteria')}\n"
            yaml_proxies_block += f"    server: \"{p.get('server')}\"\n"
            yaml_proxies_block += f"    port: {p.get('port')}\n"
            if "password" in p:
                yaml_proxies_block += f"    password: \"{p.get('password')}\"\n"
            if "auth_str" in p or "auth" in p:
                yaml_proxies_block += f"    auth: \"{p.get('auth', p.get('auth_str', ''))}\"\n"
            if "sni" in p:
                yaml_proxies_block += f"    sni: \"{p.get('sni')}\"\n"
            if "skip-cert-verify" in p:
                yaml_proxies_block += f"    skip-cert-verify: {str(p.get('skip-cert-verify')).lower()}\n"
            if "up" in p:
                yaml_proxies_block += f"    up: \"{p.get('up')}\"\n"
            if "down" in p:
                yaml_proxies_block += f"    down: \"{p.get('down')}\"\n"

        template = f"""# =================================================================
# Clash 混合 12 节点订阅配置文件
# 独立自动化更新于: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}
# 节点总数: {len(extracted_nodes)} 个有效节点
# =================================================================
secret: github.com/Alvin9999-newpac/fanqiang
mixed-port: 7890
allow-lan: false
mode: rule
log-level: info
ipv6: true

dns:
  enable: true
  ipv6: true
  nameserver:
    - 119.29.29.29
    - 223.5.5.5

proxies:
{yaml_proxies_block.rstrip()}

proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies:
      - ♻️ 自动选择
      - DIRECT
{yaml_indent(proxy_names, 6)}
  - name: ♻️ 自动选择
    type: fallback
    url: http://www.gstatic.com/generate_204
    interval: 5
    proxies:
{yaml_indent(proxy_names, 6)}
  - name: 🌍 国外媒体
    type: select
    proxies:
      - 🚀 节点选择
      - ♻️ 自动选择
      - 🎯 全球直连
{yaml_indent(proxy_names, 6)}
  - name: 📲 电报信息
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
{yaml_indent(proxy_names, 6)}
  - name: Ⓜ️ 微软服务
    type: select
    proxies:
      - 🎯 全球直连
      - 🚀 节点选择
{yaml_indent(proxy_names, 6)}
  - name: 🍎 苹果服务
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
{yaml_indent(proxy_names, 6)}
  - name: 🎯 全球直连
    type: select
    proxies:
      - DIRECT
      - 🚀 节点选择
      - ♻️ 自动选择
{yaml_indent(proxy_names, 6)}

rules:
  - MATCH,🚀 节点选择
"""
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write(template)
        
    # 4. 生成 Base64 编码文件 config.b64 便于特定客户端导入
    with open(OUTPUT_FILE, "rb") as f:
        encoded_b64 = base64.b64encode(f.read()).decode("utf-8")
    with open(OUTPUT_B64_FILE, "w", encoding="utf-8") as f:
        f.write(encoded_b64)
        
    print(f"\n[✓] 成功生成配置文件: {OUTPUT_FILE} (文件大小: {os.path.getsize(OUTPUT_FILE)} 字节)")
    print(f"[✓] 成功生成 Base64 文件: {OUTPUT_B64_FILE} (文件大小: {os.path.getsize(OUTPUT_B64_FILE)} 字节)")
    print("=" * 65)

if __name__ == "__main__":
    main()
