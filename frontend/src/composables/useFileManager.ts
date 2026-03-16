import { useActiveCharacterStore } from '@/stores/active-character'
import { showToast } from '@/stores/toast'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'

import { ref } from 'vue'

// 记录当前绑定的本地文件路径 (仅 Tauri 端有效)
const AUTO_SAVE_INTERVAL = 30 * 1000 // 30秒

const CUSTOM_EXT = '.crst' // 自定义扩展名，方便用户识别

let autoSaveTimer: ReturnType<typeof setInterval> | null = null
const enableAutoSave = ref(false) // 是否启用自动保存

let runOnceFlag = false
let lastSavedDataStr: string | null = null // 记录上次成功保存的内容字符串，用于与当前内容对比，避免不必要的自动保存
const isBondedToFile = ref(false) // 是否已经绑定到一个文件路径（无论是通过保存还是加载），用于控制自动保存的行为

// 时间追踪状态
const lastSaveTimestamp = ref<number | null>(null) // 记录绝对时间戳
const lastSaveText = ref('尚未保存') // 用于 UI 显示的文字
setInterval(() => {
  if (!lastSaveTimestamp.value) return

  const diffSeconds = Math.floor((Date.now() - lastSaveTimestamp.value) / 1000)

  if (diffSeconds < 60) {
    lastSaveText.value = diffSeconds === 0 ? '刚刚' : `${diffSeconds} 秒前`
  } else if (diffSeconds < 3600) {
    lastSaveText.value = `${Math.floor(diffSeconds / 60)} 分钟前`
  } else {
    lastSaveText.value = `${Math.floor(diffSeconds / 3600)} 小时前`
  }
}, 1000)

// 辅助函数：触发保存成功后的时间重置
const markSaved = (dataStr: string) => {
  lastSaveTimestamp.value = Date.now()
  lastSaveText.value = '刚刚'
  lastSavedDataStr = dataStr // 更新参照物
}

export function useFileManager() {
  const activeCharacterStore = useActiveCharacterStore()
  const startAutoSave = () => {
    // 避免重复创建定时器
    if (autoSaveTimer) return
    autoSaveTimer = setInterval(async () => {
      if (!enableAutoSave.value || !isBondedToFile.value || !lastSaveTimestamp.value) return
      const diffMs = Date.now() - lastSaveTimestamp.value
      if (diffMs < AUTO_SAVE_INTERVAL) return // 距离上次保存时间太近，跳过这次自动保存
      const dataStr = activeCharacterStore.exportData()
      // 数据对比：如果数据没变，只重置时间，不写磁盘！
      if (dataStr === lastSavedDataStr) {
        return
      }
      try {
        await invoke('silent_save_to_disk', {
          dataStr,
        })
        console.log('自动保存到本地磁盘成功:', new Date().toLocaleTimeString())
        markSaved(dataStr) // 更新保存状态
      } catch (err) {
        showToast(`自动保存失败：${err}`, 'error')
      }
    }, 1000) // 每 30 秒执行一次
  }
  startAutoSave() // 组件加载时就启动自动保存机制

  const handleQuickSave = async () => {
    if (!isBondedToFile.value) {
      await handleSave() // 如果没有绑定文件路径，先执行一次完整的保存流程（会弹出保存对话框）
      return
    }
    try {
      const dataStr = activeCharacterStore.exportData()
      await invoke('silent_save_to_disk', {
        dataStr,
      })
      showToast('保存成功！', 'success')
      markSaved(dataStr) // 更新保存状态
    } catch (err) {
      showToast(`保存失败：${err}`, 'error')
    }
  }

  const handleSave = async () => {
    const dataStr = activeCharacterStore.exportData() // 获取导出的JSON字符串
    const charName = activeCharacterStore.getCharacterName().replace(/[\\/:*?"<>|]/g, '_')
    const rule = activeCharacterStore.rule
    const defaultFilename = `${charName}_${rule}_${new Date().toISOString().slice(0, 10)}${CUSTOM_EXT}`

    try {
      await invoke('save_character_to_disk', {
        dataStr,
        defaultFilename,
      })
      showToast('角色卡导出成功！', 'success')
      isBondedToFile.value = true // 现在已经绑定到一个文件路径了
      markSaved(dataStr)
    } catch (err) {
      if (err !== 'CANCELLED') {
        console.error('Rust端写入失败:', err)
        showToast('导出失败', 'error')
      }
    }
  }

  const handleLoad = async () => {
    try {
      const result = await invoke<string>('load_character_from_disk')
      activeCharacterStore.importData(result)
      showToast('角色卡读取成功！', 'success')

      isBondedToFile.value = true // 现在已经绑定到一个文件路径了
      markSaved(result) // 读取后也视为“已保存”状态，更新时间追踪
    } catch (err) {
      if (err !== 'CANCELLED') {
        console.error('Rust端读取失败:', err)
        showToast('文件读取发生错误', 'error')
      }
      // 取消选择则静默处理
    }
  }

  const handleInitialFile = async () => {
    try {
      const result = await invoke<string | null>('get_initial_file')
      if (!result) return
      activeCharacterStore.importData(result)
      showToast('角色卡读取成功！', 'success')
      isBondedToFile.value = true // 现在已经绑定到一个文件路径了
      markSaved(result) // 读取后也视为“已保存”状态，更新时间追踪
    } catch (err) {
      console.error('获取初始文件失败:', err)
      // 不弹窗，默默失败，用户可以手动点击加载
    }
  }

  // 注册快捷键监听（Ctrl+S / Cmd+S）
  if (!runOnceFlag) {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault() // 极其重要：拦截浏览器原生的“保存网页”弹窗！
        handleQuickSave()
      }
    })
    getCurrentWindow().listen<string>('hijack-file', async () => {
      await handleInitialFile()
    })
    runOnceFlag = true
  }

  return {
    handleSave,
    handleLoad,
    enableAutoSave,
    lastSaveText,
    handleQuickSave,
    handleInitialFile,
    isBondedToFile,
  }
}
