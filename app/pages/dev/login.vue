<script setup lang="ts">
definePageMeta({
  layout: 'plain',
  middleware: () => { if (!import.meta.dev) return abortNavigation(createError({ statusCode: 404 })) },
})
const supabase = useSupabaseClient()
const { profile } = useProfile()
const error = ref('')
const users = ['kuba', 'ola', 'halina', 'krystyna']

async function signIn(who: string) {
  error.value = ''
  const { error: e } = await supabase.auth.signInWithPassword({ email: `${who}@penpal.test`, password: 'pisanielistow' })
  if (e) { error.value = e.message; return }
  profile.value = null
  await navigateTo('/listy')
}
async function signOut() {
  await supabase.auth.signOut()
  profile.value = null
  await navigateTo('/')
}
</script>

<template>
  <div class="page">
    <ScreenTop title="Dev: zaloguj jako" />
    <main class="body">
      <AppButton v-for="u in users" :key="u" @click="signIn(u)">{{ u }}</AppButton>
      <AppButton variant="outline" @click="signOut">Wyloguj</AppButton>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
  </div>
</template>
