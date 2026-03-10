<template>
  <div class="toolbarContainer" :class="{ isDark: isDark }">
    <div class="toolbar" ref="toolbarRef">
      <!-- 节点操作 -->
      <div class="toolbarBlock">
        <ToolbarNodeBtnList :list="horizontalList"></ToolbarNodeBtnList>
        <!-- 更多 -->
        <el-popover
          v-model="popoverShow"
          placement="bottom-end"
          width="120"
          trigger="hover"
          v-if="showMoreBtn"
          :style="{ marginLeft: horizontalList.length > 0 ? '20px' : 0 }"
        >
          <template #default>
            <ToolbarNodeBtnList
              dir="v"
              :list="verticalList"
              @click.native="popoverShow = false"
            ></ToolbarNodeBtnList>
          </template>
          <template #reference>
            <div class="toolbarBtn">
              <span class="icon iconfont icongongshi"></span>
              <span class="text">{{ $t('toolbar.more') }}</span>
            </div>
          </template>
        </el-popover>
      </div>
      <!-- 导出 -->
      <div class="toolbarBlock">
        <div class="toolbarBtn" @click="openDirectory" v-if="!isMobile">
          <span class="icon iconfont icondakai"></span>
          <span class="text">{{ $t('toolbar.directory') }}</span>
        </div>
        <div class="toolbarBtn" @click="createNewLocalFile" v-if="!isMobile">
          <span class="icon iconfont iconxinjian"></span>
          <span class="text">{{ $t('toolbar.newFile') }}</span>
        </div>
        <el-tooltip
          effect="dark"
          :content="$t('toolbar.openFileTip')"
          placement="bottom"
          v-if="!isMobile"
        >
          <div class="toolbarBtn" @click="openLocalFile">
            <span class="icon iconfont iconwenjian1"></span>
            <span class="text">{{ $t('toolbar.openFile') }}</span>
          </div>
        </el-tooltip>
        <div class="toolbarBtn" @click="saveLocalFile" v-if="!isMobile">
          <span class="icon iconfont iconlingcunwei"></span>
          <span class="text">{{ $t('toolbar.saveAs') }}</span>
        </div>
        <div class="toolbarBtn" @click="emitShowImport">
          <span class="icon iconfont icondaoru"></span>
          <span class="text">{{ $t('toolbar.import') }}</span>
        </div>
        <div class="toolbarBtn" @click="emitShowExport">
          <span class="icon iconfont iconexport"></span>
          <span class="text">{{ $t('toolbar.export') }}</span>
        </div>
        <el-tooltip
          effect="dark"
          :content="isZenMode ? $t('toolbar.showToolbars') : $t('toolbar.hideToolbars')"
          placement="bottom"
        >
          <div class="toolbarBtn" @click="toggleZenMode" style="margin-right: 0;">
            <span class="icon iconfont iconquanping"></span>
            <span class="text">{{ isZenMode ? $t('toolbar.showToolbars') : $t('toolbar.hideToolbars') }}</span>
          </div>
        </el-tooltip>
        <!-- 本地文件树 -->
        <div
          class="fileTreeBox"
          v-if="fileTreeVisible"
          :class="{ expand: fileTreeExpand }"
        >
          <div class="fileTreeToolbar">
            <div class="fileTreeName">
              {{ rootDirName ? '/' + rootDirName : '' }}
            </div>
            <div class="fileTreeActionList">
              <div
                class="btn"
                :class="[
                  fileTreeExpand ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
                ]"
                @click="fileTreeExpand = !fileTreeExpand"
              ></div>
              <div
                class="btn el-icon-close"
                @click="fileTreeVisible = false"
              ></div>
            </div>
          </div>
          <div class="fileTreeWrap">
            <el-tree
              :props="fileTreeProps"
              :load="loadFileTreeNode"
              :expand-on-click-node="false"
              node-key="id"
              lazy
            >
              <template #default="{ node, data }">
                <span class="customTreeNode">
                  <div class="treeNodeInfo">
                    <span
                      class="treeNodeIcon iconfont"
                      :class="[
                        data.type === 'file' ? 'iconwenjian' : 'icondakai'
                      ]"
                    ></span>
                    <span class="treeNodeName">{{ node.label }}</span>
                  </div>
                  <div class="treeNodeBtnList" v-if="data.type === 'file'">
                    <el-button
                      type="text"
                      size="small"
                      v-if="data.enableEdit"
                      @click="editLocalFile(data)"
                    >编辑</el-button
                    >
                    <el-button
                      type="text"
                      size="small"
                      v-else
                      @click="importLocalFile(data)"
                    >导入</el-button
                    >
                  </div>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
    </div>
    <NodeImage></NodeImage>
    <NodeHyperlink></NodeHyperlink>
    <NodeIcon></NodeIcon>
    <NodeNote></NodeNote>
    <NodeTag></NodeTag>
    <Export></Export>
    <Import ref="ImportRef"></Import>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import NodeImage from './NodeImage.vue'
import NodeHyperlink from './NodeHyperlink.vue'
import NodeIcon from './NodeIcon.vue'
import NodeNote from './NodeNote.vue'
import NodeTag from './NodeTag.vue'
import Export from './Export.vue'
import Import from './Import.vue'
import ToolbarNodeBtnList from './ToolbarNodeBtnList.vue'
import { storeMixin } from '@/mixins/storeMixin'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { ElNotification, ElMessage, ElLoading } from 'element-plus'
import exampleData from 'simple-mind-map/example/exampleData'
import { getData } from '@/api'
import { throttle, isMobile as checkIsMobile } from 'simple-mind-map/src/utils/index'
import { useI18n } from 'vue-i18n'
import { useStoreMixin } from '@/mixins/storeMixin'

const defaultBtnList = [
  'back', 'forward', 'painter', 'siblingNode', 'childNode', 'deleteNode',
  'image', 'icon', 'link', 'note', 'tag', 'summary', 'associativeLine',
  'formula', 'outerFrame', 'annotation', 'ai', 'aiCreatePart'
]

let fileHandle: any = null
const { openNodeRichText, enableAi, isHandleLocalFile, setIsHandleLocalFile, isZenMode, setLocalConfig } = useStoreMixin()
const bus = getBus()
const { t } = useI18n()

const toolbarRef = ref<HTMLElement | null>(null)
const ImportRef = ref<InstanceType<typeof Import> | null>(null)
const isMobile = checkIsMobile()
const horizontalList = ref<string[]>([])
const verticalList = ref<string[]>([])
const showMoreBtn = ref(true)
const popoverShow = ref(false)
const fileTreeProps = { label: 'name', children: 'children', isLeaf: 'leaf' }
const fileTreeVisible = ref(false)
const rootDirName = ref('')
const fileTreeExpand = ref(true)
const waitingWriteToLocalFile = ref(false)
const isFullDataFile = ref(false)
const timer = ref<ReturnType<typeof setTimeout> | null>(null)

const isDark = computed(() => useStore().isDark ?? false)
const btnLit = computed(() => {
  let res = [...defaultBtnList]
  if (!openNodeRichText.value) res = res.filter((item) => item !== 'formula')
  if (!enableAi.value) res = res.filter((item) => item !== 'ai' && item !== 'aiCreatePart')
  return res
})

function emitShowImport() {
  bus.$emit('showImport')
}
function emitShowExport() {
  bus.$emit('showExport')
}

function toggleZenMode() {
  setLocalConfig({ isZenMode: !isZenMode.value })
}

function computeToolbarShow() {
  if (!toolbarRef.value) return
  const windowWidth = window.innerWidth - 40
  const all = [...btnLit.value]
  let index = 1
  const done = () => {
    verticalList.value = all.slice(index)
    showMoreBtn.value = verticalList.value.length > 0
  }
  const loopCheck = () => {
    if (index > all.length) return done()
    horizontalList.value = all.slice(0, index)
    nextTick(() => {
      const width = toolbarRef.value!.getBoundingClientRect().width
      if (width < windowWidth) {
        index++
        loopCheck()
      } else if (index > 0 && width > windowWidth) {
        index--
        horizontalList.value = all.slice(0, index)
        done()
      }
    })
  }
  loopCheck()
}

function onWriteLocalFile(content: any) {
  if (timer.value) clearTimeout(timer.value)
  if (fileHandle && isHandleLocalFile.value) waitingWriteToLocalFile.value = true
  timer.value = setTimeout(() => writeLocalFile(content), 1000)
}

function onUnload(e: BeforeUnloadEvent) {
  if (waitingWriteToLocalFile.value) {
    e.returnValue = '存在未保存的数据'
    return '存在未保存的数据'
  }
}

async function loadFileTreeNode(node: any, resolve: (data: any[]) => void) {
  try {
    let dirHandle: any
    if (node.level === 0) {
      dirHandle = await window.showDirectoryPicker()
      rootDirName.value = dirHandle.name
    } else {
      dirHandle = node.data.handle
    }
    const dirList: any[] = []
    const fileList: any[] = []
    for await (const [key, value] of dirHandle.entries()) {
      const isFile = value.kind === 'file'
      if (isFile && !/\.(smm|xmind|md|json)$/.test(value.name)) continue
      const enableEdit = isFile && /\.smm$/.test(value.name)
      const data = { id: key, name: value.name, type: value.kind, handle: value, leaf: isFile, enableEdit }
      if (isFile) fileList.push(data)
      else dirList.push(data)
    }
    resolve([...dirList, ...fileList])
  } catch (error) {
    console.log(error)
    fileTreeVisible.value = false
    resolve([])
    if (!String(error).includes('aborted')) ElMessage.warning(t('toolbar.notSupportTip'))
  }
}

function openDirectory() {
  fileTreeVisible.value = false
  fileTreeExpand.value = true
  rootDirName.value = ''
  nextTick(() => { fileTreeVisible.value = true })
}

function editLocalFile(data: any) {
  if (data.handle) {
    fileHandle = data.handle
    readFile()
  }
}

async function importLocalFile(data: any) {
  try {
    const file = await data.handle.getFile()
    ImportRef.value?.onChange?.({ raw: file, name: file.name })
    ImportRef.value?.confirm?.()
  } catch (error) {
    console.log(error)
  }
}

async function openLocalFile() {
  try {
    const [_fileHandle] = await window.showOpenFilePicker({
      types: [{ description: '', accept: { 'application/json': ['.smm'] } }],
      excludeAcceptAllOption: true,
      multiple: false
    })
    if (!_fileHandle) return
    fileHandle = _fileHandle
    if (fileHandle.kind === 'directory') {
      ElMessage.warning(t('toolbar.selectFileTip'))
      return
    }
    readFile()
  } catch (error) {
    if (!String(error).includes('aborted')) ElMessage.warning(t('toolbar.notSupportTip'))
  }
}

async function readFile() {
  const file = await fileHandle.getFile()
  const fileReader = new FileReader()
  fileReader.onload = () => {
    setIsHandleLocalFile(true)
    setData(fileReader.result as string)
    ElNotification.closeAll()
    ElNotification({
      title: t('toolbar.tip'),
      message: `${t('toolbar.editingLocalFileTipFront')}${file.name}${t('toolbar.editingLocalFileTipEnd')}`,
      duration: 0,
      showClose: true
    })
  }
  fileReader.readAsText(file)
}

function setData(str: string) {
  try {
    let data = JSON.parse(str)
    if (typeof data !== 'object') throw new Error(t('toolbar.fileContentError'))
    if (data.root) {
      isFullDataFile.value = true
    } else {
      isFullDataFile.value = false
      data = { ...exampleData, root: data }
    }
    bus.$emit('setData', data)
  } catch (error) {
    ElMessage.error(t('toolbar.fileOpenFailed'))
  }
}

async function writeLocalFile(content: any) {
  if (!fileHandle || !isHandleLocalFile.value) {
    waitingWriteToLocalFile.value = false
    return
  }
  if (!isFullDataFile.value) content = content.root
  const writable = await fileHandle.createWritable()
  await writable.write(JSON.stringify(content))
  await writable.close()
  waitingWriteToLocalFile.value = false
}

function createNewLocalFile() {
  fileHandle = null
  setIsHandleLocalFile(false)
  ElNotification.closeAll()
  waitingWriteToLocalFile.value = false
  const data = exampleData?.root ? exampleData : { ...exampleData, root: exampleData }
  bus.$emit('setData', data)
}

async function saveLocalFile() {
  await createLocalFile(getData())
}

async function createLocalFile(content: any) {
  try {
    const _fileHandle = await window.showSaveFilePicker({
      types: [{ description: '', accept: { 'application/json': ['.smm'] } }],
      suggestedName: t('toolbar.defaultFileName')
    })
    if (!_fileHandle) return
    const loading = ElLoading.service({
      lock: true,
      text: t('toolbar.creatingTip'),
      background: 'rgba(0, 0, 0, 0.7)'
    })
    fileHandle = _fileHandle
    setIsHandleLocalFile(true)
    isFullDataFile.value = true
    await writeLocalFile(content)
    await readFile()
    loading.close()
  } catch (error) {
    if (!String(error).includes('aborted')) ElMessage.warning(t('toolbar.notSupportTip'))
  }
}

function onNodeNoteDblclick(node: any, e: Event) {
  e.stopPropagation()
  bus.$emit('showNodeNote', node)
}

const computeToolbarShowThrottle = throttle(computeToolbarShow, 300)

watch(isHandleLocalFile, (val) => {
  if (!val) ElNotification.closeAll()
})
watch(btnLit, () => computeToolbarShow(), { deep: true })

onMounted(() => {
  bus.$on('write_local_file', onWriteLocalFile)
  computeToolbarShow()
  window.addEventListener('resize', computeToolbarShowThrottle)
  bus.$on('lang_change', computeToolbarShowThrottle)
  window.addEventListener('beforeunload', onUnload)
  bus.$on('node_note_dblclick', onNodeNoteDblclick)
})

onBeforeUnmount(() => {
  bus.$off('write_local_file', onWriteLocalFile)
  window.removeEventListener('resize', computeToolbarShowThrottle)
  bus.$off('lang_change', computeToolbarShowThrottle)
  window.removeEventListener('beforeunload', onUnload)
  bus.$off('node_note_dblclick', onNodeNoteDblclick)
})
</script>

<style lang="less" scoped>
.toolbarContainer {
  &.isDark {
    .toolbar {
      color: hsla(0, 0%, 100%, 0.9);
      .toolbarBlock {
        background-color: #262a2e;

        .fileTreeBox {
          background-color: #262a2e;

          :deep(.el-tree) {
            background-color: #262a2e;

            &.el-tree--highlight-current {
              .el-tree-node.is-current > .el-tree-node__content {
                background-color: hsla(0, 0%, 100%, 0.05) !important;
              }
            }

            .el-tree-node:focus > .el-tree-node__content {
              background-color: hsla(0, 0%, 100%, 0.05) !important;
            }

            .el-tree-node__content:hover,
            .el-upload-list__item:hover {
              background-color: hsla(0, 0%, 100%, 0.02) !important;
            }
          }

          .fileTreeWrap {
            .customTreeNode {
              .treeNodeInfo {
                color: #fff;
              }

              .treeNodeBtnList {
                .el-button {
                  padding: 7px 5px;
                }
              }
            }
          }
        }
      }

      .toolbarBtn {
        .icon {
          background: transparent;
          border-color: transparent;
        }

        &:hover {
          &:not(.disabled) {
            .icon {
              background: hsla(0, 0%, 100%, 0.05);
            }
          }
        }

        &.disabled {
          color: #54595f;
        }
      }
    }
  }
  .toolbar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: 20px;
    width: max-content;
    display: flex;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: rgba(26, 26, 26, 0.8);
    z-index: 2;

    .toolbarBlock {
      display: flex;
      background-color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.06);
      margin-right: 20px;
      flex-shrink: 0;
      position: relative;

      &:last-of-type {
        margin-right: 0;
      }

      .fileTreeBox {
        position: absolute;
        left: 0;
        top: 68px;
        width: 100%;
        height: 30px;
        background-color: #fff;
        padding: 12px 5px;
        padding-top: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 5px;
        min-width: 200px;
        box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);

        &.expand {
          height: 300px;

          .fileTreeWrap {
            visibility: visible;
          }
        }

        .fileTreeToolbar {
          width: 100%;
          height: 30px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e9e9e9;
          margin-bottom: 12px;
          padding-left: 12px;

          .fileTreeName {
          }

          .fileTreeActionList {
            .btn {
              font-size: 18px;
              margin-left: 12px;
              cursor: pointer;
            }
          }
        }

        .fileTreeWrap {
          width: 100%;
          height: 100%;
          overflow: auto;
          visibility: hidden;

          .customTreeNode {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            padding-right: 5px;

            .treeNodeInfo {
              display: flex;
              align-items: center;

              .treeNodeIcon {
                margin-right: 5px;
                opacity: 0.7;
              }

              .treeNodeName {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .treeNodeBtnList {
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    .toolbarBtn {
      display: flex;
      justify-content: center;
      flex-direction: column;
      cursor: pointer;
      margin-right: 20px;

      &:last-of-type {
        margin-right: 0;
      }

      &:hover {
        &:not(.disabled) {
          .icon {
            background: #f5f5f5;
          }
        }
      }

      &.active {
        .icon {
          background: #f5f5f5;
        }
      }

      &.disabled {
        color: #bcbcbc;
        cursor: not-allowed;
        pointer-events: none;
      }

      .icon {
        display: flex;
        height: 26px;
        background: #fff;
        border-radius: 4px;
        border: 1px solid #e9e9e9;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        padding: 0 5px;
      }

      .text {
        margin-top: 3px;
      }
    }
  }
}
</style>
