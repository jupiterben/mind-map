<template>
  <div
    class="aiDebugPanel"
    :class="{ collapsed: collapsed }"
    ref="panelRef"
    v-show="visible"
    :style="panelStyle"
  >
    <div v-if="collapsed" class="aiDebugPanelTab" @click="collapsed = false">
      <span class="aiDebugPanelTabText">{{ $t('ai.debugTitle') }}</span>
    </div>
    <template v-else>
      <div class="aiDebugHeader" @mousedown.prevent="onDragStart">
        <span>{{ $t('ai.debugTitle') }}</span>
        <span>
          <el-button
            size="small"
            type="primary"
            :loading="isDebugRequesting"
            :disabled="!prompt.trim()"
            @click="debugSendRequest"
          >
            {{ $t('ai.debugSend') }}
          </el-button>
          <el-button size="small" text @click="clearPromptAndResponse">
            {{ $t('ai.debugClear') }}
          </el-button>
          <el-button size="small" text class="aiDebugCollapseBtn" @click.stop="collapsed = true" title="收起至左侧">◀</el-button>
        </span>
      </div>
      <div class="aiDebugSection">
        <div class="aiDebugLabel">{{ $t('ai.debugPrompt') }}</div>
        <el-input
          :model-value="prompt"
          @update:model-value="$emit('update:prompt', $event)"
          type="textarea"
          :rows="4"
          class="aiDebugTextarea"
          :placeholder="$t('ai.debugPromptPlaceholder')"
        />
      </div>
      <div class="aiDebugSection" v-if="response">
        <div class="aiDebugLabel">{{ $t('ai.debugResponse') }}</div>
        <pre class="aiDebugContent">{{ response }}</pre>
      </div>
      <div class="aiDebugSection aiDebugSmartIcon">
        <div class="aiDebugLabel">{{ $t('ai.debugSmartIconTitle') }}</div>
        <div class="aiDebugSmartIconRow">
          <el-input
            v-model="debugSmartIconText"
            size="small"
            class="aiDebugSmartIconInput"
            :placeholder="$t('ai.debugSmartIconPlaceholder')"
          />
          <el-button
            size="small"
            type="primary"
            :loading="isDebugSmartIconRequesting"
            :disabled="!debugSmartIconText.trim()"
            @click="debugSmartIconSend"
          >
            {{ $t('ai.debugSmartIconSend') }}
          </el-button>
        </div>
        <div class="aiDebugSection" v-if="debugSmartIconResponse !== ''">
          <div class="aiDebugLabel">{{ $t('ai.debugResponse') }}</div>
          <pre class="aiDebugContent">{{ debugSmartIconResponse }}</pre>
          <div v-if="debugSmartIconParsed" class="aiDebugLabel aiDebugParsed">
            {{ $t('ai.debugSmartIconParsed') }}: <span class="aiDebugEmoji">{{ debugSmartIconParsed }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { createAi } from '@/utils/ai'
import { getSmartIconPrompt, extractEmojiFromAiResponse } from '@/utils/smartIcon'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    visible: boolean
    prompt: string
    response: string
    aiConfig: any
    /** 请求前校验配置，失败时抛出或打开配置弹窗 */
    validateConfig?: () => Promise<void>
  }>(),
  { validateConfig: async () => {} }
)

const emit = defineEmits<{
  'update:prompt': [value: string]
  'update:response': [value: string]
  openConfig: []
}>()

const { t } = useI18n()

const panelRef = ref<HTMLElement | null>(null)
const collapsed = ref(false)
const panelLeft = ref<number | null>(null)
const panelTop = ref<number | null>(null)
let dragStartX = 0
let dragStartY = 0
let dragStartLeft = 0
let dragStartTop = 0

const debugSmartIconText = ref('')
const debugSmartIconResponse = ref('')
const debugSmartIconParsed = ref('')
const isDebugSmartIconRequesting = ref(false)
const isDebugRequesting = ref(false)

const panelStyle = computed(() => {
  if (collapsed.value) {
    return { left: '0', bottom: '24px', top: 'auto', right: 'auto' }
  }
  const left = panelLeft.value
  const top = panelTop.value
  if (left === null || top === null) return {}
  return {
    left: `${left}px`,
    top: `${top}px`,
    right: 'auto',
    bottom: 'auto'
  }
})

function onDragStart(e: MouseEvent) {
  if (collapsed.value) return
  const el = panelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (panelLeft.value === null || panelTop.value === null) {
    panelLeft.value = rect.left
    panelTop.value = rect.top
  }
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartLeft = panelLeft.value
  dragStartTop = panelTop.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  const W = 360
  const left = Math.max(0, Math.min(window.innerWidth - W, dragStartLeft + dx))
  const top = Math.max(0, Math.min(window.innerHeight - 100, dragStartTop + dy))
  panelLeft.value = left
  panelTop.value = top
}

function onDragEnd() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

function clearPromptAndResponse() {
  emit('update:prompt', '')
  emit('update:response', '')
}

async function debugSendRequest() {
  const promptText = props.prompt.trim()
  if (!promptText || isDebugRequesting.value) return
  try {
    await props.validateConfig?.()
    isDebugRequesting.value = true
    emit('update:response', '')
    const debugAi = createAi(props.aiConfig ?? {})
    debugAi.request(
      { messages: [{ role: 'user', content: promptText }] },
      () => {},
      ((content: string) => {
        emit('update:response', content)
        isDebugRequesting.value = false
      }) as () => void,
      () => {
        isDebugRequesting.value = false
        ElMessage.error(t('ai.generationFailed'))
      }
    )
  } catch (e) {
    isDebugRequesting.value = false
    emit('openConfig')
  }
}

async function debugSmartIconSend() {
  const text = debugSmartIconText.value.trim()
  if (!text || isDebugSmartIconRequesting.value) return
  try {
    await props.validateConfig?.()
    isDebugSmartIconRequesting.value = true
    debugSmartIconResponse.value = ''
    debugSmartIconParsed.value = ''
    const prompt = getSmartIconPrompt(text)
    const debugAi = createAi(props.aiConfig ?? {})
    debugAi.request(
      { messages: [{ role: 'user', content: prompt }] },
      () => {},
      ((content: string) => {
        debugSmartIconResponse.value = content || ''
        debugSmartIconParsed.value = extractEmojiFromAiResponse(content || '') || '—'
        isDebugSmartIconRequesting.value = false
      }) as () => void,
      () => {
        isDebugSmartIconRequesting.value = false
        ElMessage.error(t('ai.generationFailed'))
      }
    )
  } catch (e) {
    isDebugSmartIconRequesting.value = false
    emit('openConfig')
  }
}
</script>

<style lang="less" scoped>
.aiDebugPanel {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 1999;
  width: 360px;
  max-height: 400px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s, left 0.2s, bottom 0.2s;

  &.collapsed {
    width: 32px;
    min-height: 80px;
    max-height: 120px;
    border-radius: 0 8px 8px 0;
    left: 0 !important;
    bottom: 24px !important;
    top: auto !important;
  }

  .aiDebugPanelTab {
    width: 32px;
    height: 80px;
    writing-mode: vertical-rl;
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    cursor: pointer;
    user-select: none;
    font-size: 12px;
    font-weight: 600;
    color: #333;
    border-radius: 0 8px 8px 0;
  }

  .aiDebugPanelTabText {
    transform: rotate(180deg);
  }

  .aiDebugCollapseBtn {
    padding: 0 4px;
    min-width: auto;
  }

  .aiDebugHeader {
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #333;
    background: #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    user-select: none;
  }

  .aiDebugSection {
    border-top: 1px solid #eee;
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-height: 180px;
  }

  .aiDebugLabel {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    color: #666;
    background: #fafafa;
  }

  .aiDebugContent {
    flex: 1;
    margin: 0;
    padding: 8px 10px;
    font-size: 11px;
    line-height: 1.4;
    color: #333;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .aiDebugTextarea {
    flex: 1;
    font-size: 11px;
    :deep(.el-textarea__inner) {
      border-radius: 0;
      border-left: none;
      border-right: none;
      resize: none;
    }
  }

  .aiDebugSmartIcon {
    max-height: none;
  }
  .aiDebugSmartIconRow {
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    align-items: center;
  }
  .aiDebugSmartIconInput {
    flex: 1;
    :deep(.el-input__wrapper) {
      font-size: 12px;
    }
  }
  .aiDebugParsed {
    margin-top: 4px;
    font-weight: normal;
  }
  .aiDebugEmoji {
    font-size: 20px;
  }
}
</style>
