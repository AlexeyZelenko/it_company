<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="bg-gray-900 text-white pt-16 pb-6">
    <div class="container-custom">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <!-- Company Info -->
        <div>
          <h3 class="text-xl font-bold mb-4">IT Компанія</h3>
          <p class="mb-4 text-gray-300">
            Інноваційні IT рішення для вашого бізнесу. Ми допомагаємо компаніям трансформувати свій бізнес за допомогою передових технологій.
          </p>
          <div class="flex space-x-4">
            <a href="#" class="text-gray-300 hover:text-white transition">
              <i class="pi pi-facebook text-xl"></i>
            </a>
            <a href="#" class="text-gray-300 hover:text-white transition">
              <i class="pi pi-twitter text-xl"></i>
            </a>
            <a href="#" class="text-gray-300 hover:text-white transition">
              <i class="pi pi-linkedin text-xl"></i>
            </a>
            <a href="#" class="text-gray-300 hover:text-white transition">
              <i class="pi pi-instagram text-xl"></i>
            </a>
          </div>
        </div>
        
        <!-- Quick Links -->
        <div>
          <h3 class="text-xl font-bold mb-4">{{ t('common.home') }}</h3>
          <ul class="space-y-2">
            <li>
              <router-link to="/" class="text-gray-300 hover:text-white transition">
                {{ t('common.home') }}
              </router-link>
            </li>
            <li>
              <router-link to="/services" class="text-gray-300 hover:text-white transition">
                {{ t('common.services') }}
              </router-link>
            </li>
            <li>
              <router-link to="/blog" class="text-gray-300 hover:text-white transition">
                {{ t('common.blog') }}
              </router-link>
            </li>
            <li>
              <router-link to="/faq" class="text-gray-300 hover:text-white transition">
                {{ t('common.faq') }}
              </router-link>
            </li>
            <li>
              <router-link to="/contacts" class="text-gray-300 hover:text-white transition">
                {{ t('common.contacts') }}
              </router-link>
            </li>
          </ul>
        </div>
        
        <!-- Services -->
        <div>
          <h3 class="text-xl font-bold mb-4">{{ t('common.services') }}</h3>
          <ul class="space-y-2">
            <li>
              <a href="#" class="text-gray-300 hover:text-white transition">Веб-розробка</a>
            </li>
            <li>
              <a href="#" class="text-gray-300 hover:text-white transition">Розробка мобільних додатків</a>
            </li>
            <li>
              <a href="#" class="text-gray-300 hover:text-white transition">Штучний інтелект</a>
            </li>
            <li>
              <a href="#" class="text-gray-300 hover:text-white transition">DevOps</a>
            </li>
            <li>
              <a href="#" class="text-gray-300 hover:text-white transition">Кібербезпека</a>
            </li>
          </ul>
        </div>
        
        <!-- Contact -->
        <div>
          <h3 class="text-xl font-bold mb-4">{{ t('contact.title') }}</h3>
          <ul class="space-y-2">
            <li class="flex items-start space-x-3">
              <i class="pi pi-map-marker mt-1 text-primary-500"></i>
              <span class="text-gray-300">вул. Хрещатик 1, Київ, Україна</span>
            </li>
            <li class="flex items-center space-x-3">
              <i class="pi pi-phone text-primary-500"></i>
              <span class="text-gray-300">+380 44 123 4567</span>
            </li>
            <li class="flex items-center space-x-3">
              <i class="pi pi-envelope text-primary-500"></i>
              <span class="text-gray-300">info@itcompany.ua</span>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Bottom Footer -->
      <div class="border-t border-gray-800 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center">
        <p class="text-gray-400 text-sm">
          {{ t('common.footerCopyright', { year: currentYear }) }}
        </p>
        <div class="flex space-x-4 mt-4 md:mt-0">
          <router-link to="/policy" class="text-gray-400 hover:text-white text-sm transition">
            {{ t('common.policy') }}
          </router-link>
        </div>
      </div>
    </div>
  </footer>
</template>