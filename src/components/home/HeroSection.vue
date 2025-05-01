<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const { t } = useI18n()
const router = useRouter()

const goToServices = () => {
  router.push({ name: 'services' })
}
</script>

<template>
  <section class="relative h-[80vh] min-h-[600px] flex items-center">
    <!-- Background image with overlay -->
    <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" 
         style="background-image: url('https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920')">
      <div class="absolute inset-0 bg-gradient-to-r from-primary-950/90 to-primary-800/70"></div>
    </div>
    
    <!-- Content -->
    <div class="container-custom relative z-10 text-white">
      <div class="max-w-3xl">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fadeInUp">
          {{ t('home.hero.title') }}
        </h1>
        <p class="text-lg md:text-xl mb-8 opacity-90 animate-fadeInUp animation-delay-200">
          {{ t('home.hero.subtitle') }}
        </p>
        <div class="flex flex-wrap gap-4 animate-fadeInUp animation-delay-400">
          <Button 
            :label="t('home.hero.cta')" 
            icon="pi pi-arrow-right" 
            iconPos="right" 
            class="p-button-lg"
            @click="goToServices"
          />
          <Button 
            :label="t('common.callToAction')" 
            icon="pi pi-phone" 
            class="p-button-outlined p-button-lg"
            @click="router.push({ name: 'contacts' })"
          />
        </div>
      </div>
    </div>
    
    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <i class="pi pi-chevron-down text-white text-3xl"></i>
    </div>
  </section>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-400 {
  animation-delay: 0.4s;
}
</style>