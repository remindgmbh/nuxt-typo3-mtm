<template>
  <div>
    <h1>Nuxt Typo3 MTM Playground</h1>
    <nav>
      <NuxtLink to="/">
        Home
      </NuxtLink>
      |
      <NuxtLink to="/about">
        About
      </NuxtLink>
    </nav>
    <NuxtPage />
    <button @click="trackCustomEvent">
      Push Custom Event
    </button>
  </div>
</template>

<script setup>
const { push } = useMtm()

function trackCustomEvent() {
  push({ event: 'button-click', buttonName: 'custom-event-demo' })
}
</script>
