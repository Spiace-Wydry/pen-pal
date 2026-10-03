import type { Me, MePatch } from '#shared/types/api'

export function useProfile() {
  const profile = useState<Me | null>('profile', () => null)
  const fetcher = useRequestFetch() // forwards the auth cookie during SSR
  async function refreshProfile() {
    profile.value = await fetcher<Me>('/api/me')
    return profile.value
  }
  async function saveProfile(patch: MePatch) {
    profile.value = await $fetch<Me>('/api/me', { method: 'PATCH', body: patch })
    return profile.value
  }
  return { profile, refreshProfile, saveProfile }
}
