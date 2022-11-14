<script setup lang="ts">
defineProps({
  content: String,
  icon: String,
  title: String,
});
</script>

<template>
  <div class="card">
    <div class="card-wrap">
      <div><img class="icon" :src="icon" /></div>
      <div class="card-content-center">
        <h2 class="card-content-center-title">{{ title }}</h2>
        <h1 class="card-content-center-info">{{ content }}</h1>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: #fbfbfb;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.card-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
}

.card-content-center {
  text-align: center;
}

.card-content-center-title {
  font-size: 16px;
  font-weight: lighter;
  margin: 10px 0px;
}

.card-content-center-info {
  font-size: 32px;
  font-weight: 600;
  margin: 10px 0px;
}

.icon {
  width: 80px;
}
</style>
