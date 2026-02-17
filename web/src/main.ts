import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'
import '@/assets/icon-font/iconfont.css'
import 'viewerjs/dist/viewer.css'
import VueViewer from 'v-viewer'
import i18n from './i18n'
import { getLang } from '@/api'
import { useStore, setStoreInstance } from './store'
import { bus, setBusInstance } from './bus'
import { setStoreRef } from '@/api'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.use(VueViewer, { defaultOptions: {} })

app.config.globalProperties.$bus = bus
app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$confirm = ElMessageBox.confirm
app.config.globalProperties.$loading = ElLoading.service
app.config.globalProperties.$notify = {
  info: (opts: Record<string, unknown>) => ElNotification({ ...opts, type: 'info' }),
  success: (opts: Record<string, unknown>) => ElNotification({ ...opts, type: 'success' }),
  warning: (opts: Record<string, unknown>) => ElNotification({ ...opts, type: 'warning' }),
  error: (opts: Record<string, unknown>) => ElNotification({ ...opts, type: 'error' })
}
setBusInstance(bus)
const store = useStore()
setStoreInstance(store)
setStoreRef(store)

const initApp = (): void => {
  i18n.global.locale.value = getLang() as 'zh' | 'zhtw' | 'en' | 'vi'
  app.mount('#app')
}

if (window.takeOverApp) {
  window.initApp = initApp
  window.$bus = bus
} else {
  initApp()
}
