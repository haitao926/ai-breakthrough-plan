// 移动端菜单切换
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // 关闭移动端菜单
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
});

// 返回顶部按钮
const backToTopBtn = document.getElementById('backToTop');

if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.remove('opacity-0', 'invisible');
            backToTopBtn.classList.add('opacity-100', 'visible');
        } else {
            backToTopBtn.classList.add('opacity-0', 'invisible');
            backToTopBtn.classList.remove('opacity-100', 'visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 页面加载动画
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Initialize Kaleidoscope
    initKaleidoscope();
});

// 导航栏滚动效果
let lastScroll = 0;
const nav = document.querySelector('nav');

if (nav) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            nav.classList.add('shadow-lg');
        } else {
            nav.classList.remove('shadow-lg');
        }

        lastScroll = currentScroll;
    });
}

// 深色模式切换
let isDarkMode = false;
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode');
        darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', isDarkMode);
    });

    // 恢复深色模式设置
    if (localStorage.getItem('darkMode') === 'true') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// ESC键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMarkdownModal();
    }
});

// Markdown 模态框功能
const markdownModal = document.getElementById('markdownModal');
const markdownModalTitle = document.getElementById('markdownModalTitle');
const markdownContent = document.getElementById('markdownContent');
const markdownModalClose = document.getElementById('markdownModalClose');
const markdownModalFullscreen = document.getElementById('markdownModalFullscreen');
const fullscreenHeader = document.getElementById('fullscreenHeader');
const fullscreenTitle = document.getElementById('fullscreenTitle');
const fullscreenExitBtn = document.getElementById('fullscreenExitBtn');
const fullscreenCloseBtn = document.getElementById('fullscreenCloseBtn');
let isFullscreen = false;

// 等待 marked.js 加载完成后再配置
function initializeMarkdown() {
    if (typeof marked !== 'undefined') {
        // 配置 marked.js
        marked.setOptions({
            highlight: function (code, lang) {
                // 简单的语法高亮
                return code;
            },
            breaks: true,
            gfm: true
        });
        console.log('Markdown 渲染器初始化成功');
    } else {
        console.error('marked.js 未加载');
    }
}

// 处理 Markdown 链接点击
function handleMarkdownLink(event) {
    console.log('Markdown 链接被点击');
    const link = event.target.closest('a[href$=".md"]');
    if (!link) return;

    console.log('找到 Markdown 链接:', link.href);
    event.preventDefault();
    const mdPath = link.getAttribute('href');
    const fileName = mdPath.split('/').pop().replace('.md', '');

    console.log('加载 Markdown 文件:', mdPath);

    // 设置模态框标题
    if (markdownModalTitle) markdownModalTitle.textContent = fileName;

    // 显示模态框
    if (markdownModal) {
        markdownModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 强制滚动到顶部
    setTimeout(() => {
        if (markdownContent) markdownContent.scrollTop = 0;
    }, 50);

    // 加载 Markdown 内容
    loadMarkdown(mdPath);
}

// 加载并渲染 Markdown 文件
async function loadMarkdown(mdPath) {
    console.log('开始加载 Markdown:', mdPath);

    if (!markdownContent) return;

    try {
        markdownContent.innerHTML = `
            <div class="markdown-loading">
                <div class="markdown-loading-spinner"></div>
                <div>正在加载文档...</div>
            </div>
        `;

        // 尝试获取 Markdown 文件内容
        const response = await fetch(mdPath);
        console.log('Fetch 响应状态:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const markdownText = await response.text();
        console.log('Markdown 文本长度:', markdownText.length);

        // 检查 marked 是否可用
        if (typeof marked === 'undefined') {
            throw new Error('marked.js 库未加载');
        }

        // 渲染 Markdown
        const htmlContent = marked.parse(markdownText);
        console.log('Markdown 渲染成功');

        // 使用 DOMPurify 清理 HTML（安全考虑）
        let cleanHtml = htmlContent;
        if (typeof DOMPurify !== 'undefined') {
            cleanHtml = DOMPurify.sanitize(htmlContent);
            console.log('HTML 安全清理完成');
        } else {
            console.warn('DOMPurify 未加载，跳过安全清理');
        }

        // 显示渲染后的内容
        markdownContent.innerHTML = `<div class="markdown-content">${cleanHtml}</div>`;
        console.log('Markdown 内容已显示');

        // 自动滚动到模态框顶部
        setTimeout(() => {
            markdownContent.scrollTop = 0;
        }, 100);

        // 为 Markdown 内容中的链接添加特殊处理
        processMarkdownContentLinks();

    } catch (error) {
        console.error('加载 Markdown 文件失败:', error);
        markdownContent.innerHTML = `
            <div class="markdown-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>文档加载失败</h3>
                <p>无法加载文档: ${mdPath}</p>
                <p class="text-sm mt-2">错误信息: ${error.message}</p>
                <div class="mt-4">
                    <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mr-2" onclick="window.open('${mdPath}', '_blank')">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        在新窗口中打开
                    </button>
                    <button class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors" onclick="showMarkdownRaw('${mdPath}')">
                        <i class="fas fa-code mr-2"></i>
                        显示原始内容
                    </button>
                </div>
            </div>
        `;
    }
}

// 显示原始 Markdown 内容
async function showMarkdownRaw(mdPath) {
    if (!markdownContent) return;
    try {
        const response = await fetch(mdPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const markdownText = await response.text();
        const escapedText = markdownText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        markdownContent.innerHTML = `
            <div class="markdown-content">
                <h3>原始 Markdown 内容</h3>
                <pre style="background: #f8f9fa; padding: 1rem; border-radius: 8px; overflow-x: auto;"><code>${escapedText}</code></pre>
            </div>
        `;
    } catch (error) {
        console.error('显示原始内容失败:', error);
        markdownContent.innerHTML = `<div class="markdown-error">无法加载原始内容: ${error.message}</div>`;
    }
}

// 处理 Markdown 内容中的链接
function processMarkdownContentLinks() {
    if (!markdownContent) return;
    const contentLinks = markdownContent.querySelectorAll('a[href$=".md"]');
    contentLinks.forEach(link => {
        link.addEventListener('click', handleMarkdownLink);
    });
}

// 关闭模态框
function closeMarkdownModal() {
    // 如果在全屏模式，先退出全屏
    if (isFullscreen) {
        toggleFullscreen();
    }

    if (markdownModal) markdownModal.classList.remove('active');
    document.body.style.overflow = '';
    if (markdownContent) {
        markdownContent.innerHTML = `
            <div class="markdown-loading">
                <div class="markdown-loading-spinner"></div>
                <div>正在加载文档...</div>
            </div>
        `;
    }
}

// 事件监听器
if (markdownModalClose) markdownModalClose.addEventListener('click', closeMarkdownModal);

// 全屏切换功能
function toggleFullscreen() {
    if (!markdownModal) return;

    if (!isFullscreen) {
        // 进入全屏
        document.body.style.overflow = 'hidden';
        markdownModal.style.background = 'white';
        markdownModal.style.padding = '0';
        markdownModal.style.position = 'fixed';
        markdownModal.style.top = '0';
        markdownModal.style.left = '0';
        markdownModal.style.width = '100vw';
        markdownModal.style.height = '100vh';
        markdownModal.style.borderRadius = '0';

        const modalContent = markdownModal.querySelector('.markdown-modal-content');
        if (modalContent) {
            modalContent.style.maxHeight = '100vh';
            modalContent.style.height = '100vh';
            modalContent.style.maxWidth = '100vw';
            modalContent.style.width = '100vw';
            modalContent.style.borderRadius = '0';
            modalContent.style.margin = '0';
        }

        // 隐藏原始标题栏
        const header = markdownModal.querySelector('.markdown-modal-header');
        if (header) header.style.display = 'none';

        // 显示浮动标题栏
        if (fullscreenHeader) {
            fullscreenHeader.style.display = 'flex';
            if (fullscreenTitle && markdownModalTitle) fullscreenTitle.textContent = markdownModalTitle.textContent;
        }

        const modalBody = markdownModal.querySelector('.markdown-modal-body');
        if (modalBody) {
            modalBody.style.paddingTop = '4rem';
            modalBody.style.height = 'calc(100vh - 4rem)';
        }

        if (markdownModalFullscreen) markdownModalFullscreen.innerHTML = '<i class="fas fa-compress"></i>';

        isFullscreen = true;
    } else {
        // 退出全屏
        document.body.style.overflow = '';
        markdownModal.style.background = '';
        markdownModal.style.padding = '';
        markdownModal.style.position = '';
        markdownModal.style.top = '';
        markdownModal.style.left = '';
        markdownModal.style.width = '';
        markdownModal.style.height = '';
        markdownModal.style.borderRadius = '';

        const modalContent = markdownModal.querySelector('.markdown-modal-content');
        if (modalContent) {
            modalContent.style.maxHeight = '';
            modalContent.style.height = '';
            modalContent.style.maxWidth = '';
            modalContent.style.width = '';
            modalContent.style.borderRadius = '';
            modalContent.style.margin = '';
        }

        // 显示原始标题栏
        const header = markdownModal.querySelector('.markdown-modal-header');
        if (header) header.style.display = '';

        // 隐藏浮动标题栏
        if (fullscreenHeader) fullscreenHeader.style.display = 'none';

        const modalBody = markdownModal.querySelector('.markdown-modal-body');
        if (modalBody) {
            modalBody.style.paddingTop = '';
            modalBody.style.height = '';
        }

        if (markdownModalFullscreen) markdownModalFullscreen.innerHTML = '<i class="fas fa-expand"></i>';

        isFullscreen = false;
    }
}

if (markdownModalFullscreen) markdownModalFullscreen.addEventListener('click', toggleFullscreen);

// 浮动标题栏按钮事件
if (fullscreenExitBtn) fullscreenExitBtn.addEventListener('click', toggleFullscreen);
if (fullscreenCloseBtn) fullscreenCloseBtn.addEventListener('click', closeMarkdownModal);

// 点击模态框背景关闭
if (markdownModal) {
    markdownModal.addEventListener('click', (event) => {
        if (event.target === markdownModal && !isFullscreen) {
            closeMarkdownModal();
        }
    });
}

// 为页面中所有的 Markdown 链接添加点击事件
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 加载完成，开始初始化...');

    // 初始化 Markdown 渲染器
    initializeMarkdown();

    // 为所有 Markdown 链接添加点击事件
    const markdownLinks = document.querySelectorAll('a[href$=".md"]');
    console.log('找到 Markdown 链接数量:', markdownLinks.length);

    markdownLinks.forEach((link, index) => {
        console.log(`链接 ${index + 1}:`, link.href);
        link.addEventListener('click', handleMarkdownLink);
    });
});

// Kaleidoscope Animation Logic
function initKaleidoscope() {
    const canvas = document.getElementById('kaleidoscope-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 5 + 2;
            this.color = `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Kaleidoscope effect (mirroring)
        // This is a simplified effect for performance
        // For a true kaleidoscope, we'd need more complex canvas transformations

        requestAnimationFrame(animate);
    }

    animate();
}

// 作业提交功能
const uploadModal = document.getElementById('uploadModal');
const openUploadModalBtn = document.getElementById('openUploadModalBtn');
const mobileUploadBtn = document.getElementById('mobileUploadBtn');
const closeUploadModalBtn = document.getElementById('closeUploadModal');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.querySelector('input[type="file"]');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const dropZone = document.getElementById('dropZone');

function openUploadModal() {
    if (uploadModal) {
        uploadModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeUploadModal() {
    if (uploadModal) {
        uploadModal.classList.remove('active');
        document.body.style.overflow = '';
        uploadForm.reset();
        fileNameDisplay.textContent = '点击或拖拽文件到这里';
        dropZone.classList.remove('bg-green-50', 'border-green-400');
    }
}

if (openUploadModalBtn) openUploadModalBtn.addEventListener('click', openUploadModal);
if (mobileUploadBtn) mobileUploadBtn.addEventListener('click', (e) => {
    e.preventDefault(); // 阻止链接默认跳转（虽然现在是button）
    openUploadModal();
    // 关闭移动端菜单
    if (mobileMenu) mobileMenu.classList.add('hidden');
});
if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeUploadModal);

// 文件选择显示
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = `已选择: ${e.target.files[0].name}`;
            dropZone.classList.add('bg-green-50', 'border-green-400');
        } else {
            fileNameDisplay.textContent = '点击或拖拽文件到这里';
            dropZone.classList.remove('bg-green-50', 'border-green-400');
        }
    });
}

// 表单提交
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(uploadForm);
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnSpinner = document.getElementById('btnSpinner');

        // Loading state
        submitBtn.disabled = true;
        btnText.textContent = '正在提交...';
        btnSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const info = result.filename ? ` 文件：${result.filename}` : '';
                alert(`作业提交成功！${info}`);
                closeUploadModal();
            } else {
                throw new Error(result.error || '提交失败');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert(`提交失败: ${error.message}`);
        } finally {
            // Reset state
            submitBtn.disabled = false;
            btnText.textContent = '确认提交';
            btnSpinner.classList.add('hidden');
        }
    });
}

// 点击模态框背景关闭 (这部分逻辑可以复用已有的，或者单独加)
if (uploadModal) {
    uploadModal.addEventListener('click', (event) => {
        if (event.target === uploadModal) {
            closeUploadModal();
        }
    });
}

// --------------------------------------------------------------------------
// 随机抽取功能逻辑
// --------------------------------------------------------------------------
const randomPickerModal = document.getElementById('randomPickerModal');
const openRandomPickerBtn = document.getElementById('openRandomPickerBtn');
const mobileRandomPickerBtn = document.getElementById('mobileRandomPickerBtn');
const closeRandomPickerBtn = document.getElementById('closeRandomPickerModal');
const startPickBtn = document.getElementById('startPickBtn');
const startIdInput = document.getElementById('startId');
const endIdInput = document.getElementById('endId');
const randomResultDisplay = document.getElementById('randomResult');

let pickInterval;
let isPicking = false;

function openRandomPicker() {
    if (randomPickerModal) {
        randomPickerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeRandomPicker() {
    if (randomPickerModal) {
        if (isPicking) {
            // 如果正在抽取中关闭，停止抽取
            stopPicking(true);
        }
        randomPickerModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

if (openRandomPickerBtn) openRandomPickerBtn.addEventListener('click', openRandomPicker);
if (mobileRandomPickerBtn) mobileRandomPickerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openRandomPicker();
    if (mobileMenu) mobileMenu.classList.add('hidden');
});
if (closeRandomPickerBtn) closeRandomPickerBtn.addEventListener('click', closeRandomPicker);

// 点击模态框背景关闭
if (randomPickerModal) {
    randomPickerModal.addEventListener('click', (event) => {
        if (event.target === randomPickerModal) {
            closeRandomPicker();
        }
    });
}

// 抽取逻辑
if (startPickBtn) {
    startPickBtn.addEventListener('click', () => {
        if (isPicking) return; // 防止重复点击

        const start = parseInt(startIdInput.value);
        const end = parseInt(endIdInput.value);

        if (isNaN(start) || isNaN(end) || start > end) {
            alert('请输入有效的学号范围！');
            return;
        }

        isPicking = true;
        startPickBtn.disabled = true;
        startPickBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> 抽取中...';
        startPickBtn.classList.add('opacity-75', 'cursor-not-allowed');

        // 动画效果：快速跳动数字
        let speed = 50;
        let counter = 0;
        const duration = 2000; // 持续时间 2秒
        const totalSteps = duration / speed;

        pickInterval = setInterval(() => {
            const randomNum = Math.floor(Math.random() * (end - start + 1)) + start;
            randomResultDisplay.textContent = randomNum < 10 ? '0' + randomNum : randomNum;
            randomResultDisplay.style.transform = 'scale(1.2)';
            setTimeout(() => {
                randomResultDisplay.style.transform = 'scale(1)';
            }, speed / 2);

            counter++;
            if (counter >= totalSteps) {
                stopPicking(false, start, end);
            }
        }, speed);
    });
}

function stopPicking(forceStop, start, end) {
    clearInterval(pickInterval);
    isPicking = false;

    if (startPickBtn) {
        startPickBtn.disabled = false;
        startPickBtn.innerHTML = '<i class="fas fa-play mr-2"></i> 开始抽取';
        startPickBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }

    if (!forceStop && start !== undefined && end !== undefined) {
        // 最终定格结果
        const finalNum = Math.floor(Math.random() * (end - start + 1)) + start;
        randomResultDisplay.textContent = finalNum < 10 ? '0' + finalNum : finalNum;
        
        // 庆祝动画效果
        randomResultDisplay.style.transform = 'scale(1.5)';
        randomResultDisplay.style.color = '#ef4444'; // red-500
        
        setTimeout(() => {
             randomResultDisplay.style.transform = 'scale(1)';
             randomResultDisplay.style.color = '#4f46e5'; // indigo-600 (restore)
        }, 500);
    }
}
