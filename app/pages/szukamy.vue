<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const { profile, refreshProfile } = useProfile()
if (!profile.value) await refreshProfile()

// Brief "searching" moment after onboarding, then show the proposals. replace: Back from Propozycje won't land here again.
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => { timer = setTimeout(() => navigateTo('/propozycje', { replace: true }), 3000) })
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="page">
    <main class="body" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px; padding: 40px 28px 0; text-align: center">
      <svg width="280" height="180" viewBox="0 0 280 180" fill="none" aria-hidden="true">
        <path d="M30 150 C 80 150, 70 60, 140 70 S 220 30, 250 40" stroke="#A8432A" stroke-width="2.5" stroke-dasharray="6 7" stroke-linecap="round" />
        <circle cx="30" cy="150" r="8" fill="#1F2A44" />
        <g transform="translate(196 14) rotate(12)">
          <rect x="0" y="0" width="74" height="50" rx="5" fill="#FFFDF8" stroke="#1F2A44" stroke-width="2.5" />
          <path d="M2 3 L37 30 L72 3" stroke="#1F2A44" stroke-width="2.5" stroke-linejoin="round" />
        </g>
        <circle cx="120" cy="40" r="3" fill="#CDBF9F" />
        <circle cx="60" cy="90" r="3" fill="#CDBF9F" />
        <circle cx="210" cy="120" r="3" fill="#CDBF9F" />
      </svg>
      <div style="display: flex; flex-direction: column; gap: 12px">
        <h1 class="h1">Szukamy dla Ciebie korespondenta</h1>
        <p class="p">Łączymy osoby z innego pokolenia, które lubią to samo co Ty. Damy Ci znać, gdy kogoś znajdziemy.</p>
      </div>
      <div class="chips" style="justify-content: center">
        <span v-for="i in profile?.interests ?? []" :key="i" class="tag">{{ i }}</span>
      </div>
    </main>
    <div class="foot">
      <AppButton to="/propozycje">Zobacz propozycje</AppButton>
      <AppButton variant="outline" to="/listy">Przejdź do moich listów</AppButton>
      <p class="muted" style="text-align: center">Powiadomimy Cię SMS-em i w aplikacji.</p>
    </div>
  </div>
</template>
