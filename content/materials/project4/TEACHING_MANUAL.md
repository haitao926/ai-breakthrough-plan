# 项目4：算法工程师 (Algorithm Engineer) - 教师授课指南

## 📅 课程概览
*   **课程名称**：AI 算法研究 - 从论文到代码
*   **课时安排**：4 课时
*   **核心目标**：
    1.  **学术素养**：学会阅读 AI 顶会论文（借助 AI 翻译与总结）。
    2.  **工程能力**：调用预训练模型 (Pre-trained Model) 解决实际问题。
    3.  **科学思维**：通过对比实验 (A/B Test) 验证算法效果。

---

## 🎒 课前准备
*   **环境**：
    *   Python 环境（已安装 `torch`, `torchvision`, `pillow`, `numpy`）。
    *   或者使用 Google Colab / Kaggle Notebook（如果有网络条件）。
*   **素材**：
    *   经典论文 PDF（如 ResNet, YOLO）。
    *   测试数据集（如：一组模糊的校园失物照片）。

---

## 📝 第1课：论文侦探 (Paper Reading)

### 🎯 教学目标
1.  了解 AI 领域的顶级会议 (CVPR, ICCV, NeurIPS)。
2.  掌握使用 AI 辅助阅读论文的方法。
3.  **产出**：一份论文核心观点摘要。

### ⏱️ 教学流程

#### 0-10分钟：学术圈初探
*   **引入**："最新的 AI 技术不是写在教科书里的，而是写在论文里的。"
*   **展示**：打开 arXiv.org，展示每天成千上万的新论文。
*   **挑战**：全英文、满屏数学公式，怎么读？—— 用 AI。

#### 10-25分钟：AI 辅助阅读实战
*   **案例**：*Deep Residual Learning for Image Recognition* (ResNet)。
*   **Prompt 演示**：
    *   "请扮演一位人工智能教授。我是一名高中生。请用通俗易懂的语言，帮我解读这篇论文的 Abstract 和 Introduction。核心创新点是什么？解决了什么问题？"
*   **讲解**：
    *   **梯度消失** (Vanishing Gradient)：层数多了，信号传不过去。
    *   **残差连接** (Shortcut Connection)：修一条高速公路，让信号直通。

#### 25-45分钟：小组调研
*   **任务**：分组选择一个感兴趣的方向（图像识别、风格迁移、超分辨率）。
*   **行动**：在 PapersWithCode.com 找一篇高引用论文。
*   **产出**：填写"论文调研单"（标题、作者、核心解决的问题、关键技术）。

---

## 📝 第2课：复现与推理 (Inference)

### 🎯 教学目标
1.  理解 **预训练模型** (Pre-trained Model) 的概念（站在巨人的肩膀上）。
2.  使用 `torch.hub` 或 `huggingface` 调用现有模型。
3.  **产出**：一个能识别图片内容的 Python 脚本。

### ⏱️ 教学流程

#### 0-10分钟：不造轮子
*   **概念**：训练一个 ResNet 需要几周时间和几十块显卡。我们可以直接用别人训练好的"大脑"。
*   **类比**：你不需要从头养一只猎犬，你只需要借一只训练好的猎犬来帮你找东西。

#### 10-35分钟：代码实战
*   **环境检查**：`import torch; print(torch.__version__)`。
*   **AI 辅助编程**：
    *   Prompt: "请使用 PyTorch 的 torchvision 库，加载预训练的 ResNet50 模型。编写一个 Python 脚本，读取本地图片 'dog.jpg'，并输出它的分类结果。"
*   **核心代码解读**：
    ```python
    model = torch.hub.load('pytorch/vision:v0.10.0', 'resnet50', pretrained=True)
    model.eval() # 开启评估模式
    ```
*   **测试**：让学生找一张自己的照片（猫、狗、汽车），运行代码看结果。

#### 35-45分钟：结果分析
*   **讨论**：
    *   AI 认出来了什么？
    *   Confidence Score (置信度) 是多少？
    *   如果给它一张"外星人"的照片，它会识别成什么？（讲解 Softmax 的局限性）。

---

## 📝 第3课：性能优化实验 (Optimization)

### 🎯 教学目标
1.  理解 **Trade-off** (权衡)：精度 vs 速度。
2.  设计对比实验，用数据说话。
3.  **产出**：实验数据对比表。

### ⏱️ 教学流程

#### 0-10分钟：快与准的抉择
*   **场景**：如果要给学校大门的闸机做人脸识别，要求 0.1秒内完成。ResNet50 太慢了怎么办？
*   **引入**：MobileNet（轻量级模型）。

#### 10-30分钟：对比实验 (A/B Test)
*   **实验设计**：
    *   **变量**：模型架构 (ResNet50 vs MobileNet_V2)。
    *   **指标**：
        1.  **推理时间** (Inference Time)：处理一张图要多久？
        2.  **模型大小** (Model Size)：权重文件几 MB？
        3.  **准确率** (Accuracy)：测试 10 张图，对了对少？
*   **代码实现**：
    *   使用 `time.time()` 记录时间。
    *   使用 `os.path.getsize()` 获取文件大小。

#### 30-45分钟：数据记录
*   **填写表格**：
    | 模型 | 时间 (ms) | 大小 (MB) | 准确率 |
    | --- | --- | --- | --- |
    | ResNet50 | 120ms | 98MB | 9/10 |
    | MobileNet | 30ms | 14MB | 8/10 |
*   **结论**：MobileNet 牺牲了一点点精度，换来了 4 倍的速度提升，适合手机端。

---

## 📝 第4课：学术报告 (Research Report)

### 🎯 教学目标
1.  掌握 **IMRaD** 结构 (Introduction, Methods, Results, Discussion)。
2.  撰写一份基于数据的技术报告。

### ⏱️ 教学流程

#### 0-10分钟：像科学家一样表达
*   **原则**：客观、严谨、图文并茂。
*   **结构**：
    1.  **背景**：为什么要做这个实验？
    2.  **方法**：用了什么模型？什么数据？
    3.  **结果**：数据表格、柱状图。
    4.  **讨论**：为什么 MobileNet 更快？

#### 10-30分钟：撰写报告
*   **工具**：Markdown 编辑器 (Typora/VS Code)。
*   **AI 辅助**：
    *   Prompt: "我做了一个对比实验，对比了 ResNet50 和 MobileNet 在图像识别上的表现。ResNet50 耗时 120ms，MobileNet 耗时 30ms。请帮我生成一段'实验结果与分析'的学术文字。"
*   **作图**：用 Excel 或 Python (Matplotlib) 生成一张对比柱状图。

#### 30-45分钟：答辩 (Defense)
*   **形式**：每组选代表展示报告。
*   **提问**："如果我想在智能手表上运行，你会推荐哪个模型？"
*   **总结**：这一周你们不仅写了代码，还做了一次真正的科学研究。

---

## 🛠️ 常见问题 (Troubleshooting)

1.  **下载预训练模型太慢？**
    *   **解决**：提前下载好 `.pth` 文件，分发给学生，修改代码从本地加载。
    *   `model.load_state_dict(torch.load('resnet50.pth'))`

2.  **安装 PyTorch 报错？**
    *   **解决**：如果学校电脑没有 GPU，请安装 CPU 版本：
        `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`

3.  **识别结果全是英文，学生看不懂？**
    *   **解决**：准备一份 `imagenet_classes.txt` 对应的中文翻译表，或者写一个字典进行映射。
