<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Editor from 'primevue/editor';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

interface Faq {
  id?: string;
  question: string;
  answer: string;
  category: string;
  order: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FormState {
  question: string;
  answer: string;
  category: string;
  order: any;
}

const { t: _t } = useI18n()
const toast = useToast();

const faqs = ref<Faq[]>([]);
const loading = ref<boolean>(true);
const dialog = ref<boolean>(false);
const deleteDialog = ref<boolean>(false);
const selectedFaq = ref<Faq | null>(null);

const form = ref<FormState>({
  question: '',
  answer: '',
  category: '',
  order: 0
});

onMounted(async () => {
  await loadFaqs();
});

const loadFaqs = async () => {
  try {
    const faqsSnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'faqs'));
    faqs.value = faqsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Faq[];
    faqs.value.sort((a, b) => a.order - b.order);
  } catch (error: any) {
    console.error('Error loading FAQs:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити FAQ',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const openNew = () => {
  selectedFaq.value = null;
  form.value = {
    question: '',
    answer: '',
    category: '',
    order: faqs.value.length,
  };
  dialog.value = true;
};

const editFaq = (faq: Faq) => {
  selectedFaq.value = faq;
  form.value = { ...faq };
  dialog.value = true;
};

const confirmDelete = (faq: Faq) => {
  selectedFaq.value = faq;
  deleteDialog.value = true;
};

const deleteFaq = async () => {
  if (!selectedFaq.value?.id) return;

  try {
    await deleteDoc(doc(db, 'faqs', selectedFaq.value.id));
    await loadFaqs();
    deleteDialog.value = false;

    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: 'FAQ видалено',
      life: 3000,
    });
  } catch (error: any) {
    console.error('Error deleting FAQ:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити FAQ',
      life: 3000,
    });
  }
};

const saveFaq = async () => {
  try {
    const faqData: Omit<Faq, 'id' | 'createdAt' | 'updatedAt'> = {
      ...form.value,
      order: form.value.order !== null ? form.value.order : 0,
    };

    if (selectedFaq.value?.id) {
      await updateDoc(doc(db, 'faqs', selectedFaq.value.id), {
        ...faqData,
        updatedAt: new Date(),
      });
    } else {
      await addDoc(collection(db, 'faqs'), {
        ...faqData,
        createdAt: new Date(),
      });
    }

    await loadFaqs();
    dialog.value = false;

    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: selectedFaq.value?.id ? 'FAQ оновлено' : 'FAQ створено',
      life: 3000,
    });
  } catch (error: any) {
    console.error('Error saving FAQ:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти FAQ',
      life: 3000,
    });
  }
};
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
      <Column field="order" header="Порядок" sortable />
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
          <InputText id="order" v-model.number="form.order" type="number" class="w-full" />
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