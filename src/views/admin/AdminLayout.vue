<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Menubar from 'primevue/menubar';
import Toast from 'primevue/toast';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/firebase';

interface MenuItem {
  label: string;
  icon?: string;
  command?: () => void;
}

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const currentUser = ref<User | null>(null);

const menuItems = ref<MenuItem[]>([
  {
    label: t('admin.dashboard.title'),
    icon: 'pi pi-home',
    command: () => router.push({ name: 'admin-dashboard' }),
  },
  {
    label: t('admin.dashboard.services'),
    icon: 'pi pi-cog',
    command: () => router.push({ name: 'admin-services' }),
  },
  {
    label: t('admin.dashboard.blogPosts'),
    icon: 'pi pi-book',
    command: () => router.push({ name: 'admin-blog' }),
  },
  {
    label: t('admin.dashboard.faqItems'),
    icon: 'pi pi-question-circle',
    command: () => router.push({ name: 'admin-faq' }),
  },
  {
    label: 'Проекти',
    icon: 'pi pi-briefcase',
    command: () => router.push({ name: 'admin-projects' }),
  },
  {
    label: t('admin.common.logout'),
    icon: 'pi pi-sign-out',
    command: handleLogout,
  },
]);

onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
    if (!user) {
      router.replace({ name: 'login' });
    }
  });

  return () => unsubscribe();
});

async function handleLogout() {
  try {
    await signOut(auth);
    router.replace({ name: 'login' });
    toast.add({
      severity: 'success',
      summary: 'Успішний вихід',
      detail: 'Ви успішно вийшли з адмін-панелі',
      life: 3000,
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Помилка при виході з адмін-панелі',
      life: 3000,
    });
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <Toast />

    <div class="bg-white shadow-md">
      <div class="container-custom py-2">
        <Menubar :model="menuItems">
          <template #start>
            <div class="flex items-center mr-4">
              <span class="font-bold text-xl text-primary-600">Адмін-панель</span>
            </div>
          </template>
          <template #end>
            <div v-if="currentUser" class="flex items-center">
              <span class="mr-2 hidden md:inline">{{ currentUser.email }}</span>
              <i class="pi pi-user text-gray-700"></i>
            </div>
          </template>
        </Menubar>
      </div>
    </div>

    <main class="container-custom py-8">
      <router-view />
    </main>
  </div>
</template>