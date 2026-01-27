#!/bin/bash

# 获取当前脚本所在的目录（即 scripts 目录）
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 切换到 scripts 目录
cd "$DIR"

# 执行启动脚本
bash "$DIR/start.sh"
