<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Editor from 'primevue/editor'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase'

const { t } = useI18n()
const toast = useToast()

const faqs = ref([])
const loading = ref(true)
const dialog = ref(false)
const deleteDialog = ref(false)
const selectedFaq = ref(null)

const form = ref({
  question: '',
  answer: '',
  category: '',
  order: 0
})

onMounted(async () => {
  await loadFaqs()
})

const loadFaqs = async () => {
  try {
    const faqsSnapshot = await getDocs(collection(db, 'faqs'))
    faqs.value = faqsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => a.order - b.order)
  } catch (error) {
    console.error('Error loading FAQs:', error)
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити FAQ',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const openNew = () => {
  selectedFaq.value = null
  form.value = {
    question: '',
    answer: '',
    category: '',
    order: faqs.value.length
  }
  dialog.value = true
}

const editFaq = (faq) => {
  selectedFaq.value = faq
  form.value = { ...faq }
  dialog.value = true
}

const confirmDelete = (faq) => {
  selectedFaq.value = faq
  deleteDialog.value = true
}

const deleteFaq = async () => {
  if (!selectedFaq.value) return

  try {
    await deleteDoc(doc(db, 'faqs', selectedFaq.value.id))
    await loadFaqs()
    deleteDialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: 'FAQ видалено',
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити FAQ',
      life: 3000
    })
  }
}

const saveFaq = async () => {
  try {
    const faqData = {
      ...form.value,
      updatedAt: new Date()
    }

    if (selectedFaq.value) {
      await updateDoc(doc(db, 'faqs', selectedFaq.value.id), faqData)
    } else {
      await addDoc(collection(db, 'faqs'), {
        ...faqData,
        createdAt: new Date()
      })
    }

    await loadFaqs()
    dialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: selectedFaq.value ? 'FAQ оновлено' : 'FAQ створено',
      life: 3000
    })
  } catch (error) {
    console.error('Error saving FAQ:', error)
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти FAQ',
      life: 3000
    })
  }
}
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Керування FAQ</h1>
      <Button
        label="Нове питання"
        icon="pi pi-plus"
        @click="openNew"
      />
    </div>

    <DataTable
      :value="faqs"
      :loading="loading"
      responsiveLayout="scroll"
      class="p-datatable-lg"
    >
      <Column field="question" header="Питання" />
      <Column field="category" header="Категорія" />
      <Column field="order" header="Порядок" />
      <Column header="Дії">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              class="p-button-rounded p-button-success p-button-text"
              @click="editFaq(data)"
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
      :header="selectedFaq ? 'Редагувати FAQ' : 'Нове питання'"
    >
      <div class="grid grid-cols-1 gap-4">
        <div class="field">
          <label for="question">Питання</label>
          <InputText id="question" v-model="form.question" class="w-full" />
        </div>

        <div class="field">
          <label for="answer">Відповідь</label>
          <Editor
            v-model="form.answer"
            editorStyle="height: 320px"
          />
        </div>

        <div class="field">
          <label for="category">Категорія</label>
          <InputText id="category" v-model="form.category" class="w-full" />
        </div>

        <div class="field">
          <label for="order">Порядок</label>
          <InputText id="order" v-model="form.order" type="number" class="w-full" />
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
          @click="saveFaq"
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
        <span>Ви впевнені, що хочете видалити це питання?</span>
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
          @click="deleteFaq"
        />
      </template>
    </Dialog>
  </div>
</template>