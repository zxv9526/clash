#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
Clash Hysteria 1 (HY1) 纯 IPv4 独立节点自动化聚合与生成脚本
- 数据源：urls_hy1.txt
- 核心规则：**严格过滤 IPv6，仅保留纯 IPv4 节点**
- 独立输出：hy1_config.yaml 与 hy1_config.b64
=============================================================================
"""

import os
import sys
import json
import base64
import re
import datetime
import urllib.request
import ssl
from typing import List, Dict, Any, Optional

TIMEOUT = 12
MAX_RETRIES = 2
OUTPUT_YAML = "hy1_config.yaml"
OUTPUT_B64 = "hy1_config.b64"
URLS_FILE = "urls_hy1.txt"

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}

def get_backup_url(primary_url: str) -> Optional[str]:
    """生成对应的备用镜像源地址"""
    if "gitlab.com/free9999/ipupdate/-/raw/master/" in primary_url:
        return primary_url.replace(
            "https://gitlab.com/free9999/ipupdate/-/raw/master/",
            "https://www.67867867.xyz/Alvin9999/PAC/refs/heads/master/"
        )
    return None

def fetch_url_content(url: str) -> Optional[str]:
    """带有重试与备用源容灾的 HTTP 获取函数"""
    urls_to_try = [url]
    backup = get_backup_url(url)
    if backup:
        urls_to_try.append(backup)

    for idx, target_url in enumerate(urls_to_try):
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                req = urllib.request.Request(target_url, headers=DEFAULT_HEADERS)
                with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as response:
                    if response.status == 200:
                        content = response.read().decode('utf-8', errors='ignore')
                        if content.strip():
                            return content
            except Exception:
                pass

    return None

def is_ipv6_host(host: str) -> bool:
    """判断地址是否包含 IPv6"""
    if not host:
        return False
    clean = host.strip().lstrip("[").rstrip("]")
    return ":" in clean

def parse_hy1_json_to_clash_proxy(json_str: str, node_index: int) -> Optional[Dict[str, Any]]:
    """解析 Hysteria 1 JSON 配置为 Clash 标准 Hysteria 节点 (排除 IPv6)"""
    try:
        data = json.loads(json_str.strip())
    except Exception:
        m = re.search(r'\{[\s\S]*"server"[\s\S]*\}', json_str)
        if m:
            try:
                data = json.loads(m.group(0))
            except Exception:
                return None
        else:
            return None

    server_raw = str(data.get("server", "")).strip()
    if not server_raw or ":" not in server_raw:
        return None

    if server_raw.startswith("[") and "]:" in server_raw:
        parts = server_raw.split("]:")
        host = parts[0].lstrip("[")
        port = int(parts[1])
    else:
        parts = server_raw.rsplit(":", 1)
        host = parts[0]
        port = int(parts[1])

    # 🛑 **严格过滤 IPv6 地址**
    if is_ipv6_host(host):
        return None

    auth_str = str(data.get("auth_str", data.get("auth", "dongtaiwang.com"))).strip()
    sni = str(data.get("server_name", data.get("sni", "www.microsoft.com"))).strip()
    if sni in ["apple.com", "bing.com"]:
        sni = "www.microsoft.com"

    up_mbps = data.get("up_mbps", 11)
    down_mbps = data.get("down_mbps", 55)
    insecure = data.get("insecure", True)
    alpn = data.get("alpn", "h3")
    alpn_list = [alpn] if isinstance(alpn, str) else list(alpn)

    node_name = f"HY1 节点 {node_index:02d} ({host})"

    proxy_dict: Dict[str, Any] = {
        "name": node_name,
        "type": "hysteria",
        "server": host,
        "port": port,
        "auth-str": auth_str,
        "sni": sni,
        "skip-cert-verify": bool(insecure),
        "alpn": alpn_list,
        "protocol": "udp",
        "up": f"{up_mbps} Mbps",
        "down": f"{down_mbps} Mbps"
    }

    return proxy_dict

def generate_hy1_clash_yaml(proxies: List[Dict[str, Any]]) -> str:
    """生成适用于 Karing / Clash Meta 的纯 IPv4 HY1 配置文件"""
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
        yaml_proxies_block += f"    auth-str: \"{p['auth-str']}\"\n"
        yaml_proxies_block += f"    sni: \"{p['sni']}\"\n"
        yaml_proxies_block += f"    skip-cert-verify: {str(p['skip-cert-verify']).lower()}\n"
        yaml_proxies_block += f"    alpn:\n      - h3\n"
        yaml_proxies_block += f"    protocol: udp\n"
        yaml_proxies_block += f"    up: \"{p['up']}\"\n"
        yaml_proxies_block += f"    down: \"{p['down']}\"\n"

    template = f"""# =================================================================
# Clash Hysteria 1 (HY1) 纯 IPv4 专用节点订阅配置文件 (已禁用 IPv6)
# 自动化更新时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
# 纯 IPv4 HY1 节点总数: {len(proxies)} 个
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
    print("=" * 68)
    print(">>> 开始执行 Clash Hysteria 1 (HY1) 纯 IPv4 订阅抓取生成任务")
    print(f">>> 执行时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 68)

    if not os.path.exists(URLS_FILE):
        print(f"[!] 找不到 URL 列表文件: {URLS_FILE}")
        sys.exit(1)

    with open(URLS_FILE, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    valid_proxies: List[Dict[str, Any]] = []

    for i, url in enumerate(urls, 1):
        print(f"[{i:02d}/{len(urls):02d}] 正在提取纯 IPv4 HY1 节点 #{i:02d}...", end="", flush=True)
        content = fetch_url_content(url)
        if not content:
            print(" [✗] 提取失败: 超时或无法访问")
            continue

        proxy = parse_hy1_json_to_clash_proxy(content, i)
        if proxy:
            valid_proxies.append(proxy)
            print(f" [✓] 提取成功: {proxy['name']} -> {proxy['server']}:{proxy['port']}")
        else:
            print(" [✗] 已过滤 IPv6 或格式无效节点")

    print("-" * 68)
    print(f"[*] HY1 纯 IPv4 节点导出完成: 成功抓取 {len(valid_proxies)} 个有效节点")
    print("-" * 68)

    if not valid_proxies:
        print("[!] 警告: 未能获取到任何纯 IPv4 HY1 节点")
        sys.exit(0)

    # 1. 生成 YAML
    yaml_content = generate_hy1_clash_yaml(valid_proxies)
    with open(OUTPUT_YAML, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"[✓] 成功生成 HY1 配置文件: {OUTPUT_YAML}")

    # 2. 生成 Base64
    b64_content = base64.b64encode(yaml_content.encode("utf-8")).decode("utf-8")
    with open(OUTPUT_B64, "w", encoding="utf-8") as f:
        f.write(b64_content)
    print(f"[✓] 成功生成 HY1 Base64 文件: {OUTPUT_B64}")

    print("=" * 68)
    print("🎉 Hysteria 1 纯 IPv4 订阅构建完成！")

if __name__ == "__main__":
    main()
