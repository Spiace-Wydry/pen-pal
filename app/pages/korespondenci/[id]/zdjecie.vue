<script setup lang="ts">
import type { PairingView } from '#shared/types/api'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p, error } = await useFetch<PairingView>(`/api/pairings/${id}`)
if (p.value && !p.value.canWrite) await navigateTo(`/korespondenci/${id}`, { replace: true })

const { draft } = useLetterDraft(id)
const input = ref<HTMLInputElement>()
const urls = computed(() => import.meta.client ? draft.value.pages.map(f => URL.createObjectURL(f)) : [])
watch(urls, (_, old) => old?.forEach(u => URL.revokeObjectURL(u)))

function add(e: Event) {
  const el = e.target as HTMLInputElement
  draft.value.pages = [...draft.value.pages, ...Array.from(el.files ?? [])].slice(0, 10)
  el.value = ''
}
function remove(i: number) {
  draft.value.pages = draft.value.pages.filter((_, j) => j !== i)
}
function next() {
  draft.value.mode = 'SCAN'
  return navigateTo(`/korespondenci/${id}/wyslij`)
}
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop :back="`/korespondenci/${id}`" title="Dodaj zdjęcie listu" :subtitle="`Do: ${p.partner.name}`" />
    <main class="body" style="gap: 16px">
      <p class="p">Napisałeś list ręcznie? Zrób zdjęcie każdej strony — dostarczymy je jak list.</p>
      <input ref="input" class="sr-only" type="file" accept="image/jpeg,image/png" multiple tabindex="-1" aria-hidden="true" @change="add">
      <button type="button" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 180px; border: 2px dashed #A8432A; border-radius: 16px; background: #FBF7EE; color: #1F2A44; font-family: inherit; cursor: pointer" @click="input?.click()">
        <AppIcon name="camera" :size="40" :stroke-width="1.8" style="color: #A8432A" />
        <span style="font-weight: 700; font-size: 18px">Zrób zdjęcie strony</span>
        <span class="muted">lub wybierz z galerii</span>
      </button>
      <template v-if="draft.pages.length">
        <div class="label">Dodane strony ({{ draft.pages.length }})</div>
        <div class="row" style="gap: 12px; flex-wrap: wrap">
          <div v-for="(u, i) in urls" :key="u" style="position: relative">
            <img :src="u" :alt="`Strona ${i + 1}`" style="width: 96px; height: 124px; object-fit: cover; border-radius: 4px; border: 1px solid #CDBF9F">
            <span class="tag" style="position: absolute; left: 6px; bottom: 6px; min-height: 22px; font-size: 12px">{{ i + 1 }}</span>
            <!-- (new copy) 48px hit area -->
            <button type="button" class="back" :aria-label="`Usuń stronę ${i + 1}`" style="position: absolute; right: -16px; top: -16px; width: 48px; height: 48px; min-height: 0" @click="remove(i)">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
        </div>
      </template>
      <InfoNote icon="info">Połóż kartkę na płaskim blacie, w dobrym świetle.</InfoNote>
    </main>
    <div class="foot">
      <AppButton :disabled="!draft.pages.length" @click="next">Dalej</AppButton>
    </div>
  </div>
  <p v-else-if="error" class="error" role="alert" style="padding: 20px">{{ errorText(error) }}</p>
</template>
