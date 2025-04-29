<template>
    <div class="flex items-center justify-center min-h-screen">
      <AdminLoginForm />
    </div>
</template>
  
<script setup lang="ts">
  import AdminLoginForm from '~/components/admin/LoginForm.vue';
  
  // Deze pagina gebruikt ook de default layout
  definePageMeta({
    layout: 'default', // Of maak een specifieke 'login' layout
  });
  
  useHead({
    title: 'Admin Login',
  })
</script>
<style scoped>
h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
}
h2 {
  font-family: 'Poppins', sans-serif;
}
a {
  font-family: 'Poppins', sans-serif;
}
p {
  font-family: 'Poppins', sans-serif;
}
</style>