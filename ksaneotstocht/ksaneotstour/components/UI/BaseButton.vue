<template>
  <button
    :type="type"
    :disabled="disabled"
    px="4" py="2" rounded font-semibold
    focus:outline="none" focus:ring="2 offset-2 offset-gray-800"
    :class="[{ 'opacity-50 cursor-not-allowed': disabled }, sizeClasses]"
    v-bind="variantClasses"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
});

// Gebruik objecten voor Attributify classes
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return { bg: 'brand-yellow', text: 'gray-900', hover: 'bg-yellow-400', focus: 'ring-brand-yellow' };
    case 'secondary':
      return { bg: 'gray-600', text: 'gray-200', hover: 'bg-gray-500', focus: 'ring-gray-500' };
    case 'danger':
      return { bg: 'red-600', text: 'white', hover: 'bg-red-700', focus: 'ring-red-500' };
    default:
      return { bg: 'brand-yellow', text: 'gray-900', hover: 'bg-yellow-400', focus: 'ring-brand-yellow' };
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs px-2.5 py-1.5';
    case 'lg':
      return 'text-lg px-5 py-2.5';
    case 'md':
    default:
      return 'text-sm px-4 py-2';
  }
});
</script>