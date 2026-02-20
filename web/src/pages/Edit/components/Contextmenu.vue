<template>
  <div
    class="contextmenuContainer listBox"
    v-if="isShow"
    ref="contextmenuRef"
    :style="{ left: left + 'px', top: top + 'px' }"
    :class="{ isDark: isDark }"
  >
    <template v-if="type === 'node'">
      <div
        class="item"
        @click="exec('INSERT_NODE', insertNodeBtnDisabled)"
        :class="{ disabled: insertNodeBtnDisabled }"
      >
        <span class="name">{{ $t('contextmenu.insertSiblingNode') }}</span>
        <span class="desc">Enter</span>
      </div>
      <div
        class="item"
        @click="exec('INSERT_CHILD_NODE')"
        :class="{ disabled: isGeneralization }"
      >
        <span class="name">{{ $t('contextmenu.insertChildNode') }}</span>
        <span class="desc">Tab</span>
      </div>
      <div
        class="item"
        @click="exec('INSERT_PARENT_NODE')"
        :class="{ disabled: insertNodeBtnDisabled }"
      >
        <span class="name">{{ $t('contextmenu.insertParentNode') }}</span>
        <span class="desc">Shift + Tab</span>
      </div>
      <div
        class="item"
        @click="exec('ADD_GENERALIZATION')"
        :class="{ disabled: insertNodeBtnDisabled }"
      >
        <span class="name">{{ $t('contextmenu.insertSummary') }}</span>
        <span class="desc">Ctrl + G</span>
      </div>
      <div class="splitLine"></div>
      <div
        class="item"
        @click="exec('UP_NODE')"
        :class="{ disabled: upNodeBtnDisabled }"
      >
        <span class="name">{{ $t('contextmenu.moveUpNode') }}</span>
        <span class="desc">Ctrl + ↑</span>
      </div>
      <div
        class="item"
        @click="exec('DOWN_NODE')"
        :class="{ disabled: downNodeBtnDisabled }"
      >
        <span class="name">{{ $t('contextmenu.moveDownNode') }}</span>
        <span class="desc">Ctrl + ↓</span>
      </div>
      <div class="item" @click="exec('UNEXPAND_ALL')">
        <span class="name">{{ $t('contextmenu.unExpandNodeChild') }}</span>
      </div>
      <div class="item" @click="exec('EXPAND_ALL')">
        <span class="name">{{ $t('contextmenu.expandNodeChild') }}</span>
      </div>
      <div class="splitLine"></div>
      <div class="item danger" @click="exec('REMOVE_NODE')">
        <span class="name">{{ $t('contextmenu.deleteNode') }}</span>
        <span class="desc">Delete</span>
      </div>
      <div class="item danger" @click="exec('REMOVE_CURRENT_NODE')">
        <span class="name">{{ $t('contextmenu.deleteCurrentNode') }}</span>
        <span class="desc">Shift + Backspace</span>
      </div>
      <div class="splitLine"></div>
      <div
        class="item"
        @click="exec('COPY_NODE')"
        :class="{ disabled: isGeneralization }"
      >
        <span class="name">{{ $t('contextmenu.copyNode') }}</span>
        <span class="desc">Ctrl + C</span>
      </div>
      <div
        class="item"
        @click="exec('CUT_NODE')"
        :class="{ disabled: isGeneralization }"
      >
        <span class="name">{{ $t('contextmenu.cutNode') }}</span>
        <span class="desc">Ctrl + X</span>
      </div>
      <div class="item" @click="exec('PASTE_NODE')">
        <span class="name">{{ $t('contextmenu.pasteNode') }}</span>
        <span class="desc">Ctrl + V</span>
      </div>
      <div class="splitLine"></div>
      <div class="item" @click="exec('REMOVE_HYPERLINK')" v-if="hasHyperlink">
        <span class="name">{{ $t('contextmenu.removeHyperlink') }}</span>
      </div>
      <div class="item" @click="exec('REMOVE_NOTE')" v-if="hasNote">
        <span class="name">{{ $t('contextmenu.removeNote') }}</span>
      </div>
      <div class="item" @click="exec('REMOVE_CUSTOM_STYLES')">
        <span class="name">{{ $t('contextmenu.removeCustomStyles') }}</span>
      </div>
      <div class="item" @click="exec('EXPORT_CUR_NODE_TO_PNG')">
        <span class="name">{{ $t('contextmenu.exportNodeToPng') }}</span>
      </div>
      <div class="splitLine"></div>
      <div class="item" @click="smartIcon">
        <span class="name">{{ $t('contextmenu.smartIcon') }}</span>
      </div>
      <div class="splitLine" v-if="enableAi"></div>
      <div class="item" @click="aiCreate" v-if="enableAi">
        <span class="name">{{ $t('contextmenu.aiCreate') }}</span>
      </div>
      <div class="item" @click="aiNoteDetail" v-if="enableAi">
        <span class="name">{{ $t('contextmenu.aiNoteDetail') }}</span>
      </div>
    </template>
    <template v-if="type === 'svg'">
      <div class="item" @click="exec('RETURN_CENTER')">
        <span class="name">{{ $t('contextmenu.backCenter') }}</span>
        <span class="desc">Ctrl + Enter</span>
      </div>
      <div class="splitLine"></div>
      <div class="item" @click="exec('EXPAND_ALL')">
        <span class="name">{{ $t('contextmenu.expandAll') }}</span>
      </div>
      <div class="item" @click="exec('UNEXPAND_ALL')">
        <span class="name">{{ $t('contextmenu.unExpandAll') }}</span>
      </div>
      <div class="item">
        <span class="name">{{ $t('contextmenu.expandTo') }}</span>
        <span class="el-icon-arrow-right"></span>
        <div
          class="subItems listBox"
          :class="{ isDark: isDark, showLeft: subItemsShowLeft }"
          style="top: -10px"
        >
          <div
            class="item"
            v-for="(item, index) in expandList"
            :key="item"
            @click="exec('UNEXPAND_TO_LEVEL', false, index + 1)"
          >
            {{ item }}
          </div>
        </div>
      </div>
      <div class="splitLine"></div>
      <div class="item" @click="exec('RESET_LAYOUT')">
        <span class="name">{{ $t('contextmenu.arrangeLayout') }}</span>
        <span class="desc">Ctrl + L</span>
      </div>
      <div class="item" @click="exec('FIT_CANVAS')">
        <span class="name">{{ $t('contextmenu.fitCanvas') }}</span>
        <span class="desc">Ctrl + i</span>
      </div>
      <div class="item" @click="exec('TOGGLE_ZEN_MODE')">
        <span class="name">{{ $t('contextmenu.zenMode') }}</span>
        {{ isZenMode ? '√' : '' }}
      </div>
      <div class="splitLine"></div>
      <div class="item" @click="exec('REMOVE_ALL_NODE_CUSTOM_STYLES')">
        <span class="name">{{
          $t('contextmenu.removeAllNodeCustomStyles')
        }}</span>
      </div>
      <div class="item">
        <span class="name">{{ $t('contextmenu.copyToClipboard') }}</span>
        <span class="el-icon-arrow-right"></span>
        <div
          class="subItems listBox"
          :class="{ isDark: isDark, showLeft: subItemsShowLeft }"
          style="top: -130px"
        >
          <div
            class="item"
            v-for="item in copyList"
            :key="item.value"
            @click="copyToClipboard(item.value)"
          >
            {{ item.name }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, inject } from 'vue'
import { useStoreMixin } from '@/mixins/storeMixin'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { getTextFromHtml, imgToDataUrl } from 'simple-mind-map/src/utils'
import { transformToMarkdown } from 'simple-mind-map/src/parse/toMarkdown'
import { transformToTxt } from 'simple-mind-map/src/parse/toTxt'
import { setDataToClipboard, setImgToClipboard, copy } from '@/utils'
import { numberTypeList, numberLevelList } from '@/config'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ mindMap: any }>()
const { setLocalConfig, isZenMode, enableAi } = useStoreMixin()
const bus = getBus()
const { t } = useI18n()

const contextmenuRef = ref<HTMLElement | null>(null)
const isShow = ref(false)
const left = ref(0)
const top = ref(0)
const node = ref<any>(null)
const type = ref('')
const isMousedown = ref(false)
const mosuedownX = ref(0)
const mosuedownY = ref(0)
const enableCopyToClipboardApi = !!navigator.clipboard
const numberType = ref('')
const numberLevel = ref('')
const subItemsShowLeft = ref(false)
const isNodeMousedown = ref(false)

const isDark = computed(() => useStore().isDark ?? false)
const expandList = computed(() => [
  t('contextmenu.level1'),
  t('contextmenu.level2'),
  t('contextmenu.level3'),
  t('contextmenu.level4'),
  t('contextmenu.level5'),
  t('contextmenu.level6')
])
const copyList = computed(() => {
  const list = [
    { name: t('contextmenu.copyToSmm'), value: 'smm' },
    { name: t('contextmenu.copyToJson'), value: 'json' },
    { name: t('contextmenu.copyToMarkdown'), value: 'md' },
    { name: t('contextmenu.copyToTxt'), value: 'txt' }
  ]
  if (enableCopyToClipboardApi) list.push({ name: t('contextmenu.copyToPng'), value: 'png' })
  return list
})
const insertNodeBtnDisabled = computed(
  () => !node.value || node.value.isRoot || node.value.isGeneralization
)
const upNodeBtnDisabled = computed(() => {
  if (!node.value || node.value.isRoot || node.value.isGeneralization) return true
  return node.value.parent.children.findIndex((item: any) => item === node.value) === 0
})
const downNodeBtnDisabled = computed(() => {
  if (!node.value || node.value.isRoot || node.value.isGeneralization) return true
  const children = node.value.parent.children
  return children.findIndex((item: any) => item === node.value) === children.length - 1
})
const isGeneralization = computed(() => node.value?.isGeneralization)
const hasHyperlink = computed(() => !!node.value?.getData('hyperlink'))
const hasNote = computed(() => !!node.value?.getData('note'))
const { locale } = useI18n()
const numberTypeListComputed = computed(
  () => numberTypeList[locale.value ?? (locale as any)] || numberTypeList.zh
)
const numberLevelListComputed = computed(
  () => numberLevelList[locale.value ?? (locale as any)] || numberLevelList.zh
)
const hasCheckbox = computed(() => !!node.value?.getData('checkbox'))
const hasNodeLink = computed(() => !!node.value?.getData('nodeLink'))

function getShowPosition(x: number, y: number) {
  const rect = contextmenuRef.value?.getBoundingClientRect()
  if (!rect) return { x, y }
  if (x + rect.width > window.innerWidth) x = x - rect.width - 20
  subItemsShowLeft.value = x + rect.width + 150 > window.innerWidth
  if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 10
  return { x, y }
}

function show(e: MouseEvent, n: any) {
  type.value = 'node'
  isShow.value = true
  node.value = n
  const number = n.getData('number')
  if (number) {
    numberType.value = number.type || 1
    numberLevel.value = number.level === '' ? 1 : number.level
  }
  nextTick(() => {
    const pos = getShowPosition(e.clientX + 10, e.clientY + 10)
    left.value = pos.x
    top.value = pos.y
  })
}

function onNodeMousedown() {
  isNodeMousedown.value = true
}

function onMousedown(e: MouseEvent) {
  if (e.which !== 3) return
  mosuedownX.value = e.clientX
  mosuedownY.value = e.clientY
  isMousedown.value = true
}

function onMouseup(e: MouseEvent) {
  if (!isMousedown.value) return
  if (isNodeMousedown.value) {
    isNodeMousedown.value = false
    return
  }
  isMousedown.value = false
  if (Math.abs(mosuedownX.value - e.clientX) > 3 || Math.abs(mosuedownY.value - e.clientY) > 3) {
    hide()
    return
  }
  show2(e)
}

function show2(e: MouseEvent) {
  type.value = 'svg'
  isShow.value = true
  nextTick(() => {
    const pos = getShowPosition(e.clientX + 10, e.clientY + 10)
    left.value = pos.x
    top.value = pos.y
  })
}

function hide() {
  isShow.value = false
  left.value = -9999
  top.value = -9999
  type.value = ''
  node.value = null
  numberType.value = ''
  numberLevel.value = ''
}

function exec(key: string, disabled: boolean, ...args: any[]) {
  if (disabled) return
  switch (key) {
    case 'COPY_NODE':
      props.mindMap.renderer.copy()
      break
    case 'CUT_NODE':
      props.mindMap.renderer.cut()
      break
    case 'PASTE_NODE':
      props.mindMap.renderer.paste()
      break
    case 'RETURN_CENTER':
      props.mindMap.renderer.setRootNodeCenter()
      break
    case 'TOGGLE_ZEN_MODE':
      setLocalConfig({ isZenMode: !isZenMode.value })
      break
    case 'FIT_CANVAS':
      props.mindMap.view.fit()
      break
    case 'REMOVE_HYPERLINK':
      node.value?.setHyperlink('', '')
      break
    case 'REMOVE_NOTE':
      node.value?.setNote('')
      break
    case 'EXPORT_CUR_NODE_TO_PNG':
      props.mindMap.export('png', true, getTextFromHtml(node.value.getData('text')), false, node.value)
      break
    case 'UNEXPAND_ALL':
      bus.$emit('execCommand', key, !node.value?.uid, node.value?.uid)
      break
    case 'EXPAND_ALL':
      bus.$emit('execCommand', key, node.value?.uid ?? '')
      break
    default:
      bus.$emit('execCommand', key, ...args)
      break
  }
  hide()
}

async function copyToClipboard(typeVal: string) {
  try {
    hide()
    let data: any
    let str: string | undefined
    switch (typeVal) {
      case 'smm':
      case 'json':
        data = props.mindMap.getData(true)
        str = JSON.stringify(data)
        break
      case 'md':
        data = props.mindMap.getData()
        str = transformToMarkdown(data)
        break
      case 'txt':
        data = props.mindMap.getData()
        str = transformToTxt(data)
        break
      case 'png':
        const png = await props.mindMap.export('png', false)
        const blob = await imgToDataUrl(png, true)
        setImgToClipboard(blob)
        break
      default:
        break
    }
    if (str) {
      if (enableCopyToClipboardApi) setDataToClipboard(str)
      else copy(str)
    }
    ElMessage.success(t('contextmenu.copySuccess'))
  } catch (error) {
    ElMessage.error(t('contextmenu.copyFail'))
  }
}

function aiCreate() {
  bus.$emit('ai_create_part', node.value)
  hide()
}

function aiNoteDetail() {
  bus.$emit('ai_note_detail', node.value)
  hide()
}

const doSmartIcon = inject<((node: any) => void) | undefined>('doSmartIcon')
function smartIcon() {
  if (node.value && doSmartIcon) doSmartIcon(node.value)
  hide()
}

onMounted(() => {
  bus.$on('node_contextmenu', show)
  bus.$on('node_click', hide)
  bus.$on('draw_click', hide)
  bus.$on('expand_btn_click', hide)
  bus.$on('svg_mousedown', onMousedown)
  bus.$on('mouseup', onMouseup)
  bus.$on('translate', hide)
  bus.$on('node_mousedown', onNodeMousedown)
})

onBeforeUnmount(() => {
  bus.$off('node_contextmenu', show)
  bus.$off('node_click', hide)
  bus.$off('draw_click', hide)
  bus.$off('expand_btn_click', hide)
  bus.$off('svg_mousedown', onMousedown)
  bus.$off('mouseup', onMouseup)
  bus.$off('translate', hide)
  bus.$off('node_mousedown', onNodeMousedown)
})
</script>

<style lang="less" scoped>
.listBox {
  width: 250px;
  background: #fff;
  box-shadow: 0 4px 12px 0 hsla(0, 0%, 69%, 0.5);
  border-radius: 4px;
  padding-top: 16px;
  padding-bottom: 16px;

  &.isDark {
    background: #363b3f;
  }
}
.contextmenuContainer {
  position: fixed;
  font-size: 14px;
  font-family: PingFangSC-Regular, PingFang SC;
  font-weight: 400;
  color: #1a1a1a;

  &.isDark {
    color: #fff;

    .item {
      &:hover {
        background: hsla(0, 0%, 100%, 0.05);
      }
    }
  }

  .splitLine {
    width: 95%;
    height: 1px;
    background-color: #e9edf2;
    margin: 2px auto;
  }

  .item {
    position: relative;
    height: 28px;
    padding: 0 16px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &.danger {
      color: #f56c6c;
    }

    &:hover {
      background: #f5f5f5;

      .subItems {
        visibility: visible;
      }
    }

    &.disabled {
      color: grey;
      cursor: not-allowed;
      pointer-events: none;

      &:hover {
        background: #fff;
      }
    }

    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .desc {
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .subItems {
      position: absolute;
      left: 100%;
      visibility: hidden;
      width: 150px;
      cursor: auto;

      &.showLeft {
        left: -150px;
      }
    }
  }
}
</style>
