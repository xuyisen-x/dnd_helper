<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <RouterLink to="/main/character-sheet" class="nav-link">
        <span>角色卡</span>
      </RouterLink>
      <RouterLink to="/main/dice" class="nav-link">
        <span>电子骰子</span>
      </RouterLink>
      <RouterLink to="/main/about" class="nav-link">
        <span>关于</span>
      </RouterLink>
    </header>
    <!-- 主功能区 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-rows: calc(0.25rem + 32px) 1fr;
  height: 100vh;
  width: 100vw;
}

/* 顶部导航 */
.top-nav {
  background-color: var(--color-background-mute);
  padding: 0.25rem 1rem 0 1rem;
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-border);
  min-height: 40px;

  overflow-x: auto;
  white-space: nowrap;
}
.nav-link {
  text-decoration: none;
  color: var(--color-text);
  font-weight: 500;
  min-width: 110px;
  min-height: 32px;
  padding-bottom: 0;

  display: flex;
  justify-content: center;
  align-items: center;
}
.nav-link.router-link-active {
  font-weight: bold;
  color: var(--color-text);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-bottom: none;
  border-radius: 7px 7px 0 0;
}
.nav-link:hover {
  color: var(--color-text-soft);
}

.main-content {
  flex: 1;
  overflow: auto;
  background-color: var(--color-background);
  min-height: 400px;
  min-width: 500px;
}

.icon {
  margin-right: 6px;
}

::v-deep(.loading-container) {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 100%; /* 保证填满父容器 */
  width: 100%;
}
</style>
