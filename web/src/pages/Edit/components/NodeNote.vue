<template>
  <el-dialog
    class="nodeNoteDialog"
    :title="$t('nodeNote.title')"
    v-model="dialogVisible"
    :width="isMobile ? '90%' : '50%'"
    :top="isMobile ? '20px' : '15vh'"
  >
    <div class="noteEditor" ref="noteEditorRef" @keyup.stop @keydown.stop></div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancel">{{ $t('dialog.cancel') }}</el-button>
        <el-button type="primary" @click="confirm">{{ $t('dialog.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import { getBus } from '@/bus'
import { isMobile as checkIsMobile } from 'simple-mind-map/src/utils/index'

const bus = getBus()

const noteEditorRef = ref<HTMLElement | null>(null)
const dialogVisible = ref(false)
const note = ref('')
const activeNodes = ref<any[]>([])
const editor = ref<any>(null)
const isMobile = checkIsMobile()
const appointNode = ref<any>(null)

function handleNodeActive(...args: any[]) {
  activeNodes.value = [...args[1]]
  updateNoteInfo()
}

function updateNoteInfo() {
  if (activeNodes.value.length > 0) {
    note.value = activeNodes.value[0].getData('note') || ''
  } else {
    note.value = ''
  }
}

function handleShowNodeNote(node?: any) {
  bus.$emit('startTextEdit')
  if (node) {
    appointNode.value = node
    note.value = node.getData('note') || ''
  }
  dialogVisible.value = true
  nextTick(() => initEditor())
}

function initEditor() {
  if (!editor.value && noteEditorRef.value) {
    editor.value = new Editor({
      el: noteEditorRef.value,
      height: '500px',
      initialEditType: 'markdown',
      previewStyle: 'vertical'
    })
  }
  editor.value?.setMarkdown(note.value)
}

function cancel() {
  dialogVisible.value = false
  if (appointNode.value) {
    appointNode.value = null
    updateNoteInfo()
  }
}

function confirm() {
  const content = editor.value?.getMarkdown()
  if (appointNode.value) {
    appointNode.value.setNote(content)
  } else {
    activeNodes.value.forEach((node) => node.setNote(content))
  }
  cancel()
}

watch(dialogVisible, (val, oldVal) => {
  if (!val && oldVal) bus.$emit('endTextEdit')
})

onMounted(() => {
  bus.$on('node_active', handleNodeActive)
  bus.$on('showNodeNote', handleShowNodeNote)
})

onBeforeUnmount(() => {
  bus.$off('node_active', handleNodeActive)
  bus.$off('showNodeNote', handleShowNodeNote)
})
</script>

<style lang="less" scoped>
.nodeNoteDialog {
  .tip {
    margin-top: 5px;
    color: #dcdfe6;
  }
}
</style>
