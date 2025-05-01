<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const form = ref({
  email: '',
  password: ''
})

const errors = ref({
  email: '',
  password: '',
  general: ''
})

const loading = ref(false)

const validateForm = () => {
  let isValid = true
  errors.value.email = ''
  errors.value.password = ''
  errors.value.general = ''
  
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
  }
  
  return isValid
}

const login = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    await signInWithEmailAndPassword(auth, form.value.email, form.value.password)
    
    const redirectPath = route.query.redirect?.toString() || '/'
    router.replace(redirectPath)
    
    toast.add({
      severity: 'success',
      summary: 'Успіх',
      detail: 'Ви успішно увійшли',
      life: 3000
    })
  } catch (error) {
    console.error('Login error:', error)
    errors.value.general = 'Невірний email або пароль'
    
    toast.add({
      severity: 'error',
      summary: 'Помилка входу',
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
          <h1 class="text-2xl font-bold text-gray-900">Вхід</h1>
          <p class="mt-2 text-sm text-gray-600">
            Або
            <router-link 
              to="/register" 
              class="font-medium text-primary-600 hover:text-primary-500"
            >
              створіть новий акаунт
            </router-link>
          </p>
        </div>
      </template>
      
      <template #content>
        <form @submit.prevent="login" class="space-y-6">
          <div v-if="errors.general" class="p-4 bg-red-50 text-red-700 rounded-md">
            {{ errors.general }}
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
              :feedback="false"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              >
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                Запам'ятати мене
              </label>
            </div>
            
            <div class="text-sm">
              <a href="#" class="font-medium text-primary-600 hover:text-primary-500">
                Забули пароль?
              </a>
            </div>
          </div>
          
          <Button
            type="submit"
            label="Увійти"
            icon="pi pi-sign-in"
            class="w-full"
            :loading="loading"
          />
        </form>
      </template>
    </Card>
  </div>
</template>