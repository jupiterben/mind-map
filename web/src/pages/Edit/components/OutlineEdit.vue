<template>
  <div
    class="outlineEditContainer"
    :class="{ isDark: isDark }"
    ref="outlineEditContainer"
    v-if="isOutlineEdit"
  >
    <div class="btnList">
      <el-tooltip
        class="item"
        effect="dark"
        :content="$t('outline.print')"
        placement="top"
      >
        <div class="btn" @click="onPrint">
          <span class="icon iconfont iconprinting"></span>
        </div>
      </el-tooltip>
      <div class="btn" @click="onClose">
        <span class="icon iconfont iconguanbi"></span>
      </div>
    </div>
    <div class="outlineEditBox" id="fullScreenOutlineEditBox" ref="outlineEditBox">
      <div class="outlineEdit">
        <el-tree
          ref="tree"
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
          @current-change="onCurrentChange"
        >
          <template #default="{ node, data: nodeData }">
            <span class="customNode" :data-id="nodeData.uid">
              <span
                class="nodeEdit"
                :contenteditable="!isReadonly"
                :key="editKey"
                @blur="onBlur($event, node)"
                @keydown.stop="onNodeInputKeydown($event, node)"
                @keyup.stop
                @paste="onPaste($event, node)"
                v-html="node.label"
              ></span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useStoreMixin } from '@/mixins/storeMixin'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import {
  nodeRichTextToTextWithWrap,
  textToNodeRichTextWithWrap,
  createUid,
  simpleDeepClone,
  htmlEscape,
  handleInputPasteText
} from 'simple-mind-map/src/utils'
import { storeData } from '@/api'
import { printOutline } from '@/utils'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  mindMap: any
}>()

const { setIsOutlineEdit } = useStoreMixin()
const bus = getBus()
const { t } = useI18n()

const isDark = computed(() => useStore().isDark ?? false)
const isOutlineEdit = computed(() => useStore().isOutlineEdit ?? false)
const isReadonly = computed(() => useStore().isReadonly ?? false)

const outlineEditContainer = ref<HTMLElement | null>(null)
const outlineEditBox = ref<HTMLElement | null>(null)
const tree = ref<any>(null)
const data = ref<any[]>([])
const defaultProps = { label: 'label' }
const currentData = ref<any>(null)
const editKey = ref(0)

function getKey() {
  editKey.value = Math.random()
}

function refresh() {
  let treeData = props.mindMap.getData()
  treeData.root = true
  const walk = (root: any) => {
    let text = root.data.richText
      ? nodeRichTextToTextWithWrap(root.data.text)
      : root.data.text
    text = htmlEscape(text)
    text = text.replace(/\n/g, '<br>')
    root.textCache = text
    root.label = text
    root.uid = root.data.uid
    if (root.children?.length) {
      root.children.forEach((item: any) => walk(item))
    }
  }
  walk(treeData)
  data.value = [treeData]
}

function checkAllowDrag(node: any) {
  return !node.data.root
}

function onNodeDrop() {
  save()
}

function onCurrentChange(nodeData: any) {
  currentData.value = nodeData
}

function onBlur(e: Event, node: any) {
  const target = e.target as HTMLElement
  if (node.data.textCache === target.innerHTML) return
  const richText = node.data.data.richText
  const text = richText ? target.innerHTML : target.innerText
  node.data.data.text = richText ? textToNodeRichTextWithWrap(text) : text
  node.data.textCache = target.innerHTML
  save()
}

function onNodeInputKeydown(e: KeyboardEvent, node: any) {
  const richText = !!node.data.data.richText
  const uid = createUid()
  const text = t('outline.nodeDefaultText')
  const newData = {
    textCache: text,
    uid,
    label: text,
    data: {
      text: richText ? textToNodeRichTextWithWrap(text) : text,
      uid,
      richText
    },
    children: []
  }
  if (e.keyCode === 13 && !e.shiftKey) {
    e.preventDefault()
    if (node.data.root) return
    tree.value?.insertAfter(newData, node)
  }
  if (e.keyCode === 9) {
    e.preventDefault()
    if (e.shiftKey) {
      tree.value?.insertAfter(node.data, node.parent)
      tree.value?.remove(node)
    } else {
      tree.value?.append(newData, node)
    }
  }
  save()
  nextTick(() => {
    tree.value?.setCurrentKey(uid)
    const el = document.querySelector(`.customNode[data-id="${uid}"] .nodeEdit`)
    if (el) {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      selection?.removeAllRanges()
      selection?.addRange(range)
      scrollTo((el as HTMLElement).offsetTop)
    }
  })
}

function onKeyDown(e: KeyboardEvent) {
  if (!isOutlineEdit.value) return
  if ([46, 8].includes(e.keyCode) && currentData.value) {
    e.stopPropagation()
    tree.value?.remove(currentData.value)
    currentData.value = null
    save()
  }
}

function onPaste(e: Event) {
  handleInputPasteText(e)
}

function onPrint() {
  if (outlineEditBox.value) printOutline(outlineEditBox.value)
}

function onClose() {
  setIsOutlineEdit(false)
  bus.$emit('setData', getData())
}

function scrollTo(y: number) {
  const container = outlineEditBox.value
  if (!container) return
  const height = container.offsetHeight
  const top = container.scrollTop
  y += 50
  if (y > top + height) {
    container.scrollTo(0, y - height / 2)
  }
}

function getData() {
  const newNode: any = {}
  const node = data.value[0]
  const walk = (root: any, newRoot: any) => {
    newRoot.data = root.data
    newRoot.children = []
    ;(root.children || []).forEach((child: any) => {
      const newChild: any = {}
      newRoot.children.push(newChild)
      walk(child, newChild)
    })
  }
  walk(node, newNode)
  return simpleDeepClone(newNode)
}

function save() {
  storeData({ root: getData() })
}

watch(isOutlineEdit, (val) => {
  if (val) {
    refresh()
    nextTick(() => {
      if (outlineEditContainer.value) document.body.appendChild(outlineEditContainer.value)
    })
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style lang="less" scoped>
.outlineEditContainer {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1999;
  background-color: #fff;
  overflow: hidden;

  &.isDark {
    background-color: #262a2e;

    .btnList {
      .btn {
        .icon {
          color: #fff;
        }
      }
    }
  }

  .btnList {
    position: absolute;
    right: 40px;
    top: 20px;
    display: flex;
    align-items: center;

    .btn {
      cursor: pointer;
      margin-left: 12px;

      .icon {
        font-size: 28px;
      }
    }
  }

  .outlineEditBox {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 50px 0;

    .outlineEdit {
      width: 1000px;
      height: 100%;
      height: max-content;
      margin: 0 auto;

      :deep(.customNode) {
        .nodeEdit {
          max-width: 800px;
        }
      }
    }
  }
}

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
