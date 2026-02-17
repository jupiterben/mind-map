<template>
  <el-tree
    ref="treeRef"
    class="outlineTree"
    node-key="uid"
    draggable
    default-expand-all
    :class="{ isDark: isDark }"
    :data="data"
    :props="defaultProps"
    :highlight-current="true"
    :expand-on-click-node="false"
    :allow-drag="checkAllowDrag"
    @node-drop="onNodeDrop"
    @node-drag-start="onNodeDragStart"
    @node-drag-end="onNodeDragEnd"
    @current-change="onCurrentChange"
    @mouseenter="isInTreArea = true"
    @mouseleave="isInTreArea = false"
  >
    <template #default="{ node, data: nodeData }">
      <span
        class="customNode"
        :data-id="nodeData.uid"
        @click="onClick(nodeData)"
      >
        <span
          class="nodeEdit"
          :contenteditable="!isReadonly"
          :key="getKey()"
          @keydown.stop="onNodeInputKeydown($event, node)"
          @keyup.stop
          @blur="onBlur($event, node)"
          @paste="onPaste($event, node)"
          v-html="node.label"
        ></span>
      </span>
    </template>
  </el-tree>
</template>

<script setup lang="ts">
import { ref, nextTick, getCurrentInstance, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import {
  nodeRichTextToTextWithWrap,
  textToNodeRichTextWithWrap,
  createUid,
  htmlEscape,
  handleInputPasteText
} from 'simple-mind-map/src/utils'

const props = defineProps<{
  mindMap: {
    getData: () => { data: unknown; children?: unknown[]; root?: boolean }
    execCommand: (cmd: string, ...args: unknown[]) => void
    renderer: {
      findNodeByUid: (uid: string) => { setText: (t: string, rich?: boolean) => void; nodeData: { data: { isActive?: boolean } }; isRoot?: boolean } | null
      textEdit: { hideEditTextBox: () => void }
    }
  }
}>()
const emit = defineEmits<{ (e: 'scrollTo', y: number): void }>()
const store = useStore()
const { isDark, isReadonly } = storeToRefs(store)
const { setIsDragOutlineTreeNode } = store
const bus = getBus()

const treeRef = ref<{ setCurrentKey: (k: string) => void; getNode: (k: string) => { data: unknown }; remove: (data: unknown) => void } | null>(null)
const data = ref<unknown[]>([])
const defaultProps = { label: 'label' }
const currentData = ref<unknown>(null)
const notHandleDataChange = ref(false)
const isHandleNodeTreeRenderEnd = ref(false)
const beInsertNodeUid = ref('')
const insertType = ref('')
const isInTreArea = ref(false)
const isAfterCreateNewNode = ref(false)

function handleHideTextEdit() {
  if (notHandleDataChange.value) {
    notHandleDataChange.value = false
    refresh()
  }
}

function handleDataChange() {
  if (notHandleDataChange.value) {
    notHandleDataChange.value = false
    isAfterCreateNewNode.value = false
    return
  }
  if (isAfterCreateNewNode.value) {
    isAfterCreateNewNode.value = false
    return
  }
  refresh()
}

function handleNodeTreeRenderEnd() {
  if (insertType.value) {
    const fn = insertType.value as 'insertNode' | 'moveUp' | 'insertChildNode'
    if (fn === 'insertNode') insertNode()
    else if (fn === 'moveUp') moveUp()
    else if (fn === 'insertChildNode') insertChildNode()
    insertType.value = ''
    return
  }
  if (isHandleNodeTreeRenderEnd.value) {
    isHandleNodeTreeRenderEnd.value = false
    refresh()
    nextTick(() => afterCreateNewNode())
  }
}

function refresh() {
  const rootData = props.mindMap.getData()
  ;(rootData as { root?: boolean }).root = true
  const walk = (root: { data: { richText?: boolean; text?: string; uid?: string }; textCache?: string; label?: string; uid?: string; children?: unknown[] }) => {
    let text = root.data.richText
      ? nodeRichTextToTextWithWrap(root.data.text)
      : root.data.text
    text = htmlEscape(text as string)
    text = (text as string).replace(/\n/g, '<br>')
    root.textCache = text as string
    root.label = text as string
    root.uid = root.data.uid
    if (root.children && root.children.length > 0) {
      root.children.forEach((item) => walk(item as { data: { richText?: boolean; text?: string; uid?: string }; textCache?: string; label?: string; uid?: string; children?: unknown[] }))
    }
  }
  walk(rootData as { data: { richText?: boolean; text?: string; uid?: string }; textCache?: string; label?: string; uid?: string; children?: unknown[] })
  data.value = [rootData]
}

function afterCreateNewNode() {
  const id = beInsertNodeUid.value
  if (id && treeRef.value) {
    try {
      isAfterCreateNewNode.value = true
      treeRef.value.setCurrentKey(id)
      const node = treeRef.value.getNode(id)
      onCurrentChange(node.data)
      onClick(node.data)
      const el = document.querySelector(`.customNode[data-id="${id}"] .nodeEdit`)
      if (el) {
        const selection = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(el)
        selection?.removeAllRanges()
        selection?.addRange(range)
        emit('scrollTo', (el as HTMLElement).offsetTop)
      }
    } catch (err) {
      console.log(err)
    }
  }
  beInsertNodeUid.value = ''
}

function checkAllowDrag(node: { data: { root?: boolean } }) {
  return !node.data.root
}

function onBlur(e: Event, node: { data: { textCache?: string; data?: { richText?: boolean }; uid?: string } }) {
  const target = e.target as HTMLElement
  if (node.data.textCache === target.innerHTML) {
    if (insertType.value) {
      const fn = insertType.value as 'insertNode' | 'moveUp' | 'insertChildNode'
      if (fn === 'insertNode') insertNode()
      else if (fn === 'moveUp') moveUp()
      else if (fn === 'insertChildNode') insertChildNode()
      insertType.value = ''
    }
    return
  }
  const richText = node.data.data?.richText
  const text = richText ? target.innerHTML : target.innerText
  const targetNode = props.mindMap.renderer.findNodeByUid(node.data.uid as string)
  if (!targetNode) return
  notHandleDataChange.value = true
  if (richText) {
    targetNode.setText(textToNodeRichTextWithWrap(text), true)
  } else {
    targetNode.setText(text)
  }
}

function onPaste(e: Event) {
  handleInputPasteText(e)
}

function getKey() {
  return Math.random()
}

function onNodeInputKeydown(e: KeyboardEvent, node: unknown) {
  if (e.keyCode === 13 && !e.shiftKey) {
    e.preventDefault()
    insertType.value = 'insertNode'
    ;(e.target as HTMLElement).blur()
  }
  if (e.keyCode === 9) {
    e.preventDefault()
    if (e.shiftKey) {
      insertType.value = 'moveUp'
      ;(e.target as HTMLElement).blur()
    } else {
      insertType.value = 'insertChildNode'
      ;(e.target as HTMLElement).blur()
    }
  }
}

function moveUp() {
  props.mindMap.execCommand('MOVE_UP_ONE_LEVEL')
}

function insertNode() {
  notHandleDataChange.value = true
  isHandleNodeTreeRenderEnd.value = true
  beInsertNodeUid.value = createUid()
  props.mindMap.execCommand('INSERT_NODE', false, [], { uid: beInsertNodeUid.value })
}

function insertChildNode() {
  notHandleDataChange.value = true
  isHandleNodeTreeRenderEnd.value = true
  beInsertNodeUid.value = createUid()
  props.mindMap.execCommand('INSERT_CHILD_NODE', false, [], { uid: beInsertNodeUid.value })
}

function onClick(data: { uid: string }) {
  notHandleDataChange.value = true
  const targetNode = props.mindMap.renderer.findNodeByUid(data.uid)
  if (targetNode?.nodeData?.data?.isActive) return
  props.mindMap.execCommand('GO_TARGET_NODE', data.uid, () => {
    notHandleDataChange.value = false
  })
}

function onNodeDragStart() {
  setIsDragOutlineTreeNode(true)
}

function onNodeDragEnd() {
  setIsDragOutlineTreeNode(false)
}

function onNodeDrop(
  data: { data: { uid: string } },
  target: { data: { uid: string } },
  postion: string
) {
  notHandleDataChange.value = true
  const node = props.mindMap.renderer.findNodeByUid(data.data.uid)
  const targetNode = props.mindMap.renderer.findNodeByUid(target.data.uid)
  if (!node || !targetNode) return
  switch (postion) {
    case 'before':
      props.mindMap.execCommand('INSERT_BEFORE', node, targetNode)
      break
    case 'after':
      props.mindMap.execCommand('INSERT_AFTER', node, targetNode)
      break
    case 'inner':
      props.mindMap.execCommand('MOVE_NODE_TO', node, targetNode)
      break
    default:
      break
  }
}

function onCurrentChange(nodeData: unknown) {
  currentData.value = nodeData
}

function onKeyDown(e: KeyboardEvent) {
  if (!isInTreArea.value) return
  if ([46, 8].includes(e.keyCode) && currentData.value) {
    e.stopPropagation()
    props.mindMap.renderer.textEdit.hideEditTextBox()
    const node = props.mindMap.renderer.findNodeByUid((currentData.value as { uid: string }).uid)
    if (node && !node.isRoot && treeRef.value) {
      notHandleDataChange.value = true
      treeRef.value.remove(currentData.value)
      props.mindMap.execCommand('REMOVE_NODE', [node])
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  bus.$on('data_change', handleDataChange)
  bus.$on('node_tree_render_end', handleNodeTreeRenderEnd)
  bus.$on('hide_text_edit', handleHideTextEdit)
  refresh()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  bus.$off('data_change', handleDataChange)
  bus.$off('node_tree_render_end', handleNodeTreeRenderEnd)
  bus.$off('hide_text_edit', handleHideTextEdit)
})

const instance = getCurrentInstance()
defineExpose({
  get $el() {
    return instance?.proxy?.$el as HTMLElement
  }
})
</script>

<style lang="less" scoped>
.customNode {
  width: 100%;
  color: rgba(0, 0, 0, 0.85);
  font-weight: bold;

  .nodeEdit {
    outline: none;
    white-space: normal;
    padding-right: 20px;
  }
}
</style>
<style lang="less" scoped>
@import url('../../../style/outlineTree.less');
</style>
