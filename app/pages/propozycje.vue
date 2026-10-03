<script setup lang="ts">
import type { MatchesResponse } from '#shared/types/api'
import { ageLabel, channelLabel, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const { data, error: loadError } = await useFetch<MatchesResponse>('/api/matches')
const error = ref('')
const busy = ref('')
const avatarBg = ['', '#D9E0D0', '#E9D3CC']

async function invite(userId: string) {
  error.value = ''
  busy.value = userId
  try {
    const { id } = await $fetch<{ id: string }>('/api/pairings', { method: 'POST', body: { userId } })
    await navigateTo(`/korespondenci/${id}/nowy`)
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = '' }
}
</script>

<template>
  <div class="page">
    <ScreenTop back="/szukamy" title="Propozycje" />
    <main class="body" style="gap: 14px">
      <template v-if="data?.full">
        <InfoNote icon="info">Masz już {{ data.limit }} korespondentów. Zakończ jedną znajomość, aby poznać kogoś nowego.</InfoNote>
        <AppButton to="/listy">Przejdź do moich listów</AppButton>
      </template>
      <template v-else-if="data?.matches.length">
        <div style="display: flex; flex-direction: column; gap: 4px">
          <h1 class="h1" style="font-size: 28px">Znaleźliśmy kogoś dla Ciebie!</h1>
          <p class="muted">Zaproś jedną osobę do korespondencji.</p>
        </div>
        <article v-for="(m, n) in data.matches" :key="m.profile.id" class="card" style="display: flex; flex-direction: column; gap: 10px">
          <div class="row">
            <div class="avatar" :style="avatarBg[n % 3] ? { background: avatarBg[n % 3] } : undefined" aria-hidden="true">{{ initial(m.profile.name) }}</div>
            <div style="flex: 1">
              <h2 class="h2" style="font-size: 20px">{{ m.profile.name }}</h2>
              <div class="muted">{{ ageLabel(m.profile.ageRange) }} · {{ channelLabel(m.profile.channel) }}</div>
            </div>
          </div>
          <p class="p" style="font-size: 16px">{{ m.profile.bio }}</p>
          <div class="row" style="justify-content: space-between">
            <div class="chips" style="gap: 6px" aria-label="Wspólne zainteresowania"><span v-for="i in m.sharedInterests" :key="i" class="tag">{{ i }}</span></div>
            <AppButton :disabled="!!busy" style="width: auto; min-height: 48px; padding: 0 18px; font-size: 16px" @click="invite(m.profile.id)">Zaproś</AppButton>
          </div>
        </article>
      </template>
      <template v-else>
        <h1 class="h1">Szukamy dla Ciebie korespondenta</h1>
        <p class="p">Damy Ci znać, gdy kogoś znajdziemy.</p>
      </template>
      <p v-if="error || loadError" class="error" role="alert">{{ error || errorText(loadError) }}</p>
    </main>
  </div>
</template>
