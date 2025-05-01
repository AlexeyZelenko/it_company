<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMeta } from 'vue-meta'
import InputText from 'primevue/inputtext'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'

const { t } = useI18n()
const faqs = ref([])
const loading = ref(true)
const searchQuery = ref('')

useMeta({
  title: t('faq.title') + ' | IT Компанія',
  meta: [
    { name: 'description', content: t('faq.subtitle') }
  ]
})

onMounted(async () => {
  try {
    const faqsQuery = query(
      collection(db, 'faqs'),
      orderBy('order', 'asc')
    )
    const faqsSnapshot = await getDocs(faqsQuery)
    faqs.value = faqsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    faqs.value = [
      {
        id: '1',
        question: 'Які послуги ви надаєте?',
        answer: 'Ми надаємо широкий спектр IT-послуг, включаючи веб-розробку, мобільну розробку, хмарні рішення та консалтинг.',
        category: 'Загальні питання'
      },
      {
        id: '2',
        question: 'Як розпочати співпрацю?',
        answer: 'Для початку співпраці зв\'яжіться з нами через форму на сайті або зателефонуйте. Ми обговоримо ваш проект та запропонуємо оптимальне рішення.',
        category: 'Співпраця'
      }
    ]
  } finally {
    loading.value = false
  }
})

const filteredFaqs = computed(() => {
  if (!searchQuery.value) return faqs.value
  
  const search = searchQuery.value.toLowerCase()
  return faqs.value.filter(faq => 
    faq.question.toLowerCase().includes(search) ||
    faq.answer.toLowerCase().includes(search) ||
    faq.category.toLowerCase().includes(search)
  )
})

const groupedFaqs = computed(() => {
  const groups = {}
  filteredFaqs.value.forEach(faq => {
    if (!groups[faq.category]) {
      groups[faq.category] = []
    }
    groups[faq.category].push(faq)
  })
  return groups
})
</script>

<template>
  <div class="py-16">
    <div class="container-custom">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          {{ t('faq.title') }}
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ t('faq.subtitle') }}
        </p>
      </div>

      <!-- Search -->
      <div class="max-w-xl mx-auto mb-12">
        <span class="p-input-icon-left w-full">
          <InputText
            v-model="searchQuery"
            :placeholder="t('faq.searchPlaceholder')"
            class="w-full"
          />
        </span>
      </div>

      <!-- FAQ Accordion -->
      <div v-if="!loading" class="max-w-4xl mx-auto">
        <template v-if="Object.keys(groupedFaqs).length">
          <div v-for="(faqs, category) in groupedFaqs" :key="category" class="mb-8">
            <h2 class="text-2xl font-bold mb-4">{{ category }}</h2>
            <Accordion>
              <AccordionTab v-for="faq in faqs" :key="faq.id">
                <template #header>
                  <span class="text-lg">{{ faq.question }}</span>
                </template>
                <div class="prose prose-lg" v-html="faq.answer"></div>
              </AccordionTab>
            </Accordion>
          </div>
        </template>
        <div v-else class="text-center py-12">
          <p class="text-xl text-gray-600">
            {{ t('faq.noResults') }}
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="flex justify-center">
        <i class="pi pi-spinner animate-spin text-4xl text-primary-500"></i>
      </div>
    </div>
  </div>
</template>