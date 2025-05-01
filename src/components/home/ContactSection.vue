<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'

const { t } = useI18n()
const toast = useToast()

const form = ref({
  name: '',
  email: '',
  message: ''
})

const errors = ref({
  name: '',
  email: '',
  message: ''
})

const loading = ref(false)

const validateForm = () => {
  let isValid = true
  errors.value.name = ''
  errors.value.email = ''
  errors.value.message = ''
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Ім\'я обов\'язкове'
    isValid = false
  }
  
  if (!form.value.email.trim()) {
    errors.value.email = 'Email обов\'язковий'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Введіть коректний email'
    isValid = false
  }
  
  if (!form.value.message.trim()) {
    errors.value.message = 'Повідомлення обов\'язкове'
    isValid = false
  }
  
  return isValid
}

const submitForm = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    // Save message to Firebase
    await addDoc(collection(db, 'messages'), {
      ...form.value,
      createdAt: serverTimestamp(),
      status: 'new'
    })
    
    // Reset form
    form.value.name = ''
    form.value.email = ''
    form.value.message = ''
    
    // Show success message
    toast.add({
      severity: 'success',
      summary: t('home.contact.success'),
      life: 3000
    })
  } catch (error) {
    console.error('Error submitting form:', error)
    toast.add({
      severity: 'error',
      summary: t('home.contact.error'),
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="py-16 bg-primary-50">
    <Toast />
    <div class="container-custom">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
          {{ t('home.contact.title') }}
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ t('home.contact.subtitle') }}
        </p>
      </div>
      
      <div class="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8">
        <form @submit.prevent="submitForm">
          <div class="mb-6">
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('home.contact.name') }} *
            </label>
            <InputText
              id="name"
              v-model="form.name"
              type="text"
              class="w-full"
              :class="{ 'p-invalid': errors.name }"
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>
          
          <div class="mb-6">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('home.contact.email') }} *
            </label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>
          
          <div class="mb-6">
            <label for="message" class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('home.contact.message') }} *
            </label>
            <Textarea
              id="message"
              v-model="form.message"
              rows="5"
              class="w-full"
              :class="{ 'p-invalid': errors.message }"
            />
            <small v-if="errors.message" class="p-error">{{ errors.message }}</small>
          </div>
          
          <Button
            type="submit"
            :label="t('home.contact.submit')"
            icon="pi pi-send"
            iconPos="right"
            class="w-full"
            :loading="loading"
          />
        </form>
      </div>
    </div>
  </section>
</template>