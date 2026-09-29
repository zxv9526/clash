#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
Clash / Mihomo 纯 IPv4 节点订阅自动聚合与配置文件生成器
- 自动从 urls.txt 中读取订阅源
- 支持主地址 + 备用镜像双源容灾
- **严格过滤 IPv6 节点，仅保留 100% 纯 IPv4 节点**
- 禁用全局 IPv6 (`ipv6: false`)，完美适配无 IPv6 的宽带网络
====================================================================
"""

import os
import sys
import time
import base64
import re
import json
import urllib.parse
import urllib.request
import urllib.error

# ==================== 配置参数 ====================
URLS_FILE = "urls.txt"
OUTPUT_FILE = "config.yaml"
OUTPUT_B64_FILE = "config.b64"
TIMEOUT = 12
MAX_RETRIES = 2
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

DEFAULT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "*/*",
}

def fetch_url(url, retries=MAX_RETRIES):
    """带重试的 HTTP 获取函数"""
    if not url or not url.startswith("http"):
        return None

    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers=DEFAULT_HEADERS)
            with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
                if response.status == 200:
                    content = response.read().decode("utf-8", errors="ignore").strip()
                    if len(content) > 10:
                        return content
        except Exception:
            if attempt < retries:
                time.sleep(1)
    return None

def is_ipv6_host(host: str) -> bool:
    """判断地址是否为 IPv6 地址"""
    if not host:
        return False
    clean_host = host.strip().lstrip("[").rstrip("]")
    return ":" in clean_host

def parse_proxy_from_content(content: str, index: int) -> dict:
    """从下载的文本 (JSON 或 YAML) 中精确提取代理节点信息，并排除 IPv6"""
    if not content:
        return None

    # 1. 尝试匹配内嵌 JSON 格式，如 {"name":"洛杉矶1", "server":"173.234.25.51", ...}
    json_m = re.search(r'\{[^\}]*["\']server["\']\s*:\s*["\']([^\"]+)["\'][^\}]*\}', content)
    data = None
    if json_m:
        try:
            data = json.loads(json_m.group(0))
        except Exception:
            data = None

    if not data:
        # 尝试将全文解析为完整 JSON
        try:
            data = json.loads(content)
        except Exception:
            data = None

    if data and isinstance(data, dict):
        server_raw = str(data.get("server", "")).strip()
        if not server_raw or server_raw == "-":
            return None

        if server_raw.startswith("[") and "]:" in server_raw:
            parts = server_raw.split("]:")
            server = parts[0].lstrip("[").strip()
            port = int(parts[1].strip())
        elif ":" in server_raw and not is_ipv6_host(server_raw):
            parts = server_raw.rsplit(":", 1)
            server = parts[0].strip()
            port = int(parts[1].strip())
        else:
            server = server_raw
            port = int(data.get("port", 7890))

        if is_ipv6_host(server):
            return None

        ptype = str(data.get("type", "hysteria")).lower()
        auth_val = str(data.get("auth_str", data.get("auth", data.get("password", "dongtaiwang.com")))).strip()
        sni_val = str(data.get("sni", data.get("server_name", "www.microsoft.com"))).strip() or "www.microsoft.com"
        if sni_val in ["apple.com", "bing.com"]:
            sni_val = "www.microsoft.com"

        node_name = f"节点 {index:02d} [{ptype.upper()}] ({server})"

        proxy = {
            "name": node_name,
            "type": ptype,
            "server": server,
            "port": port,
            "password": auth_val,
            "auth": auth_val,
            "sni": sni_val,
            "skip-cert-verify": True,
            "up": "11 Mbps",
            "down": "55 Mbps",
            "fast-open": True
        }

        if ptype == "hysteria":
            proxy["auth-str"] = auth_val
            proxy["protocol"] = "udp"
            proxy["alpn"] = ["h3"]

        return proxy

    # 2. 如果非内嵌 JSON，用正则针对 proxies 局部块匹配
    proxies_block_m = re.search(r'proxies:\s*\n?\s*-\s*([^\n]+(?:\n\s+[^\n]+)*)', content)
    target_text = proxies_block_m.group(1) if proxies_block_m else content

    server_m = re.search(r'server:\s*["\']?([^\s"\',\}]+)', target_text, re.I)
    port_m = re.search(r'port:\s*(\d+)', target_text, re.I)
    type_m = re.search(r'type:\s*["\']?([^\s"\',\}]+)', target_text, re.I)

    if not (server_m and port_m):
        return None

    server = server_m.group(1).strip().lstrip("[").rstrip("]")
    if server == "-" or is_ipv6_host(server):
        return None

    port = int(port_m.group(1).strip())
    ptype = type_m.group(1).strip().lower() if type_m else "hysteria"

    auth_m = re.search(r'(?:auth[-_]str|auth|password):\s*["\']?([^\s"\',\}]+)', target_text, re.I)
    sni_m = re.search(r'(?:sni|server_name):\s*["\']?([^\s"\',\}]+)', target_text, re.I)

    auth_val = auth_m.group(1).strip() if auth_m else "dongtaiwang.com"
    sni_val = sni_m.group(1).strip() if sni_m else "www.microsoft.com"
    if sni_val in ["apple.com", "bing.com"]:
        sni_val = "www.microsoft.com"

    node_name = f"节点 {index:02d} [{ptype.upper()}] ({server})"

    proxy = {
        "name": node_name,
        "type": ptype,
        "server": server,
        "port": port,
        "password": auth_val,
        "auth": auth_val,
        "sni": sni_val,
        "skip-cert-verify": True,
        "up": "11 Mbps",
        "down": "55 Mbps",
        "fast-open": True
    }

    if ptype == "hysteria":
        proxy["auth-str"] = auth_val
        proxy["protocol"] = "udp"
        proxy["alpn"] = ["h3"]

    return proxy

def generate_clash_yaml(proxies: list) -> str:
    """生成 100% 禁用 IPv6 的 Clash YAML 纯 IPv4 配置文件"""
    proxy_names = [p["name"] for p in proxies]

    def yaml_indent(items, spaces=6):
        pad = " " * spaces
        return "\n".join(f"{pad}- \"{item}\"" for item in items)

    yaml_proxies_block = ""
    for p in proxies:
        yaml_proxies_block += f"  - name: \"{p['name']}\"\n"
        yaml_proxies_block += f"    type: {p['type']}\n"
        yaml_proxies_block += f"    server: \"{p['server']}\"\n"
        yaml_proxies_block += f"    port: {p['port']}\n"
        if p["type"] == "hysteria":
            yaml_proxies_block += f"    auth-str: \"{p['auth-str']}\"\n"
            yaml_proxies_block += f"    protocol: udp\n"
            yaml_proxies_block += f"    alpn:\n      - h3\n"
        else:
            yaml_proxies_block += f"    password: \"{p['password']}\"\n"
            yaml_proxies_block += f"    auth: \"{p['auth']}\"\n"

        yaml_proxies_block += f"    sni: \"{p['sni']}\"\n"
        yaml_proxies_block += f"    skip-cert-verify: {str(p['skip-cert-verify']).lower()}\n"
        yaml_proxies_block += f"    up: \"{p['up']}\"\n"
        yaml_proxies_block += f"    down: \"{p['down']}\"\n"
        yaml_proxies_block += f"    fast-open: true\n"

    template = f"""# =================================================================
# Clash / Mihomo 纯 IPv4 专用订阅配置文件 (已完全禁用 IPv6)
# 更新时间: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}
# 可用纯 IPv4 节点总数: {len(proxies)} 个
# =================================================================
secret: github.com/Alvin9999-newpac/fanqiang
mixed-port: 7890
allow-lan: false
mode: rule
log-level: info
ipv6: false

dns:
  enable: true
  ipv6: false
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
    - 114.114.114.114
  fallback-filter:
    geoip: false
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32

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
  - name: 🛑 全球拦截
    type: select
    proxies:
      - REJECT
      - DIRECT
{yaml_indent(proxy_names, 6)}
  - name: 🍃 应用净化
    type: select
    proxies:
      - REJECT
      - DIRECT
{yaml_indent(proxy_names, 6)}
  - name: 🐟 漏网之鱼
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 全球直连
      - ♻️ 自动选择
{yaml_indent(proxy_names, 6)}

rules:
  - MATCH,🚀 节点选择
"""
    return template

def main():
    print("=" * 65)
    print(">>> 开始执行 Clash 纯 IPv4 节点订阅聚合生成任务")
    print(f">>> 当前时间: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}")
    print("=" * 65)

    if not os.path.exists(URLS_FILE):
        print(f"[!] 错误: {URLS_FILE} 不存在")
        sys.exit(1)

    with open(URLS_FILE, "r", encoding="utf-8") as f:
        raw_lines = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    proxies = []
    node_counter = 1

    for idx, line in enumerate(raw_lines, 1):
        urls = [u.strip() for u in line.split("|") if u.strip()]
        if not urls:
            continue

        print(f"[{idx:02d}/{len(raw_lines):02d}] 正在提取纯 IPv4 节点 #{idx:02d}...", end="", flush=True)
        content = None
        for u in urls:
            content = fetch_url(u)
            if content:
                break

        if not content:
            print(" [✗] 提取失败: 超时或链接无法连通")
            continue

        proxy = parse_proxy_from_content(content, node_counter)
        if proxy:
            proxies.append(proxy)
            print(f" [✓] 提取成功: {proxy['name']} -> {proxy['server']}:{proxy['port']}")
            node_counter += 1
        else:
            print(" [✗] 节点跳过 (已过滤的 IPv6 节点或无效无响应节点)")

    print("-" * 65)
    print(f"[*] IPv4 节点提取总结: 成功获取 {len(proxies)} 个纯 IPv4 有效节点")
    print("-" * 65)

    if not proxies:
        print("[!] 警告: 未能获取到任何 IPv4 节点")
        sys.exit(0)

    # 1. 生成 YAML
    yaml_text = generate_clash_yaml(proxies)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(yaml_text)
    print(f"[✓] 成功生成纯 IPv4 配置文件: {OUTPUT_FILE}")

    # 2. 生成 Base64 订阅
    b64_text = base64.b64encode(yaml_text.encode("utf-8")).decode("utf-8")
    with open(OUTPUT_B64_FILE, "w", encoding="utf-8") as f:
        f.write(b64_text)
    print(f"[✓] 成功生成纯 IPv4 Base64 文件: {OUTPUT_B64_FILE}")

    print("=" * 65)
    print("🎉 Clash 纯 IPv4 订阅生成完成！")

if __name__ == "__main__":
    main()
