<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const cards = [
  { icon: 'pen', title: 'Pisz tak, jak lubisz', text: 'Ręcznie na papierze albo w aplikacji. My dostarczymy list w formie, którą woli Twój korespondent.' },
  { icon: 'lock', title: 'Twój adres jest bezpieczny', text: 'Widzimy go tylko my — nigdy Twój korespondent. Nie pokazujemy też Twojego miasta.' },
  { icon: 'clock', title: 'Listy mają swój czas', text: 'Każdy list idzie 2 dni — jak prawdziwa poczta. To nie czat, tylko czekanie na listonosza.' },
]
</script>

<template>
  <div class="page">
    <ScreenTop back="/" />
    <main class="body" style="gap: 22px">
      <h1 class="h1">Jak działa PenPal?</h1>
      <div v-for="c in cards" :key="c.title" class="card" style="display: flex; gap: 16px; align-items: flex-start; padding: 20px">
        <div class="avatar" style="background: #E7D7B8; color: #1F2A44"><AppIcon :name="c.icon" :size="28" /></div>
        <div style="display: flex; flex-direction: column; gap: 6px">
          <h2 class="h2">{{ c.title }}</h2>
          <p class="p" style="font-size: 17px">{{ c.text }}</p>
        </div>
      </div>
    </main>
    <div class="foot">
      <AppButton to="/rejestracja">Zaczynamy</AppButton>
    </div>
  </div>
</template>
