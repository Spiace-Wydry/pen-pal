<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const code = ref('')
const palKod = ref('')
const from = ref('')
const files = ref<File[]>([])
const result = ref('')
const error = ref('')
const busy = ref(false)

const fileInput = ref<HTMLInputElement>()

async function submit() {
  error.value = ''
  result.value = ''
  busy.value = true
  try {
    const fd = new FormData()
    fd.append('code', code.value)
    fd.append('palKod', palKod.value)
    fd.append('from', from.value)
    files.value.forEach(f => fd.append('pages', f))
    const r = await $fetch<{ id: string, to: string }>('/api/admin/scan', { method: 'POST', body: fd })
    result.value = `List zeskanowany. Dotrze do: ${r.to} za 2 dni.`
    palKod.value = ''
    from.value = ''
    files.value = []
    if (fileInput.value) fileInput.value.value = '' // native input keeps filenames otherwise
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <form class="page" @submit.prevent="submit">
    <ScreenTop title="Skan w PalPoincie" subtitle="Narzędzie demo" />
    <main class="body">
      <div class="field">
        <label class="label" for="code">Kod obsługi</label>
        <input id="code" v-model="code" class="input" type="password" autocomplete="off" placeholder="Kod obsługi" required>
      </div>
      <div class="field">
        <label class="label" for="kod">PalKod z koperty</label>
        <input id="kod" v-model="palKod" class="input" type="text" placeholder="PP-7K3D" autocapitalize="characters" required>
      </div>
      <div class="field">
        <label class="label" for="from">Od (imię nadawcy)</label>
        <input id="from" v-model="from" class="input" type="text" placeholder="np. Halina" required>
      </div>
      <div class="field">
        <label class="label" for="pages">Zdjęcia stron</label>
        <input id="pages" ref="fileInput" class="input" style="padding-top: 14px" type="file" accept="image/jpeg,image/png" multiple required @change="files = Array.from(($event.target as HTMLInputElement).files ?? [])">
      </div>
      <InfoNote v-if="result" icon="check">{{ result }}</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" variant="stamp" :disabled="busy || !files.length">Zeskanuj list</AppButton>
    </div>
  </form>
</template>
