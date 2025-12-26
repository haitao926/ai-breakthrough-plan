#!/bin/bash

# 配置
INSTALL_DIR="$(pwd)/gitea"
EXECUTABLE="${INSTALL_DIR}/gitea"
DOWNLOAD_URL="https://dl.gitea.com/gitea/1.21.4/gitea-1.21.4-darwin-arm64"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== AI破壁计划 代码托管平台启动器 ===${NC}"

# 1. 检查文件是否存在
if [ ! -f "$EXECUTABLE" ]; then
    echo "未检测到 Gitea 程序，正在尝试自动下载..."
    curl -L -o "$EXECUTABLE" "$DOWNLOAD_URL"
    chmod +x "$EXECUTABLE"
fi

# 2. 检查文件有效性 (防止下载成 404 页面)
FILE_SIZE=$(wc -c <"$EXECUTABLE" | tr -d ' ')
if [ "$FILE_SIZE" -lt 10000000 ]; then # 小于 10MB 视为无效
    echo -e "${RED}❌ 自动下载失败 (可能是网络问题)${NC}"
    echo -e "${YELLOW}👉 请手动完成以下步骤：${NC}"
    echo "1. 点击下载: ${DOWNLOAD_URL}"
    echo "2. 将下载的文件重命名为 'gitea' (无后缀)"
    echo "3. 放入目录: ${INSTALL_DIR}/"
    echo "4. 重新运行此脚本"
    
    # 清理无效文件
    rm "$EXECUTABLE"
    exit 1
fi

# 3. 准备环境
export GITEA_WORK_DIR="$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/custom/conf"
mkdir -p "$INSTALL_DIR/data"
mkdir -p "$INSTALL_DIR/log"

# 4. 启动服务
echo -e "${GREEN}✅ Gitea 准备就绪！正在启动...${NC}"
echo "-----------------------------------------------------"
echo "🌐 访问地址: http://localhost:3000"
echo "👉 首次访问请点击页面底部的 [立即安装]"
echo "-----------------------------------------------------"

"$EXECUTABLE" web --port 3000 --config "$INSTALL_DIR/custom/conf/app.ini"
