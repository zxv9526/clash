@echo off
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
