<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Menubar from 'primevue/menubar'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase'
import { useToast } from 'primevue/usetoast'

const currentUser = computed(() => auth.currentUser)
const toast = useToast()
const { t, locale } = useI18n()
const router = useRouter()
const isMobileMenuOpen = ref(false)
const scrolled = ref(false)
const languages = ref([
  { name: 'УКР', value: 'uk' },
  { name: 'ENG', value: 'en' }
])

const login = () => {
  console.log('Login clicked')
  console.log('USER:', currentUser?.uid)
  router.push({ name: 'login' })
}

// Обновленный вариант меню с прямыми маршрутами
const menuItems = computed(() => [
  {
    label: t('common.home'),
    icon: 'pi pi-home',
    route: 'home'
  },
  {
    label: t('common.services'),
    icon: 'pi pi-cog',
    route: 'services'
  },
  {
    label: t('common.blog'),
    icon: 'pi pi-book',
    route: 'blog'
  },
  {
    label: t('common.faq'),
    icon: 'pi pi-question-circle',
    route: 'faq'
  },
  {
    label: t('common.contacts'),
    icon: 'pi pi-envelope',
    route: 'contacts'
  },
  {
    label: 'Admin',
    icon: 'pi pi-shield',
    route: 'admin-dashboard',
    visible: auth.currentUser?.uid
  }
])

// Конвертируем наши элементы меню в формат, понятный компоненту Menubar
const menubarItems = computed(() =>
    menuItems.value
        .filter(item => item.visible !== false)
        .map(item => ({
          label: item.label,
          icon: item.icon,
          command: () => router.push({ name: item.route })
        }))
)

// Корректный способ добавления обработчика прокрутки с использованием хуков жизненного цикла
const handleScroll = () => {
  scrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const navigateTo = (routeName) => {
  router.push({ name: routeName })
  closeMobileMenu()
}

const handleLogout = async () => {
  try {
    console.log('Logging out...', auth)
    await signOut(auth)
    toast.add({
      severity: 'success',
      summary: t('Ви вийшли'),
      detail: t('Ви успішно вийшли з системи'),
      life: 3000
    })

    setTimeout(() => {
      router.push({ name: 'home' })
      closeMobileMenu()
    }, 1000)
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<template>
  <header
      :class="[
      'fixed w-full z-50 transition-all duration-300',
      scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
    ]"
  >
    <div class="container-custom flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center" @click="closeMobileMenu">
        <span class="text-xl font-bold text-primary-600">IT Компанія</span>
      </router-link>

      <!-- Desktop Menu -->
      <div class="hidden lg:block">
        <Menubar :model="menubarItems" class="border-none bg-transparent" />
      </div>

      <!-- Language Switcher & Auth Buttons -->
      <div class="hidden lg:flex items-center space-x-4">
        <!-- Обновленный дизайн переключателя языка -->
        <div class="flex border rounded-lg overflow-hidden">
          <button
              v-for="lang in languages"
              :key="lang.value"
              :class="[
              'px-3 py-1 transition-colors',
              locale === lang.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            ]"
              @click="locale = lang.value"
          >
            {{ lang.name }}
          </button>
        </div>
        {{currentUser?.uid}}
        <Button
            v-if="auth.currentUser"
            label="Вийти"
            icon="pi pi-sign-out"
            class="p-button-outlined"
            @click.prevent="handleLogout"
        />
        <Button
            v-if="!auth.currentUser"
            label="Увійти"
            icon="pi pi-sign-in"
            class="p-button-outlined"
            @click.prevent="login"
        />
      </div>

      <!-- Mobile Menu Button -->
      <div class="lg:hidden flex items-center space-x-2">
        <!-- Обновленный дизайн переключателя языка для мобильных -->
        <div class="flex border rounded-lg overflow-hidden">
          <button
              v-for="lang in languages"
              :key="lang.value"
              :class="[
              'px-2 py-1 text-sm transition-colors',
              locale === lang.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700'
            ]"
              @click="locale = lang.value"
          >
            {{ lang.name }}
          </button>
        </div>

        <button @click="toggleMobileMenu" class="p-2 rounded-md text-gray-700">
          <span class="sr-only">Open menu</span>
          <i :class="[isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars', 'text-2xl']"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Menu - исправлено для корректной навигации -->
    <div
        v-if="isMobileMenuOpen"
        class="lg:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-4 transition-all duration-300 ease-in-out z-50"
    >
      <nav class="flex flex-col space-y-4">
        <a
            v-show="item.visible !== false"
            v-for="item in menuItems"
            :key="item.label"
            href="#"
            class="px-4 py-2 rounded-md hover:bg-gray-100 flex items-center"
            @click.prevent="navigateTo(item.route)"
        >
          <i :class="[item.icon, 'mr-2']"></i>
          {{ item.label }}
        </a>

        <template v-if="!auth.currentUser">
          <Button
              label="Увійти"
              icon="pi pi-sign-in"
              class="p-button-outlined w-full"
              @click="() => { router.push({ name: 'login' }); closeMobileMenu(); }"
          />
          <Button
              label="Реєстрація"
              icon="pi pi-user-plus"
              class="w-full"
              @click="() => { router.push({ name: 'register' }); closeMobileMenu(); }"
          />
        </template>
        <template v-else>
          <Button
              label="Вийти"
              icon="pi pi-sign-out"
              class="p-button-outlined w-full"
              @click="handleLogout"
          />
        </template>
      </nav>
    </div>
  </header>

  <!-- Spacer for fixed header -->
  <div :class="['h-16', scrolled ? 'h-16' : 'h-20']"></div>
</template>