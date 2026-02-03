<template>
  <div class="tool-root">
    <nav class="tool-nav">
      <div class="nav-left">
        <RouterLink to="/tools" class="nav-back"><i class="fas fa-arrow-left"></i></RouterLink>
        <h1 class="nav-title">
          <i class="fas fa-project-diagram text-emerald-600 mr-2"></i> 架构设计
        </h1>
      </div>
      <div class="nav-right">
        <button @click="openDrawio" class="btn-primary small">
          <i class="fas fa-external-link-alt mr-1"></i> 打开 Draw.io
        </button>
      </div>
    </nav>

    <main class="tool-main">
      <div class="hero-card">
        <div class="hero-icon">
          <i class="fas fa-pen-ruler"></i>
        </div>
        <div class="hero-content">
          <h2>系统架构设计</h2>
          <p>使用 Draw.io 绘制系统流程图或架构图，帮助团队理解技术实现。</p>
          <button class="btn-primary mt-4" @click="openDrawio">
            立即开始绘图
          </button>
        </div>
      </div>

      <div class="grid-cards">
        <div class="card-base">
          <div class="card-icon bg-emerald-50 text-emerald-600"><i class="fas fa-sitemap"></i></div>
          <h3>系统架构图</h3>
          <p>展示模块关系 (前端/后端/数据库)</p>
        </div>
        <div class="card-base">
          <div class="card-icon bg-blue-50 text-blue-600"><i class="fas fa-exchange-alt"></i></div>
          <h3>数据流图</h3>
          <p>展示用户操作与数据流向</p>
        </div>
        <div class="card-base">
          <div class="card-icon bg-purple-50 text-purple-600"><i class="fas fa-cubes"></i></div>
          <h3>功能模块图</h3>
          <p>按功能拆分系统结构</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
function openDrawio() {
  window.open('https://drawio.reopeninnolab.com', '_blank');
}
</script>

<style scoped>
.tool-root {
  min-height: 100vh;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
}

.tool-nav {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-main);
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-back {
  color: var(--text-secondary);
  transition: color 0.2s;
}
.nav-back:hover {
  color: var(--text-main);
}

.nav-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
}

.tool-main {
  flex: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hero-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-main);
  padding: 3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  box-shadow: var(--shadow-card);
}

.hero-icon {
  width: 64px;
  height: 64px;
  background: var(--primary-50);
  color: var(--primary-600);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.hero-content h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}

.hero-content p {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 480px;
  margin: 0 auto;
}

.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.card-base {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-main);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-base:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-100);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 18px;
}

.card-base h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}

.card-base p {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-primary.small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}
</style>