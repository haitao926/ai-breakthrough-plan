#!/bin/bash

# ==========================================
# SASU AI Lab - 智能启动脚本 (v2.1)
# ==========================================

# 获取脚本绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
INNOVATION_DIR="$BASE_DIR/apps/api"
INNOVATION_PORT=8090
GITEA_PORT=3000
LOG_DIR="$BASE_DIR/storage/logs"
WEB_VUE_DIR="$BASE_DIR/apps/web-vue"
WEB_VUE_DIST="$WEB_VUE_DIR/dist"

# --- 清理函数 ---
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."
    if [ ! -z "$GITEA_PID" ]; then
        kill $GITEA_PID 2>/dev/null
        echo "✅ Git Server 已停止"
    fi
    exit
}
# 捕获退出信号 (Ctrl+C)
trap cleanup SIGINT SIGTERM

echo "🚀 正在初始化启动环境..."

# 1. 自动清理端口占用
# 清理 Innovation Platform 端口
PID=$(lsof -ti :$INNOVATION_PORT)
if [ ! -z "$PID" ]; then
    echo "🧹 检测到 Innovation Platform 端口 $INNOVATION_PORT 被占用 (PID: $PID)，正在清理..."
    kill -9 $PID
fi

# 清理 Gitea 端口
PID=$(lsof -ti :$GITEA_PORT)
if [ ! -z "$PID" ]; then
    echo "🧹 检测到 Gitea 端口 $GITEA_PORT 被占用 (PID: $PID)，正在清理..."
    kill -9 $PID
fi
echo "✅ 旧服务已清理完成"


# 2. 启动 Git Server
GIT_SERVER_SCRIPT="$SCRIPT_DIR/start_git_server.sh"
if [ -f "$GIT_SERVER_SCRIPT" ]; then
    echo "🚀 正在启动 Git Server..."
    mkdir -p "$LOG_DIR"
    # 以后台方式启动，重定向输出到日志文件
    bash "$GIT_SERVER_SCRIPT" > "$LOG_DIR/gitea_server.log" 2>&1 &
    GITEA_PID=$!
    echo "✅ Git Server 已在后台启动 (PID: $GITEA_PID)"
    echo "👉 Git 服务地址: http://localhost:$GITEA_PORT"
else
    echo "⚠️ 警告: 未找到 start_git_server.sh，跳过 Git 服务启动。"
fi


# 3. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装。"
    cleanup
    exit 1
fi

# 3.1 构建 Vue 前端（如存在）
if [ -d "$WEB_VUE_DIR" ]; then
    echo "🧩 检查 Vue 前端..."
    get_latest_mtime() {
        local latest=0
        while IFS= read -r -d '' file; do
            local mtime
            mtime=$(stat -f "%m" "$file" 2>/dev/null || echo 0)
            if [ "$mtime" -gt "$latest" ]; then
                latest=$mtime
            fi
        done < <(find "$WEB_VUE_DIR/src" "$WEB_VUE_DIR/public" \
                 "$WEB_VUE_DIR/index.html" "$WEB_VUE_DIR/vite.config.js" \
                 "$WEB_VUE_DIR/tailwind.config.js" "$WEB_VUE_DIR/postcss.config.js" \
                 "$WEB_VUE_DIR/package.json" "$WEB_VUE_DIR/package-lock.json" \
                 -type f -print0 2>/dev/null)
        echo "$latest"
    }

    dist_mtime() {
        if [ -f "$WEB_VUE_DIST/index.html" ]; then
            stat -f "%m" "$WEB_VUE_DIST/index.html" 2>/dev/null || echo 0
        else
            echo 0
        fi
    }

    if [ ! -d "$WEB_VUE_DIR/node_modules" ]; then
        echo "📦 正在安装 Vue 前端依赖..."
        (cd "$WEB_VUE_DIR" && npm install --silent)
    fi
    if [ ! -d "$WEB_VUE_DIST" ] || [ "$FORCE_WEB_BUILD" = "1" ]; then
        echo "🏗️  正在构建 Vue 前端..."
        (cd "$WEB_VUE_DIR" && npm run build --silent)
    else
        SRC_TS=$(get_latest_mtime)
        DIST_TS=$(dist_mtime)
        if [ "$SRC_TS" -gt "$DIST_TS" ]; then
            echo "🏗️  检测到前端更新，正在重新构建..."
            (cd "$WEB_VUE_DIR" && npm run build --silent)
        else
            echo "✅ Vue 前端无变更，跳过构建"
        fi
    fi
    if [ -d "$WEB_VUE_DIST" ]; then
        export WEB_ROOT="$WEB_VUE_DIST"
        export WEB_SPA="true"
        echo "✅ Vue 前端构建完成，将由 API 进行静态托管"
    else
        echo "⚠️ Vue 前端未构建成功，将尝试使用已有静态资源"
    fi
fi

# 4. 进入平台目录
if [ ! -d "$INNOVATION_DIR" ]; then
    echo "❌ 错误: 找不到 apps/api 目录。"
    cleanup
    exit 1
fi
cd "$INNOVATION_DIR"

# 5. 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install --silent
fi

# 6. 启动 Innovation Platform 服务
echo "------------------------------------------------"
echo "🟢 科创项目平台已启动"
echo "👉 本机访问: http://localhost:$INNOVATION_PORT"

# 获取并显示局域网 IP
IP_LIST=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
if [ ! -z "$IP_LIST" ]; then
    echo "📡 局域网访问 (其他设备):"
    for ip in $IP_LIST; do
        echo "   👉 http://$ip:$INNOVATION_PORT"
    done
fi
echo "------------------------------------------------"

# 后台打开浏览器
(sleep 3 && open "http://localhost:$INNOVATION_PORT" 2>/dev/null) &

# 启动 Server (前台运行)
PORT=$INNOVATION_PORT node server.js
