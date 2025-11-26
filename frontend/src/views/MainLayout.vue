<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-container">
        <RouterLink to="/main/character-sheet" class="nav-link">
          <span>角色卡</span>
        </RouterLink>
        <RouterLink to="/main/dice" class="nav-link">
          <span>电子骰子</span>
        </RouterLink>
        <RouterLink to="/main/about" class="nav-link">
          <span>关于</span>
        </RouterLink>
      </div>
    </header>

    <main class="main-content">
      <div class="content-wrapper">
        <RouterView></RouterView>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  /* 头部固定高度，剩下给内容 */
  grid-template-rows: 40px 1fr;
  height: 100vh;
  width: 100vw;
  background-color: var(--color-background-mute); /* 整体背景偏深一点，突出纸张 */
  overflow: hidden;
}

/* --- 顶部导航 --- */
.top-nav {
  background-color: var(--color-background-mute); /* 与背景融合 */
  display: flex;
  align-items: flex-end; /* 让标签底部对齐 */
  padding: 0 20px;
  border-bottom: 1px solid var(--dnd-gold); /* 金色分割线 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); /* 轻微投影 */
  z-index: 10;
}

.nav-container {
  display: flex;
  gap: 8px;
  width: 100%;
  /* max-width: 1200px; 限制导航内容宽度 */
  margin: 0 auto;
  overflow-x: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.nav-container::-webkit-scrollbar {
  display: none;
}

/* --- 导航链接 (标签页风格) --- */
.nav-link {
  text-decoration: none;
  color: var(--dnd-ink-secondary); /* 未选中：浅墨色 */
  font-weight: 600;
  font-size: 0.95rem;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  min-width: 100px;
  height: 30px; /* 标签高度 */
  padding: 0 1.5rem;

  /* 形状：上方圆角，像文件夹标签 */
  border-radius: 8px 8px 0 0;
  margin-bottom: -1px; /* 稍微下沉，盖住分割线 */
  border: 1px solid transparent;

  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  opacity: 0.7;
}

body.has-mouse .nav-link:hover {
  color: var(--dnd-dragon-red); /* 悬停变红 */
  background-color: rgba(255, 255, 255, 0.3);
  opacity: 1;
}

/* --- 选中状态 --- */
.nav-link.router-link-active {
  color: var(--dnd-dragon-red); /* 选中文字变红 */
  background-color: var(--dnd-parchment-bg); /* 背景变亮（羊皮纸色） */

  /* 边框处理：让它看起来像连着下面的内容 */
  border: 1px solid var(--dnd-gold);
  border-bottom: 1px solid var(--dnd-parchment-bg); /* 底部颜色与内容区一致，造成无缝效果 */
  border-top: 3px solid var(--dnd-dragon-red); /* 顶部加粗红线强调 */

  font-weight: bold;
  opacity: 1;
  transform: translateY(1px); /* 微调位置 */
}

.icon {
  font-size: 1.1rem;
  margin-bottom: 2px;
}

/* --- 主内容区 --- */
.main-content {
  background-color: var(--dnd-parchment-bg); /* 羊皮纸背景 */
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  /* 这里的 padding 是为了让内容不贴边 */
  padding: 0;
}

.content-wrapper {
  margin: 0 auto;
  padding: 20px;
  min-height: 100%;
}

/* --- 滚动条美化 (Webkit) --- */
.main-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.main-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
.main-content::-webkit-scrollbar-thumb {
  background-color: var(--dnd-ink-secondary);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}
body.has-mouse .main-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--dnd-dragon-red);
}

/* --- 页面切换过渡动画 --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
