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
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, deleteField, DocumentData, QuerySnapshot, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase';
import slugify from 'slugify';
import { PrimeIcons } from 'primevue/api';
import Dropdown from 'primevue/dropdown';

interface Service {
  id?: string;
  title: string;
  description: string;
  fullDescription: string;
  image?: string;
  icon?: string;
  features: string[];
  slug?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

interface FormState {
  title: string;
  description: string;
  fullDescription: string;
  image: string;
  icon: string | null;
  features: string;
  slug: string;
}

interface IconOption {
  name: string;
  value: string;
}

const { t: _t } = useI18n()
const toast = useToast();

const services = ref<Service[]>([]);
const loading = ref<boolean>(true);
const dialog = ref<boolean>(false);
const deleteDialog = ref<boolean>(false);
const selectedService = ref<Service | null>(null);
const uploadedFile = ref<File | null>(null);
const src = ref<any>(null);
const primeIconsList = ref<IconOption[]>([]);

const form = ref<FormState>({
  title: '',
  description: '',
  fullDescription: '',
  image: '',
  icon: null,
  features: '',
  slug: '',
});

onMounted(async () => {
  primeIconsList.value = Object.values(PrimeIcons).map(iconName => ({ name: iconName, value: iconName }));
  await loadServices();
});

const loadServices = async () => {
  try {
    const servicesSnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'services'));
    services.value = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      features: (doc.data().features as string[]) || [],
    })) as Service[];
  } catch (error: any) {
    console.error('Error loading services:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося завантажити послуги',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const openNew = () => {
  selectedService.value = null;
  form.value = {
    title: '',
    description: '',
    fullDescription: '',
    image: '',
    icon: null,
    features: '',
    slug: '',
  };
  uploadedFile.value = null;
  src.value = null;
  dialog.value = true;
};

const editService = (service: Service) => {
  selectedService.value = service;
  // @ts-ignore
  form.value = {
    ...service,
    features: Array.isArray(service.features) ? service.features.join('\n') : '',
    icon: service.icon || null,
  };
  uploadedFile.value = null;
  src.value = service.image || null;
  dialog.value = true;
};

const confirmDelete = (service: Service) => {
  selectedService.value = service;
  deleteDialog.value = true;
};

const deleteService = async () => {
  if (!selectedService.value?.id) return;

  try {
    if (selectedService.value.image) {
      const imageRef = storageRef(storage, selectedService.value.image);
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

    await deleteDoc(doc(db, 'services', selectedService.value.id));
    await loadServices();
    deleteDialog.value = false;

    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: 'Послугу видалено',
      life: 3000,
    });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити послугу',
      life: 3000,
    });
  }
};

const deleteImage = async () => {
  if (!selectedService.value?.id || !selectedService.value.image) return;

  try {
    const imageRef = storageRef(storage, selectedService.value.image);
    await deleteObject(imageRef);

    await updateDoc(doc(db, 'services', selectedService.value.id), {
      image: deleteField(),
    });

    form.value.image = '';
    src.value = null;

    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: 'Зображення видалено',
      life: 3000,
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося видалити зображення',
      life: 3000,
    });
  }
};

const saveService = async () => {
  try {
    // @ts-ignore
    const serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> = {
      ...form.value,
      slug: slugify(form.value.title, { lower: true }),
      features: form.value.features.split('\n').filter(f => f.trim()),
    };

    if (uploadedFile.value) {
      const file = uploadedFile.value;
      const imageName = `services/${Date.now()}_${file.name}`;
      const imageRef = storageRef(storage, imageName);
      const snapshot = await uploadBytes(imageRef, file);
      serviceData.image = await getDownloadURL(snapshot.ref);

      if (selectedService.value?.image && selectedService.value.image !== serviceData.image) {
        const prevImageRef = storageRef(storage, selectedService.value.image);
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

    if (selectedService.value?.id) {
      await updateDoc(doc(db, 'services', selectedService.value.id), {
        ...serviceData,
        updatedAt: new Date(),
      });
    } else {
      await addDoc(collection(db, 'services'), {
        ...serviceData,
        createdAt: new Date(),
      });
    }

    await loadServices();
    dialog.value = false;

    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: selectedService.value?.id ? 'Послугу оновлено' : 'Послугу створено',
      life: 3000,
    });
  } catch (error: any) {
    console.error('Error saving service:', error);
    toast.add({
      severity: 'error',
      summary: 'Помилка',
      detail: 'Не вдалося зберегти послугу',
      life: 3000,
    });
  } finally {
    uploadedFile.value = null;
    src.value = null;
  }
};

const onFileSelect = (event: any) => {
  const file: File = event.files[0];
  uploadedFile.value = file;
  const reader = new FileReader();

  reader.onload = (e) => {
    src.value = e.target?.result || null;
  };

  reader.readAsDataURL(file);

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
      <h1 class="text-2xl font-bold">Керування послугами</h1>
      <Button
          label="Нова послуга"
          icon="pi pi-plus"
          @click="openNew"
      />
    </div>

    <DataTable
        :value="services"
        :loading="loading"
        responsiveLayout="scroll"
        class="p-datatable-lg"
    >
      <Column field="title" header="Назва">
        <template #body="{ data }">
          <div class="flex flex-col">
            <span class="font-medium">{{ data.title }}</span>
            <span class="text-sm text-gray-500">{{ data.description }}</span>
          </div>
        </template>
      </Column>
      <Column field="icon" header="Іконка">
        <template #body="{ data }">
          <i v-if="data.icon" :class="['pi', data.icon]" class="text-2xl"></i>
        </template>
      </Column>
      <Column field="features" header="Особливості">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <span
                v-for="feature in data.features"
                :key="feature"
                class="px-2 py-1 bg-gray-100 rounded-full text-sm"
            >
              {{ feature }}
            </span>
          </div>
        </template>
      </Column>
      <Column header="Дії">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success p-button-text"
                @click="editService(data)"
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
        :header="selectedService ? 'Редагувати послугу' : 'Нова послуга'"
    >
      <div class="grid grid-cols-1 gap-4">
        <div class="field">
          <label for="title">Назва</label>
          <InputText id="title" v-model="form.title" class="w-full" />
        </div>

        <div class="field">
          <label for="description">Короткий опис</label>
          <Textarea
              id="description"
              v-model="form.description"
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

        <div class="field my-4">
          <label>Зображення</label>
          <div class="flex flex-col gap-4 items-start justify-start mt-2">
            <FileUpload mode="basic" @select="onFileSelect" customUpload auto severity="secondary" class="p-button-outlined" />
            <img v-if="src || form.image" :src="src || form.image" alt="Image" class="shadow-md rounded-xl w-full sm:w-64" style="filter: grayscale(100%)" />
          </div>
          <Button
              v-if="form.image"
              label="Видалити зображення"
              icon="pi pi-times"
              class="p-button-danger mt-2"
              @click="deleteImage"
          />
        </div>

        <div class="field">
          <label for="icon">Іконка (виберіть з PrimeIcons)</label>
          <Dropdown
              id="icon"
              v-model="form.icon"
              :options="primeIconsList"
              optionLabel="name"
              optionValue="value"
              placeholder="Виберіть іконку"
              class="w-full"
          >
            <template #option="slotProps">
              <div class="flex align-items-center">
                <i :class="['pi', slotProps.option.value]" style="margin-right: 8px;"></i>
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex align-items-center">
                <i :class="['pi', slotProps.value]" style="margin-right: 8px;"></i>
                <span>{{ slotProps.value }}</span>
              </div>
              <span v-else>Виберіть іконку</span>
            </template>
          </Dropdown>
        </div>

        <div class="field">
          <label for="features">Особливості (кожна з нового рядка)</label>
          <Textarea
              id="features"
              v-model="form.features"
              rows="5"
              class="w-full"
          />
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
            @click="saveService"
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
        <span>Ви впевнені, що хочете видалити цю послугу?</span>
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
            @click="deleteService"
        />
      </template>
    </Dialog>
  </div>
</template>