<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <RouterLink to="/tools" class="text-gray-400 hover:text-gray-600 transition"><i class="fas fa-arrow-left"></i></RouterLink>
        <h1 class="font-bold text-gray-800 text-lg flex items-center">
          <i class="fas fa-project-diagram text-emerald-600 mr-2"></i> 架构设计
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <button @click="openDrawio" class="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">
          <i class="fas fa-external-link-alt mr-1"></i> 打开 Draw.io
        </button>
      </div>
    </nav>

    <main class="flex-1 max-w-5xl mx-auto w-full p-8 space-y-6">
      <section class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">在 Draw.io 里画清楚你的系统</h2>
        <p class="text-gray-500 text-sm">本页面只告诉你“画什么、怎么画”，具体绘图请使用 drawio.reopeninnolab.com。</p>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div class="text-xs text-gray-400">目标</div>
          <div class="text-lg font-bold text-gray-900 mt-1">让别人一眼看懂你的系统</div>
          <div class="text-xs text-gray-400 mt-2">建议输出 1~2 张核心架构图</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div class="text-xs text-gray-400">核心问题</div>
          <div class="text-lg font-bold text-gray-900 mt-1">数据怎么流？功能怎么协作？</div>
          <div class="text-xs text-gray-400 mt-2">用箭头说明“谁调用谁”</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div class="text-xs text-gray-400">交付形式</div>
          <div class="text-lg font-bold text-gray-900 mt-1">PNG / SVG</div>
          <div class="text-xs text-gray-400 mt-2">导出后在里程碑提交中上传</div>
        </div>
      </section>

      <section class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-gray-900">建议画 4 张图（优先级从上到下）</h3>
            <p class="text-xs text-gray-400">根据项目类型挑 1~2 张即可，不必全部完成。</p>
          </div>
          <button class="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" @click="openDrawio">
            立即开画
          </button>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="border border-gray-200 rounded-xl p-4">
            <div class="font-semibold text-gray-900">1) 系统架构图</div>
            <p class="text-xs text-gray-500 mt-1">展示模块与模块之间的关系（前端/后端/数据库/外部服务）。</p>
            <ul class="text-xs text-gray-500 mt-2 list-disc list-inside">
              <li>每个模块用矩形表示</li>
              <li>箭头标注“调用方向”</li>
              <li>标明关键接口或数据</li>
            </ul>
          </div>
          <div class="border border-gray-200 rounded-xl p-4">
            <div class="font-semibold text-gray-900">2) 数据流图（或流程图）</div>
            <p class="text-xs text-gray-500 mt-1">展示用户操作与系统响应的关键路径。</p>
            <ul class="text-xs text-gray-500 mt-2 list-disc list-inside">
              <li>从用户行为开始</li>
              <li>步骤尽量 6~10 个</li>
              <li>每步写动词：上传/分析/展示</li>
            </ul>
          </div>
          <div class="border border-gray-200 rounded-xl p-4">
            <div class="font-semibold text-gray-900">3) 功能模块图</div>
            <p class="text-xs text-gray-500 mt-1">展示产品功能是如何分块的（适合工程类项目）。</p>
            <ul class="text-xs text-gray-500 mt-2 list-disc list-inside">
              <li>模块可以按“用户-系统-数据”拆</li>
              <li>每块写 1~3 个关键词</li>
              <li>突出你的创新模块</li>
            </ul>
          </div>
          <div class="border border-gray-200 rounded-xl p-4">
            <div class="font-semibold text-gray-900">4) 实验设计图</div>
            <p class="text-xs text-gray-500 mt-1">课题探究类可画实验流程与变量控制。</p>
            <ul class="text-xs text-gray-500 mt-2 list-disc list-inside">
              <li>标明自变量/因变量</li>
              <li>对照组与实验组</li>
              <li>记录方式/频次</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 class="text-lg font-bold text-gray-900">Draw.io 快速操作</h3>
          <ol class="text-sm text-gray-600 mt-3 space-y-2 list-decimal list-inside">
            <li>打开网站后选择“空白画布”</li>
            <li>左侧拖拽“矩形/箭头”到画布</li>
            <li>双击图形输入文字</li>
            <li>用“连接线”指明流程方向</li>
            <li>完成后：文件 → 导出 → PNG/SVG</li>
          </ol>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 class="text-lg font-bold text-gray-900">检查清单</h3>
          <ul class="text-sm text-gray-600 mt-3 space-y-2 list-disc list-inside">
            <li>图中要出现“你自己做的核心模块”</li>
            <li>箭头方向能看懂“谁调用谁”</li>
            <li>每张图控制在 1 个屏幕可读</li>
            <li>图名写清楚，例如“系统架构图”</li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
function openDrawio() {
  window.open('https://drawio.reopeninnolab.com', '_blank');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
body { font-family: 'Inter', sans-serif; background: #f8fafc; }
</style>
