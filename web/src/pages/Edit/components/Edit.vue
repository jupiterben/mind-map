<template>
  <div class="editContainer" @dragenter.stop.prevent="onDragenter" @dragleave.stop.prevent @dragover.stop.prevent
    @drop.stop.prevent>
    <div class="mindMapContainer" id="mindMapContainer" ref="mindMapContainer"></div>
    <!-- 仅 mindMap 初始化后才挂载以下依赖它的子组件，保证传入的 mindMap 非 null -->
    <template v-if="mindMap">
      <Count v-if="!isZenMode" :mindMap="mindMap"></Count>
      <Navigator :mindMap="mindMap"></Navigator>
      <NavigatorToolbar v-if="!isZenMode" :mindMap="mindMap"></NavigatorToolbar>
      <OutlineSidebar :mindMap="mindMap"></OutlineSidebar>
      <Style v-if="!isZenMode" :mindMap="mindMap"></Style>
      <BaseStyle :data="mindMapData" :configData="mindMapConfig" :mindMap="mindMap"></BaseStyle>
      <AssociativeLineStyle :mindMap="mindMap"></AssociativeLineStyle>
      <Theme :data="mindMapData" :mindMap="mindMap"></Theme>
      <Structure :mindMap="mindMap"></Structure>
      <Contextmenu :mindMap="mindMap"></Contextmenu>
      <RichTextToolbar :mindMap="mindMap"></RichTextToolbar>
      <NodeNoteContentShow :mindMap="mindMap"></NodeNoteContentShow>
      <NodeImgPreview :mindMap="mindMap"></NodeImgPreview>
      <Search :mindMap="mindMap"></Search>
      <NodeIconSidebar :mindMap="mindMap"></NodeIconSidebar>
      <NodeIconToolbar :mindMap="mindMap"></NodeIconToolbar>
      <OutlineEdit :mindMap="mindMap"></OutlineEdit>
      <Scrollbar v-if="isShowScrollbar" :mindMap="mindMap"></Scrollbar>
      <FormulaSidebar :mindMap="mindMap"></FormulaSidebar>
      <NodeOuterFrame :mindMap="mindMap"></NodeOuterFrame>
      <NodeTagStyle :mindMap="mindMap"></NodeTagStyle>
      <Setting :configData="mindMapConfig" :mindMap="mindMap"></Setting>
      <NodeImgPlacementToolbar :mindMap="mindMap"></NodeImgPlacementToolbar>
      <NodeNoteSidebar :mindMap="mindMap"></NodeNoteSidebar>
      <AiCreate v-if="enableAi" :mindMap="mindMap"></AiCreate>
      <AiContinueToolbar v-if="enableAi" :mindMap="mindMap"></AiContinueToolbar>
    </template>
    <ShortcutKey></ShortcutKey>
    <SidebarTrigger v-if="!isZenMode"></SidebarTrigger>
    <AiChat v-if="enableAi"></AiChat>
    <div class="dragMask" v-if="showDragMask" @dragleave.stop.prevent="onDragleave" @dragover.stop.prevent
      @drop.stop.prevent="onDrop">
      <div class="dragTip">{{ t('edit.dragTip') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, h, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import MindMap from 'simple-mind-map'
import MiniMap from 'simple-mind-map/src/plugins/MiniMap.js'
import Watermark from 'simple-mind-map/src/plugins/Watermark.js'
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js'
import ExportPDF from 'simple-mind-map/src/plugins/ExportPDF.js'
import ExportXMind from 'simple-mind-map/src/plugins/ExportXMind.js'
import Export from 'simple-mind-map/src/plugins/Export.js'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Select from 'simple-mind-map/src/plugins/Select.js'
import RichText from 'simple-mind-map/src/plugins/RichText.js'
import AssociativeLine from 'simple-mind-map/src/plugins/AssociativeLine.js'
import TouchEvent from 'simple-mind-map/src/plugins/TouchEvent.js'
import NodeImgAdjust from 'simple-mind-map/src/plugins/NodeImgAdjust.js'
import SearchPlugin from 'simple-mind-map/src/plugins/Search.js'
import Painter from 'simple-mind-map/src/plugins/Painter.js'
import ScrollbarPlugin from 'simple-mind-map/src/plugins/Scrollbar.js'
import Formula from 'simple-mind-map/src/plugins/Formula.js'
import RainbowLines from 'simple-mind-map/src/plugins/RainbowLines.js'
import Demonstrate from 'simple-mind-map/src/plugins/Demonstrate.js'
import OuterFrame from 'simple-mind-map/src/plugins/OuterFrame.js'
import MindMapLayoutPro from 'simple-mind-map/src/plugins/MindMapLayoutPro.js'
import NodeBase64ImageStorage from 'simple-mind-map/src/plugins/NodeBase64ImageStorage.js'
import Themes from 'simple-mind-map-plugin-themes'
// 协同编辑插件
// import Cooperate from 'simple-mind-map/src/plugins/Cooperate.js'
import OutlineSidebar from './OutlineSidebar.vue'
import Style from './Style.vue'
import BaseStyle from './BaseStyle.vue'
import Theme from './Theme.vue'
import Structure from './Structure.vue'
import Count from './Count.vue'
import NavigatorToolbar from './NavigatorToolbar.vue'
import ShortcutKey from './ShortcutKey.vue'
import Contextmenu from './Contextmenu.vue'
import RichTextToolbar from './RichTextToolbar.vue'
import NodeNoteContentShow from './NodeNoteContentShow.vue'
import { getData as getDataFromApi, getConfig, storeData } from '@/api'
import Navigator from './Navigator.vue'
import NodeImgPreview from './NodeImgPreview.vue'
import SidebarTrigger from './SidebarTrigger.vue'
import icon from '@/config/icon'
import Search from './Search.vue'
import NodeIconSidebar from './NodeIconSidebar.vue'
import NodeIconToolbar from './NodeIconToolbar.vue'
import OutlineEdit from './OutlineEdit.vue'
import { showLoading, hideLoading } from '@/utils/loading'
import handleClipboardText from '@/utils/handleClipboardText'
import { getParentWithClass } from '@/utils'
import Scrollbar from './Scrollbar.vue'
import exampleData from 'simple-mind-map/example/exampleData'
import FormulaSidebar from './FormulaSidebar.vue'
import NodeOuterFrame from './NodeOuterFrame.vue'
import NodeTagStyle from './NodeTagStyle.vue'
import Setting from './Setting.vue'
import AssociativeLineStyle from './AssociativeLineStyle.vue'
import NodeImgPlacementToolbar from './NodeImgPlacementToolbar.vue'
import NodeNoteSidebar from './NodeNoteSidebar.vue'
import AiCreate from './AiCreate.vue'
import AiContinueToolbar from './AiContinueToolbar.vue'
import AiChat from './AiChat.vue'
import defaultNodeImageUrl from '../../../assets/img/图片加载失败.svg'

// 注册插件
MindMap.usePlugin(MiniMap)
  .usePlugin(Watermark)
  .usePlugin(Drag)
  .usePlugin(KeyboardNavigation)
  .usePlugin(ExportPDF)
  .usePlugin(ExportXMind)
  .usePlugin(Export)
  .usePlugin(Select)
  .usePlugin(AssociativeLine)
  .usePlugin(NodeImgAdjust)
  .usePlugin(TouchEvent)
  .usePlugin(SearchPlugin)
  .usePlugin(Painter)
  .usePlugin(Formula)
  .usePlugin(RainbowLines)
  .usePlugin(Demonstrate)
  .usePlugin(OuterFrame)
  .usePlugin(MindMapLayoutPro)
  .usePlugin(NodeBase64ImageStorage)
// .usePlugin(Cooperate) // 协同插件

// 注册主题
Themes.init(MindMap)
// 扩展主题列表
if (typeof MoreThemes !== 'undefined') {
  MoreThemes.init(MindMap)
}

const route = useRoute()
const { t } = useI18n()
const store = useStore()
const { openNodeRichText, isShowScrollbar, useLeftKeySelectionRightKeyDrag, extraTextOnExport, enableAi, enableDragImport, isDragOutlineTreeNode, isZenMode } = storeToRefs(store)
const bus = getBus()

const mindMapContainer = ref<HTMLElement | null>(null)
const enableShowLoading = ref(true)
const mindMap = ref<InstanceType<typeof MindMap> | null>(null)
const mindMapData = ref<unknown>(null)
const mindMapConfig = ref<Record<string, unknown>>({})
const prevImg = ref('')
let storeConfigTimer: ReturnType<typeof setTimeout> | null = null
const showDragMask = ref(false)

watch(openNodeRichText, (v) => {
  if (v) addRichTextPlugin()
  else removeRichTextPlugin()
})
watch(isShowScrollbar, (v) => {
  if (v) addScrollbarPlugin()
  else removeScrollbarPlugin()
})

function onLocalStorageExceeded() {
  ElNotification({
    type: 'warning',
    title: t('edit.tip'),
    message: t('edit.localStorageExceededTip'),
    duration: 0
  })
}

function handleStartTextEdit() {
  mindMap.value.renderer.startTextEdit()
}

function handleEndTextEdit() {
  mindMap.value.renderer.endTextEdit()
}

function handleCreateLineFromActiveNode() {
  mindMap.value.associativeLine.createLineFromActiveNode()
}

function handleStartPainter() {
  mindMap.value.painter.startPainter()
}

function handleResize() {
  mindMap.value.resize()
}

// 显示loading
function handleShowLoading() {
  enableShowLoading.value = true
  showLoading()
}

// 渲染结束后关闭loading
function handleHideLoading() {
  if (enableShowLoading.value) {
    enableShowLoading.value = false
    hideLoading()
  }
}

// 获取思维导图数据，实际应该调接口获取
function getData() {
  mindMapData.value = getDataFromApi()
  mindMapConfig.value = (getConfig() as Record<string, unknown>) || {}
}

function bindSaveEvent() {
  bus.$on('data_change', data => {
    storeData({ root: data })
  })
  bus.$on('view_data_change', data => {
    clearTimeout(storeConfigTimer)
    storeConfigTimer = setTimeout(() => {
      storeData({
        view: data
      })
    }, 300)
  })
}

// 手动保存
function manualSave() {
  storeData(mindMap.value.getData(true))
}

// 保证根节点有 data 和默认文案（用于显示与保存后还原）
function ensureRootDefaultText(root: unknown) {
  if (!root || typeof root !== 'object') return { data: { text: t('edit.root') }, children: [] }
  const r = root as { data?: { text?: string }; children?: unknown[] }
  if (!r.data || typeof r.data !== 'object') r.data = { text: t('edit.root') }
  if (r.data.text === undefined || r.data.text === '') r.data.text = t('edit.root')
  if (!Array.isArray(r.children)) r.children = []
  return r
}

// 初始化
function init() {
  let hasFile = hasFileURL()
  const raw = mindMapData.value as { root?: unknown; layout?: string; theme?: { template?: string; config?: unknown }; view?: unknown } | null
  let root = raw?.root
  let layout = raw?.layout
  let theme = raw?.theme
  let view = raw?.view
  const config = mindMapConfig.value
  // 如果url中存在要打开的文件，那么思维导图数据、主题、布局都使用默认的
  if (hasFile) {
    root = {
      data: {
        text: t('edit.root')
      },
      children: []
    }
    layout = exampleData.layout
    theme = exampleData.theme
    view = null
  }
  root = ensureRootDefaultText(root)
  mindMap.value = new MindMap({
    el: mindMapContainer.value,
    data: root,
    fit: false,
    layout: layout,
    theme: theme.template,
    themeConfig: theme.config,
    viewData: view,
    nodeTextEditZIndex: 1000,
    nodeNoteTooltipZIndex: 1000,
    customNoteContentShow: {
      show: (content, left, top, node) => {
        bus.$emit('showNoteContent', content, left, top, node)
      },
      hide: () => {
        // bus.$emit('hideNoteContent')
      }
    },
    openRealtimeRenderOnNodeTextEdit: true,
    enableAutoEnterTextEditWhenKeydown: true,
    demonstrateConfig: {
      openBlankMode: false
    },
    ...(config || {}),
    iconList: [...icon],
    useLeftKeySelectionRightKeyDrag: useLeftKeySelectionRightKeyDrag.value,
    customInnerElsAppendTo: null,
    customHandleClipboardText: handleClipboardText,
    defaultNodeImage: defaultNodeImageUrl,
    initRootNodePosition: ['center', 'center'],
    handleIsSplitByWrapOnPasteCreateNewNode: () => {
      return ElMessageBox.confirm(
        t('edit.splitByWrap'),
        t('edit.tip'),
        {
          confirmButtonText: t('edit.yes'),
          cancelButtonText: t('edit.no'),
          type: 'warning'
        }
      )
    },
    errorHandler: (code, err) => {
      console.error(err)
      switch (code) {
        case 'export_error':
          ElMessage.error(t('edit.exportError'))
          break
        default:
          break
      }
    },
    addContentToFooter: () => {
      const text = extraTextOnExport.value.trim()
      if (!text) return null
      const el = document.createElement('div')
      el.className = 'footer'
      el.innerHTML = text
      const cssText = `
            .footer {
              width: 100%;
              height: 30px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 12px;
              color: #979797;
            }
          `
      return {
        el,
        cssText,
        height: 30
      }
    },
    expandBtnNumHandler: num => {
      return num >= 100 ? '…' : num
    },
    beforeDeleteNodeImg: node => {
      return new Promise(resolve => {
        ElMessageBox.confirm(
          t('edit.deleteNodeImgTip'),
          t('edit.tip'),
          {
            confirmButtonText: t('edit.yes'),
            cancelButtonText: t('edit.no'),
            type: 'warning'
          }
        )
          .then(() => {
            resolve(false)
          })
          .catch(() => {
            resolve(true)
          })
      })
    }
  })
  loadPlugins()
  mindMap.value.keyCommand.addShortcut('Control+s', () => {
    manualSave()
  })
    // 转发事件
    ;[
      'node_active',
      'data_change',
      'view_data_change',
      'back_forward',
      'node_contextmenu',
      'node_click',
      'draw_click',
      'expand_btn_click',
      'svg_mousedown',
      'mouseup',
      'mode_change',
      'node_tree_render_end',
      'rich_text_selection_change',
      'transforming-dom-to-images',
      'generalization_node_contextmenu',
      'painter_start',
      'painter_end',
      'scrollbar_change',
      'scale',
      'translate',
      'node_attachmentClick',
      'node_attachmentContextmenu',
      'demonstrate_jump',
      'exit_demonstrate',
      'node_note_dblclick',
      'node_mousedown'
    ].forEach(event => {
      mindMap.value.on(event, (...args) => {
        bus.$emit(event, ...args)
      })
    })
  mindMap.value.on('node_click', () => {
    if (!isZenMode.value) store.setActiveSidebar('nodeStyle')
  })
  bindSaveEvent()
  // 如果应用被接管，那么抛出事件传递思维导图实例
  if (window.takeOverApp) {
    bus.$emit('app_inited', mindMap.value)
  }
  // 解析url中的文件
  if (hasFile) {
    bus.$emit('handle_file_url')
  }
  window.getCurrentData = () => {
    const fullData = mindMap.value.getData(true)
    return { ...fullData }
  }
  // 协同测试
  cooperateTest()
}

// 加载相关插件
function loadPlugins() {
  if (openNodeRichText.value) addRichTextPlugin()
  if (isShowScrollbar.value) addScrollbarPlugin()
}

// url中是否存在要打开的文件
function hasFileURL() {
  const fileURL = route.query.fileURL
  if (!fileURL) return false
  return /\.(smm|json|xmind|md|xlsx)$/.test(fileURL)
}

// 动态设置思维导图数据
function setData(data: unknown) {
  handleShowLoading()
  const raw = data as { root?: unknown; layout?: string; theme?: unknown; view?: unknown } | null
  let rootNodeData: { data?: { richText?: boolean } } | null = null
  if (raw?.root !== undefined && raw?.root !== null) {
    ensureRootDefaultText(raw.root)
    mindMap.value.setFullData(raw)
    rootNodeData = raw.root as { data?: { richText?: boolean } }
  } else {
    const rootTree = ensureRootDefaultText(raw?.root ?? raw)
    mindMap.value.setData(rootTree)
    rootNodeData = rootTree as { data?: { richText?: boolean } }
  }
  mindMap.value.view.reset()
  manualSave()
  // 如果导入的是富文本内容，那么自动开启富文本模式
  if (rootNodeData?.data?.richText && !openNodeRichText.value) {
    bus.$emit('toggleOpenNodeRichText', true)
    ElNotification.info({
      title: t('edit.tip'),
      message: t('edit.autoOpenNodeRichTextTip')
    })
  }
}

// 重新渲染
function reRender() {
  mindMap.value.reRender()
}

// 执行命令
function execCommand(...args: unknown[]) {
  mindMap.value.execCommand(...args)
}

// 导出
async function exportMap(...args: unknown[]) {
  try {
    showLoading()
    await mindMap.value.export(...args)
    hideLoading()
  } catch (error) {
    console.log(error)
    hideLoading()
  }
}

// 修改导出内边距
function onPaddingChange(data: unknown) {
  mindMap.value.updateConfig(data)
}

// 加载节点富文本编辑插件
function addRichTextPlugin() {
  if (!mindMap.value) return
  mindMap.value.addPlugin(RichText)
}

// 移除节点富文本编辑插件
function removeRichTextPlugin() {
  mindMap.value.removePlugin(RichText)
}

// 加载滚动条插件
function addScrollbarPlugin() {
  if (!mindMap.value) return
  mindMap.value.addPlugin(ScrollbarPlugin)
}

// 移除滚动条插件
function removeScrollbarPlugin() {
  mindMap.value.removePlugin(ScrollbarPlugin)
}

// 协同测试
function cooperateTest() {
  if (mindMap.value.cooperate && route.query.userName) {
    mindMap.value.cooperate.setProvider(null, {
      roomName: 'demo-room',
      signalingList: ['ws://localhost:4444']
    })
    mindMap.value.cooperate.setUserInfo({
      id: Math.random(),
      name: route.query.userName,
      color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'][
        Math.floor(Math.random() * 5)
      ],
      avatar:
        Math.random() > 0.5
          ? 'https://img0.baidu.com/it/u=4270674549,2416627993&fm=253&app=138&size=w931&n=0&f=JPEG&fmt=auto?sec=1696006800&t=4d32871d14a7224a4591d0c3c7a97311'
          : ''
    })
  }
}

// 拖拽文件到页面导入
function onDragenter() {
  if (!enableDragImport.value || isDragOutlineTreeNode.value) return
  showDragMask.value = true
}

function onDragleave() {
  showDragMask.value = false
}

function onDrop(e: DragEvent) {
  if (!enableDragImport.value) return
  showDragMask.value = false
  const dt = e.dataTransfer
  const file = dt.files && dt.files[0]
  if (!file) return
  bus.$emit('importFile', file)
}

// 网页版试用提示
function webTip() {
  const storageKey = 'webUseTip'
  const data = localStorage.getItem(storageKey)
  if (data) {
    return
  }
  showDownloadTip(
    '重要提示',
    '网页版已暂停更新，部分功能缺失，请下载客户端获得完整体验~'
  )
  localStorage.setItem(storageKey, 1)
}

function showDownloadTip(title: string, desc: string) {
  ElMessageBox.alert(
    h('div', null, [
      h('p', { style: { marginBottom: '12px' } }, desc),
      h('div', null, [
        h(
          'a',
          {
            href: 'https://pan.baidu.com/s/1huasEbKsGNH2Af68dvWiOg?pwd=3bp3',
            target: '_blank',
            style: { color: '#409eff', marginRight: '12px' }
          },
          t('edit.downBaidu')
        ),
        h(
          'a',
          {
            href: 'https://github.com/wanglin2/mind-map/releases',
            target: '_blank',
            style: { color: '#409eff' }
          },
          t('edit.downGithub')
        )
      ])
    ]),
    title,
    { showCancelButton: false, showConfirmButton: false }
  )
}

onMounted(() => {
  showLoading()
  getData()
  init()
  bus.$on('execCommand', execCommand)
  bus.$on('paddingChange', onPaddingChange)
  bus.$on('export', exportMap)
  bus.$on('setData', setData)
  bus.$on('startTextEdit', handleStartTextEdit)
  bus.$on('endTextEdit', handleEndTextEdit)
  bus.$on('createAssociativeLine', handleCreateLineFromActiveNode)
  bus.$on('startPainter', handleStartPainter)
  bus.$on('node_tree_render_end', handleHideLoading)
  bus.$on('showLoading', handleShowLoading)
  bus.$on('localStorageExceeded', onLocalStorageExceeded)
  window.addEventListener('resize', handleResize)
  bus.$on('showDownloadTip', showDownloadTip)
  webTip()
})
onBeforeUnmount(() => {
  bus.$off('execCommand', execCommand)
  bus.$off('paddingChange', onPaddingChange)
  bus.$off('export', exportMap)
  bus.$off('setData', setData)
  bus.$off('startTextEdit', handleStartTextEdit)
  bus.$off('endTextEdit', handleEndTextEdit)
  bus.$off('createAssociativeLine', handleCreateLineFromActiveNode)
  bus.$off('startPainter', handleStartPainter)
  bus.$off('node_tree_render_end', handleHideLoading)
  bus.$off('showLoading', handleShowLoading)
  bus.$off('localStorageExceeded', onLocalStorageExceeded)
  window.removeEventListener('resize', handleResize)
  bus.$off('showDownloadTip', showDownloadTip)
  if (mindMap.value) mindMap.value.destroy()
})
</script>

<style lang="less" scoped>
.editContainer {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  .dragMask {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3999;

    .dragTip {
      pointer-events: none;
      font-weight: bold;
    }
  }

  .mindMapContainer {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
  }
}
</style>
