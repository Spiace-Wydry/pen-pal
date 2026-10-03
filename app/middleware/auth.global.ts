const PUBLIC = ['/', '/jak-to-dziala', '/rejestracja', '/admin/skan', '/dev/login']
const ONBOARDING = ['/profil/o-mnie', '/profil/zainteresowania', '/profil/kanal']

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  // Right after signUp/signIn the module sets the user asynchronously; ask the client directly.
  if (!user.value && import.meta.client) {
    const { data } = await useSupabaseClient().auth.getClaims()
    user.value = data?.claims ?? null
  }
  if (!user.value) {
    useProfile().profile.value = null
    return PUBLIC.includes(to.path) ? undefined : navigateTo('/')
  }
  if (to.path === '/') return navigateTo('/listy')
  if (PUBLIC.includes(to.path) || ONBOARDING.includes(to.path)) return

  const { profile, refreshProfile } = useProfile()
  if (!profile.value || profile.value.id !== user.value.sub) {
    try { await refreshProfile() }
    catch (e: any) {
      // Stale session (db reset, deleted user, revoked token): drop it instead of erroring every route.
      if (![401, 404].includes(e?.statusCode ?? e?.response?.status)) throw e
      await useSupabaseClient().auth.signOut({ scope: 'local' }).catch(() => {})
      user.value = null
      profile.value = null
      return navigateTo('/')
    }
  }
  const step = profile.value?.onboardingStep
  if (step) return navigateTo(step)
})
