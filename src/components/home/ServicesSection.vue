<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { collection, getDocs, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

interface Service {
  id?: string;
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  features?: string[];
  slug?: string;
}

const { t } = useI18n();
const router = useRouter();
const services = ref<Service[]>([]);
const loading = ref<boolean>(true);

onMounted(async () => {
  try {
    const servicesSnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'services'));
    services.value = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      features: (doc.data().features as string[]) || [],
    })) as Service[];
  } catch (error: any) {
    console.error('Error fetching services:', error);
  } finally {
    loading.value = false;
  }
});

const navigateToService = (slug: string | undefined) => {
  if (slug) {
    router.push({ name: 'service-detail', params: { slug } });
  }
};

const navigateToAllServices = () => {
  router.push({ name: 'services' });
};
</script>

<template>
  <section class="py-16 bg-gray-50">
    <div class="py-16">
      <div class="container-custom">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {{ t('services.title') }}
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ t('services.subtitle') }}
          </p>
        </div>

        <div class="services grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card
              v-for="service in services"
              :key="service.id"
              class="h-full flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow"
          >
            <template #header v-if="service.image">
              <img :src="service.image" :alt="service.title" class="w-full h-48 object-cover">
            </template>
            <template #title>
              <div class="flex items-center gap-2">
                <i v-if="service.icon" :class="[service.icon, 'text-2xl text-primary-500']"></i>
                <h2 class="text-2xl font-semibold">{{ service.title }}</h2>
              </div>
            </template>
            <template #content>
              <div class="h-full flex flex-col justify-between">
                <p class="text-gray-600 mb-6">{{ service?.description }}</p>
                <ul v-if="service.features" class="space-y-2 mb-6">
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
                  @click="navigateToService(service?.slug)"
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
  .p-card {
    height: 100%;
  }
  .p-card-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }
}
</style>