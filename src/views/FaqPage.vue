<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import { collection, getDocs, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase';

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

interface GroupedFAQs {
  [category: string]: FAQItem[];
}

const { t } = useI18n();
const faqs = ref<FAQItem[]>([]);
const loading = ref<boolean>(true);
const searchQuery = ref<string>('');

onMounted(async () => {
  try {
    const faqsQuery = query(
        collection(db, 'faqs'),
        orderBy('order', 'asc')
    );
    const faqsSnapshot: QuerySnapshot<DocumentData> = await getDocs(faqsQuery);
    faqs.value = faqsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FAQItem[];
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
  } finally {
    loading.value = false;
  }
});

const filteredFaqs = computed(() => {
  if (!searchQuery.value) return faqs.value;

  const search = searchQuery.value.toLowerCase();
  return faqs.value.filter(faq =>
      faq.question.toLowerCase().includes(search) ||
      faq.answer.toLowerCase().includes(search) ||
      faq.category.toLowerCase().includes(search)
  );
});

const groupedFaqs = computed<GroupedFAQs>(() => {
  const groups: GroupedFAQs = {};
  filteredFaqs.value.forEach(faq => {
    if (!groups[faq.category]) {
      groups[faq.category] = [];
    }
    groups[faq.category].push(faq);
  });
  return groups;
});
</script>

<template>
  <div class="py-16">
    <div class="container-custom">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          {{ t('faq.title') }}
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ t('faq.subtitle') }}
        </p>
      </div>

      <div class="max-w-xl mx-auto mb-12">
        <span class="p-input-icon-left w-full">
          <InputText
              v-model="searchQuery"
              :placeholder="t('faq.searchPlaceholder')"
              class="w-full"
          />
        </span>
      </div>

      <div v-if="!loading" class="max-w-4xl mx-auto">
        <template v-if="Object.keys(groupedFaqs).length">
          <div v-for="(faqsInCategory, category) in groupedFaqs" :key="category" class="mb-8">
            <h2 class="text-2xl font-bold mb-4">{{ category }}</h2>
            <Accordion>
              <AccordionTab v-for="faq in faqsInCategory" :key="faq.id">
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

      <div v-else class="flex justify-center">
        <i class="pi pi-spinner animate-spin text-4xl text-primary-500"></i>
      </div>
    </div>
  </div>
</template>