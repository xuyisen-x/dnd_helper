<template>
  <div class="page-container">
    <section class="intro-section">
      <h2>D&D 跑团助手</h2>
      <p class="description">
        本项目是一个开源的 D&D 跑团辅助工具，旨在提供流畅的角色卡管理体验。 欢迎在 GitHub 上提交
        Issue 或 PR 参与讨论与共建。
      </p>
    </section>
    <div class="link-card">
      <a href="https://github.com/xuyisen-x/dnd_helper/" target="_blank" class="github-link">
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436c.55.096.756-.233.756-.522c0-.262-.013-1.128-.013-2.049c-2.764.509-3.479-.674-3.699-1.292c-.124-.317-.66-1.293-1.127-1.554c-.385-.207-.936-.715-.014-.729c.866-.014 1.485.797 1.691 1.128c.99 1.663 2.571 1.196 3.204.907c.096-.715.385-1.196.701-1.471c-2.448-.275-5.005-1.224-5.005-5.432c0-1.196.426-2.186 1.128-2.956c-.111-.275-.496-1.402.11-2.915c0 0 .921-.288 3.024 1.128a10.2 10.2 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371c2.104-1.43 3.025-1.128 3.025-1.128c.605 1.513.221 2.64.111 2.915c.701.77 1.127 1.747 1.127 2.956c0 4.222-2.571 5.157-5.019 5.432c.399.344.743 1.004.743 2.035c0 1.471-.014 2.654-.014 3.025c0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11"
          />
        </svg>
        <span>访问 GitHub 仓库</span>
      </a>
    </div>
    <div>
      本项目基于<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>协议
    </div>

    <div class="divider"></div>

    <footer class="credits-section">
      <h3>Tips</h3>
      <div class="credit-item">
        <p>单击调整值，可以在计算得到的调整值基础上添加额外调整值</p>
      </div>
      <br />
      <h3>致谢</h3>
      <div class="credit-item">
        <strong>Icons / 图标素材</strong>
        <p>
          "Dice 20 faces 20" 图标由
          <a href="https://delapouite.com/">Delapouite</a>
          创作，基于
          <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>
          协议。
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.page-container {
  /* 整体布局：垂直排列，最大宽度限制，水平居中 */
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  color: var(--dnd-ink-primary); /* 适配你的主题色 */
}

/* 简介区域 */
.intro-section {
  text-align: center;
  margin-bottom: 2rem;
}
.intro-section h2 {
  margin-bottom: 1rem;
  color: var(--dnd-dragon-red); /* 标题用主题红 */
}
.description {
  line-height: 1.6;
  color: var(--dnd-ink-secondary);
}

/* GitHub 链接卡片 */
.link-card {
  margin-bottom: 2rem;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0.05); /* 淡淡的背景框 */
  border-radius: 8px;
  transition: transform 0.2s;
}
.link-card:hover {
  transform: translateY(-2px);
  background-color: rgba(0, 0, 0, 0.08);
}

.github-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
  font-weight: bold;
}

.icon {
  width: 1.5em; /* 图标稍微大一点点 */
  height: 1.5em;
  color: #333; /* GitHub 图标通常是黑色 */
}

/* 分割线 */
.divider {
  width: 100%;
  height: 1px;
  background-color: var(--color-border, #ddd);
  margin-bottom: 2rem;
}

/* 致谢区域 */
.credits-section {
  width: 100%;
  text-align: left; /* 致谢信息通常左对齐或居中，这里左对齐显得正式 */
  font-size: 0.9rem;
}

.credits-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  color: var(--dnd-ink-secondary);
  border-left: 3px solid var(--dnd-gold); /* 左侧加个金色装饰条 */
  padding-left: 10px;
}

.credit-item p {
  margin: 4px 0;
  line-height: 1.5;
  color: var(--dnd-ink-secondary);
}

.license-info {
  font-size: 0.85rem;
  margin-top: 5px;
  color: #888;
}

/* 链接样式 */
a {
  color: var(--dnd-dragon-red);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
</style>
