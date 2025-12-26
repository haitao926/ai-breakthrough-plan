#!/bin/bash

# ==========================================
# AI破壁计划 - 智能启动脚本 (v2.0)
# ==========================================

# 获取脚本绝对路径
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLATFORM_DIR="$BASE_DIR/platform"
PORT=8080

echo "🚀 正在初始化启动环境..."

# 1. 自动清理端口占用 (防止"接口不存在"错误)
PID=$(lsof -ti :$PORT)
if [ ! -z "$PID" ]; then
    echo "🧹 检测到端口 $PORT 被占用 (PID: $PID)，正在清理..."
    kill -9 $PID
    echo "✅ 旧服务已停止"
fi

# 2. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装。"
    exit 1
fi

# 3. 进入平台目录
if [ ! -d "$PLATFORM_DIR" ]; then
    echo "❌ 错误: 找不到 platform 目录。"
    exit 1
fi
cd "$PLATFORM_DIR"

# 4. 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install --silent
fi

# 5. 启动服务
echo "------------------------------------------------"
echo "🟢 服务已启动 (全新实例)"
echo "👉 访问地址: http://localhost:$PORT"
echo "------------------------------------------------"

# 后台打开浏览器
(sleep 2 && open "http://localhost:$PORT" 2>/dev/null) &

# 启动 Server
node server.js