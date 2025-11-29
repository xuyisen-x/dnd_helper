import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import longpress from './directives/longpress'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.directive('longpress', longpress)
app.mount('#app')
