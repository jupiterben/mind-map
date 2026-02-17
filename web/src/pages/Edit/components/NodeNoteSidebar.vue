<template>
  <Sidebar ref="sidebar" :title="$t('note.title')">
    <div class="noteContentWrap" ref="noteContentWrap"></div>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Sidebar from './Sidebar.vue'
import { useStoreMixin } from '@/mixins/storeMixin'
import { getBus } from '@/bus'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

const props = defineProps<{
  mindMap: any
}>()

const { activeSidebar, setActiveSidebar } = useStoreMixin()
const bus = getBus()

const sidebar = ref<InstanceType<typeof Sidebar> | null>(null)
const noteContentWrap = ref<HTMLElement | null>(null)
const editor = ref<any>(null)
const node = ref<any>(null)

watch(activeSidebar, (val) => {
  const s = sidebar.value as { setShow?: (v: boolean) => void } | null
  if (s?.setShow) s.setShow(val === 'noteSidebar')
})

function onNodeActive(...args: any[]) {
  if (activeSidebar.value !== 'noteSidebar') return
  const nodes = [...args[1]]
  if (nodes.length > 0) {
    if (nodes[0] !== node.value) setActiveSidebar(null)
  } else {
    setActiveSidebar(null)
  }
}

function initEditor() {
  if (!editor.value && noteContentWrap.value) {
    editor.value = new Viewer({ el: noteContentWrap.value })
  }
}

function onNodeNoteClick(n: any) {
  node.value = n
  setActiveSidebar('noteSidebar')
  editor.value?.setMarkdown(n.getData('note'))
}

onMounted(() => {
  bus.$on('node_active', onNodeActive)
  props.mindMap.on('node_note_click', onNodeNoteClick)
  initEditor()
})

onBeforeUnmount(() => {
  bus.$off('node_active', onNodeActive)
  props.mindMap.off('node_note_click', onNodeNoteClick)
})
</script>

<style lang="less" scoped>
.noteContentWrap {
  padding: 12px 20px;
}
</style>
