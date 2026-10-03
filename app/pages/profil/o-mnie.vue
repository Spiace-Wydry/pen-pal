<script setup lang="ts">
import { AGE_RANGES, type AgeRange } from '#shared/utils/rules'
import { ageLabel } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const route = useRoute()
const edit = computed(() => route.query.edit === '1')
const { profile, refreshProfile, saveProfile } = useProfile()
if (!profile.value) await refreshProfile()

const name = ref(profile.value?.name ?? '')
const ageRange = ref<string>(profile.value?.ageRange ?? '')
const city = ref(profile.value?.city ?? '')
const address = ref(profile.value?.postalAddress ?? '')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await saveProfile({ name: name.value, ageRange: ageRange.value as AgeRange, city: city.value, postalAddress: address.value })
    await navigateTo(edit.value ? '/profil' : '/profil/zainteresowania')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <form class="page" @submit.prevent="submit">
    <ScreenTop :back="edit ? '/profil' : '/rejestracja'">
      <template v-if="!edit" #center><StepProgress :step="2" /></template>
    </ScreenTop>
    <main class="body" style="gap: 16px">
      <h1 class="h1">Opowiedz nam o sobie</h1>
      <div class="field">
        <label class="label" for="name">Imię</label>
        <input id="name" v-model="name" class="input" type="text" autocomplete="given-name" maxlength="40" required>
      </div>
      <div class="field">
        <div class="label">Przedział wieku</div>
        <ChipPicker v-model="ageRange" :options="AGE_RANGES" :labels="ageLabel" label="Przedział wieku" />
      </div>
      <div class="field">
        <label class="label" for="city">Miasto</label>
        <input id="city" v-model="city" class="input" type="text" autocomplete="address-level2" maxlength="80">
      </div>
      <div class="field">
        <label class="label" for="addr">Adres pocztowy</label>
        <input id="addr" v-model="address" class="input" type="text" autocomplete="street-address" maxlength="200">
      </div>
      <InfoNote icon="lock">Miasto i adres widzi <b>tylko PenPal</b> — używamy ich do dostarczania listów i dopasowania w regionie.</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" :disabled="busy || !name.trim() || !ageRange">{{ edit ? 'Zapisz' : 'Dalej' }}</AppButton>
    </div>
  </form>
</template>
