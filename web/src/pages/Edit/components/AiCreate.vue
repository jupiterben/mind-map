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
    <!-- AI续写：根据 precedent 节点自动生成 prompt，可编辑 -->
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
    <!-- 调试：可编辑提示词，手动发送 AI 请求并查看返回 -->
    <div class="aiDebugPanel" v-show="showAiDebug">
      <div class="aiDebugHeader">
        <span>{{ $t('ai.debugTitle') }}</span>
        <span>
          <el-button size="small" type="primary" :loading="isDebugRequesting" :disabled="!debugPromptEdit.trim()" @click="debugSendRequest">
            {{ $t('ai.debugSend') }}
          </el-button>
          <el-button size="small" text @click="debugPromptEdit = ''; lastAiResponse = ''">{{ $t('ai.debugClear') }}</el-button>
        </span>
      </div>
      <div class="aiDebugSection">
        <div class="aiDebugLabel">{{ $t('ai.debugPrompt') }}</div>
        <el-input v-model="debugPromptEdit" type="textarea" :rows="4" class="aiDebugTextarea" :placeholder="$t('ai.debugPromptPlaceholder')" />
      </div>
      <div class="aiDebugSection" v-if="lastAiResponse">
        <div class="aiDebugLabel">{{ $t('ai.debugResponse') }}</div>
        <pre class="aiDebugContent">{{ lastAiResponse }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import Ai from '@/utils/ai'
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
/** 调试：最近一次发送的提示词（续写时会写入，调试面板可编辑） */
const lastAiPrompt = ref('')
/** 调试面板内编辑的提示词（与 lastAiPrompt 同步，便于手动修改后发送） */
const debugPromptEdit = ref('')
/** 调试：最近一次 AI 续写返回的原始内容 */
const lastAiResponse = ref('')
/** 调试：是否正在手动发送请求 */
const isDebugRequesting = ref(false)
/** 是否显示调试面板（可通过 bus 或默认 true 在开发时显示） */
const showAiDebug = ref(true)

function showAiConfigDialog() {
  aiConfigDialogVisible.value = true
}

async function aiTest() {
  const config = aiConfig.value
  if (!(config?.api && config?.key && config?.model)) {
    showAiConfigDialog()
    throw new Error(t('ai.configurationMissing'))
  }
  if (config.provider === 'volcano_ark' && !config?.port) {
    showAiConfigDialog()
    throw new Error(t('ai.configurationMissing'))
  }
  // DeepSeek 走 Vite 代理，无需检测本地服务；火山方舟仍依赖本地代理服务
  if (config.provider !== 'deepseek') {
    try {
      await fetch(`http://localhost:${config.port}/ai/test`, { method: 'GET' })
    } catch (error) {
      throw new Error(t('ai.connectFailed'))
    }
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
  aiInstance.value = new Ai({ port: aiConfig.value.port })
  aiInstance.value.init(aiConfig.value.provider === 'deepseek' ? 'deepseek' : 'huoshan', aiConfig.value)
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
    aiInstance.value = new Ai({ port: aiConfig.value.port })
    aiInstance.value.init(aiConfig.value.provider === 'deepseek' ? 'deepseek' : 'huoshan', aiConfig.value)
    const partPrompt = aiPartInput.value.trim()
    const fullPrompt = partPrompt + t('ai.aiCreatePartMsgHelp')
    lastAiPrompt.value = fullPrompt
    debugPromptEdit.value = fullPrompt
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

/** 从 AI 续写返回的逗号分隔字符串解析出子节点数组（每项为平级节点） */
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
    aiInstance.value = new Ai({ port: aiConfig.value.port })
    aiInstance.value.init(aiConfig.value.provider === 'deepseek' ? 'deepseek' : 'huoshan', aiConfig.value)
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

/** 调试面板：用当前编辑的提示词手动发 AI 请求，结果展示在调试面板 */
async function debugSendRequest() {
  const prompt = debugPromptEdit.value.trim()
  if (!prompt || isAiCreating.value || isDebugRequesting.value) return
  try {
    await aiTest()
    isDebugRequesting.value = true
    lastAiPrompt.value = prompt
    lastAiResponse.value = ''
    const debugAi = new Ai({ port: aiConfig.value.port })
    debugAi.init(aiConfig.value.provider === 'deepseek' ? 'deepseek' : 'huoshan', aiConfig.value)
    debugAi.request(
      { messages: [{ role: 'user', content: prompt }] },
      () => {},
      (content: string) => {
        lastAiResponse.value = content
        isDebugRequesting.value = false
      },
      () => {
        isDebugRequesting.value = false
        ElMessage.error(t('ai.generationFailed'))
      }
    )
  } catch (e) {
    isDebugRequesting.value = false
    console.log(e)
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
  bus.$on('ai_chat', aiChat)
  bus.$on('ai_chat_stop', aiChatStop)
  bus.$on('showAiConfigDialog', showAiConfigDialog)
  if (aiCreatingMaskRef.value) document.body.appendChild(aiCreatingMaskRef.value)
})

onBeforeUnmount(() => {
  bus.$off('ai_create_all', aiCrateAll)
  bus.$off('ai_create_part', showAiCreatePartDialog)
  bus.$off('ai_create_part_with_options', runAiCreatePartWithOptions)
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

.aiDebugPanel {
  position: fixed;
  right: 24px;
  bottom: 180px;
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

  .aiDebugHeader {
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #333;
    background: #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
}
</style>
