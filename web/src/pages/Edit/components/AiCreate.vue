<template>
  <div>
    <!-- 客户端连接失败提示弹窗 -->
    <el-dialog
      class="clientTipDialog"
      :title="$t('ai.connectFailedTitle')"
      v-model="clientTipDialogVisible"
      width="400px"
      append-to-body
    >
      <div class="tipBox">
        <p>{{ $t('ai.connectFailedTip') }}</p>
        <p>
          {{ $t('ai.connectFailedCheckTip1')
          }}<a
            href="https://pan.baidu.com/s/1huasEbKsGNH2Af68dvWiOg?pwd=3bp3"
            >{{ $t('ai.baiduNetdisk') }}</a
          >、<a href="https://github.com/wanglin2/mind-map/releases">Github</a>
        </p>
        <p>{{ $t('ai.connectFailedCheckTip2') }}</p>
        <p>{{ $t('ai.connectFailedCheckTip3') }}</p>
        <p>
          {{ $t('ai.connectFailedCheckTip4')
          }}<el-button size="small" @click="testConnect">{{
            $t('ai.connectionDetection')
          }}</el-button>
        </p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="clientTipDialogVisible = false">{{
            $t('ai.close')
          }}</el-button>
        </div>
      </template>
    </el-dialog>
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
    <!-- AI续写 -->
    <el-dialog
      class="createDialog"
      :title="$t('ai.aiCreatePart')"
      v-model="createPartDialogVisible"
      width="450px"
      append-to-body
    >
      <div class="inputBox">
        <el-input type="textarea" :rows="5" v-model="aiPartInput"> </el-input>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeAiCreatePartDialog">{{ $t('ai.cancel') }}</el-button>
          <el-button type="primary" @click="confirmAiCreatePart">{{ $t('ai.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
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
const clientTipDialogVisible = ref(false)
const createDialogVisible = ref(false)
const aiInput = ref('')
const aiCreatingMaskVisible = ref(false)
const aiConfigDialogVisible = ref(false)
const mindMapDataCache = ref('')
const beingAiCreateNodeUid = ref('')
const createPartDialogVisible = ref(false)
const aiPartInput = ref('')
const beingCreatePartNode = ref<any>(null)

function showAiConfigDialog() {
  aiConfigDialogVisible.value = true
}

async function testConnect() {
  try {
    await fetch(`http://localhost:${aiConfig.value.port}/ai/test`, { method: 'GET' })
    ElMessage.success(t('ai.connectSuccessful'))
    clientTipDialogVisible.value = false
    createDialogVisible.value = true
  } catch (error) {
    ElMessage.error(t('ai.connectFailed'))
  }
}

async function aiTest() {
  const config = aiConfig.value
  if (!(config?.api && config?.key && config?.model && config?.port)) {
    showAiConfigDialog()
    throw new Error(t('ai.configurationMissing'))
  }
  try {
    await fetch(`http://localhost:${config.port}/ai/test`, { method: 'GET' })
  } catch (error) {
    clientTipDialogVisible.value = true
    throw new Error(t('ai.connectFailed'))
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
  aiInstance.value.init('huoshan', aiConfig.value)
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

function showAiCreatePartDialog(node: any) {
  beingCreatePartNode.value = node
  const currentMindMapData = props.mindMap.getData()
  aiPartInput.value = `${t('ai.aiCreatePartMsgPrefix')}${getStrWithBrFromHtml(currentMindMapData.data.text)}${t('ai.aiCreatePartMsgCenter')}${getStrWithBrFromHtml(node.getData('text'))}${t('ai.aiCreatePartMsgPostfix')}`
  createPartDialogVisible.value = true
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
    beingAiCreateNodeUid.value = beingCreatePartNode.value.getData('uid')
    mindMapDataCache.value = JSON.stringify(props.mindMap.getData())
    aiCreatingMaskVisible.value = true
    isAiCreating.value = true
    aiInstance.value = new Ai({ port: aiConfig.value.port })
    aiInstance.value.init('huoshan', aiConfig.value)
    aiInstance.value.request(
      { messages: [{ role: 'user', content: aiPartInput.value.trim() + t('ai.aiCreatePartMsgHelp') }] },
      (content: string) => {
        if (content) {
          const arr = content.split(/\n+/)
          aiCreatingContent.value = arr.splice(0, arr.length - 1).join('\n')
        }
        loopRenderOnAiCreatingPart()
      },
      (content: string) => {
        aiCreatingContent.value = content
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

function addToTargetNode(newChildren: any[] = []) {
  const initData = JSON.parse(mindMapDataCache.value)
  const walk = (node: any) => {
    if (node.data.uid === beingAiCreateNodeUid.value) {
      if (!node.children) node.children = []
      node.children.push(...newChildren)
      return
    }
    if (node.children?.length) node.children.forEach((child: any) => walk(child))
  }
  walk(initData)
  return initData
}

function loopRenderOnAiCreatingPart() {
  if (!aiCreatingContent.value.trim() || isLoopRendering.value) return
  isLoopRendering.value = true
  const partData = transformMarkdownTo(aiCreatingContent.value)
  addUid(partData)
  let lastPartData = JSON.stringify(partData)
  const treeData = addToTargetNode(partData.children || [])

  const onRenderEnd = () => {
    checkNodeOuter()
    if (!isAiCreating.value && !aiCreatingContent.value) {
      props.mindMap.off('node_tree_render_end', onRenderEnd)
      latestUid.value = ''
      return
    }
    const partData2 = transformMarkdownTo(aiCreatingContent.value)
    addUid(partData2)
    const treeData2 = addToTargetNode(partData2.children || [])
    if (isAiCreating.value) {
      const curPartData = JSON.stringify(partData2)
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
    aiInstance.value.init('huoshan', aiConfig.value)
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
  bus.$on('ai_chat', aiChat)
  bus.$on('ai_chat_stop', aiChatStop)
  bus.$on('showAiConfigDialog', showAiConfigDialog)
  if (aiCreatingMaskRef.value) document.body.appendChild(aiCreatingMaskRef.value)
})

onBeforeUnmount(() => {
  bus.$off('ai_create_all', aiCrateAll)
  bus.$off('ai_create_part', showAiCreatePartDialog)
  bus.$off('ai_chat', aiChat)
  bus.$off('ai_chat_stop', aiChatStop)
  bus.$off('showAiConfigDialog', showAiConfigDialog)
})
</script>

<style lang="less" scoped>
.clientTipDialog,
.createDialog {
  :deep(.el-dialog__body) {
    padding: 12px 20px;
  }
}

.tipBox {
  p {
    margin-bottom: 12px;

    a {
      color: #409eff;
    }
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
