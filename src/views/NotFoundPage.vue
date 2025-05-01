<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const { t: _t } = useI18n()
const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-primary-500">404</h1>
      <h2 class="text-3xl md:text-4xl font-bold mt-6 mb-4">Сторінку не знайдено</h2>
      <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Сторінка, яку ви шукаєте, не існує або була переміщена.
      </p>
      <div class="flex flex-wrap justify-center gap-4">
        <Button 
          label="Повернутися назад" 
          icon="pi pi-arrow-left" 
          class="p-button-outlined"
          @click="goBack"
        />
        <Button 
          label="На головну" 
          icon="pi pi-home" 
          @click="goHome"
        />
      </div>
    </div>
  </div>
</template>