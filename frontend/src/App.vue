<script setup lang="ts">
import DiceDiv from './components/Common/DiceDiv.vue'
import ToastContainer from './components/Common/ToastContainer.vue'
</script>

<template>
  <DiceDiv />
  <ToastContainer />
  <router-view />
</template>
