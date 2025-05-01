<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { collection, getDocs, query, orderBy, limit, DocumentData, QuerySnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { format } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';

interface Post {
  id?: string;
  title?: string;
  shortDescription?: string;
  image?: string;
  publishDate: Date | Timestamp;
  formattedDate?: string;
  slug?: string;
  readingTime?: number;
  viewCount?: number;
}

const { t, locale } = useI18n();
const router = useRouter();
const posts = ref<Post[]>([]);
const loading = ref<boolean>(true);

const dateLocale = computed(() => locale.value === 'uk' ? uk : enUS);

onMounted(async () => {
  try {
    const postsQuery = query(
        collection(db, 'blog'),
        orderBy('publishDate', 'desc'),
        limit(3)
    );
    const postsSnapshot: QuerySnapshot<DocumentData> = await getDocs(postsQuery);
    posts.value = postsSnapshot.docs.map(doc => {
      const data = doc.data();
      const publishDate = (data.publishDate as Timestamp)?.toDate();
      return {
        id: doc.id,
        ...data,
        formattedDate: publishDate ? format(publishDate, 'dd MMMM yyyy', { locale: dateLocale.value }) : '',
        readingTime: data.readingTime || 5,
        viewCount: data.viewCount || 0,
      } as Post;
    });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    // Optionally set fallback data here:
    // posts.value = [...]
  } finally {
    loading.value = false;
  }
});

const navigateToPost = (slug: string | undefined) => {
  if (slug) {
    router.push({ name: 'blog-post', params: { slug } });
  }
};

const navigateToBlog = () => {
  router.push({ name: 'blog' });
};
</script>

<template>
  <section class="py-16">
    <div class="container-custom">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
          {{ t('home.blog.title') }}
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ t('home.blog.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card
            v-for="post in posts"
            :key="post.id"
            class="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow p-0"
        >
          <template #header>
            <img
                v-if="post.image"
                :src="post.image"
                alt="Post image"
                class="w-full h-48 object-cover cursor-pointer"
                @click="navigateToPost(post.slug)"
            >
            <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center cursor-pointer" @click="navigateToPost(post.slug)">
              <i class="pi pi-image text-5xl text-gray-500"></i>
            </div>
          </template>
          <template #title>
            <h3
                class="text-xl font-semibold text-gray-900 cursor-pointer hover:text-primary-600 transition"
                @click="navigateToPost(post?.slug)"
            >
              {{ post?.title }}
            </h3>
          </template>
          <template #subtitle>
            <div class="flex flex-wrap text-sm text-gray-500 gap-4 mt-1 mb-3">
              <div class="flex items-center">
                <i class="pi pi-calendar mr-1"></i>
                <span>{{ post?.formattedDate }}</span>
              </div>
              <div class="flex items-center">
                <i class="pi pi-clock mr-1"></i>
                <span>{{ t('common.minutesToRead', { n: post?.readingTime || 5 }) }}</span>
              </div>
              <div class="flex items-center">
                <i class="pi pi-eye mr-1"></i>
                <span>{{ t('common.views', { n: post?.viewCount || 0 }) }}</span>
              </div>
            </div>
          </template>
          <template #content>
            <p class="text-gray-600 mb-6">{{ post?.shortDescription }}</p>
            <Button
                :label="t('common.readMore')"
                icon="pi pi-arrow-right"
                iconPos="right"
                class="p-button-outlined w-full"
                @click="navigateToPost(post?.slug)"
            />
          </template>
        </Card>
      </div>

      <div class="flex justify-center mt-12">
        <Button
            :label="t('common.blog')"
            icon="pi pi-arrow-right"
            iconPos="right"
            class="p-button-lg"
            @click="navigateToBlog"
        />
      </div>
    </div>
  </section>
</template>