interface Draft { mode: 'TYPED' | 'SCAN', body: string, pages: File[] }

export function useLetterDraft(pairingId: string) {
  const draft = useState<Draft>(`draft-${pairingId}`, () => ({ mode: 'TYPED', body: '', pages: [] }))
  const key = `penpal-draft-${pairingId}`
  onMounted(() => {
    if (!draft.value.body) {
      try { draft.value.body = localStorage.getItem(key) ?? '' }
      catch { /* storage blocked: draft just won't survive a reload */ }
    }
  })
  function persist() {
    try { localStorage.setItem(key, draft.value.body) }
    catch { /* ignore */ }
  }
  function clear() {
    draft.value = { mode: 'TYPED', body: '', pages: [] }
    try { localStorage.removeItem(key) }
    catch { /* ignore */ }
  }
  return { draft, persist, clear }
}
