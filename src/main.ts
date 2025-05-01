import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createMetaManager } from 'vue-meta'
import { VueFire, VueFireAuth } from 'vuefire'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

// Import PrimeVue styles
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primeicons/primeicons.css'

// Import tailwind styles
import './style.css'

import App from './App.vue'
import router from './router'
import { firebaseApp } from './firebase'
import { messages } from './i18n'

// Initialize i18n
const i18n = createI18n({
  legacy: false,
  locale: 'uk', // default locale
  fallbackLocale: 'en',
  messages
})

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(i18n)
app.use(createMetaManager())
app.use(PrimeVue, {
   ripple: true,
   theme: {
    preset: Aura
  }
})
app.use(ToastService)
app.use(ConfirmationService)
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()]
})

app.mount('#app')