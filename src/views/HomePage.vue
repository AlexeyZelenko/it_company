<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMeta } from 'vue-meta'
import HeroSection from '../components/home/HeroSection.vue'
import ServicesSection from '../components/home/ServicesSection.vue'
import BlogSection from '../components/home/BlogSection.vue'
import ContactSection from '../components/home/ContactSection.vue'

const { t } = useI18n()

useMeta({
  title: t('common.home') + ' | IT Компанія',
  meta: [
    { name: 'description', content: 'Інноваційні IT рішення для вашого бізнесу. Ми допомагаємо компаніям трансформувати свій бізнес за допомогою передових технологій.' }
  ]
})
</script>

<template>
  <div>
    <HeroSection />
    <ServicesSection />
    <BlogSection />
    <ContactSection />
  </div>
</template>