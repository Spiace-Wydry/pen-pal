export function errorText(e: unknown): string {
  const msg = (e as { data?: { message?: string } } | null)?.data?.message
  return msg || 'Coś poszło nie tak. Spróbuj ponownie.' // (new copy)
}
