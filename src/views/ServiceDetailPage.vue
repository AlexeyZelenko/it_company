<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'vue-meta';
import Button from 'primevue/button';
import { collection, query, where, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase';

interface ServiceBenefit {
  title: string;
  description: string;
  icon: string;
}

interface Service {
  id?: string;
  title: string;
  slug: string;
  description?: string;
  fullDescription?: string;
  features?: string[];
  benefits?: ServiceBenefit[];
  image?: string;
  icon?: string;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const service = ref<Service | null>(null);
const loading = ref<boolean>(true);
const error = ref<boolean>(false);

useMeta(() => ({
  title: service.value ? `${service.value.title} | IT Компанія` : 'Послуга | IT Компанія',
  meta: [
    {
      name: 'description',
      content: service.value?.description || 'Детальна інформація про послугу',
    },
  ],
}));

onMounted(async () => {
  try {
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, where('slug', '==', route.params.slug));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    if (!querySnapshot.empty) {
      service.value = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      } as Service;
    } else {
      // Fallback data with explicit typing
      if (route.params.slug === 'web-development') {
        service.value = {
          id: '1',
          title: 'Веб-розробка',
          slug: 'web-development',
          description: 'Розробка сучасних та ефективних веб-сайтів та веб-додатків з використанням передових технологій.',
          fullDescription: `
            <h2>Професійна веб-розробка для вашого бізнесу</h2>
            <p>Ми створюємо сучасні веб-рішення, які допомагають бізнесу розвиватися в цифровому світі. Наша команда досвідчених розробників використовує найновіші технології та найкращі практики для створення швидких, безпечних та масштабованих веб-додатків.</p>

            <h3>Наші послуги включають:</h3>
            <ul>
              <li>Розробка корпоративних веб-сайтів</li>
              <li>Створення інтернет-магазинів</li>
              <li>Розробка веб-додатків</li>
              <li>Оптимізація продуктивності існуючих сайтів</li>
            </ul>

            <h3>Технології, які ми використовуємо:</h3>
            <ul>
              <li>Frontend: React, Vue.js, Angular</li>
              <li>Backend: Node.js, Python, PHP</li>
              <li>Бази даних: PostgreSQL, MongoDB, MySQL</li>
              <li>Cloud: AWS, Google Cloud, Azure</li>
            </ul>
          `,
          features: [
            'Розробка корпоративних сайтів',
            'Створення інтернет-магазинів',
            'Розробка веб-додатків',
            'Оптимізація продуктивності',
          ],
          benefits: [
            {
              title: 'Сучасний дизайн',
              description: 'Створюємо унікальний та привабливий дизайн, який відповідає вашому бренду',
              icon: 'pi pi-palette',
            },
            {
              title: 'Адаптивність',
              description: 'Всі наші рішення адаптивні та чудово виглядають на всіх пристроях',
              icon: 'pi pi-mobile',
            },
            {
              title: 'Швидкість',
              description: 'Оптимізуємо продуктивність для швидкого завантаження та плавної роботи',
              icon: 'pi pi-bolt',
            },
            {
              title: 'SEO',
              description: 'Впроваджуємо найкращі практики SEO для кращого ранжування в пошукових системах',
              icon: 'pi pi-chart-line',
            },
          ],
          image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg',
          icon: 'pi pi-desktop',
        } as Service;
      } else {
        error.value = true;
      }
    }
  } catch (err: any) {
    console.error('Error fetching service:', err);
    // Fallback data in case of error, also with explicit typing
    if (route.params.slug === 'web-development') {
      service.value = {
        id: '1',
        title: 'Веб-розробка',
        slug: 'web-development',
        description: 'Розробка сучасних та ефективних веб-сайтів та веб-додатків з використанням передових технологій.',
        fullDescription: `
          <h2>Професійна веб-розробка для вашого бізнесу</h2>
          <p>Ми створюємо сучасні веб-рішення, які допомагають бізнесу розвиватися в цифровому світі. Наша команда досвідчених розробників використовує найновіші технології та найкращі практики для створення швидких, безпечних та масштабованих веб-додатків.</p>

          <h3>Наші послуги включають:</h3>
          <ul>
            <li>Розробка корпоративних веб-сайтів</li>
            <li>Створення інтернет-магазинів</li>
            <li>Розробка веб-додатків</li>
            <li>Оптимізація продуктивності існуючих сайтів</li>
          </ul>

          <h3>Технології, які ми використовуємо:</h3>
          <ul>
            <li>Frontend: React, Vue.js, Angular</li>
            <li>Backend: Node.js, Python, PHP</li>
            <li>Бази даних: PostgreSQL, MongoDB, MySQL</li>
            <li>Cloud: AWS, Google Cloud, Azure</li>
          </ul>
        `,
        features: [
          'Розробка корпоративних сайтів',
          'Створення інтернет-магазинів',
          'Розробка веб-додатків',
          'Оптимізація продуктивності',
        ],
        benefits: [
          {
            title: 'Сучасний дизайн',
            description: 'Створюємо унікальний та привабливий дизайн, який відповідає вашому бренду',
            icon: 'pi pi-palette',
          },
          {
            title: 'Адаптивність',
            description: 'Всі наші рішення адаптивні та чудово виглядають на всіх пристроях',
            icon: 'pi pi-mobile',
          },
          {
            title: 'Швидкість',
            description: 'Оптимізуємо продуктивність для швидкого завантаження та плавної роботи',
            icon: 'pi pi-bolt',
          },
          {
            title: 'SEO',
            description: 'Впроваджуємо найкращі практики SEO для кращого ранжування в пошукових системах',
            icon: 'pi pi-chart-line',
          },
        ],
        image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg',
        icon: 'pi pi-desktop',
      } as Service;
    } else {
      error.value = true;
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="!loading && !error" class="py-16">
    <div class="container-custom">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <i :class="[service?.icon, 'text-4xl text-primary-500']"></i>
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900">
              {{ service?.title }}
            </h1>
          </div>
          <p class="text-xl text-gray-600 mb-8">
            {{ service?.description }}
          </p>
          <Button
              :label="t('services.cta')"
              icon="pi pi-send"
              class="p-button-lg"
              @click="router.push({ name: 'contacts' })"
          />
        </div>
        <div v-if="service?.image">
          <img
              :src="service.image"
              :alt="service.title"
              class="rounded-lg shadow-lg w-full"
          >
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div
            v-for="benefit in service?.benefits"
            :key="benefit.title"
            class="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <i :class="[benefit.icon, 'text-3xl text-primary-500 mb-4']"></i>
          <h3 class="text-xl font-semibold mb-2">{{ benefit.title }}</h3>
          <p class="text-gray-600">{{ benefit.description }}</p>
        </div>
      </div>

      <div class="prose prose-lg max-w-none mb-16" v-html="service?.fullDescription"></div>

      <div class="bg-primary-50 rounded-2xl p-8 md:p-12 text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">
          Готові обговорити ваш проект?
        </h2>
        <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Зв'яжіться з нами для отримання безкоштовної консультації та обговорення деталей вашого проекту
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

  <div v-else-if="error" class="py-16">
    <div class="container-custom text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        Послугу не знайдено
      </h1>
      <p class="text-gray-600 mb-8">
        Вибачте, але послугу, яку ви шукаєте, не знайдено.
      </p>
      <Button
          label="Повернутися до списку послуг"
          icon="pi pi-arrow-left"
          @click="router.push({ name: 'services' })"
      />
    </div>
  </div>

  <div v-else class="py-16">
    <div class="container-custom">
      <div class="flex justify-center">
        <i class="pi pi-spinner animate-spin text-4xl text-primary-500"></i>
      </div>
    </div>
  </div>
</template>