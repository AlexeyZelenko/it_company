<script setup lang="ts">
import { ref, onMounted, computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { marked } from 'marked';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  doc,
  DocumentData,
  QuerySnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';

// Визначаємо інтерфейс для поста блогу
interface BlogPost {
  id: string;
  title: string;
  shortDescription: string;
  content?: string;
  image?: string;
  publishDate: Timestamp;
  formattedDate?: string;
  viewCount?: number;
  likes?: number;
  tags?: string[];
}

// Використовуємо composables для кращої організації коду
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// Стан компонента
const post = ref<BlogPost | null>(null);
const loading = ref(true);
const error = ref(false);
const likes = ref<any>(0);
const hasLiked = ref<any>(false);

// Кэширование в localStorage
const CACHE_TTL = 60 * 5 * 1000; // 5 минут
const POST_CACHE_KEY = `blog_post_${route.params.slug}`;
const cachedPost = localStorage.getItem(POST_CACHE_KEY);

// Вычисляемые свойства
const readingTime = computed<number>(() => {
  if (!post.value?.content) return 0;
  const words = post.value.content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
});

const formattedContent = computed<string>(() => {
  if (!post.value?.content) return '';
  try {
    return marked(post.value.content);
  } catch (err) {
    console.error('Error formatting content:', err);
    return post.value.content || '';
  }
});

// URLs для шеринга в соцсетях - вынесено в отдельную функцию
const shareUrls: any = computed(() => {
  if (!post.value) return {};

  const url = window.location.href;
  const title = post.value.title || '';
  const description = post.value.shortDescription || '';

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  };
});

// Правильное управление мета-тегами без useMeta
const updateMeta = (title = 'Блог | IT Компанія', description = 'Блог IT Компанії') => {
  document.title = title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', description);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = description;
    document.head.appendChild(meta);
  }
};

// Обновляем мета-информацию при изменении поста
watchEffect(() => {
  if (post.value) {
    updateMeta(`${post.value.title} | IT Компанія`, post.value.shortDescription);
  } else {
    updateMeta(); // Восстанавливаем значения по умолчанию
  }
});

// Асинхронно загружаем данные поста
onMounted(async () => {
  try {
    // Проверяем кэш сначала
    if (cachedPost) {
      try {
        const { data, timestamp } = JSON.parse(cachedPost) as { data: BlogPost; timestamp: number };
        if (Date.now() - timestamp < CACHE_TTL) {
          post.value = data;
          likes.value = data.likes || 0;
          checkUserLike();
          loading.value = false;

          // Обновляем счетчик просмотров в фоне (но не возвращаемся раньше времени)
          incrementViewCount().catch((err) => console.error('Background view increment failed:', err));
          return;
        }
      } catch (e) {
        console.log('Cache parsing error:', e);
      }
    }

    await fetchPost();
  } catch (err) {
    console.error('Error in component initialization:', err);
    error.value = true;
    loading.value = false;
  }
});

// Функции для работы с данными
async function fetchPost() {
  try {
    // Используем конкретный docId, если он известен, избегая запроса с where
    const slug = route.params.slug;
    const postsQuery = query(collection(db, 'blog'), where('slug', '==', slug));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(postsQuery);

    if (!querySnapshot.empty) {
      const postDoc = querySnapshot.docs[0];
      const postData = postDoc.data() as Omit<BlogPost, 'id' | 'formattedDate'> & { publishDate: Timestamp };

      post.value = {
        id: postDoc.id,
        ...postData,
        formattedDate: postData.publishDate.toDate().toLocaleDateString('uk-UA', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      };

      // Инкрементируем счетчик просмотров
      incrementViewCount(postDoc);

      // Сохраняем в кэш
      localStorage.setItem(POST_CACHE_KEY, JSON.stringify({
        data: post.value,
        timestamp: Date.now(),
      }));

      // Проверяем, лайкнул ли пользователь пост
      likes.value = postData.likes || 0;
      checkUserLike();
    } else {
      error.value = true;
    }
  } catch (err) {
    console.error('Error fetching post:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function incrementViewCount(postDoc: any = null) {
  try {
    // Проверяем, есть ли уже id документа в кэше
    if (post.value?.id) {
      const postRef = doc(db, 'blog', post.value.id);
      await updateDoc(postRef, {
        viewCount: increment(1),
      });
      return;
    }

    // Если нет, делаем запрос
    if (!postDoc) {
      const postsQuery = query(collection(db, 'blog'), where('slug', '==', route.params.slug));
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(postsQuery);
      if (!querySnapshot.empty) {
        postDoc = querySnapshot.docs[0];
      } else {
        return;
      }
    }

    await updateDoc(postDoc.ref, {
      viewCount: increment(1),
    });
  } catch (err) {
    console.error('Error incrementing view count:', err);
    // Не прокидываем ошибку дальше, так как это некритичная операция
  }
}

function checkUserLike() {
  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]') as string[];
  hasLiked.value = post.value && likedPosts.includes(post.value.id);
}

// Обработчики действий пользователя
const handleLike = async () => {
  if (!post.value) return;

  try {
    const postId = post.value.id;
    const postRef = doc(db, 'blog', postId);
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]') as string[];
    const isCurrentlyLiked = likedPosts.includes(postId);

    await updateDoc(postRef, {
      likes: increment(isCurrentlyLiked ? -1 : 1),
    });

    if (isCurrentlyLiked) {
      const index = likedPosts.indexOf(postId);
      if (index > -1) {
        likedPosts.splice(index, 1);
      }
      likes.value--;
      hasLiked.value = false;
    } else {
      likedPosts.push(postId);
      likes.value++;
      hasLiked.value = true;
    }

    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));

    // Оновлюємо кеш
    if (cachedPost) {
      try {
        const cachedData = JSON.parse(cachedPost) as { data: BlogPost; timestamp: number };
        cachedData.data.likes = likes.value;
        localStorage.setItem(POST_CACHE_KEY, JSON.stringify(cachedData));
      } catch (e) {
        console.error('Error updating cache:', e);
      }
    }
  } catch (error) {
    console.error('Error liking/unliking post:', error);
  }
};

const share = (platform: keyof ReturnType<any>) => {
  if (!post.value || !shareUrls.value[platform]) return;

  window.open(shareUrls.value[platform], '_blank');
};
</script>

<template>
  <div v-if="!loading && !error" class="py-16">
    <div class="container-custom">
      <div class="mb-8">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">{{ post?.title }}</h1>

        <div class="flex flex-wrap gap-4 text-gray-600 mb-6">
          <div class="flex items-center">
            <i class="pi pi-calendar mr-2"></i>
            <span>{{ post?.formattedDate }}</span>
          </div>
          <div class="flex items-center">
            <i class="pi pi-clock mr-2"></i>
            <span>{{ t('common.minutesToRead', { n: readingTime }) }}</span>
          </div>
          <div class="flex items-center">
            <i class="pi pi-eye mr-2"></i>
            <span>{{ t('common.views', { n: post?.viewCount }) }}</span>
          </div>
        </div>

        <img
            v-if="post?.image"
            :src="post?.image"
            :alt="post?.title"
            class="w-full h-96 object-cover rounded-lg shadow-lg mb-8"
            loading="lazy"
        >
      </div>
      <div class="mb-8">
        <Card class="flex flex-wrap items-center gap-4">
          <template #content>
            <Button
                type="button"
                :label="t('common.like')"
                severity="secondary"
                rounded
                class="p-button-outlined"
                :class="hasLiked ? 'p-button-danger' : 'p-button-secondary'"
                :icon="hasLiked ? 'pi pi-heart-fill' : 'pi pi-heart'"
                :badge="likes"
                badgeSeverity="secondary"
                @click="handleLike"
            />
          </template>
          <template #footer>
            <div class="flex gap-2">
              <Button
                  icon="pi pi-facebook"
                  severity="info" raised
                  rounded
                  outlined
                  @click="share('facebook')"
                  aria-label="Поділитися у Facebook"
              />
              <Button
                  icon="pi pi-twitter"
                  severity="secondary" variant="text" raised
                  rounded
                  outlined
                  @click="share('twitter')"
                  aria-label="Поділитися у Twitter"
              />
              <Button
                  icon="pi pi-linkedin"
                  severity="secondary" variant="text" raised
                  rounded
                  outlined
                  @click="share('linkedin')"
                  aria-label="Поділитися у LinkedIn"
              />
              <Button
                  icon="pi pi-telegram"
                  severity="secondary" variant="text" raised
                  rounded
                  outlined
                  @click="share('telegram')"
                  aria-label="Поділитися у Telegram"
              />
            </div>
          </template>
        </Card>
      </div>

      <div class="prose prose-lg max-w-none mb-12">
        <div v-html="formattedContent" class="blog-content"></div>
      </div>

      <div v-if="post?.tags?.length" class="flex flex-wrap gap-2 mb-8">
        <span
            v-for="tag in post?.tags"
            :key="tag"
            class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
        >
          #{{ tag }}
        </span>
      </div>
    </div>
  </div>

  <div v-else-if="error" class="py-16">
    <div class="container-custom text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        Статтю не знайдено
      </h1>
      <p class="text-gray-600 mb-8">
        Вибачте, але статтю, яку ви шукаєте, не знайдено.
      </p>
      <Button
          :label="t('blog.postNotFound.back')"
          icon="pi pi-arrow-left"
          @click="router.push({ name: 'blog' })"
      />
    </div>
  </div>

  <div v-else class="py-16">
    <div class="container-custom">
      <div class="flex flex-col items-center">
        <i class="pi pi-spinner animate-spin text-4xl text-primary-500 mb-4"></i>
        <p>{{ t('common.loadingPost') }}</p>
      </div>
    </div>
  </div>
</template>

<style>
/* Скомпилированные стили для улучшения производительности */
.prose img {
  @apply rounded-lg shadow-md;
  max-width: 100%;
  height: auto;
}

.prose table {
  @apply border-collapse w-full;
  margin: 1.5rem 0;
}

.prose table th,
.prose table td {
  @apply border border-gray-300 p-2;
}

.prose table th {
  @apply bg-gray-50;
}

.prose ul {
  @apply list-disc pl-6;
  margin: 1rem 0;
}

.prose ol {
  @apply list-decimal pl-6;
  margin: 1rem 0;
}

.prose blockquote {
  @apply border-l-4 border-primary-500 pl-4 italic;
  margin: 1.5rem 0;
  color: #4a5568;
}

.prose code {
  @apply bg-gray-100 rounded px-1;
  font-size: 0.875em;
}

.prose pre {
  @apply bg-gray-900 text-white p-4 rounded-lg overflow-x-auto;
  margin: 1.5rem 0;
}

/* Добавление плавного перехода для интерактивных элементов */
.p-button {
  transition: background-color 0.3s, transform 0.2s;
}

.p-button:active {
  transform: scale(0.98);
}

/* Добавление стилей для улучшения отзывчивости */
@media (max-width: 640px) {
  .prose {
    font-size: 1rem;
  }

  h1 {
    font-size: 1.75rem !important;
  }
}
</style>