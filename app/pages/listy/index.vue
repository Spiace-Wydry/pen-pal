<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { formatLongDay, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'default' })
const { profile, refreshProfile } = useProfile()
if (!profile.value) await refreshProfile()
const { data: pairings } = await useFetch<PairingView[]>('/api/pairings')

const active = computed(() => (pairings.value ?? []).filter(p => p.status === 'ACTIVE'))
const invites = computed(() => (pairings.value ?? []).filter(p => p.status === 'INVITED' && p.inviterId !== profile.value?.id))
const limit = computed(() => profile.value?.limit ?? 3)
const today = formatLongDay(new Date().toISOString())
const ORDINAL = ['pierwszego', 'drugiego', 'trzeciego', 'czwartego', 'piątego']
</script>

<template>
  <div class="page">
    <header style="padding: 32px 20px 8px; display: flex; flex-direction: column; gap: 4px">
      <div class="muted">{{ today }}</div>
      <h1 class="h1">Dzień dobry, {{ profile?.name }}</h1>
    </header>
    <main class="body" style="gap: 14px; padding-top: 12px">
      <div class="row" style="justify-content: space-between">
        <h2 class="h2">Moi korespondenci</h2>
        <div class="muted" style="font-weight: 700">{{ active.length }} z {{ limit }}</div>
      </div>

      <NuxtLink v-for="p in invites" :key="p.id" :to="`/zaproszenia/${p.id}`" class="card row" style="border: 2px solid #A8432A">
        <div class="avatar" aria-hidden="true">{{ initial(p.partner.name) }}</div>
        <div style="flex: 1">
          <div class="h2" style="font-size: 20px">{{ p.partner.name }}</div>
          <div style="color: #A8432A; font-weight: 700">{{ p.partner.name }} chce z Tobą korespondować</div>
        </div>
        <AppIcon name="chevron" :stroke-width="2.2" style="color: #5E667A" />
      </NuxtLink>

      <PenPalCard v-for="p in active" :key="p.id" :pairing="p" />

      <NuxtLink v-if="active.length < limit" to="/propozycje" class="card" style="display: flex; align-items: center; gap: 14px; background: transparent; border: 2px dashed #CDBF9F">
        <div class="avatar" style="background: transparent; border: 2px dashed #CDBF9F"><AppIcon name="plus" :size="24" :stroke-width="2.2" style="color: #1F2A44" /></div>
        <div>
          <div style="font-weight: 700; font-size: 17px">Wolne miejsce</div>
          <div class="muted">Znajdź {{ ORDINAL[active.length] }} korespondenta</div>
        </div>
      </NuxtLink>

      <p v-if="!profile?.isPremium" class="muted" style="text-align: center">Chcesz pisać z większą liczbą osób? <NuxtLink to="/profil" style="font-weight: 700">PenPal Premium</NuxtLink></p>
    </main>
  </div>
</template>
