# 项目3：全栈工程师 (Full Stack) - 教师授课指南

## 📅 课程概览
*   **课程名称**：全栈开发实战 - 智能错题本 (Mistake Killer)
*   **课时安排**：4 课时
*   **核心目标**：
    1.  理解 **Client-Server** 架构（前端 vs 后端）。
    2.  掌握 **API** 的概念与使用。
    3.  完成一个具有增删改查 (CRUD) 功能的 Web 应用。

---

## 🎒 课前准备
*   **环境配置**：
    *   Python 3.8+
    *   VS Code (安装 Python 插件, Live Server 插件)
    *   库安装：`pip install fastapi uvicorn`
*   **素材**：分发 `project3/mistake_killer_starter` 文件夹给学生。

---

## 📝 第1课：产品设计与原型 (Design Day)

### 🎯 教学目标
1.  明确产品需求（MVP：最小可行性产品）。
2.  了解 UI/UX 设计基础。
3.  **产出**：手绘原型图 + HTML 骨架。

### ⏱️ 教学流程

#### 0-10分钟：需求分析
*   **场景**：期末考试复习，试卷找不到？错题不仅要记，还要分类。
*   **角色**：今天大家是 **产品经理**。
*   **MVP 功能列表**：
    1.  上传错题（图片+文字）。
    2.  错题列表展示。
    3.  (可选) 按学科筛选。

#### 10-20分钟：UI 设计 (纸面原型)
*   **工具**：A4纸 + 笔。
*   **绘制**：
    *   **首页**：顶部是标题，下面是卡片流（Card Stream）。
    *   **添加页**：输入框、上传按钮、保存按钮。

#### 20-40分钟：HTML 骨架搭建
*   **AI 辅助**：
    *   Prompt: "请帮我写一个简单的 HTML 页面结构，包含一个顶部导航栏，一个错题列表区域（用卡片样式），和一个底部的'添加错题'按钮。"
*   **代码阅读**：
    *   讲解 `<div>`, `<input>`, `<button>` 标签。
    *   让学生修改按钮的文字，修改标题。

#### 40-45分钟：总结
*   **展示**：大家用浏览器打开 HTML，虽然丑（没 CSS），但是骨架有了。

---

## 📝 第2课：前端美化与逻辑 (Frontend Day)

### 🎯 教学目标
1.  理解 **CSS** 的作用 (Make it pretty)。
2.  理解 **JavaScript** 的作用 (Make it work)。
3.  **产出**：一个好看的、静态的网页。

### ⏱️ 教学流程

#### 0-10分钟：CSS 魔法
*   **对比**：展示"裸奔"的 HTML 和加上 CSS 后的页面。
*   **实操**：
    *   引入 `style.css`。
    *   使用 Flexbox 布局（AI 辅助生成 Flex 布局代码）。
    *   Prompt: "请帮我写 CSS，让 .card 类变成圆角矩形，有阴影，并且卡片之间有间距。"

#### 10-35分钟：JS 交互 (Mock Data)
*   **概念**：现在没有后端，数据从哪来？-> **假数据 (Mock Data)**。
*   **任务**：
    1.  定义一个数组 `let mistakes = [...]`。
    2.  编写 `render()` 函数，把数组变成 HTML 卡片插入页面。
    3.  编写按钮点击事件：`console.log("点击了添加")`。

#### 35-45分钟：挑战
*   **挑战**：修改 JS 中的 Mock 数据（比如改成分数、科目），刷新页面，看界面是否变化。

---

## 📝 第3课：后端开发与接口 (Backend Day)

### 🎯 教学目标
1.  理解 **API** 和 **HTTP 请求**。
2.  使用 **FastAPI** 编写后端服务。
3.  **产出**：一个能返回 JSON 数据的后端接口。

### ⏱️ 教学流程

#### 0-10分钟：后端是什么？
*   **比喻**：
    *   前端是餐厅服务员（展示菜单、端菜）。
    *   后端是厨师（做菜、处理逻辑）。
    *   API 是订单（传递信息）。

#### 10-25分钟：Hello FastAPI
*   **代码实操**：
    ```python
    from fastapi import FastAPI
    app = FastAPI()

    @app.get("/")
    def read_root():
        return {"Hello": "World"}
    ```
*   **运行**：`uvicorn main:app --reload`。
*   **访问**：浏览器打开 `http://127.0.0.1:8000`。

#### 25-45分钟：编写 API
*   **任务 1：GET /api/mistakes**
    *   返回一个错题列表（JSON格式）。
*   **任务 2：POST /api/mistakes**
    *   接收前端发来的数据，打印出来 `print(data)`。
    *   (进阶) 将数据存入一个全局列表 `MISTAKE_DB = []`。

---

## 📝 第4课：全栈联调 (Integration Day)

### 🎯 教学目标
1.  使用 **Fetch API** 打通前后端。
2.  掌握 **跨域 (CORS)** 概念（虽然 FastAPI 本地调试可能不涉及，但概念要讲）。
3.  **产出**：完整的、可运行的错题本应用。

### ⏱️ 教学流程

#### 0-10分钟：Fetch API
*   **概念**：前端 JS 里的“快递员”，负责把数据发给后端。
*   **代码**：
    ```javascript
    fetch('http://127.0.0.1:8000/api/mistakes')
        .then(response => response.json())
        .then(data => render(data));
    ```

#### 10-30分钟：联调 (The "Moment of Truth")
*   **步骤**：
    1.  启动后端 (`uvicorn ...`).
    2.  打开前端 HTML.
    3.  前端不再读取 Mock 数据，而是调用 `fetch()`.
*   **常见 Bug**：
    *   端口对不上（8000 vs 5500）。
    *   数据格式不对（JSON 字段名不匹配）。

#### 30-40分钟：发布与演示
*   **功能验收**：
    *   添加一道错题 -> 列表自动刷新 -> 成功！
*   **演示**：邀请同学上台录入自己的真实错题。

#### 40-45分钟：总结
*   **全栈概念**：你一个人完成了一个团队的工作。
*   **预告**：下节课我们要深入算法，让这个错题本变“聪明”。

---

## 🛠️ 常见问题 (Troubleshooting)

1.  **`uvicorn` 命令找不到**
    *   **解决**：检查环境变量，或者使用 `python -m uvicorn main:app --reload`。

2.  **前端 Fetch 报错 (Network Error)**
    *   **解决**：
        1.  确认后端运行了吗？
        2.  确认 URL 写对了吗？(`http://127.0.0.1:8000...`)。
        3.  FastAPI 是否配置了 CORS？(如果前后端端口不同)。
            *   *Solution Code*:
                ```python
                from fastapi.middleware.cors import CORSMiddleware
                app.add_middleware(
                    CORSMiddleware,
                    allow_origins=["*"],
                    allow_methods=["*"],
                    allow_headers=["*"],
                )
                ```

3.  **数据存不住，重启后端就没了？**
    *   **解释**：目前存在内存里 (`MISTAKE_DB = []`)。
    *   **扩展**：告诉学生这就是为什么我们需要数据库 (Database) 和文件存储。
