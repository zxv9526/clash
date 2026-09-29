#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
Karing & Clash Hysteria 2 (HY2) 纯 IPv4 智能验证与自动修复生成脚本
- 数据源：urls_hy2.txt
- 核心功能：
  1. 严格过滤 IPv6 节点，仅保留 100% 纯 IPv4 节点
  2. 真实 Socket/TLS 探针连通性与 SNI 智能纠错
  3. 彻底禁用 IPv6 规则与配置，保障无 IPv6 宽带环境通畅使用
=============================================================================
"""

import os
import sys
import json
import base64
import re
import socket
import ssl
import datetime
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple

TIMEOUT = 10
MAX_RETRIES = 2
OUTPUT_YAML = "hy2_config.yaml"
OUTPUT_B64 = "hy2_config.b64"
OUTPUT_LINKS = "hy2_links.txt"
URLS_FILE = "urls_hy2.txt"

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
    """判断地址是否为 IPv6"""
    if not host:
        return False
    clean = host.strip().lstrip("[").rstrip("]")
    return ":" in clean

def verify_and_repair_node_tls(host: str, port: int, original_sni: str) -> Tuple[bool, str]:
    """通过真实 IPv4 Socket 探针验证节点的网络连通性与 TLS SNI"""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    snis_to_test = [original_sni, "www.microsoft.com", "bing.com", "gateway.icloud.com"]
    seen_snis = []
    for s in snis_to_test:
        if s and s not in seen_snis:
            seen_snis.append(s)

    for test_sni in seen_snis:
        sock = None
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3.5)
            sock.connect((host, port))
            
            tls_sock = ctx.wrap_socket(sock, server_hostname=test_sni)
            tls_sock.close()
            return True, test_sni
        except Exception:
            if sock:
                try:
                    sock.close()
                except Exception:
                    pass

    return False, original_sni

def parse_hy2_json_to_clash_proxy(json_str: str, node_index: int) -> Optional[Dict[str, Any]]:
    """解析 Hysteria 2 JSON 配置为纯 IPv4 节点"""
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
        host = parts[0].lstrip("[").strip()
        port = int(parts[1].strip())
    else:
        parts = server_raw.rsplit(":", 1)
        host = parts[0].strip()
        port = int(parts[1].strip())

    # 🛑 **严格过滤 IPv6 节点**
    if is_ipv6_host(host):
        return None

    auth_str = str(data.get("auth", data.get("password", "dongtaiwang.com"))).strip()

    tls_obj = data.get("tls", {})
    raw_sni = str(tls_obj.get("sni", data.get("sni", "www.microsoft.com"))).strip() or "www.microsoft.com"
    insecure = tls_obj.get("insecure", data.get("insecure", True))

    bw_obj = data.get("bandwidth", {})
    up_raw = bw_obj.get("up", data.get("up", "11 Mbps"))
    down_raw = bw_obj.get("down", data.get("down", "55 Mbps"))

    up_str = f"{up_raw} Mbps" if isinstance(up_raw, (int, float)) else str(up_raw).strip()
    down_str = f"{down_raw} Mbps" if isinstance(down_raw, (int, float)) else str(down_raw).strip()

    # 🔍 真实 IPv4 Socket/TLS 握手探针与 SNI 修复
    is_alive, working_sni = verify_and_repair_node_tls(host, port, raw_sni)
    if not is_alive:
        print(f" [✗] 连通性测试未通过: {host}:{port}")
        return None

    node_name = f"HY2 节点 {node_index:02d} ({host})"

    uri_params = []
    if working_sni:
        uri_params.append(f"sni={urllib.parse.quote(working_sni)}")
    if insecure:
        uri_params.append("insecure=1")

    query_str = ("?" + "&".join(uri_params)) if uri_params else ""
    tag_str = "#" + urllib.parse.quote(node_name)
    hy2_uri = f"hy2://{urllib.parse.quote(auth_str)}@{host}:{port}{query_str}{tag_str}"

    proxy_dict: Dict[str, Any] = {
        "name": node_name,
        "type": "hysteria2",
        "server": host,
        "port": port,
        "password": auth_str,
        "auth": auth_str,
        "sni": working_sni,
        "skip-cert-verify": bool(insecure),
        "up": up_str,
        "down": down_str,
        "fast-open": True,
        "client-fingerprint": "chrome",
        "alpn": ["h3"],
        "hy2_uri": hy2_uri
    }

    return proxy_dict

def generate_hy2_clash_yaml(proxies: List[Dict[str, Any]]) -> str:
    """生成适用于 Karing / Clash Meta 的纯 IPv4 HY2 配置文件 (禁用 IPv6)"""
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
        yaml_proxies_block += f"    password: \"{p['password']}\"\n"
        yaml_proxies_block += f"    auth: \"{p['auth']}\"\n"
        yaml_proxies_block += f"    sni: \"{p['sni']}\"\n"
        yaml_proxies_block += f"    skip-cert-verify: {str(p['skip-cert-verify']).lower()}\n"
        yaml_proxies_block += f"    up: \"{p['up']}\"\n"
        yaml_proxies_block += f"    down: \"{p['down']}\"\n"
        yaml_proxies_block += f"    fast-open: true\n"

    template = f"""# =================================================================
# Karing & Clash Hysteria 2 (HY2) 纯 IPv4 专用节点订阅配置文件 (已禁用 IPv6)
# 更新时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
# 纯 IPv4 HY2 节点总数: {len(proxies)} 个
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
    print(">>> 开始执行 Karing & Clash Hysteria 2 (HY2) 纯 IPv4 验证与生成任务")
    print(f">>> 执行时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 68)

    if not os.path.exists(URLS_FILE):
        print(f"[!] 找不到 URL 列表文件: {URLS_FILE}")
        sys.exit(1)

    with open(URLS_FILE, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    valid_proxies: List[Dict[str, Any]] = []

    for i, url in enumerate(urls, 1):
        print(f"[{i:02d}/{len(urls):02d}] 正在检测纯 IPv4 HY2 节点 #{i:02d}...", end="", flush=True)
        content = fetch_url_content(url)
        if not content:
            print(" [✗] 提取失败: 超时或无法访问")
            continue

        proxy = parse_hy2_json_to_clash_proxy(content, i)
        if proxy:
            valid_proxies.append(proxy)
            print(f" [✓] 检验通过: {proxy['name']} -> {proxy['server']}:{proxy['port']}")
        else:
            print(" [✗] 已过滤 IPv6 节点或无效无响应节点")

    print("-" * 68)
    print(f"[*] HY2 纯 IPv4 节点聚合完成: 成功通过 {len(valid_proxies)} 个纯 IPv4 节点")
    print("-" * 68)

    if not valid_proxies:
        print("[!] 提示: 未在 urls_hy2.txt 中查找到纯 IPv4 的 HY2 源，保持现有模板防清空")
        sys.exit(0)

    # 1. 生成 Clash YAML
    yaml_content = generate_hy2_clash_yaml(valid_proxies)
    with open(OUTPUT_YAML, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"[✓] 成功生成 HY2 纯 IPv4 配置文件: {OUTPUT_YAML}")

    # 2. 生成明文 hy2://
    raw_links = "\n".join(p["hy2_uri"] for p in valid_proxies)
    with open(OUTPUT_LINKS, "w", encoding="utf-8") as f:
        f.write(raw_links)

    # 3. 生成 Base64
    b64_content = base64.b64encode(raw_links.encode("utf-8")).decode("utf-8")
    with open(OUTPUT_B64, "w", encoding="utf-8") as f:
        f.write(b64_content)
    print(f"[✓] 成功生成 HY2 纯 IPv4 Base64 订阅文件: {OUTPUT_B64}")

    print("=" * 68)
    print("🎉 Hysteria 2 纯 IPv4 订阅构建全部完成！")

if __name__ == "__main__":
    main()
