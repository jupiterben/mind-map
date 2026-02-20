<template>
  <div>
    <!-- ai内容输入弹窗 -->
    <el-dialog
      class="createDialog"
      :title="$t('ai.createMindMapTitle')"
      v-model="createDialogVisible"
      width="450px"
      append-to-body
    >
      <div class="inputBox">
        <el-input
          type="textarea"
          :rows="5"
          :placeholder="$t('ai.createTip')"
          v-model="aiInput"
        >
        </el-input>
        <div class="tip warning">
          {{ $t('ai.importantTip') }}
        </div>
        <div class="tip">
          {{ $t('ai.wantModifyAiConfigTip')
          }}<el-button size="small" @click="showAiConfigDialog">{{
            $t('ai.modifyAIConfiguration')
          }}</el-button>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeAiCreateDialog">{{ $t('ai.cancel') }}</el-button>
          <el-button type="primary" @click="doAiCreate">{{ $t('ai.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- ai生成中添加一个透明层，防止期间用户进行操作 -->
    <div
      class="aiCreatingMask"
      ref="aiCreatingMaskRef"
      v-show="aiCreatingMaskVisible"
    >
      <el-button type="warning" class="btn" @click="stopCreate">{{
        $t('ai.stopGenerating')
      }}</el-button>
    </div>
    <AiConfigDialog :visible="aiConfigDialogVisible" @change="(v: boolean) => (aiConfigDialogVisible = v)"></AiConfigDialog>
    <!-- AI子节点：根据 precedent 节点自动生成 prompt，可编辑 -->
    <el-dialog
      class="createDialog"
      :title="$t('ai.aiCreatePart')"
      v-model="createPartDialogVisible"
      width="450px"
      append-to-body
    >
      <div class="inputBox">
        <p class="tip">{{ $t('ai.aiCreatePartPromptTip') }}</p>
        <el-input type="textarea" :rows="6" v-model="aiPartInput" :placeholder="$t('ai.aiCreatePartPromptPlaceholder')" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeAiCreatePartDialog">{{ $t('ai.cancel') }}</el-button>
          <el-button type="primary" @click="confirmAiCreatePart">{{ $t('ai.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
    <AiDebugPanel
      :visible="showAiDebug"
      v-model:prompt="lastAiPrompt"
      v-model:response="lastAiResponse"
      :ai-config="aiConfig"
      :validate-config="aiTest"
      @open-config="showAiConfigDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { createAi } from '@/utils/ai'
import { transformMarkdownTo } from 'simple-mind-map/src/parse/markdownTo'
import {
  createUid,
  isUndef,
  checkNodeOuter as checkNodeOuterUtil,
  getStrWithBrFromHtml
} from 'simple-mind-map/src/utils'
import { useStoreMixin } from '@/mixins/storeMixin'
import { getBus } from '@/bus'
import AiConfigDialog from './AiConfigDialog.vue'
import AiDebugPanel from './AiDebugPanel.vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ mindMap: any }>()
const { aiConfig } = useStoreMixin()
const bus = getBus()
const { t } = useI18n()

const aiCreatingMaskRef = ref<HTMLElement | null>(null)
const aiInstance = ref<any>(null)
const isAiCreating = ref(false)
const aiCreatingContent = ref('')
const isLoopRendering = ref(false)
const uidMap = reactive<Record<string, string>>({})
const latestUid = ref('')
const createDialogVisible = ref(false)
const aiInput = ref('')
const aiCreatingMaskVisible = ref(false)
const aiConfigDialogVisible = ref(false)
const mindMapDataCache = ref('')
const beingAiCreateNodeUid = ref('')
const createPartDialogVisible = ref(false)
const aiPartInput = ref('')
const beingCreatePartNode = ref<any>(null)
/** true=替换子节点，false=追加子节点 */
const beingCreatePartReplace = ref(false)
/** 调试：最近一次发送的提示词（AI子节点时会写入，调试面板可编辑） */
const lastAiPrompt = ref('')
/** 调试：最近一次 AI 子节点返回的原始内容 */
const lastAiResponse = ref('')
/** 是否显示调试面板 */
const showAiDebug = ref(true)

function showAiConfigDialog() {
  aiConfigDialogVisible.value = true
}

async function aiTest() {
  const config = aiConfig.value
  const key = config?.keys?.[config.provider] ?? (config as any)?.key
  if (!(key && config?.model)) {
    showAiConfigDialog()
    throw new Error(t('ai.configurationMissing'))
  }
}

async function aiCrateAll() {
  try {
    await aiTest()
    createDialogVisible.value = true
  } catch (error) {
    console.log(error)
  }
}

function closeAiCreateDialog() {
  createDialogVisible.value = false
  aiInput.value = ''
}

function doAiCreate() {
  const aiInputText = aiInput.value.trim()
  if (!aiInputText) {
    ElMessage.warning(t('ai.noInputTip'))
    return
  }
  closeAiCreateDialog()
  aiCreatingMaskVisible.value = true
  isAiCreating.value = true
  aiInstance.value = createAi(aiConfig.value)
  props.mindMap.renderer.setRootNodeCenter()
  props.mindMap.setData(null)
  aiInstance.value.request(
    {
      messages: [
        {
          role: 'user',
          content: `${t('ai.aiCreateMsgPrefix')}${aiInputText}${t('ai.aiCreateMsgPostfix')}`
        }
      ]
    },
    (content: string) => {
      if (content) {
        const arr = content.split(/\n+/)
        aiCreatingContent.value = arr.splice(0, arr.length - 1).join('\n')
      }
      loopRenderOnAiCreating()
    },
    (content: string) => {
      aiCreatingContent.value = content
      resetOnAiCreatingStop()
    },
    () => {
      resetOnAiCreatingStop()
      resetOnRenderEnd()
      ElMessage.error(t('ai.generationFailed'))
    }
  )
}

function resetOnAiCreatingStop() {
  aiCreatingMaskVisible.value = false
  isAiCreating.value = false
  aiInstance.value = null
  bus.$emit('ai_creating_end')
}

/** AI 详细：为节点生成备注并写入 node.note */
async function runAiNoteDetail(node: any) {
  if (!node) return
  try {
    await aiTest()
    bus.$emit('ai_creating_start')
    aiCreatingMaskVisible.value = true
    isAiCreating.value = true
    aiInstance.value = createAi(aiConfig.value)
    const pathText = getPrecedentPathText(node)
    const prompt = t('ai.aiNoteDetailPrompt', { path: pathText || getStrWithBrFromHtml(node.getData('text') || '') })
    lastAiPrompt.value = prompt
    aiInstance.value.request(
      { messages: [{ role: 'user', content: prompt }] },
      () => {},
      (content: string) => {
        const note = (content || '').trim()
        if (typeof node.setNote === 'function') node.setNote(note)
        resetOnAiCreatingStop()
        ElMessage.success(t('ai.aiGenerationSuccess'))
      },
      () => {
        resetOnAiCreatingStop()
        ElMessage.error(t('ai.generationFailed'))
      }
    )
  } catch (error) {
    console.log(error)
  }
}

function resetOnRenderEnd() {
  isLoopRendering.value = false
  Object.keys(uidMap).forEach((k) => delete uidMap[k])
  aiCreatingContent.value = ''
  mindMapDataCache.value = ''
  beingAiCreateNodeUid.value = ''
}

function stopCreate() {
  aiInstance.value?.stop()
  isAiCreating.value = false
  aiCreatingMaskVisible.value = false
  ElMessage.success(t('ai.stoppedGenerating'))
}

function loopRenderOnAiCreating() {
  if (!aiCreatingContent.value.trim() || isLoopRendering.value) return
  isLoopRendering.value = true
  const treeData = transformMarkdownTo(aiCreatingContent.value)
  addUid(treeData)
  let lastTreeData = JSON.stringify(treeData)

  const onRenderEnd = () => {
    checkNodeOuter()
    if (!isAiCreating.value && !aiCreatingContent.value) {
      props.mindMap.off('node_tree_render_end', onRenderEnd)
      latestUid.value = ''
      return
    }
    const treeData2 = transformMarkdownTo(aiCreatingContent.value)
    addUid(treeData2)
    if (isAiCreating.value) {
      const curTreeData = JSON.stringify(treeData2)
      if (curTreeData === lastTreeData) {
        setTimeout(onRenderEnd, 500)
        return
      }
      lastTreeData = curTreeData
      props.mindMap.updateData(treeData2)
    } else {
      props.mindMap.updateData(treeData2)
      resetOnRenderEnd()
      ElMessage.success(t('ai.aiGenerationSuccess'))
    }
  }
  props.mindMap.on('node_tree_render_end', onRenderEnd)
  props.mindMap.setData(treeData)
}

function checkNodeOuter() {
  if (latestUid.value) {
    const latestNode = props.mindMap.renderer.findNodeByUid(latestUid.value)
    if (latestNode) {
      const { isOuter, offsetLeft, offsetTop } = checkNodeOuterUtil(
        props.mindMap,
        latestNode,
        100,
        100
      )
      if (isOuter) props.mindMap.view.translateXY(offsetLeft, offsetTop)
    }
  }
}

function addUid(data: any) {
  const checkRepeatUidMap: Record<string, boolean> = {}
  const walk = (node: any, pUid = '') => {
    if (!node.data) node.data = {}
    if (isUndef(node.data.uid)) {
      const key = pUid + '-' + node.data.text
      node.data.uid = uidMap[key] || createUid()
      if (checkRepeatUidMap[node.data.uid]) node.data.uid = createUid()
      latestUid.value = uidMap[key] = node.data.uid
      checkRepeatUidMap[node.data.uid] = true
    }
    if (node.children?.length) {
      node.children.forEach((child: any) => walk(child, node.data.uid))
    }
  }
  walk(data)
}

/** 从根到当前节点的路径文案（precedent nodes），用于生成联想子节点的 prompt */
function getPrecedentPathText(node: any): string {
  const ancestors = typeof node.getAncestorNodes === 'function' ? node.getAncestorNodes() : []
  const pathNodes = [...ancestors, node]
  return pathNodes
    .map((n: any) => getStrWithBrFromHtml(n.getData('text') || '').trim())
    .filter(Boolean)
    .join(' > ')
}

const DEFAULT_MAX_DEPTH = 5

function buildPartPrompt(node: any, options?: { breadth?: number }) {
  const pathText = getPrecedentPathText(node)
  let prompt = t('ai.aiCreatePartPromptFromPrecedent', {
    path: pathText || getStrWithBrFromHtml(node.getData('text') || '')
  })
  if (options?.breadth != null) {
    prompt += t('ai.aiCreatePartBreadth', { breadth: options.breadth })
  }
  return prompt
}

function showAiCreatePartDialog(node: any) {
  beingCreatePartNode.value = node
  beingCreatePartReplace.value = false
  aiPartInput.value = buildPartPrompt(node)
  createPartDialogVisible.value = true
}

function runAiCreatePartWithOptions(node: any, options: { breadth?: number; replace?: boolean }) {
  beingCreatePartNode.value = node
  beingCreatePartReplace.value = options.replace === true
  aiPartInput.value = buildPartPrompt(node, options)
  aiCreatePart()
}

function closeAiCreatePartDialog() {
  createPartDialogVisible.value = false
}

function resetAiCreatePartDialog() {
  beingCreatePartNode.value = null
  aiPartInput.value = ''
}

function confirmAiCreatePart() {
  if (!aiPartInput.value.trim()) return
  closeAiCreatePartDialog()
  aiCreatePart()
}

async function aiCreatePart() {
  try {
    if (!beingCreatePartNode.value) return
    await aiTest()
    bus.$emit('ai_creating_start')
    beingAiCreateNodeUid.value = beingCreatePartNode.value.getData('uid')
    mindMapDataCache.value = JSON.stringify(props.mindMap.getData())
    aiCreatingMaskVisible.value = true
    isAiCreating.value = true
    aiInstance.value = createAi(aiConfig.value)
    const partPrompt = aiPartInput.value.trim()
    const fullPrompt = partPrompt + t('ai.aiCreatePartMsgHelp')
    lastAiPrompt.value = fullPrompt
    aiInstance.value.request(
      { messages: [{ role: 'user', content: fullPrompt }] },
      (content: string) => {
        if (content) aiCreatingContent.value = content
        loopRenderOnAiCreatingPart()
      },
      (content: string) => {
        aiCreatingContent.value = content
        lastAiResponse.value = content
        const children = getPartChildrenForMerge()
        const treeData = addToTargetNode(children)
        props.mindMap.updateData(treeData)
        resetOnAiCreatingStop()
        resetAiCreatePartDialog()
      },
      () => {
        resetOnAiCreatingStop()
        resetAiCreatePartDialog()
        resetOnRenderEnd()
        ElMessage.error(t('ai.generationFailed'))
      }
    )
  } catch (error) {
    console.log(error)
  }
}

/** 将子树限制为最多 maxDepth 层（0=只保留当前层并裁掉子节点），超过的层级被裁掉 */
function limitTreeDepth(children: any[] = [], maxDepth: number): any[] {
  if (!children.length) return []
  if (maxDepth < 0) return []
  if (maxDepth === 0) return children.map((c) => ({ ...c, children: [] }))
  return children.map((c) => ({
    ...c,
    children: limitTreeDepth(c.children || [], maxDepth - 1)
  }))
}

function addToTargetNode(newChildren: any[] = []) {
  const initData = JSON.parse(mindMapDataCache.value)
  const replace = beingCreatePartReplace.value
  const walk = (node: any) => {
    if (node.data.uid === beingAiCreateNodeUid.value) {
      if (replace) {
        node.children = [...newChildren]
      } else {
        if (!node.children) node.children = []
        node.children.push(...newChildren)
      }
      return
    }
    if (node.children?.length) node.children.forEach((child: any) => walk(child))
  }
  walk(initData)
  return initData
}

/** 从 AI 子节点返回的逗号分隔字符串解析出子节点数组（每项为平级节点） */
function parsePartResponseFromCsv(raw: string): any[] {
  const str = raw.trim().replace(/\n+/g, ',')
  if (!str) return []
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ data: { text }, children: [] }))
}

function getPartChildrenForMerge(): any[] {
  const raw = aiCreatingContent.value
  let children = parsePartResponseFromCsv(raw)
  const root = { data: {} as any, children }
  addUid(root)
  children = root.children || []
  const maxDepth = DEFAULT_MAX_DEPTH - 1
  if (maxDepth >= 0) {
    children = limitTreeDepth(children, maxDepth)
  }
  return children
}

function loopRenderOnAiCreatingPart() {
  if (!aiCreatingContent.value.trim() || isLoopRendering.value) return
  isLoopRendering.value = true
  const children = getPartChildrenForMerge()
  let lastPartData = JSON.stringify(children)
  const treeData = addToTargetNode(children)

  const onRenderEnd = () => {
    checkNodeOuter()
    if (!isAiCreating.value && !aiCreatingContent.value) {
      props.mindMap.off('node_tree_render_end', onRenderEnd)
      latestUid.value = ''
      return
    }
    const children2 = getPartChildrenForMerge()
    const treeData2 = addToTargetNode(children2)
    if (isAiCreating.value) {
      const curPartData = JSON.stringify(children2)
      if (curPartData === lastPartData) {
        setTimeout(onRenderEnd, 500)
        return
      }
      lastPartData = curPartData
      props.mindMap.updateData(treeData2)
    } else {
      props.mindMap.updateData(treeData2)
      resetOnRenderEnd()
      ElMessage.success(t('ai.aiGenerationSuccess'))
    }
  }
  props.mindMap.on('node_tree_render_end', onRenderEnd)
  props.mindMap.updateData(treeData)
}

async function aiChat(
  messageList: string[] = [],
  progress: (c: string) => void = () => {},
  end: (c: string) => void = () => {},
  err: (e: any) => void = () => {}
) {
  try {
    await aiTest()
    isAiCreating.value = true
    aiInstance.value = createAi(aiConfig.value)
    aiInstance.value.request(
      { messages: messageList.map((msg) => ({ role: 'user', content: msg })) },
      (content: string) => progress(content),
      (content: string) => end(content),
      (error: any) => err(error)
    )
  } catch (error) {
    console.log(error)
  }
}

function aiChatStop() {
  if (aiInstance.value) {
    aiInstance.value.stop()
    isAiCreating.value = false
    aiInstance.value = null
  }
}

onMounted(() => {
  bus.$on('ai_create_all', aiCrateAll)
  bus.$on('ai_create_part', showAiCreatePartDialog)
  bus.$on('ai_create_part_with_options', runAiCreatePartWithOptions)
  bus.$on('ai_note_detail', runAiNoteDetail)
  bus.$on('ai_chat', aiChat)
  bus.$on('ai_chat_stop', aiChatStop)
  bus.$on('showAiConfigDialog', showAiConfigDialog)
  if (aiCreatingMaskRef.value) document.body.appendChild(aiCreatingMaskRef.value)
})

onBeforeUnmount(() => {
  bus.$off('ai_create_all', aiCrateAll)
  bus.$off('ai_create_part', showAiCreatePartDialog)
  bus.$off('ai_create_part_with_options', runAiCreatePartWithOptions)
  bus.$off('ai_note_detail', runAiNoteDetail)
  bus.$off('ai_chat', aiChat)
  bus.$off('ai_chat_stop', aiChatStop)
  bus.$off('showAiConfigDialog', showAiConfigDialog)
})
</script>

<style lang="less" scoped>
.createDialog {
  :deep(.el-dialog__body) {
    padding: 12px 20px;
  }
}

.inputBox {
  .tip {
    margin-top: 12px;

    &.warning {
      color: #f56c6c;
    }
  }
}

.aiCreatingMask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  background-color: transparent;

  .btn {
    position: absolute;
    left: 50%;
    top: 100px;
    transform: translateX(-50%);
  }
}

</style>
