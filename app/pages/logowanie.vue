<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const supabase = useSupabaseClient()
const { profile } = useProfile()

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  const { error: e } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
  busy.value = false
  if (e) { error.value = 'Nieprawidłowy e-mail lub hasło.'; return } // (new copy)
  profile.value = null
  await navigateTo('/listy') // middleware sends unfinished profiles to their onboarding step
}
</script>

<template>
  <!-- (new copy) screen: no design; mirrors Rejestracja -->
  <form class="page" novalidate @submit.prevent="submit">
    <ScreenTop back="/" />
    <main class="body">
      <h1 class="h1">Zaloguj się</h1>
      <div class="field">
        <label class="label" for="email">E-mail</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="email" placeholder="np. jan.kowalski@poczta.pl" required>
      </div>
      <div class="field">
        <label class="label" for="pass">Hasło</label>
        <input id="pass" v-model="password" class="input" type="password" autocomplete="current-password" placeholder="Twoje hasło" required>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" :disabled="busy || !email || !password">Zaloguj się</AppButton>
      <p class="muted" style="text-align: center; padding-top: 4px">
        Nie masz konta? <NuxtLink to="/jak-to-dziala" style="display: inline-flex; align-items: center; min-height: 48px">Załóż konto</NuxtLink>
      </p>
    </div>
  </form>
</template>
