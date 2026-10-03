<script setup lang="ts">
import { INTERESTS, LANGUAGES } from '#shared/utils/rules'

definePageMeta({ layout: 'plain' })
const route = useRoute()
const edit = computed(() => route.query.edit === '1')
const { profile, refreshProfile, saveProfile } = useProfile()
if (!profile.value) await refreshProfile()

const interests = ref<string[]>([...(profile.value?.interests ?? [])])
const languages = ref<string[]>([...(profile.value?.languages ?? ['polski'])])
const error = ref('')
const busy = ref(false)
const valid = computed(() => interests.value.length >= 3 && interests.value.length <= 8 && languages.value.length >= 1)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await saveProfile({ interests: interests.value, languages: languages.value })
    await navigateTo(edit.value ? '/profil' : '/profil/kanal')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <form class="page" @submit.prevent="submit">
    <ScreenTop :back="edit ? '/profil' : '/profil/o-mnie'">
      <template v-if="!edit" #center><StepProgress :step="3" /></template>
    </ScreenTop>
    <main class="body">
      <div>
        <h1 class="h1">Co lubisz?</h1>
        <p class="p">Wybierz od 3 do 8 zainteresowań. Po nich znajdziemy Ci korespondenta.</p>
      </div>
      <ChipPicker v-model="interests" :options="INTERESTS" multiple :max="8" label="Zainteresowania" />
      <p class="muted" aria-live="polite">Wybrano {{ interests.length }} z 8</p>
      <div class="divider" />
      <div class="field">
        <div class="label">W jakich językach chcesz pisać?</div>
        <ChipPicker v-model="languages" :options="LANGUAGES" multiple label="Języki listów" />
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" :disabled="busy || !valid">{{ edit ? 'Zapisz' : 'Dalej' }}</AppButton>
    </div>
  </form>
</template>
