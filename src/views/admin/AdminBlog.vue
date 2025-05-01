<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Editor from 'primevue/editor'
import FileUpload from 'primevue/fileupload'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'
import slugify from 'slugify'
import type { ToastMessageOptions } from 'primevue/toast'

// Типы для данных блога
interface BlogPost {
  id: string
  title: string
  shortDescription: string
  content: string
  image: string
  tags: string[] | string
  publishDate: Timestamp | Date
  formattedDate?: string
  slug?: string
  readingTime?: number
  viewCount?: number
  likes?: number
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

interface BlogPostForm {
  title: string
  shortDescription: string
  content: string
  image: string
  tags: string
  publishDate: Date
  readingTime?: any
}

const { t: _t } = useI18n()
const toast = useToast()

const posts = ref<BlogPost[]>([])
const loading = ref<boolean>(true)
const dialog = ref<boolean>(false)
const deleteDialog = ref<boolean>(false)
const selectedPost = ref<BlogPost | null>(null)
const uploadedFile = ref<File | null>(null)
const src = ref<string | null>(null)

const form = ref<BlogPostForm>({
  title: '',
  shortDescription: '',
  content: '',
  image: '',
  tags: '',
  publishDate: new Date()
})

// Загрузка постов
const loadPosts = async (): Promise<void> => {
  try {
    const postsSnapshot = await getDocs(collection(db, 'blog'))
    posts.value = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      formattedDate: new Date(doc.data().publishDate.toDate()).toLocaleDateString()
    })) as BlogPost[]
  } catch (error) {
    console.error('Error loading posts:', error)
    showToast({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити статті',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Вспомогательная функция для уведомлений
const showToast = (options: ToastMessageOptions): void => {
  toast.add(options)
}

// Открытие формы для новой статьи
const openNew = (): void => {
  selectedPost.value = null
  form.value = {
    title: '',
    shortDescription: '',
    content: '',
    image: '',
    tags: '',
    publishDate: new Date(),
    readingTime: 0
  }
  uploadedFile.value = null
  dialog.value = true
}

// Редактирование статьи
const editPost = (post: BlogPost): void => {
  selectedPost.value = post
  form.value = {
    ...post,
    tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
    publishDate: post.publishDate instanceof Timestamp ? post.publishDate.toDate() : post.publishDate,
    image: post.image || ''
  }
  uploadedFile.value = null
  dialog.value = true
}

// Подтверждение удаления
const confirmDelete = (post: BlogPost): void => {
  selectedPost.value = post
  deleteDialog.value = true
}

// Удаление статьи
const deletePost = async (): Promise<void> => {
  if (!selectedPost.value) return

  try {
    // Удаление изображения из Firebase Storage
    if (selectedPost.value.image) {
      const imageRef = storageRef(storage, selectedPost.value.image)
      await deleteObject(imageRef).catch(error => {
        console.error('Error deleting image from storage:', error)
        showToast({
          severity: 'warn',
          summary: 'Попередження',
          detail: 'Не вдалося видалити зображення зі сховища',
          life: 3000
        })
      })
    }

    await deleteDoc(doc(db, 'blog', selectedPost.value.id))
    await loadPosts()
    deleteDialog.value = false
    showToast({
      severity: 'success',
      summary: 'Успіх',
      detail: 'Статтю видалено',
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    showToast({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити статтю',
      life: 3000
    })
  }
}

// Сохранение статьи
const savePost = async (): Promise<void> => {
  try {
    const postData = {
      ...form.value,
      slug: slugify(form.value.title, { lower: true }),
      tags: form.value.tags.split(',').map(tag => tag.trim()),
      publishDate: new Date(form.value.publishDate),
      updatedAt: new Date()
    }

    // Загрузка нового изображения
    if (uploadedFile.value) {
      const file = uploadedFile.value
      const imageName = `blog/${Date.now()}_${file.name}`
      const imageRef = storageRef(storage, imageName)
      const snapshot = await uploadBytes(imageRef, file)
      postData.image = await getDownloadURL(snapshot.ref)

      // Удаление старого изображения
      if (selectedPost.value?.image && selectedPost.value.image !== postData.image) {
        const prevImageRef = storageRef(storage, selectedPost.value.image)
        await deleteObject(prevImageRef).catch(error => {
          console.error('Error deleting previous image:', error)
          showToast({
            severity: 'warn',
            summary: 'Попередження',
            detail: 'Не вдалося видалити попереднє зображення зі сховища',
            life: 3000
          })
        })
      }
    }

    // Обновление или создание статьи
    if (selectedPost.value) {
      await updateDoc(doc(db, 'blog', selectedPost.value.id), postData)
    } else {
      await addDoc(collection(db, 'blog'), {
        ...postData,
        createdAt: new Date(),
        viewCount: 0,
        likes: 0
      })
    }

    await loadPosts()
    dialog.value = false
    showToast({
      severity: 'success',
      summary: 'Успіх',
      detail: selectedPost.value ? 'Статтю оновлено' : 'Статтю створено',
      life: 3000
    })
  } catch (error) {
    console.error('Error saving post:', error)
    showToast({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти статтю',
      life: 3000
    })
  } finally {
    uploadedFile.value = null
  }
}

// Обработка выбора файла
const onFileSelect = (event: { files: File[] }): void => {
  const file = event.files[0]
  uploadedFile.value = file
  const reader = new FileReader()

  showToast({
    severity: 'success',
    summary: 'Успіх',
    detail: 'Зображення готове до завантаження при збереженні',
    life: 3000
  })

  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (e.target?.result) {
      src.value = e.target.result as string
    }
  }

  reader.readAsDataURL(file)
}

// Загрузка постов при монтировании
onMounted(async () => {
  await loadPosts()
})
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Керування блогом</h1>
      <Button
        label="Нова стаття"
        icon="pi pi-plus"
        @click="openNew"
      />
    </div>

    <DataTable
      :value="posts"
      :loading="loading"
      responsiveLayout="scroll"
      class="p-datatable-lg"
    >
      <Column field="title" header="Назва">
        <template #body="{ data }">
          <div class="flex flex-col">
            <span class="font-medium">{{ data.title }}</span>
            <span class="text-sm text-gray-500">{{ data.shortDescription }}</span>
          </div>
        </template>
      </Column>
      <Column field="formattedDate" header="Дата публікації" />
      <Column field="viewCount" header="Перегляди" />
      <Column field="likes" header="Лайки" />
      <Column header="Дії">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              class="p-button-rounded p-button-success p-button-text"
              @click="editPost(data)"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-rounded p-button-danger p-button-text"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="dialog"
      :style="{width: '80vw'}"
      :modal="true"
      :header="selectedPost ? 'Редагувати статтю' : 'Нова стаття'"
    >
      <div class="grid grid-cols-1 gap-4">
        <div class="field">
          <label for="title">Назва</label>
          <InputText id="title" v-model="form.title" class="w-full" />
        </div>

        <div class="field">
          <label for="shortDescription">Короткий опис</label>
          <Textarea
            id="shortDescription"
            v-model="form.shortDescription"
            rows="3"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="content">Контент</label>
          <Editor
            v-model="form.content"
            editorStyle="height: 320px"
          />
        </div>

        <div class="field">
          <label>Зображення</label>
          <div class="flex gap-4 items-center">
            <img
              v-if="form.image"
              :src="form.image"
              class="w-32 h-32 object-cover rounded"
            >
            <FileUpload mode="basic" @select="onFileSelect" customUpload auto severity="secondary" class="p-button-outlined" />
            <img v-if="src" :src="src" alt="Image" class="shadow-md rounded-xl w-full sm:w-64" style="filter: grayscale(100%)" />
          </div>
        </div>

        <div class="field">
          <label for="reading">Час читання</label>
          <InputText id="reading" v-model="form.readingTime" class="w-full" />
        </div>

        <div class="field">
          <label for="tags">Теги (розділені комами)</label>
          <InputText id="tags" v-model="form.tags" class="w-full" />
        </div>
      </div>

      <template #footer>
        <Button
          label="Скасувати"
          icon="pi pi-times"
          class="p-button-text"
          @click="dialog = false"
        />
        <Button
          label="Зберегти"
          icon="pi pi-check"
          class="p-button-primary"
          @click="savePost"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialog"
      :style="{width: '450px'}"
      header="Підтвердження"
      :modal="true"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span>Ви впевнені, що хочете видалити цю статтю?</span>
      </div>
      <template #footer>
        <Button
          label="Ні"
          icon="pi pi-times"
          class="p-button-text"
          @click="deleteDialog = false"
        />
        <Button
          label="Так"
          icon="pi pi-check"
          class="p-button-danger"
          @click="deletePost"
        />
      </template>
    </Dialog>
  </div>
</template>