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
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'
import slugify from 'slugify'

const { t } = useI18n()
const toast = useToast()

const posts = ref([])
const loading = ref(true)
const dialog = ref(false)
const deleteDialog = ref(false)
const selectedPost = ref(null)
const uploadedFile = ref(null) // Для відстеження завантаженого файлу

const form = ref({
  title: '',
  shortDescription: '',
  content: '',
  image: '', // Тут буде URL-адреса зображення
  tags: '',
  publishDate: new Date()
})

onMounted(async () => {
  await loadPosts()
})

const loadPosts = async () => {
  try {
    const postsSnapshot = await getDocs(collection(db, 'blog'))
    posts.value = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      formattedDate: new Date(doc.data().publishDate.toDate()).toLocaleDateString()
    }))
  } catch (error) {
    console.error('Error loading posts:', error)
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити статті',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const openNew = () => {
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

const editPost = (post) => {
  selectedPost.value = post
  form.value = {
    ...post,
    tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags,
    publishDate: post.publishDate ? post.publishDate.toDate() : new Date(),
    image: post.image || ''
  }
  uploadedFile.value = null
  dialog.value = true
}

const confirmDelete = (post) => {
  selectedPost.value = post
  deleteDialog.value = true
}

const deletePost = async () => {
  if (!selectedPost.value) return

  try {
    // Видалення зображення з Firebase Storage, якщо воно є
    if (selectedPost.value.image) {
      const imageRef = storageRef(storage, selectedPost.value.image)
      await deleteObject(imageRef).catch(error => {
        console.error('Error deleting image from storage:', error)
        toast.add({
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
    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: 'Статтю видалено',
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити статтю',
      life: 3000
    })
  }
}

const savePost = async () => {
  try {
    console.log('form.value.tags before split:', form.value.tags)
    const postData = {
      ...form.value,
      slug: slugify(form.value.title, { lower: true }),
      tags: form.value.tags.split(',').map(tag => tag.trim()),
      publishDate: new Date(form.value.publishDate),
      updatedAt: new Date()
    }

    if (uploadedFile.value) {
      const file = uploadedFile.value
      const imageName = `blog/${Date.now()}_${file.name}`
      const imageRef = storageRef(storage, imageName)
      const snapshot = await uploadBytes(imageRef, file)
      postData.image = await getDownloadURL(snapshot.ref)

      // Видалення попереднього зображення при редагуванні
      if (selectedPost.value?.image && selectedPost.value.image !== postData.image) {
        const prevImageRef = storageRef(storage, selectedPost.value.image)
        await deleteObject(prevImageRef).catch(error => {
          console.error('Error deleting previous image:', error)
          toast.add({
            severity: 'warn',
            summary: 'Попередження',
            detail: 'Не вдалося видалити попереднє зображення зі сховища',
            life: 3000
          })
        })
      }
    }

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
    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: selectedPost.value ? 'Статтю оновлено' : 'Статтю створено',
      life: 3000
    })
  } catch (error) {
    console.error('Error saving post:', error)
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти статтю',
      life: 3000
    })
  } finally {
    uploadedFile.value = null // Очищаємо завантажений файл після збереження
  }
}

const src = ref(null);

function onFileSelect(event) {
  const file = event.files[0];
  uploadedFile.value = file
  const reader = new FileReader();

  toast.add({
    severity: 'success',
    summary: 'Успіх',
    detail: 'Зображення готове до завантаження при збереженні',
    life: 3000
  })

  reader.onload = async (e) => {
    src.value = e.target.result;
  };

  reader.readAsDataURL(file);
}
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