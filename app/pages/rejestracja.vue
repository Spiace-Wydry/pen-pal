<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const supabase = useSupabaseClient()
const { profile } = useProfile()

const email = ref('')
const password = ref('')
const adult = ref(false)
const rodo = ref(false)
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  if (!adult.value) { error.value = 'PiszuPiszu jest tylko dla osób pełnoletnich.'; return }
  if (!rodo.value) { error.value = 'Zaakceptuj regulamin, aby założyć konto.'; return }
  busy.value = true
  const { data, error: e } = await supabase.auth.signUp({ email: email.value.trim(), password: password.value })
  busy.value = false
  if (e) {
    error.value = /already/i.test(e.message)
      ? 'Konto z tym adresem już istnieje.'
      : 'Nie udało się założyć konta. Sprawdź e-mail i hasło.'
    return
  }
  if (!data.session) { error.value = 'Sprawdź skrzynkę e-mail, aby potwierdzić konto.'; return }
  profile.value = null
  await navigateTo('/profil/o-mnie')
}
</script>

<template>
  <form class="page" novalidate @submit.prevent="submit">
    <ScreenTop back="/jak-to-dziala">
      <template #center><StepProgress :step="1" /></template>
    </ScreenTop>
    <main class="body">
      <h1 class="h1">Załóż konto</h1>
      <div class="field">
        <label class="label" for="email">E-mail</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="email" placeholder="np. jan.kowalski@poczta.pl" required>
      </div>
      <div class="field">
        <label class="label" for="pass">Hasło</label>
        <input id="pass" v-model="password" class="input" type="password" autocomplete="new-password" placeholder="Wymyśl hasło" minlength="8" required aria-describedby="pass-hint">
        <p id="pass-hint" class="muted">Co najmniej 8 znaków.</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 4px">
        <label style="display: flex; gap: 12px; align-items: flex-start; font-size: 17px; line-height: 1.4; min-height: 48px"><input v-model="adult" type="checkbox" required style="width: 26px; height: 26px; accent-color: #1F2A44; flex: none; margin: 0">Mam ukończone 18 lat</label>
        <label style="display: flex; gap: 12px; align-items: flex-start; font-size: 17px; line-height: 1.4; min-height: 48px"><input v-model="rodo" type="checkbox" required style="width: 26px; height: 26px; accent-color: #1F2A44; flex: none; margin: 0">Akceptuję regulamin i zgadzam się na przetwarzanie moich danych (RODO)</label>
      </div>
      <InfoNote icon="info">Zakładasz konto dla mamy lub taty? Możesz zrobić to w ich imieniu.</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" :disabled="busy || !email || password.length < 8 || !adult || !rodo">Dalej</AppButton>
    </div>
  </form>
</template>
