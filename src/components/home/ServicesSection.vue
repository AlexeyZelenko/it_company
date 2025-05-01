<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const { t } = useI18n()
const router = useRouter()
const services = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    // Fetch services from Firebase
    const servicesSnapshot = await getDocs(collection(db, 'services'))
    services.value = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching services:', error)
    // Fallback data if Firebase fetch fails
    services.value = [
      {
        id: '1',
        title: 'Веб-розробка',
        slug: 'web-development',
        shortDescription: 'Розробка сучасних та ефективних веб-сайтів та веб-додатків',
        icon: 'pi pi-desktop'
      },
      {
        id: '2',
        title: 'Мобільні додатки',
        slug: 'mobile-apps',
        shortDescription: 'Розробка нативних та кросплатформенних мобільних додатків',
        icon: 'pi pi-mobile'
      },
      {
        id: '3',
        title: 'Штучний інтелект',
        slug: 'artificial-intelligence',
        shortDescription: 'Впровадження рішень на основі штучного інтелекту та машинного навчання',
        icon: 'pi pi-chart-line'
      },
      {
        id: '4',
        title: 'DevOps',
        slug: 'devops',
        shortDescription: 'Оптимізація процесів розробки та розгортання програмного забезпечення',
        icon: 'pi pi-cog'
      }
    ]
  } finally {
    loading.value = false
  }
})

const navigateToService = (slug) => {
  router.push({ name: 'service-detail', params: { slug } })
}

const navigateToAllServices = () => {
  router.push({ name: 'services' })
}
</script>

<template>
  <section class="py-16 bg-gray-50">
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
        <div class="services grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card v-for="service in services" :key="service.id" class="h-full flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow">
            <template #header v-if="service.image">
              <img v-if="service.image" :src="service.image" :alt="service.title" class="w-full h-48 object-cover">
            </template>
            <template #title>
              <div class="flex items-center gap-2">
                <i :class="[service.icon, 'text-2xl text-primary-500']"></i>
                <h2 class="text-2xl font-semibold">{{ service.title }}</h2>
              </div>
            </template>
            <template #content>
              <div class="h-fll flex flex-col justify-between">
                <p class="text-gray-600 mb-6">{{ service.description }}</p>
                <ul class="space-y-2 mb-6">
                  <li v-for="feature in service.features" :key="feature" class="flex items-center gap-2">
                    <i class="pi pi-check text-green-500"></i>
                    <span>{{ feature }}</span>
                  </li>
                </ul>
              </div>
            </template>
            <template #footer>
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
      </div>
    </div>

    <div class="flex justify-center mt-6">
      <Button
          :label="t('common.services')"
          icon="pi pi-arrow-right"
          iconPos="right"
          class="p-button-lg"
          @click="navigateToAllServices"
      />
    </div>
  </section>
</template>

<style>
.services {
  .p-card-body {
    height: 100% !important;
  }
}
</style>