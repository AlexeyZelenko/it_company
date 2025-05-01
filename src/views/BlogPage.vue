<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMeta } from 'vue-meta'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'

const { t } = useI18n()
const router = useRouter()
const posts = ref([])
const loading = ref(true)
const searchQuery = ref('')

useMeta({
  title: t('blog.title') + ' | IT Компанія',
  meta: [
    { name: 'description', content: t('blog.subtitle') }
  ]
})

const filteredPosts = computed(() => {
  if (!searchQuery.value) return posts.value
  
  const search = searchQuery.value.toLowerCase()
  return posts.value.filter(post => 
    post.title.toLowerCase().includes(search) ||
    post.shortDescription.toLowerCase().includes(search) ||
    post.tags.some(tag => tag.toLowerCase().includes(search))
  )
})

onMounted(async () => {
  try {
    const postsQuery = query(
      collection(db, 'blog'),
      orderBy('publishDate', 'desc')
    )
    const postsSnapshot = await getDocs(postsQuery)
    posts.value = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      formattedDate: doc.data().publishDate.toDate().toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }))
  } catch (error) {
    console.error('Error fetching blog posts:', error)
  } finally {
    loading.value = false
  }
})

const navigateToPost = (slug: string) => {
  router.push({ name: 'blog-post', params: { slug } })
}
</script>

<template>
  <div class="blog-page py-16">
    <div class="container-custom">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          {{ t('blog.title') }}
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ t('blog.subtitle') }}
        </p>
      </div>

      <!-- Search -->
      <div class="max-w-xl mx-auto mb-12">
        <span class="p-input-icon-left w-full">
          <InputText
            v-model="searchQuery"
            :placeholder="t('common.search')"
            class="w-full"
          />
        </span>
      </div>

      <!-- Blog Posts Grid -->
      <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card 
          v-for="post in filteredPosts" 
          :key="post.id" 
          class="shadow-sm hover:shadow-md transition-shadow"
        >
          <template #header>
            <img 
              :src="post.image" 
              :alt="post.title"
              class="w-full h-48 object-cover cursor-pointer"
              @click="navigateToPost(post.slug)"
            >
          </template>
          <template #title>
            <h2 
              class="text-xl font-semibold text-gray-900 cursor-pointer hover:text-primary-600 transition"
              @click="navigateToPost(post.slug)"
            >
              {{ post.title }}
            </h2>
          </template>
          <template #subtitle>
            <div class="flex flex-wrap text-sm text-gray-500 gap-4 mt-1 mb-3">
              <div class="flex items-center">
                <i class="pi pi-calendar mr-1"></i>
                <span>{{ post.formattedDate }}</span>
              </div>
              <div class="flex items-center">
                <i class="pi pi-clock mr-1"></i>
                <span>{{ t('common.minutesToRead', { n: post.readingTime || 5 }) }}</span>
              </div>
              <div class="flex items-center">
                <i class="pi pi-eye mr-1"></i>
                <span>{{ t('common.views', { n: post.viewCount }) }}</span>
              </div>
            </div>
          </template>
          <template #content>
            <p class="text-gray-600 mb-4">{{ post.shortDescription }}</p>
            <Button
              :label="t('common.readMore')"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="w-full"
              @click="navigateToPost(post.slug)"
            />
          </template>
        </Card>
      </div>

      <!-- Loading State -->
      <div v-else class="flex justify-center">
        <i class="pi pi-spinner animate-spin text-4xl text-primary-500"></i>
      </div>

      <!-- No Results -->
      <div 
        v-if="!loading && filteredPosts.length === 0" 
        class="text-center py-12"
      >
        <p class="text-xl text-gray-600">
          {{ t('blog.noResults') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style>
  .blog-page {
    .p-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  }
</style>