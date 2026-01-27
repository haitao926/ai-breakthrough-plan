@echo off
set "BASE_DIR=%~dp0.."
cd /d "%BASE_DIR%"
echo ========================================
echo AI万花筒文档整理工�?echo ========================================
echo.
echo 此脚本将整理根目录下的文档到对应位置
echo 确保您已备份重要文件
echo.
pause

:: 显示将要执行的操�?echo 将执行以下操作：
echo.
echo 1. 创建目录结构
echo    - content\materials\common
echo    - content\materials\project1 �?project6
echo.
echo 2. 移动公共文档�?content\materials\common
echo    - 课程总体设计.md
echo    - 能力素养培养体系.md
echo    - 工具清单和资�?md
echo    - 教学实施指南.md
echo    - 📋文档体系梳理.md
echo.
echo 3. 移动项目文档到对应目�?echo    - 项目1-体感互动游戏相关文档 �?content\materials\project1
echo    - 项目2-产品经理相关文档 �?content\materials\project2
echo    - ...以此类推
echo.
set /p confirm="确认执行�?Y/N): "
if /i "%confirm%" neq "Y" (
    echo 操作已取�?    pause
    exit /b
)

echo.
echo 开始整�?..

:: 创建目录结构
echo [1/2] 创建目录结构...
if not exist "content\materials\common" mkdir "content\materials\common"
for /L %%i in (1,1,6) do (
    if not exist "content\materials\project%%i" mkdir "content\materials\project%%i"
    echo   - 创建 content\materials\project%%i
)

:: 移动公共文档
echo.
echo [2/2] 移动文档...

:: 移动公共文档
echo   移动公共文档...
if exist "课程总体设计.md" (
    move "课程总体设计.md" "content\materials\common\" >nul
    echo     �?课程总体设计.md
)
if exist "能力素养培养体系.md" (
    move "能力素养培养体系.md" "content\materials\common\" >nul
    echo     �?能力素养培养体系.md
)
if exist "工具清单和资�?md" (
    move "工具清单和资�?md" "content\materials\common\" >nul
    echo     �?工具清单和资�?md
)
if exist "教学实施指南.md" (
    move "教学实施指南.md" "content\materials\common\" >nul
    echo     �?教学实施指南.md
)
if exist "📋文档体系梳理.md" (
    move "📋文档体系梳理.md" "content\materials\common\" >nul
    echo     �?📋文档体系梳理.md
)

:: 移动项目文档
echo   移动项目文档...
if exist "项目1-体感互动游戏.md" (
    move "项目1-体感互动游戏.md" "content\materials\project1\" >nul
    echo     �?项目1-体感互动游戏.md
)
if exist "项目1-体感互动游戏-趣味�?md" (
    move "项目1-体感互动游戏-趣味�?md" "content\materials\project1\" >nul
    echo     �?项目1-体感互动游戏-趣味�?md
)

if exist "项目2-产品经理与项目经�?md" (
    move "项目2-产品经理与项目经�?md" "content\materials\project2\" >nul
    echo     �?项目2-产品经理与项目经�?md
)
if exist "项目2-产品经理与项目经�?趣味�?md" (
    move "项目2-产品经理与项目经�?趣味�?md" "content\materials\project2\" >nul
    echo     �?项目2-产品经理与项目经�?趣味�?md
)

if exist "项目3-全栈工程�?md" (
    move "项目3-全栈工程�?md" "content\materials\project3\" >nul
    echo     �?项目3-全栈工程�?md
)
if exist "项目3-全栈工程�?趣味�?md" (
    move "项目3-全栈工程�?趣味�?md" "content\materials\project3\" >nul
    echo     �?项目3-全栈工程�?趣味�?md
)

if exist "项目4-算法工程�?md" (
    move "项目4-算法工程�?md" "content\materials\project4\" >nul
    echo     �?项目4-算法工程�?md
)
if exist "项目4-算法工程�?趣味�?md" (
    move "项目4-算法工程�?趣味�?md" "content\materials\project4\" >nul
    echo     �?项目4-算法工程�?趣味�?md
)

if exist "项目5-嵌入式工程师.md" (
    move "项目5-嵌入式工程师.md" "content\materials\project5\" >nul
    echo     �?项目5-嵌入式工程师.md
)
if exist "项目5-嵌入式工程师-趣味�?md" (
    move "项目5-嵌入式工程师-趣味�?md" "content\materials\project5\" >nul
    echo     �?项目5-嵌入式工程师-趣味�?md
)

if exist "项目6-综合实践�?md" (
    move "项目6-综合实践�?md" "content\materials\project6\" >nul
    echo     �?项目6-综合实践�?md
)
if exist "项目6-综合实践�?趣味�?md" (
    move "项目6-综合实践�?趣味�?md" "content\materials\project6\" >nul
    echo     �?项目6-综合实践�?趣味�?md
)

echo.
echo ========================================
echo 文档整理完成�?echo ========================================
echo.
echo 目录结构已更新，请查�?content\materials 文件�?echo.
echo 注意事项�?echo 1. 请更�?index-unified.html 中的文档路径引用
echo 2. 测试服务器能正确访问移动后的文件
echo 3. 如有问题，请查看备份
echo.
pause
