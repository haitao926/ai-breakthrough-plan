<template>
  <div class="min-h-screen bg-[#f8fafc] text-gray-800 p-8">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-3">系统架构与设计</h1>
        <p class="text-gray-500 max-w-2xl mx-auto">
          不要急着写代码。先用图表把你的思路画出来。<br>
          好的架构设计能帮你避开 80% 的开发陷阱。
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="guide-card bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
            <i class="fas fa-sitemap"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">1. 总体架构图</h3>
          <p class="text-sm text-gray-500 mb-6 flex-1">
            展示系统的核心模块及其关系。<br>
            例如：用户端 -> 服务器 -> 数据库。
          </p>
          <button @click="openDrawio" class="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm flex items-center justify-center">
            <i class="fas fa-pen-nib mr-2"></i> 前往绘制
          </button>
        </div>

        <div class="guide-card bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
            <i class="fas fa-code-branch"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">2. 核心流程图</h3>
          <p class="text-sm text-gray-500 mb-6 flex-1">
            描述关键功能的执行逻辑。<br>
            例如：人脸识别算法、用户登录校验流程。
          </p>
          <button @click="openDrawio" class="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-sm flex items-center justify-center">
            <i class="fas fa-pen-nib mr-2"></i> 前往绘制
          </button>
        </div>

        <div class="guide-card bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
            <i class="fas fa-microchip"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">3. 硬件/数据流图</h3>
          <p class="text-sm text-gray-500 mb-6 flex-1">
            展示硬件连接或数据的流转方向。<br>
            例如：传感器 -> Arduino -> 串口 -> PC。
          </p>
          <button @click="openDrawio" class="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition shadow-sm flex items-center justify-center">
            <i class="fas fa-pen-nib mr-2"></i> 前往绘制
          </button>
        </div>
      </div>

      <div class="mt-12 bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
        <p class="text-sm text-gray-500 mb-2">
          <i class="fas fa-info-circle mr-1"></i> 提示
        </p>
        <p class="text-sm text-gray-600">
          点击按钮将跳转到专业绘图工具 <strong>Draw.io (ReopenInnoLab 版)</strong>。<br>
          绘制完成后，请导出为 <strong>PNG</strong> 图片，并在“提交开题报告”或“里程碑”时上传。
        </p>
      </div>
    </div>
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
.guide-card { transition: all 0.3s ease; }
.guide-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1); }
</style>
