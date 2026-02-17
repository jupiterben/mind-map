<template>
  <viewer :images="images">
    <img v-for="src in images" :key="src" :src="src" />
  </viewer>
</template>

<script setup lang="ts">
import { ref, getCurrentInstance, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  mindMap: {
    on: (e: string, fn: (...args: unknown[]) => void) => void
    off: (e: string, fn: (...args: unknown[]) => void) => void
  } | null
}>()

const images = ref<string[]>([])
const instance = getCurrentInstance()
const viewerApi = () => (instance?.appContext?.config?.globalProperties as { $viewerApi?: (opts: { images: string[] }) => void })?.$viewerApi

function onNodeTmgDblclick(node: { getImageUrl: () => string }, e: Event) {
  e.stopPropagation()
  e.preventDefault()
  images.value = [node.getImageUrl()]
  viewerApi()?.({ images: images.value })
}

onMounted(() => {
  props.mindMap?.on('node_img_dblclick', onNodeTmgDblclick)
})
onBeforeUnmount(() => {
  props.mindMap?.off('node_img_dblclick', onNodeTmgDblclick)
})
</script>

<style></style>
