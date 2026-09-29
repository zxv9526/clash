#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
Clash / Karing Hysteria 2 (HY2) 独立节点自动化聚合与生成脚本
- 数据源：urls_hy2.txt (包含 14 个 Hysteria 2 JSON 配置文件地址)
- 独立输出：
  1. hy2_config.yaml  -> 兼容 Clash Meta / Mihomo / Karing / Clash Verge
  2. hy2_config.b64   -> Base64 格式的 hy2:// 节点列表 (Karing/v2rayNG/Shadowrocket 原生秒解析)
  3. hy2_links.txt    -> 明文 hy2:// 节点连接列表
- 特性：双字段认证兼容 (password/auth)、标准 hy2 URI 生成、主备容灾切换
=============================================================================
"""

import os
import sys
import json
import base64
import re
import datetime
import urllib.parse
from typing import List, Dict, Any, Optional

try:
    import yaml
except ImportError:
    yaml = None

try:
    import requests
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import ssl

TIMEOUT = 12
MAX_RETRIES = 2
OUTPUT_YAML = "hy2_config.yaml"
OUTPUT_B64 = "hy2_config.b64"
OUTPUT_LINKS = "hy2_links.txt"
URLS_FILE = "urls_hy2.txt"

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
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
        is_backup = idx > 0
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                if HAS_REQUESTS:
                    res = requests.get(
                        target_url,
                        headers=DEFAULT_HEADERS,
                        timeout=TIMEOUT,
                        verify=False
                    )
                    if res.status_code == 200 and res.text.strip():
                        return res.text
                else:
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

        if not is_backup and backup:
            print(f"   [~] HY2 主地址无响应，尝试备用镜像源: {backup}")

    return None

def parse_hy2_json_to_clash_proxy(json_str: str, node_index: int) -> Optional[Dict[str, Any]]:
    """解析 Hysteria 2 JSON 配置为标准节点对象 (兼容 Clash Meta / Mihomo / Karing / Sing-box)"""
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

    # 解析 host 和 port (去掉方括号，纯净 IP 或域名)
    if server_raw.startswith("[") and "]:" in server_raw:
        parts = server_raw.split("]:")
        host = parts[0].lstrip("[").strip()
        port = int(parts[1].strip())
    else:
        parts = server_raw.rsplit(":", 1)
        host = parts[0].strip()
        port = int(parts[1].strip())

    # 密码 (HY2 认证字段)
    auth_str = str(data.get("auth", data.get("password", "dongtaiwang.com"))).strip()

    # TLS 设置 (SNI 与证书校验)
    tls_obj = data.get("tls", {})
    sni = str(tls_obj.get("sni", data.get("sni", host))).strip() or host
    insecure = tls_obj.get("insecure", data.get("insecure", True))

    # 带宽
    bw_obj = data.get("bandwidth", {})
    up_raw = bw_obj.get("up", data.get("up", "11 Mbps"))
    down_raw = bw_obj.get("down", data.get("down", "55 Mbps"))

    up_str = f"{up_raw} Mbps" if isinstance(up_raw, (int, float)) else str(up_raw).strip()
    down_str = f"{down_raw} Mbps" if isinstance(down_raw, (int, float)) else str(down_raw).strip()

    # 混淆 (obfs)
    obfs_obj = data.get("obfs", {})
    obfs_type = ""
    obfs_password = ""
    if isinstance(obfs_obj, dict):
        obfs_type = obfs_obj.get("type", "")
        obfs_password = obfs_obj.get("password", "")
    elif isinstance(obfs_obj, str) and obfs_obj:
        obfs_password = obfs_obj

    node_name = f"HY2 节点 {node_index:02d} ({host})"

    # 生成标准 hy2:// URI (Karing, v2rayNG, Sing-box, NekoBox 原生通用)
    host_for_uri = f"[{host}]" if ":" in host else host
    uri_params = []
    if sni:
        uri_params.append(f"sni={urllib.parse.quote(sni)}")
    if insecure:
        uri_params.append("insecure=1")
    if obfs_password:
        uri_params.append(f"obfs={obfs_type or 'salamander'}")
        uri_params.append(f"obfs-password={urllib.parse.quote(obfs_password)}")

    query_str = ("?" + "&".join(uri_params)) if uri_params else ""
    tag_str = "#" + urllib.parse.quote(node_name)
    hy2_uri = f"hy2://{urllib.parse.quote(auth_str)}@{host_for_uri}:{port}{query_str}{tag_str}"

    proxy_dict: Dict[str, Any] = {
        "name": node_name,
        "type": "hysteria2",
        "server": host,
        "port": port,
        "password": auth_str,
        "auth": auth_str,
        "sni": sni,
        "skip-cert-verify": bool(insecure),
        "up": up_str,
        "down": down_str,
        "fast-open": True,
        "hy2_uri": hy2_uri
    }

    if obfs_type or obfs_password:
        proxy_dict["obfs"] = obfs_type or "salamander"
        proxy_dict["obfs-password"] = obfs_password

    return proxy_dict

def generate_hy2_clash_yaml(proxies: List[Dict[str, Any]]) -> str:
    """生成适用于 Karing / Clash Meta / Mihomo 的完整 Clash YAML 配置"""
    proxy_names = [p["name"] for p in proxies]

    def yaml_indent(items, spaces=6):
        pad = " " * spaces
        return "\n".join(f"{pad}- {item}" for item in items)

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
        if "obfs" in p and p["obfs"]:
            yaml_proxies_block += f"    obfs: \"{p['obfs']}\"\n"
            yaml_proxies_block += f"    obfs-password: \"{p.get('obfs-password', '')}\"\n"

    template = f"""# =================================================================
# Karing & Clash Hysteria 2 (HY2) 专用节点订阅配置文件
# 独立自动化更新于: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
# 节点总数: {len(proxies)} 个可用 Hysteria 2 节点
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
    - 223.5.5.5
    - 119.29.29.29
    - 114.114.114.114
    - 2400:3200::1
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
    print(">>> 开始执行 Karing & Clash Hysteria 2 (HY2) 独立订阅抓取与生成任务")
    print(f">>> 执行时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 68)

    if not os.path.exists(URLS_FILE):
        print(f"[!] 找不到 URL 列表文件: {URLS_FILE}")
        sys.exit(1)

    with open(URLS_FILE, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    print(f"[*] 从 {URLS_FILE} 中读取到 {len(urls)} 个 HY2 JSON 源")
    print()

    valid_proxies: List[Dict[str, Any]] = []

    for i, url in enumerate(urls, 1):
        print(f"[{i:02d}/{len(urls):02d}] 正在提取 HY2 节点 #{i:02d}...", end="", flush=True)
        content = fetch_url_content(url)
        if not content:
            print(" [✗] 提取失败: 节点 URL 连接超时或无法访问")
            continue

        proxy = parse_hy2_json_to_clash_proxy(content, i)
        if proxy:
            valid_proxies.append(proxy)
            print(f" [✓] 提取成功: {proxy['name']} -> {proxy['server']}:{proxy['port']}")
        else:
            print(" [✗] 解析失败: JSON 数据格式不合规")

    print()
    print("-" * 68)
    print(f"[*] HY2 节点导出聚合完成: 成功抓取 {len(valid_proxies)} / {len(urls)} 个有效节点")
    print("-" * 68)

    if not valid_proxies:
        print("[!] 警告: 未能获取到任何有效 HY2 节点，保留现有配置以防被清空")
        sys.exit(0)

    # 1. 生成 Clash YAML
    yaml_content = generate_hy2_clash_yaml(valid_proxies)
    with open(OUTPUT_YAML, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"[✓] 成功生成 HY2 配置文件: {OUTPUT_YAML} ({len(yaml_content.encode('utf-8'))} 字节)")

    # 2. 生成明文 hy2:// 节点链接列表
    raw_links = "\n".join(p["hy2_uri"] for p in valid_proxies)
    with open(OUTPUT_LINKS, "w", encoding="utf-8") as f:
        f.write(raw_links)
    print(f"[✓] 成功生成 HY2 明文节点链接文件: {OUTPUT_LINKS}")

    # 3. 生成通用 Base64 订阅 (Karing/v2rayNG/Shadowrocket 原生秒解析)
    b64_content = base64.b64encode(raw_links.encode("utf-8")).decode("utf-8")
    with open(OUTPUT_B64, "w", encoding="utf-8") as f:
        f.write(b64_content)
    print(f"[✓] 成功生成 HY2 Base64 订阅文件: {OUTPUT_B64} ({len(b64_content.encode('utf-8'))} 字节)")

    print("=" * 68)
    print("🎉 Hysteria 2 订阅构建全部完成！")

if __name__ == "__main__":
    main()
