<script setup lang="ts">
import type { PointView } from '#shared/types/api'

definePageMeta({ layout: 'plain' })
const pointId = useRoute().params.pointId as string
const { data: p, error } = await useFetch<PointView>(`/api/points/${pointId}`)
const here = useState<[number, number] | null>('here', () => null)
const dist = computed(() => p.value ? formatDistance(distanceM(here.value ?? KRAKOW, [p.value.lat, p.value.lng])) : '')
const open = computed(() => p.value ? isOpenNow(p.value.hours) : false)
const services = computed(() => !p.value ? [] : [
  p.value.canSend && 'Nadasz list do korespondenta',
  p.value.canCollect && 'Odbierzesz wydrukowany list',
  p.value.type === 'PALPOINT' && 'Pomożemy założyć konto',
  p.value.type === 'PALPOINT' && 'Weźmiesz koperty z PalKodem',
].filter((s): s is string => !!s))
const directions = computed(() => p.value ? `https://www.google.com/maps/dir/?api=1&destination=${p.value.lat},${p.value.lng}` : '')
</script>

<template>
  <div class="page">
    <ScreenTop back="/mapa" />
    <main v-if="p" class="body" style="gap: 18px">
      <div style="display: flex; flex-direction: column; gap: 10px">
        <span class="tag" style="align-self: flex-start; background: #1F2A44; color: #FFFDF8; font-weight: 700">{{ p.type === 'PALPOINT' ? 'PalPoint' : 'PalBox' }}</span>
        <h1 class="h1" style="font-size: 30px">{{ p.name }}</h1>
        <p class="p">{{ p.address }} · {{ dist }}</p>
      </div>
      <div class="card" style="display: flex; flex-direction: column; gap: 10px">
        <div class="label">Co tu załatwisz</div>
        <div v-for="s in services" :key="s" class="row" style="font-size: 17px">
          <AppIcon name="check" :stroke-width="2.4" style="color: #2F6B45" />{{ s }}
        </div>
      </div>
      <div class="card" style="display: flex; flex-direction: column; gap: 8px">
        <div class="row" style="justify-content: space-between">
          <span class="label">Godziny otwarcia</span>
          <!-- 'Zamknięte' = (new copy) -->
          <span :style="{ color: open ? '#2F6B45' : '#8C3520', fontWeight: 700, fontSize: '15px' }">{{ open ? 'Otwarte teraz' : 'Zamknięte' }}</span>
        </div>
        <div v-for="r in hoursRows(p.hours)" :key="r.label" class="row" :style="{ justifyContent: 'space-between', fontSize: '17px', color: r.value === 'zamknięte' ? '#5E667A' : undefined }">
          <span>{{ r.label }}</span><span>{{ r.value }}</span>
        </div>
      </div>
      <p v-if="p.pickupNote" class="muted">{{ p.pickupNote }}</p>
    </main>
    <p v-else-if="error" class="error" role="alert" style="padding: 20px">{{ errorText(error) }}</p>
    <div v-if="p" class="foot">
      <a class="btn" :href="directions" target="_blank" rel="noopener"><AppIcon name="navigate" :stroke-width="2.2" />Prowadź</a>
      <a v-if="p.phone" class="btn2" :href="`tel:${p.phone}`"><AppIcon name="phone" :stroke-width="2.2" />Zadzwoń</a>
    </div>
  </div>
</template>
