<script setup lang="ts">
definePageMeta({ layout: 'plain' })
</script>

<template>
  <div class="page">
    <main style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 40px 28px 0">
      <div aria-hidden="true" style="position: relative; width: 260px; height: 190px">
        <svg width="260" height="170" viewBox="0 0 260 170" fill="none" style="position: absolute; left: 0; top: 20px">
          <rect x="2" y="2" width="256" height="166" rx="10" fill="#FFFDF8" stroke="#1F2A44" stroke-width="2.5" />
          <path d="M4 6 L130 96 L256 6" stroke="#1F2A44" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M4 166 L100 76 M256 166 L160 76" stroke="#CDBF9F" stroke-width="2" />
          <rect x="196" y="16" width="44" height="52" rx="3" fill="#F6F0E4" stroke="#A8432A" stroke-width="2" stroke-dasharray="4 3" />
          <path d="M218 30 c-7 -9 -16 2 0 14 c16 -12 7 -23 0 -14 z" fill="#A8432A" />
        </svg>
        <div class="postmark" style="position: absolute; left: -10px; top: 0">KRAKÓW<br>2026</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center">
        <div class="row" style="gap: 14px; justify-content: center">
          <img src="/logo.svg" alt="" width="44" height="44" style="flex: none">
          <h1 style="font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 44px; letter-spacing: -0.02em; line-height: 1; margin: 0">PiszuPiszu</h1>
        </div>
        <p class="p" style="font-size: 20px; max-width: 300px">Łączymy pokolenia, list po liście.</p>
      </div>
    </main>
    <div class="foot">
      <AppButton variant="stamp" to="/jak-to-dziala">Załóż konto</AppButton>
      <AppButton variant="outline" to="/logowanie">Mam już konto</AppButton>
      <p class="muted" style="text-align: center; padding-top: 4px">Nie masz smartfona? Konto założysz też w PalPoincie.</p>
    </div>
  </div>
</template>
