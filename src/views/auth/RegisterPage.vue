<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/firebase'

const { t: _t } = useI18n()
const router = useRouter()
const toast = useToast()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  general: ''
})

const loading = ref(false)

const validateForm = () => {
  let isValid = true
  errors.value = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
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
  
  if (!form.value.password) {
    errors.value.password = 'Пароль обов\'язковий'
    isValid = false
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Пароль має бути не менше 6 символів'
    isValid = false
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Паролі не співпадають'
    isValid = false
  }
  
  return isValid
}

const register = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      form.value.email,
      form.value.password
    )
    
    await updateProfile(user, {
      displayName: form.value.name
    })
    
    router.replace('/')
    
    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: 'Ви успішно зареєструвалися',
      life: 3000
    })
  } catch (error) {
    console.error('Registration error:', error)
    errors.value.general = 'Помилка реєстрації. Можливо, такий email вже існує'
    
    toast.add({
      severity: 'error',
      summary: 'Помилка реєстрації',
      detail: errors.value.general,
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
    <Toast />
    
    <Card class="w-full max-w-md shadow-lg">
      <template #title>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">Реєстрація</h1>
          <p class="mt-2 text-sm text-gray-600">
            Або
            <router-link 
              to="/login" 
              class="font-medium text-primary-600 hover:text-primary-500"
            >
              увійдіть в існуючий акаунт
            </router-link>
          </p>
        </div>
      </template>
      
      <template #content>
        <form @submit.prevent="register" class="space-y-6">
          <div v-if="errors.general" class="p-4 bg-red-50 text-red-700 rounded-md">
            {{ errors.general }}
          </div>
          
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Ім'я
            </label>
            <InputText
              id="name"
              v-model="form.name"
              class="w-full"
              :class="{ 'p-invalid': errors.name }"
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email
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
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <Password
              id="password"
              v-model="form.password"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Підтвердження пароля
            </label>
            <Password
              id="confirmPassword"
              v-model="form.confirmPassword"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.confirmPassword }"
              :feedback="false"
            />
            <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
          </div>
          
          <Button
            type="submit"
            label="Зареєструватися"
            icon="pi pi-user-plus"
            class="w-full"
            :loading="loading"
          />
        </form>
      </template>
    </Card>
  </div>
</template>