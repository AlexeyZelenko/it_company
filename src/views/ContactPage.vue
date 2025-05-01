<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const { t } = useI18n()
const toast = useToast()

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const errors = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const loading = ref(false)

const validateForm = () => {
  let isValid = true
  errors.value = {
    name: '',
    email: '',
    subject: '',
    message: ''
  }

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

  if (!form.value.subject.trim()) {
    errors.value.subject = 'Тема обов\'язкова'
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
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(form.value)
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    toast.add({
      severity: 'success',
      summary: t('contact.form.success'),
      life: 3000
    })

    // Reset form
    form.value = {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  } catch (error) {
    console.error('Error sending message:', error)
    toast.add({
      severity: 'error',
      summary: t('contact.form.error'),
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="py-16 bg-gray-50">
    <div class="container-custom">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          {{ t('contact.title') }}
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ t('contact.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Contact Information -->
        <div>
          <Card>
            <template #content>
              <div class="space-y-6">
                <div class="flex items-start space-x-4">
                  <div class="bg-primary-100 p-3 rounded-full flex items-center py-3 px-4">
                    <i class="pi pi-map-marker text-primary-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold mb-2">{{ t('contact.address') }}</h3>
                    <p class="text-gray-600">вул. Хрещатик 1, Київ, Україна</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="bg-primary-100 p-3 rounded-full flex items-center py-3 px-4">
                    <i class="pi pi-phone text-primary-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold mb-2">{{ t('contact.phone') }}</h3>
                    <p class="text-gray-600">+380 44 123 4567</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="bg-primary-100 p-3 rounded-full flex items-center py-3 px-4">
                    <i class="pi pi-envelope text-primary-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold mb-2">{{ t('contact.email') }}</h3>
                    <p class="text-gray-600">info@itcompany.ua</p>
                  </div>
                </div>

                <div class="pt-6">
                  <h3 class="text-lg font-semibold mb-4">Соціальні мережі</h3>
                  <div class="flex space-x-4">
                    <a href="#" class="bg-primary-100 rounded-full hover:bg-primary-200 transition flex items-center py-4 px-4">
                      <i class="pi pi-facebook text-primary-600"></i>
                    </a>
                    <a href="#" class="bg-primary-100 p-2 rounded-full hover:bg-primary-200 transition flex items-center py-4 px-4">
                      <i class="pi pi-twitter text-primary-600"></i>
                    </a>
                    <a href="#" class="bg-primary-100 p-3 rounded-full hover:bg-primary-200 transition flex items-center py-4 px-4">
                      <i class="pi pi-linkedin text-primary-600"></i>
                    </a>
                    <a href="#" class="bg-primary-100 p-3 rounded-full hover:bg-primary-200 transition flex items-center py-4 px-4">
                      <i class="pi pi-instagram text-primary-600"></i>
                    </a>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Contact Form -->
        <div>
          <Card>
            <template #content>
              <form @submit.prevent="submitForm" class="space-y-6">
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t('contact.form.name') }} *
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

                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t('contact.form.email') }} *
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

                <div>
                  <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t('contact.form.subject') }} *
                  </label>
                  <InputText
                    id="subject"
                    v-model="form.subject"
                    type="text"
                    class="w-full"
                    :class="{ 'p-invalid': errors.subject }"
                  />
                  <small v-if="errors.subject" class="p-error">{{ errors.subject }}</small>
                </div>

                <div>
                  <label for="message" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t('contact.form.message') }} *
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
                  rounded
                  :label="t('contact.form.submit')"
                  icon="pi pi-send"
                  :loading="loading"
                />
              </form>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>