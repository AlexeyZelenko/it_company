<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMeta } from 'vue-meta'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const { t } = useI18n()
const router = useRouter()
const services = ref([])
const loading = ref(true)

useMeta({
  title: t('services.title') + ' | IT Компанія',
  meta: [
    { name: 'description', content: t('services.subtitle') }
  ]
})

onMounted(async () => {
  try {
    const servicesSnapshot = await getDocs(collection(db, 'services'))
    services.value = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching services:', error)
    services.value = [
      {
        id: '1',
        title: 'Веб-розробка',
        slug: 'web-development',
        description: 'Розробка сучасних та ефективних веб-сайтів та веб-додатків з використанням передових технологій.',
        icon: 'pi pi-desktop',
        features: [
          'Розробка корпоративних сайтів',
          'Створення інтернет-магазинів',
          'Розробка веб-додатків',
          'Оптимізація продуктивності'
        ],
        image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg'
      },
      {
        id: '2',
        title: 'Мобільні додатки',
        slug: 'mobile-apps',
        description: 'Розробка нативних та кросплатформенних мобільних додатків для iOS та Android.',
        icon: 'pi pi-mobile',
        features: [
          'iOS розробка',
          'Android розробка',
          'React Native',
          'Flutter розробка'
        ],
        image: 'https://images.pexels.com/photos/147413/twitter-facebook-together-exchange-of-information-147413.jpeg'
      },
      {
        id: '3',
        title: 'Штучний інтелект',
        slug: 'artificial-intelligence',
        description: 'Впровадження рішень на основі штучного інтелекту та машинного навчання.',
        icon: 'pi pi-chart-line',
        features: [
          'Машинне навчання',
          'Обробка природної мови',
          'Комп\'ютерний зір',
          'Предиктивна аналітика'
        ],
        image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg'
      }
    ]
  } finally {
    loading.value = false
  }
})

const navigateToService = (slug: string) => {
  router.push({ name: 'service-detail', params: { slug } })
}
</script>

<template>
  <div class="py-16">
    <div class="container-custom">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          {{ t('services.title') }}
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ t('services.subtitle') }}
        </p>
      </div>

      <!-- Services Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card v-for="service in services" :key="service.id" class="flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow">
          <template #header v-if="service.image">
            <img v-if="service.image" :src="service.image" :alt="service.title" class="w-full h-48 object-cover">
          </template>
          <template #title>
            <div class="flex items-center gap-2">
              <i :class="[service.icon, 'text-2xl text-primary-500']"></i>
              <h2 class="text-2xl font-semibold">{{ service.title }}</h2>
            </div>
          </template>
          <template #content class="h-100 flex flex-col justify-between">
            <p class="text-gray-600 mb-6">{{ service.description }}</p>
            <ul class="space-y-2 mb-6">
              <li v-for="feature in service.features" :key="feature" class="flex items-center gap-2">
                <i class="pi pi-check text-green-500"></i>
                <span>{{ feature }}</span>
              </li>
            </ul>
            <Button 
              :label="t('common.readMore')"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="w-full"
              @click="navigateToService(service.slug)"
            />
          </template>
        </Card>
      </div>

      <!-- CTA Section -->
      <div class="mt-16 text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">
          Готові почати проект?
        </h2>
        <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Зв'яжіться з нами для обговорення вашого проекту та отримання безкоштовної консультації
        </p>
        <Button 
          :label="t('services.cta')"
          icon="pi pi-send"
          class="p-button-lg"
          @click="router.push({ name: 'contacts' })"
        />
      </div>
    </div>
  </div>
</template>

<style>
.p-card-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>