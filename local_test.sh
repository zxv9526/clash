#!/bin/bash
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
