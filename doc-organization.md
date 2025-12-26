# 文档整理方案

## 当前根目录下的文档分类

### 1. 项目文档（应移动到 course-files 对应目录）
```
项目1-体感互动游戏.md → course-files/project1/
项目1-体感互动游戏-趣味版.md → course-files/project1/
项目2-产品经理与项目经理.md → course-files/project2/
项目2-产品经理与项目经理-趣味版.md → course-files/project2/
项目3-全栈工程师.md → course-files/project3/
项目3-全栈工程师-趣味版.md → course-files/project3/
项目4-算法工程师.md → course-files/project4/
项目4-算法工程师-趣味版.md → course-files/project4/
项目5-嵌入式工程师.md → course-files/project5/
项目5-嵌入式工程师-趣味版.md → course-files/project5/
项目6-综合实践周.md → course-files/project6/
项目6-综合实践周-趣味版.md → course-files/project6/
```

### 2. 公共文档（应移动到 course-files/common/）
```
课程总体设计.md → course-files/common/
能力素养培养体系.md → course-files/common/
工具清单和资源.md → course-files/common/
教学实施指南.md → course-files/common/
📋文档体系梳理.md → course-files/common/
```

### 3. 平台文档（保留在根目录）
```
README.md → 项目主说明文档
README-PLATFORM.md → 平台使用说明
使用说明.md → 服务器部署说明
```

## 建议的目录结构

```
AI万花筒/
├── 根目录文件（保留）
│   ├── README.md
│   ├── README-PLATFORM.md
│   ├── 使用说明.md
│   ├── index.html (统一版)
│   ├── index-old.html (备份)
│   ├── index-new.html (备份)
│   ├── server.js
│   ├── package.json
│   └── start.bat
├── course-files/
│   ├── common/
│   │   ├── 课程总体设计.md
│   │   ├── 能力素养培养体系.md
│   │   ├── 工具清单和资源.md
│   │   ├── 教学实施指南.md
│   │   └── 📋文档体系梳理.md
│   ├── project1/
│   │   ├── 项目1-体感互动游戏.md
│   │   ├── 项目1-体感互动游戏-趣味版.md
│   │   └── (其他项目1相关资料)
│   ├── project2/
│   │   ├── 项目2-产品经理与项目经理.md
│   │   ├── 项目2-产品经理与项目经理-趣味版.md
│   │   └── (其他项目2相关资料)
│   ├── project3/
│   │   ├── 项目3-全栈工程师.md
│   │   ├── 项目3-全栈工程师-趣味版.md
│   │   └── (其他项目3相关资料)
│   ├── project4/
│   │   ├── 项目4-算法工程师.md
│   │   ├── 项目4-算法工程师-趣味版.md
│   │   └── (其他项目4相关资料)
│   ├── project5/
│   │   ├── 项目5-嵌入式工程师.md
│   │   ├── 项目5-嵌入式工程师-趣味版.md
│   │   └── (其他项目5相关资料)
│   └── project6/
│       ├── 项目6-综合实践周.md
│       ├── 项目6-综合实践周-趣味版.md
│       └── (其他项目6相关资料)
```

## 批处理脚本（Windows）

```batch
@echo off
echo 正在整理文档...

:: 创建目录结构
if not exist "course-files\common" mkdir "course-files\common"
for /L %%i in (1,1,6) do (
    if not exist "course-files\project%%i" mkdir "course-files\project%%i"
)

:: 移动公共文档
echo 移动公共文档...
move "课程总体设计.md" "course-files\common\" >nul 2>&1
move "能力素养培养体系.md" "course-files\common\" >nul 2>&1
move "工具清单和资源.md" "course-files\common\" >nul 2>&1
move "教学实施指南.md" "course-files\common\" >nul 2>&1
move "📋文档体系梳理.md" "course-files\common\" >nul 2>&1

:: 移动项目文档
echo 移动项目文档...
move "项目1-体感互动游戏.md" "course-files\project1\" >nul 2>&1
move "项目1-体感互动游戏-趣味版.md" "course-files\project1\" >nul 2>&1
move "项目2-产品经理与项目经理.md" "course-files\project2\" >nul 2>&1
move "项目2-产品经理与项目经理-趣味版.md" "course-files\project2\" >nul 2>&1
move "项目3-全栈工程师.md" "course-files\project3\" >nul 2>&1
move "项目3-全栈工程师-趣味版.md" "course-files\project3\" >nul 2>&1
move "项目4-算法工程师.md" "course-files\project4\" >nul 2>&1
move "项目4-算法工程师-趣味版.md" "course-files\project4\" >nul 2>&1
move "项目5-嵌入式工程师.md" "course-files\project5\" >nul 2>&1
move "项目5-嵌入式工程师-趣味版.md" "course-files\project5\" >nul 2>&1
move "项目6-综合实践周.md" "course-files\project6\" >nul 2>&1
move "项目6-综合实践周-趣味版.md" "course-files\project6\" >nul 2>&1

echo 文档整理完成！
pause
```

## Bash脚本（Linux/Mac）

```bash
#!/bin/bash

echo "正在整理文档..."

# 创建目录结构
mkdir -p course-files/common
for i in {1..6}; do
    mkdir -p course-files/project$i
done

# 移动公共文档
echo "移动公共文档..."
mv "课程总体设计.md" "course-files/common/" 2>/dev/null || true
mv "能力素养培养体系.md" "course-files/common/" 2>/dev/null || true
mv "工具清单和资源.md" "course-files/common/" 2>/dev/null || true
mv "教学实施指南.md" "course-files/common/" 2>/dev/null || true
mv "📋文档体系梳理.md" "course-files/common/" 2>/dev/null || true

# 移动项目文档
echo "移动项目文档..."
mv "项目1-体感互动游戏.md" "course-files/project1/" 2>/dev/null || true
mv "项目1-体感互动游戏-趣味版.md" "course-files/project1/" 2>/dev/null || true
mv "项目2-产品经理与项目经理.md" "course-files/project2/" 2>/dev/null || true
mv "项目2-产品经理与项目经理-趣味版.md" "course-files/project2/" 2>/dev/null || true
mv "项目3-全栈工程师.md" "course-files/project3/" 2>/dev/null || true
mv "项目3-全栈工程师-趣味版.md" "course-files/project3/" 2>/dev/null || true
mv "项目4-算法工程师.md" "course-files/project4/" 2>/dev/null || true
mv "项目4-算法工程师-趣味版.md" "course-files/project4/" 2>/dev/null || true
mv "项目5-嵌入式工程师.md" "course-files/project5/" 2>/dev/null || true
mv "项目5-嵌入式工程师-趣味版.md" "course-files/project5/" 2>/dev/null || true
mv "项目6-综合实践周.md" "course-files/project6/" 2>/dev/null || true
mv "项目6-综合实践周-趣味版.md" "course-files/project6/" 2>/dev/null || true

echo "文档整理完成！"
```

## 注意事项

1. **备份重要文档**：在执行移动操作前，建议先备份重要文档
2. **更新引用**：移动文档后，需要更新index-unified.html中的文档路径引用
3. **测试访问**：确保服务器能正确访问移动后的文件
4. **版本控制**：如果有使用git，需要记录文件移动的历史

## 优势

1. **清晰的目录结构**：文档分类明确，易于管理和查找
2. **与功能对应**：目录结构与网站的下载功能相对应
3. **便于扩展**：后续添加新资料时，知道应该放在哪个位置
4. **避免混乱**：根目录只保留核心文件，保持整洁