<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Editor from 'primevue/editor';
import FileUpload from 'primevue/fileupload';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, DocumentData, QuerySnapshot, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase';
import slugify from 'slugify';

interface Project {
  id?: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  technologies: string;
  client: string;
  duration: string;
  link: string;
  category: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  formattedDate?: string;
  slug?: string;
  viewCount?: number;
}

interface FormState {
  title: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  technologies: string;
  client: string;
  duration: string;
  link: string;
  category: string;
}

const { t: _t } = useI18n()
const toast = useToast();

const projects = ref<Project[]>([]);
const loading = ref<boolean>(true);
const dialog = ref<boolean>(false);
const deleteDialog = ref<boolean>(false);
const selectedProject = ref<Project | null>(null);
const uploadedFile = ref<File | null>(null);

const form = ref<FormState>({
  title: '',
  shortDescription: '',
  fullDescription: '',
  image: '',
  technologies: '',
  client: '',
  duration: '',
  link: '',
  category: '',
});

onMounted(async () => {
  await loadProjects();
});

const loadProjects = async () => {
  try {
    const projectsSnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'projects'));
    projects.value = projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        formattedDate: (data.createdAt as Timestamp)?.toDate().toLocaleDateString(),
      } as Project;
    });
  } catch (error: any) {
    console.error('Error loading projects:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити проекти',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const openNew = () => {
  selectedProject.value = null;
  form.value = {
    title: '',
    shortDescription: '',
    fullDescription: '',
    image: '',
    technologies: '',
    client: '',
    duration: '',
    link: '',
    category: '',
  };
  uploadedFile.value = null;
  dialog.value = true;
};

const editProject = (project: Project) => {
  selectedProject.value = project;
  form.value = { ...project };
  uploadedFile.value = null;
  dialog.value = true;
};

const confirmDelete = (project: Project) => {
  selectedProject.value = project;
  deleteDialog.value = true;
};

const deleteProject = async () => {
  if (!selectedProject.value?.id) return;

  try {
    if (selectedProject.value.image) {
      const imageRef = storageRef(storage, selectedProject.value.image);
      await deleteObject(imageRef).catch(error => {
        console.error('Error deleting image from storage:', error);
        toast.add({
          severity: 'warn',
          summary: 'Попередження',
          detail: 'Не вдалося видалити зображення зі сховища',
          life: 3000,
        });
      });
    }

    await deleteDoc(doc(db, 'projects', selectedProject.value.id));
    await loadProjects();
    deleteDialog.value = false;

    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: 'Проект видалено',
      life: 3000,
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити проект',
      life: 3000,
    });
  }
};

const saveProject = async () => {
  try {
    const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'formattedDate' | 'viewCount' > = {
      ...form.value,
      slug: slugify(form.value.title, { lower: true }),
    };

    if (uploadedFile.value) {
      const file = uploadedFile.value;
      const imageName = `projects/${Date.now()}_${file.name}`;
      const imageRef = storageRef(storage, imageName);
      const snapshot = await uploadBytes(imageRef, file);
      projectData.image = await getDownloadURL(snapshot.ref);

      if (selectedProject.value?.image && selectedProject.value.image !== projectData.image) {
        const prevImageRef = storageRef(storage, selectedProject.value.image);
        await deleteObject(prevImageRef).catch(error => {
          console.error('Error deleting previous image:', error);
          toast.add({
            severity: 'warn',
            summary: 'Попередження',
            detail: 'Не вдалося видалити попереднє зображення зі сховища',
            life: 3000,
          });
        });
      }
    }

    if (selectedProject.value?.id) {
      await updateDoc(doc(db, 'projects', selectedProject.value.id), {
        ...projectData,
        updatedAt: new Date(),
      });
    } else {
      await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: new Date(),
        viewCount: 0,
      });
    }

    await loadProjects();
    dialog.value = false;

    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: selectedProject.value?.id ? 'Проект оновлено' : 'Проект створено',
      life: 3000,
    });
  } catch (error: any) {
    console.error('Error saving project:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти проект',
      life: 3000,
    });
  } finally {
    uploadedFile.value = null;
  }
};

const onUpload = (event: any) => {
  const file: File = event.files[0];
  uploadedFile.value = file;
  toast.add({
    severity: 'success',
    summary: 'Успіх',
    detail: 'Зображення готове до завантаження',
    life: 3000,
  });
};
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Керування проектами</h1>
      <Button
          label="Новий проект"
          icon="pi pi-plus"
          @click="openNew"
      />
    </div>

    <DataTable
        :value="projects"
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
      <Column field="client" header="Клієнт" />
      <Column field="category" header="Категорія" />
      <Column field="formattedDate" header="Дата створення" sortable />
      <Column header="Дії">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success p-button-text"
                @click="editProject(data)"
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
        :header="selectedProject ? 'Редагувати проект' : 'Новий проект'"
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
          <label for="fullDescription">Повний опис</label>
          <Editor
              v-model="form.fullDescription"
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
            <FileUpload
                mode="basic"
                :auto="false"
                accept="image/*"
                :maxFileSize="1000000"
                @upload="onUpload"
                label="Вибрати зображення"
            />
          </div>
        </div>

        <div class="field">
          <label for="technologies">Технології</label>
          <InputText id="technologies" v-model="form.technologies" class="w-full" />
        </div>

        <div class="field">
          <label for="client">Клієнт</label>
          <InputText id="client" v-model="form.client" class="w-full" />
        </div>

        <div class="field">
          <label for="duration">Тривалість проекту</label>
          <InputText id="duration" v-model="form.duration" class="w-full" />
        </div>

        <div class="field">
          <label for="link">Посилання на проект</label>
          <InputText id="link" v-model="form.link" class="w-full" />
        </div>

        <div class="field">
          <label for="category">Категорія</label>
          <InputText id="category" v-model="form.category" class="w-full" />
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
            @click="saveProject"
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
        <span>Ви впевнені, що хочете видалити цей проект?</span>
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
            @click="deleteProject"
        />
      </template>
    </Dialog>
  </div>
</template>