<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { plural } from '#shared/utils/polish'
import { topicFor } from '#shared/utils/topics'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p } = await useFetch<PairingView>(`/api/pairings/${id}`)
if (p.value && !p.value.canWrite) await navigateTo(`/korespondenci/${id}`, { replace: true })

const { draft, persist } = useLetterDraft(id)
const saved = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(() => draft.value.body, () => {
  saved.value = false
  clearTimeout(timer)
  timer = setTimeout(() => { persist(); saved.value = true }, 600)
})
onBeforeUnmount(() => clearTimeout(timer))
const words = computed(() => draft.value.body.trim().split(/\s+/).filter(Boolean).length)
const topic = computed(() => p.value ? topicFor(p.value.sharedInterests) : null)

function next() {
  draft.value.mode = 'TYPED'
  return navigateTo(`/korespondenci/${id}/wyslij`)
}
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop :back="`/korespondenci/${id}`" title="Napisz list" :subtitle="`Do: ${p.partner.name}`">
      <span class="muted" style="font-size: 14px" aria-live="polite">{{ saved ? 'Zapisano' : '' }}</span>
    </ScreenTop>
    <main class="body" style="gap: 14px; padding-top: 8px">
      <InfoNote v-if="topic" icon="bulb">Pomysł na temat: <b>{{ topic.prompt }}</b></InfoNote>
      <label for="letter" class="label" style="position: absolute; left: -9999px">Treść listu</label>
      <textarea
        id="letter" v-model="draft.body" class="paper" maxlength="5000"
        style="flex: 1; min-height: 380px; resize: none; font-family: 'Fraunces', Georgia, serif; font-size: 19px; line-height: 32px; color: #1F2A44; border-radius: 6px; padding: 18px 20px; outline: none"
      />
      <div class="row" style="justify-content: space-between">
        <span class="muted">{{ words }} {{ plural(words, 'słowo', 'słowa', 'słów') }}</span>
        <span class="muted">Dotrze za 2 dni</span>
      </div>
    </main>
    <div class="foot" style="padding-top: 0">
      <AppButton :disabled="!draft.body.trim()" @click="next">Dalej</AppButton>
    </div>
  </div>
</template>
