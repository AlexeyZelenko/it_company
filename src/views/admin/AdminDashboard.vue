<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { collection, getDocs, query, orderBy, limit, getCountFromServer } from 'firebase/firestore'
import { db } from '@/firebase'

const { t } = useI18n()
const loading = ref(true)
const stats = ref({
  services: 0,
  blogPosts: 0,
  faqItems: 0,
  messages: 0
})
const recentMessages = ref([])

// Chart data
const chartData = ref({
  labels: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень'],
  datasets: [
    {
      label: 'Перегляди сторінок',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 1)',
      data: [65, 59, 80, 81, 56, 55, 40]
    },
    {
      label: 'Унікальні відвідувачі',
      backgroundColor: 'rgba(20, 184, 166, 0.2)',
      borderColor: 'rgba(20, 184, 166, 1)',
      data: [28, 48, 40, 19, 86, 27, 90]
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}

onMounted(async () => {
  try {
    // Fetch counts from Firestore
    const servicesCount = await getCountFromServer(collection(db, 'services'))
    const blogCount = await getCountFromServer(collection(db, 'blog'))
    const faqCount = await getCountFromServer(collection(db, 'faq'))
    const messagesCount = await getCountFromServer(collection(db, 'messages'))
    
    stats.value = {
      services: servicesCount.data().count,
      blogPosts: blogCount.data().count,
      faqItems: faqCount.data().count,
      messages: messagesCount.data().count
    }
    
    // Fetch recent messages
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(5)
    )
    const messagesSnapshot = await getDocs(messagesQuery)
    recentMessages.value = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }))
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Set fallback data if Firebase fetch fails
    stats.value = {
      services: 4,
      blogPosts: 12,
      faqItems: 15,
      messages: 8
    }
    
    recentMessages.value = [
      {
        id: '1',
        name: 'Олександр Петренко',
        email: 'oleksandr@example.com',
        message: 'Цікавлять послуги веб-розробки.',
        createdAt: new Date('2023-05-15'),
        status: 'new'
      },
      {
        id: '2',
        name: 'Марія Коваленко',
        email: 'maria@example.com',
        message: 'Хочу дізнатися більше про розробку мобільних додатків.',
        createdAt: new Date('2023-05-14'),
        status: 'read'
      },
      {
        id: '3',
        name: 'Іван Сидоренко',
        email: 'ivan@example.com',
        message: 'Питання щодо вартості послуг.',
        createdAt: new Date('2023-05-12'),
        status: 'responded'
      }
    ]
  } finally {
    loading.value = false
  }
})

const formatDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value)
}

const getStatusClass = (status) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800'
    case 'read': return 'bg-yellow-100 text-yellow-800'
    case 'responded': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'new': return 'Новий'
    case 'read': return 'Прочитано'
    case 'responded': return 'Відповідь надіслано'
    default: return status
  }
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-6">{{ t('admin.dashboard.welcome') }}</h1>
    
    <!-- Stats cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center">
            <i class="pi pi-cog text-primary-500 mr-2 text-2xl"></i>
            <span>{{ t('admin.dashboard.services') }}</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ stats.services }}</div>
        </template>
      </Card>
      
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center">
            <i class="pi pi-book text-secondary-500 mr-2 text-2xl"></i>
            <span>{{ t('admin.dashboard.blogPosts') }}</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ stats.blogPosts }}</div>
        </template>
      </Card>
      
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center">
            <i class="pi pi-question-circle text-accent-500 mr-2 text-2xl"></i>
            <span>{{ t('admin.dashboard.faqItems') }}</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ stats.faqItems }}</div>
        </template>
      </Card>
      
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center">
            <i class="pi pi-envelope text-purple-500 mr-2 text-2xl"></i>
            <span>{{ t('admin.dashboard.messages') }}</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ stats.messages }}</div>
        </template>
      </Card>
    </div>
    
    <!-- Chart & Recent Messages -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Chart -->
      <Card class="shadow-sm lg:col-span-2">
        <template #title>
          <div class="flex items-center">
            <i class="pi pi-chart-line text-primary-500 mr-2"></i>
            <span>Статистика сайту</span>
          </div>
        </template>
        <template #content>
          <div class="h-80">
            <Chart type="line" :data="chartData" :options="chartOptions" />
          </div>
        </template>
      </Card>
      
      <!-- Recent Messages -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <i class="pi pi-envelope text-primary-500 mr-2"></i>
              <span>Останні повідомлення</span>
            </div>
            <router-link to="#" class="text-sm text-primary-600 hover:underline">
              Переглянути всі
            </router-link>
          </div>
        </template>
        <template #content>
          <DataTable 
            :value="recentMessages" 
            stripedRows 
            :loading="loading" 
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
            <Column field="name" header="Ім'я">
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span class="font-medium">{{ data.name }}</span>
                  <span class="text-xs text-gray-500">{{ data.email }}</span>
                </div>
              </template>
            </Column>
            <Column field="createdAt" header="Дата">
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>
            <Column field="status" header="Статус">
              <template #body="{ data }">
                <span :class="['px-2 py-1 rounded-full text-xs font-medium', getStatusClass(data.status)]">
                  {{ getStatusLabel(data.status) }}
                </span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>