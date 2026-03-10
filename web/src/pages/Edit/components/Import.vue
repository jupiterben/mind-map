<template>
  <div>
    <el-dialog
      class="nodeImportDialog"
      :title="$t('import.title')"
      v-model="dialogVisible"
      width="480px"
    >
      <el-tabs v-model="importTab" class="import-tabs">
        <el-tab-pane :label="$t('import.tabFile')" name="file">
          <el-upload
            ref="uploadRef"
            action="x"
            :accept="supportFileStr"
            :file-list="fileList"
            :auto-upload="false"
            :multiple="false"
            :on-change="onChange"
            :on-remove="onRemove"
            :limit="1"
            :on-exceed="onExceed"
          >
            <template #trigger>
              <el-button size="small" type="primary">{{ $t('import.selectFile') }}</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                {{ $t('import.support') }}{{ supportFileStr }}{{ $t('import.file') }}
              </div>
            </template>
          </el-upload>
        </el-tab-pane>
        <el-tab-pane :label="$t('import.tabText')" name="text">
          <el-input
            v-model="pasteText"
            type="textarea"
            :rows="10"
            :placeholder="$t('import.textPlaceholder')"
            class="import-textarea"
          />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel">{{ $t('dialog.cancel') }}</el-button>
          <el-button type="primary" @click="confirm">{{ $t('dialog.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog
      class="xmindCanvasSelectDialog"
      :title="$t('import.xmindCanvasSelectDialogTitle')"
      v-model="xmindCanvasSelectDialogVisible"
      width="300px"
      :show-close="false"
    >
      <el-radio-group v-model="selectCanvas" class="canvasList">
        <el-radio v-for="(item, index) in canvasList" :key="index" :value="index">
          {{ item.title }}
        </el-radio>
      </el-radio-group>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="confirmSelect">{{ $t('dialog.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import xmind from 'simple-mind-map/src/parse/xmind.js'
import markdown from 'simple-mind-map/src/parse/markdown.js'
import { useStoreMixin } from '@/mixins/storeMixin'
import { getBus } from '@/bus'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { setIsHandleLocalFile, setActiveSidebar } = useStoreMixin()
const bus = getBus()
const route = useRoute()
const { t } = useI18n()

const dialogVisible = ref(false)
const importTab = ref<'file' | 'text'>('file')
const pasteText = ref('')
const fileList = ref<any[]>([])
const selectPromiseResolve = ref<((value: any) => void) | null>(null)
const xmindCanvasSelectDialogVisible = ref(false)
const selectCanvas = ref(0)
const canvasList = ref<any[]>([])

const supportFileStr = computed(() => '.smm,.json,.xmind,.md')

function getRegexp() {
  return /\.(smm|json|xmind|md)$/
}

function handleShowImport() {
  dialogVisible.value = true
}

async function handleFileURL() {
  try {
    const fileURL = route.query.fileURL as string
    if (!fileURL) return
    const match = fileURL.match(getRegexp())
    if (!match) return
    const type = match[1]
    const res = await fetch(fileURL)
    const file = await res.blob()
    const data = { raw: file }
    if (type === 'smm' || type === 'json') handleSmm(data)
    else if (type === 'xmind') handleXmind(data)
    else if (type === 'md') handleMd(data)
  } catch (error) {
    console.log(error)
  }
}

function onChange(file: any) {
  if (!getRegexp().test(file.name)) {
    ElMessage.error(t('import.pleaseSelect') + supportFileStr.value + t('import.file'))
    fileList.value = []
  } else {
    fileList.value = [file]
  }
}

function onRemove(_file: any, list: any[]) {
  fileList.value = list
}

function onExceed() {
  ElMessage.error(t('import.maxFileNum'))
}

function cancel() {
  dialogVisible.value = false
}

function confirm() {
  if (importTab.value === 'text') {
    const text = pasteText.value.trim()
    if (!text) return ElMessage.error(t('import.mdEmptyTip'))
    setIsHandleLocalFile(false)
    try {
      const trimmed = text.trim()
      const first = trimmed.charAt(0)
      if (first === '{' || first === '[') {
        const data = JSON.parse(trimmed)
        if (typeof data !== 'object') throw new Error(t('import.fileContentError'))
        const payload = data.root !== undefined ? data : { root: data }
        bus.$emit('setData', payload)
      } else {
        const data = markdown.transformMarkdownTo(trimmed)
        bus.$emit('setData', data)
      }
      ElMessage.success(t('import.importSuccess'))
      cancel()
      setActiveSidebar(null)
    } catch (err) {
      console.error(err)
      ElMessage.error(t('import.fileParsingFailed'))
    }
    return
  }
  if (fileList.value.length <= 0) {
    return ElMessage.error(t('import.notSelectTip'))
  }
  setIsHandleLocalFile(false)
  const file = fileList.value[0]
  if (/\.(smm|json)$/.test(file.name)) handleSmm(file)
  else if (/\.xmind$/.test(file.name)) handleXmind(file)
  else if (/\.md$/.test(file.name)) handleMd(file)
  cancel()
  setActiveSidebar(null)
}

function handleSmm(file: any) {
  const fileReader = new FileReader()
  fileReader.readAsText(file.raw)
  fileReader.onload = (evt) => {
    try {
      const data = JSON.parse((evt.target as any).result)
      if (typeof data !== 'object') throw new Error(t('import.fileContentError'))
      bus.$emit('setData', data)
      ElMessage.success(t('import.importSuccess'))
    } catch (error) {
      console.log(error)
      ElMessage.error(t('import.fileParsingFailed'))
    }
  }
}

async function handleXmind(file: any) {
  try {
    const data = await xmind.parseXmindFile(file.raw, (content: any) => {
      showSelectXmindCanvasDialog(content)
      return new Promise((resolve) => {
        selectPromiseResolve.value = resolve
      })
    })
    bus.$emit('setData', data)
    ElMessage.success(t('import.importSuccess'))
  } catch (error) {
    console.log(error)
    ElMessage.error(t('import.fileParsingFailed'))
  }
}

function showSelectXmindCanvasDialog(content: any[]) {
  canvasList.value = content
  selectCanvas.value = 0
  xmindCanvasSelectDialogVisible.value = true
}

function confirmSelect() {
  selectPromiseResolve.value?.(canvasList.value[selectCanvas.value])
  xmindCanvasSelectDialogVisible.value = false
  canvasList.value = []
  selectCanvas.value = 0
}

async function handleMd(file: any) {
  const fileReader = new FileReader()
  fileReader.readAsText(file.raw)
  fileReader.onload = (evt) => {
    try {
      const data = markdown.transformMarkdownTo((evt.target as any).result)
      bus.$emit('setData', data)
      ElMessage.success(t('import.importSuccess'))
    } catch (error) {
      console.log(error)
      ElMessage.error(t('import.fileParsingFailed'))
    }
  }
}

function handleImportFile(file: any) {
  onChange({ raw: file, name: file.name })
  if (fileList.value.length <= 0) return
  confirm()
}

watch(dialogVisible, (val, oldVal) => {
  if (!val && oldVal) {
    fileList.value = []
    pasteText.value = ''
  }
})

onMounted(() => {
  bus.$on('showImport', handleShowImport)
  bus.$on('handle_file_url', handleFileURL)
  bus.$on('importFile', handleImportFile)
})

onBeforeUnmount(() => {
  bus.$off('showImport', handleShowImport)
  bus.$off('handle_file_url', handleFileURL)
  bus.$off('importFile', handleImportFile)
})

defineExpose({ onChange, confirm })
</script>

<style lang="less" scoped>
.nodeImportDialog {
  .import-tabs {
    min-height: 120px;
  }
  .import-textarea {
    margin-top: 8px;
  }
}

.canvasList {
  display: flex;
  flex-direction: column;

  :deep(.el-radio) {
    margin-bottom: 12px;

    &:last-of-type {
      margin-bottom: 0;
    }
  }
}
</style>
