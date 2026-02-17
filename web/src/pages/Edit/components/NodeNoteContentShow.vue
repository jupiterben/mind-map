<template>
  <div
    class="noteContentViewer customScrollbar"
    ref="noteContentViewer"
    :style="{
      left: left + 'px',
      top: top + 'px',
      visibility: show ? 'visible' : 'hidden'
    }"
    @click.stop
    @mousedown.stop
    @mousemove.stop
    @mouseup.stop
    @wheel.stop
  >
    <div class="noteContentWrap customScrollbar" ref="noteContentWrap"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import { getBus } from '@/bus'

const props = defineProps<{
  mindMap: any
}>()

const bus = getBus()

const noteContentViewer = ref<HTMLElement | null>(null)
const noteContentWrap = ref<HTMLElement | null>(null)
const editor = ref<any>(null)
const show = ref(false)
const left = ref(0)
const top = ref(0)
const node = ref<any>(null)

function onNodeActive(...args: any[]) {
  const nodes = [...args[1]]
  if (nodes.length > 0) {
    if (nodes[0] !== node.value) hideNoteContent()
  } else {
    hideNoteContent()
  }
}

function onShowNoteContent(content: string, x: number, y: number, n: any) {
  node.value = n
  editor.value?.setMarkdown(content)
  handleALink()
  updateNoteContentPosition(x, y)
  show.value = true
}

function handleALink() {
  const list = noteContentViewer.value?.querySelectorAll('a')
  list && Array.from(list).forEach((a) => a.setAttribute('target', '_blank'))
}

function updateNoteContentPosition(x: number, y: number) {
  const el = noteContentViewer.value
  if (!el || !props.mindMap?.elRect) return
  const { width, height } = el.getBoundingClientRect()
  const { right, bottom } = props.mindMap.elRect
  left.value = x + width > right ? right - width : x
  top.value = y + height > bottom ? bottom - height : y
}

function onScale() {
  if (!node.value || !show.value) return
  const pos = node.value.getNoteContentPosition()
  updateNoteContentPosition(pos.left, pos.top)
}

function hideNoteContent() {
  show.value = false
}

function initEditor() {
  if (!editor.value && noteContentWrap.value) {
    editor.value = new Viewer({ el: noteContentWrap.value })
  }
}

onMounted(() => {
  bus.$on('showNoteContent', onShowNoteContent)
  bus.$on('hideNoteContent', hideNoteContent)
  document.body.addEventListener('click', hideNoteContent)
  bus.$on('node_active', onNodeActive)
  bus.$on('scale', onScale)
  bus.$on('translate', onScale)
  bus.$on('svg_mousedown', hideNoteContent)
  bus.$on('expand_btn_click', hideNoteContent)
  if (props.mindMap?.el && noteContentViewer.value) {
    props.mindMap.el.appendChild(noteContentViewer.value)
  }
  initEditor()
})

onBeforeUnmount(() => {
  bus.$off('showNoteContent', onShowNoteContent)
  bus.$off('hideNoteContent', hideNoteContent)
  document.body.removeEventListener('click', hideNoteContent)
  bus.$off('node_active', onNodeActive)
  bus.$off('scale', onScale)
  bus.$off('translate', onScale)
  bus.$off('svg_mousedown', hideNoteContent)
  bus.$off('expand_btn_click', hideNoteContent)
})
</script>

<style lang="less" scoped>
.noteContentViewer {
  position: fixed;
  background-color: #fff;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 2;

  .noteContentWrap {
    max-width: 250px;
    max-height: 300px;
    overflow-y: auto;
  }
}
</style>
