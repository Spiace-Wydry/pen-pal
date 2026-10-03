<script setup lang="ts">
import type { PointView } from '#shared/types/api'

definePageMeta({ layout: 'default' })
const { data: points } = await useFetch<PointView[]>('/api/points', { default: () => [] })

const here = useState<[number, number] | null>('here', () => null)
const center = ref<[number, number]>(here.value ?? KRAKOW)
const zoom = ref(13)
const query = ref('')
const send = ref(true)
const collect = ref(false)
const openNow = ref(false)
const selectedId = ref<string | null>(null)
const locating = ref(false)
const locError = ref('')

const ref0 = computed(() => here.value ?? KRAKOW)
const visible = computed(() => points.value
  .filter(p => (!send.value || p.canSend) && (!collect.value || p.canCollect) && (!openNow.value || isOpenNow(p.hours)))
  .filter(p => !query.value || `${p.name} ${p.address}`.toLocaleLowerCase('pl').includes(query.value.toLocaleLowerCase('pl')))
  .map(p => ({ ...p, dist: distanceM(ref0.value, [p.lat, p.lng]) }))
  .sort((a, b) => a.dist - b.dist))
const shown = computed(() => visible.value.find(p => p.id === selectedId.value) ?? visible.value[0])

const typeLabel = (t: PointView['type']) => t === 'PALPOINT' ? 'PalPoint' : 'PalBox'
const statusText = (p: PointView) => {
  if (p.type === 'PALBOX') return p.pickupNote ?? ''
  const close = closesAt(p.hours)
  return isOpenNow(p.hours) && close ? `otwarte do ${close}` : 'zamknięte' // 'zamknięte' = (new copy)
}

function locate() {
  locError.value = ''
  if (!navigator.geolocation) { locError.value = 'Twoja przeglądarka nie udostępnia lokalizacji.'; return } // (new copy)
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      here.value = [pos.coords.latitude, pos.coords.longitude]
      center.value = here.value
      zoom.value = 15
      selectedId.value = null
      locating.value = false
    },
    () => { locError.value = 'Nie udało się ustalić Twojej lokalizacji.'; locating.value = false }, // (new copy)
    { enableHighAccuracy: true, timeout: 10000 },
  )
}
</script>

<template>
  <div class="page" style="position: relative; min-height: calc(100dvh - 84px); overflow: hidden">
    <ClientOnly>
      <LMap
        v-model:center="center" v-model:zoom="zoom" :use-global-leaflet="false"
        style="position: absolute; inset: 0; z-index: 0" :options="{ zoomControl: false }"
      >
        <LTileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
          layer-type="base" name="OpenStreetMap"
        />
        <LMarker
          v-for="p in visible" :key="p.id" :lat-lng="[p.lat, p.lng]"
          :options="{ title: p.name, alt: `${p.name}, ${typeLabel(p.type)}`, keyboard: true }"
          @click="selectedId = p.id"
        >
          <LIcon v-if="p.type === 'PALPOINT'" :icon-size="[44, 52]" :icon-anchor="[22, 51]" class-name="">
            <svg width="44" height="52" viewBox="0 0 44 52"><path d="M22 51s-18-15-18-29a18 18 0 0 1 36 0c0 14-18 29-18 29z" fill="#1F2A44" stroke="#FFFDF8" stroke-width="2.5" /><rect x="12" y="15" width="20" height="14" rx="2" fill="none" stroke="#FFFDF8" stroke-width="2" /><path d="M12 17l10 7 10-7" fill="none" stroke="#FFFDF8" stroke-width="2" /></svg>
          </LIcon>
          <LIcon v-else :icon-size="[40, 48]" :icon-anchor="[20, 47]" class-name="">
            <svg width="40" height="48" viewBox="0 0 40 48"><path d="M20 47l-6-9H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4h-8z" fill="#A8432A" stroke="#FFFDF8" stroke-width="2.5" /><rect x="11" y="12" width="18" height="14" rx="2" fill="none" stroke="#FFFDF8" stroke-width="2" /><path d="M14 19h12" stroke="#FFFDF8" stroke-width="2" /></svg>
          </LIcon>
        </LMarker>
        <LCircleMarker v-if="here" :lat-lng="here" :radius="10" color="#FFFDF8" :weight="3" fill-color="#2F64B5" :fill-opacity="1" />
      </LMap>
    </ClientOnly>

    <div style="position: absolute; left: 16px; right: 16px; top: 24px; display: flex; flex-direction: column; gap: 10px; z-index: 500">
      <label style="display: flex; align-items: center; gap: 10px; background: #FFFDF8; border-radius: 14px; padding: 0 14px; min-height: 54px; box-shadow: 0 2px 8px rgba(31,42,68,0.12)">
        <AppIcon name="search" :stroke-width="2.2" style="color: #5E667A" />
        <input v-model="query" type="search" placeholder="Szukaj w Krakowie" aria-label="Szukaj w Krakowie" style="border: none; background: transparent; font-size: 18px; font-family: inherit; color: #1F2A44; flex: 1; outline: none">
      </label>
      <div class="chips" style="gap: 8px">
        <button type="button" class="chip" :class="{ 'chip-on': send }" :aria-pressed="send" @click="send = !send">Wyślij</button>
        <button type="button" class="chip" :class="{ 'chip-on': collect }" :aria-pressed="collect" @click="collect = !collect">Odbierz</button>
        <button type="button" class="chip" :class="{ 'chip-on': openNow }" :aria-pressed="openNow" @click="openNow = !openNow">Otwarte teraz</button>
      </div>
    </div>

    <div style="position: absolute; right: 16px; bottom: 200px; display: flex; flex-direction: column; gap: 8px; z-index: 500">
      <button type="button" class="back" aria-label="Najbliżej mnie" :disabled="locating" style="cursor: pointer; width: 54px; height: 54px; border-radius: 27px; background: #FFFDF8" @click="locate">
        <AppIcon name="locate" :size="24" :stroke-width="2.2" />
      </button>
    </div>

    <div style="position: absolute; left: 12px; right: 12px; bottom: 12px; background: #FFFDF8; border-radius: 18px; padding: 16px; box-shadow: 0 4px 16px rgba(31,42,68,0.16); display: flex; flex-direction: column; gap: 12px; z-index: 500">
      <div class="row" style="gap: 16px; font-size: 14px; flex-wrap: wrap">
        <span class="row" style="gap: 6px"><span style="width: 14px; height: 14px; border-radius: 7px; background: #1F2A44" />PalPoint · wyślij i odbierz</span>
        <span class="row" style="gap: 6px"><span style="width: 14px; height: 14px; border-radius: 3px; background: #A8432A" />PalBox · wyślij</span>
      </div>
      <div class="divider" />
      <NuxtLink v-if="shown" :to="`/mapa/${shown.id}`" class="row" style="text-decoration: none; color: #1F2A44; min-height: 48px">
        <div style="flex: 1">
          <div style="font-weight: 700; font-size: 18px">{{ shown.name }}</div>
          <div class="muted">{{ typeLabel(shown.type) }} · {{ formatDistance(shown.dist) }} · {{ statusText(shown) }}</div>
        </div>
        <AppIcon name="chevron" :stroke-width="2.2" style="color: #5E667A" />
      </NuxtLink>
      <!-- (new copy) -->
      <p v-else class="muted">Brak punktów dla wybranych filtrów.</p>
      <p v-if="locError" class="error" role="alert">{{ locError }}</p>
    </div>
  </div>
</template>
