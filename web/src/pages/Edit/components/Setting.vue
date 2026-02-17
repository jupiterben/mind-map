<template>
  <Sidebar ref="sidebar" :title="$t('setting.title')">
    <div
      class="sidebarContent customScrollbar"
      :class="{ isDark: isDark }"
      v-if="configData"
    >
      <!-- 水印 -->
      <div class="row">
        <!-- 是否显示水印 -->
        <div class="rowItem">
          <el-checkbox
            v-model="watermarkConfig.show"
            @change="watermarkShowChange"
            >{{ $t('setting.showWatermark') }}</el-checkbox
          >
        </div>
      </div>
      <template v-if="watermarkConfig.show">
        <!-- 是否仅在导出时显示 -->
        <div class="row">
          <div class="rowItem">
            <el-checkbox
              v-model="watermarkConfig.onlyExport"
              @change="updateWatermarkConfig"
              >{{ $t('setting.onlyExport') }}</el-checkbox
            >
          </div>
        </div>
        <!-- 是否在节点下方 -->
        <div class="row">
          <div class="rowItem">
            <el-checkbox
              v-model="watermarkConfig.belowNode"
              @change="updateWatermarkConfig"
              >{{ $t('setting.belowNode') }}</el-checkbox
            >
          </div>
        </div>
        <!-- 水印文字 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkText') }}</span>
            <el-input
              v-model="watermarkConfig.text"
              size="small"
              @change="updateWatermarkConfig"
              @keydown.stop
            ></el-input>
          </div>
        </div>
        <!-- 水印文字颜色 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkTextColor') }}</span>
            <el-popover ref="popover3" placement="bottom" trigger="click">
              <template #reference>
                <span
                  class="block"
                  :style="{ backgroundColor: watermarkConfig.textStyle.color }"
                ></span>
              </template>
              <Color
                :color="watermarkConfig.textStyle.color"
                @change="
                  value => {
                    watermarkConfig.textStyle.color = value
                    updateWatermarkConfig()
                  }
                "
              ></Color>
            </el-popover>
          </div>
        </div>
        <!-- 水印文字透明度 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkTextOpacity') }}</span>
            <el-slider
              v-model="watermarkConfig.textStyle.opacity"
              style="width: 170px"
              :min="0"
              :max="1"
              :step="0.1"
              @change="updateWatermarkConfig"
            ></el-slider>
          </div>
        </div>
        <!-- 水印文字字号 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkTextFontSize') }}</span>
            <el-input-number
              v-model="watermarkConfig.textStyle.fontSize"
              size="small"
              :min="0"
              :max="50"
              :step="1"
              @change="updateWatermarkConfig"
              @keydown.stop
            ></el-input-number>
          </div>
        </div>
        <!-- 旋转角度 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkAngle') }}</span>
            <el-input-number
              v-model="watermarkConfig.angle"
              size="small"
              :min="0"
              :max="90"
              :step="10"
              @change="updateWatermarkConfig"
              @keydown.stop
            ></el-input-number>
          </div>
        </div>
        <!-- 水印行间距 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkLineSpacing') }}</span>
            <el-input-number
              v-model="watermarkConfig.lineSpacing"
              size="small"
              :step="10"
              @change="updateWatermarkConfig"
              @keydown.stop
            ></el-input-number>
          </div>
        </div>
        <!-- 水印文字间距 -->
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('setting.watermarkTextSpacing') }}</span>
            <el-input-number
              v-model="watermarkConfig.textSpacing"
              size="small"
              :step="10"
              @change="updateWatermarkConfig"
              @keydown.stop
            ></el-input-number>
          </div>
        </div>
      </template>
      <!-- 配置性能模式 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.openPerformance"
            @change="
              value => {
                updateOtherConfig('openPerformance', value)
              }
            "
            >{{ $t('setting.openPerformance') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 配置开启自由拖拽 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.enableFreeDrag"
            @change="
              value => {
                updateOtherConfig('enableFreeDrag', value)
              }
            "
            >{{ $t('setting.enableFreeDrag') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 配置是否启用富文本编辑 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="enableNodeRichText"
            @change="enableNodeRichTextChange"
            >{{ $t('setting.isEnableNodeRichText') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否开启文本编辑时实时更新节点大小 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.openRealtimeRenderOnNodeTextEdit"
            @change="
              updateOtherConfig('openRealtimeRenderOnNodeTextEdit', $event)
            "
            >{{ $t('setting.openRealtimeRenderOnNodeTextEdit') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否显示滚动条 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="localConfigs.isShowScrollbar"
            @change="updateLocalConfig('isShowScrollbar', $event)"
            >{{ $t('setting.isShowScrollbar') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否一直显示展开收起按钮 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.alwaysShowExpandBtn"
            @change="updateOtherConfig('alwaysShowExpandBtn', $event)"
            >{{ $t('setting.alwaysShowExpandBtn') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否在键盘输入时自动进入节点文本编辑模式 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.enableAutoEnterTextEditWhenKeydown"
            @change="
              updateOtherConfig('enableAutoEnterTextEditWhenKeydown', $event)
            "
            >{{ $t('setting.enableAutoEnterTextEditWhenKeydown') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否开启文件拖入页面导入的方式 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="localConfigs.enableDragImport"
            @change="updateLocalConfig('enableDragImport', $event)"
            >{{ $t('setting.enableDragImport') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 节点连线样式是否允许继承祖先的连线样式 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="config.enableInheritAncestorLineStyle"
            @change="
              updateOtherConfig('enableInheritAncestorLineStyle', $event)
            "
            >{{ $t('setting.enableInheritAncestorLineStyle') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 是否开启ai功能 -->
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="localConfigs.enableAi"
            @change="updateLocalConfig('enableAi', $event)"
            >{{ $t('setting.enableAi') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 配置鼠标滚轮行为 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('setting.mousewheelAction') }}</span>
          <el-select
            size="small"
            style="width: 120px"
            v-model="config.mousewheelAction"
            placeholder=""
            @change="
              value => {
                updateOtherConfig('mousewheelAction', value)
              }
            "
          >
            <el-option :label="$t('setting.zoomView')" value="zoom"></el-option>
            <el-option
              :label="$t('setting.moveViewUpDown')"
              value="move"
            ></el-option>
          </el-select>
        </div>
      </div>
      <!-- 配置鼠标缩放行为 -->
      <div class="row" v-if="config.mousewheelAction === 'zoom'">
        <div class="rowItem">
          <span class="name">{{
            $t('setting.mousewheelZoomActionReverse')
          }}</span>
          <el-select
            size="small"
            style="width: 120px"
            v-model="config.mousewheelZoomActionReverse"
            placeholder=""
            @change="
              value => {
                updateOtherConfig('mousewheelZoomActionReverse', value)
              }
            "
          >
            <el-option
              :label="$t('setting.mousewheelZoomActionReverse1')"
              :value="false"
            ></el-option>
            <el-option
              :label="$t('setting.mousewheelZoomActionReverse2')"
              :value="true"
            ></el-option>
          </el-select>
        </div>
      </div>
      <!-- 配置创建新节点时的行为 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('setting.createNewNodeBehavior') }}</span>
          <el-select
            size="small"
            style="width: 120px"
            v-model="config.createNewNodeBehavior"
            placeholder=""
            @change="
              value => {
                updateOtherConfig('createNewNodeBehavior', value)
              }
            "
          >
            <el-option
              :label="$t('setting.default')"
              value="default"
            ></el-option>
            <el-option
              :label="$t('setting.notActive')"
              value="notActive"
            ></el-option>
            <el-option
              :label="$t('setting.activeOnly')"
              value="activeOnly"
            ></el-option>
          </el-select>
        </div>
      </div>
      <!-- 图片和文本内容的间距 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('setting.imgTextMargin') }}</span>
          <el-slider
            style="width: 150px"
            v-model="config.imgTextMargin"
            @change="
              value => {
                updateOtherConfig('imgTextMargin', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <!-- 文本各内容的间距 -->
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('setting.textContentMargin') }}</span>
          <el-slider
            style="width: 150px"
            v-model="config.textContentMargin"
            @change="
              value => {
                updateOtherConfig('textContentMargin', value)
              }
            "
          ></el-slider>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Sidebar from './Sidebar.vue'
import Color from './Color.vue'
import { storeConfig } from '@/api'
import { useStoreMixin } from '@/mixins/storeMixin'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  configData: any
  mindMap: any
}>()

const { localConfig, setLocalConfig, activeSidebar } = useStoreMixin()
const bus = getBus()
const { t } = useI18n()

const sidebar = ref<InstanceType<typeof Sidebar> | null>(null)
const config = reactive({
  openPerformance: false,
  enableFreeDrag: false,
  mousewheelAction: 'zoom',
  mousewheelZoomActionReverse: false,
  createNewNodeBehavior: 'default',
  openRealtimeRenderOnNodeTextEdit: true,
  alwaysShowExpandBtn: false,
  enableAutoEnterTextEditWhenKeydown: true,
  imgTextMargin: 0,
  textContentMargin: 0,
  enableInheritAncestorLineStyle: false
})
const watermarkConfig = reactive({
  show: false,
  onlyExport: false,
  belowNode: false,
  text: '',
  lineSpacing: 100,
  textSpacing: 100,
  angle: 30,
  textStyle: { color: '', opacity: 0, fontSize: 1 }
})
const updateWatermarkTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const enableNodeRichText = ref(true)
const localConfigs = reactive({
  isShowScrollbar: false,
  enableDragImport: false,
  enableAi: false
})

const isDark = computed(() => useStore().isDark ?? false)

function initConfig() {
  Object.keys(config).forEach((key) => {
    const val = props.mindMap.getConfig(key)
    if (typeof (config as any)[key] === 'object') {
      ;(config as any)[key] = { ...(val || {}) }
    } else {
      ;(config as any)[key] = val
    }
  })
}

function initLoacalConfig() {
  const cfg = localConfig.value
  if (!cfg) return
  enableNodeRichText.value = cfg.openNodeRichText
  ;(config as any).mousewheelAction = cfg.mousewheelAction
  ;(config as any).mousewheelZoomActionReverse = cfg.mousewheelZoomActionReverse
  Object.keys(localConfigs).forEach((key) => {
    ;(localConfigs as any)[key] = (cfg as any)[key]
  })
}

function initWatermark() {
  const cfg = props.mindMap.getConfig('watermarkConfig')
  ;['text', 'lineSpacing', 'textSpacing', 'angle', 'onlyExport', 'belowNode'].forEach((key) => {
    ;(watermarkConfig as any)[key] = cfg?.[key]
  })
  watermarkConfig.show = !!cfg?.text
  watermarkConfig.textStyle = { ...cfg?.textStyle }
}

function updateOtherConfig(key: string, value: any) {
  props.mindMap.updateConfig({ [key]: value })
  if (props.configData) (props.configData as any)[key] = value
  storeConfig(props.configData)
  if (['alwaysShowExpandBtn', 'imgTextMargin', 'textContentMargin', 'enableInheritAncestorLineStyle'].includes(key)) {
    props.mindMap.reRender()
  }
}

function updateWatermarkConfig() {
  if (updateWatermarkTimer.value) clearTimeout(updateWatermarkTimer.value)
  updateWatermarkTimer.value = setTimeout(() => {
    const { show, ...cfg } = watermarkConfig
    props.mindMap.watermark.updateWatermark({ ...cfg })
    if (props.configData) (props.configData as any).watermarkConfig = props.mindMap.getConfig('watermarkConfig')
    storeConfig(props.configData)
  }, 300)
}

function watermarkShowChange(value: boolean) {
  if (value) {
    watermarkConfig.text = watermarkConfig.text || t('setting.watermarkDefaultText')
  } else {
    watermarkConfig.text = ''
  }
  updateWatermarkConfig()
}

function enableNodeRichTextChange(e: boolean) {
  ElMessageBox.confirm(
    t('setting.changeRichTextTip'),
    e ? t('setting.changeRichTextTip2') : t('setting.changeRichTextTip3'),
    {
      confirmButtonText: t('setting.confirm'),
      cancelButtonText: t('setting.cancel'),
      type: 'warning'
    }
  )
    .then(() => {
      props.mindMap.renderer.textEdit.hideEditTextBox()
      setLocalConfig({ openNodeRichText: e })
    })
    .catch(() => {
      enableNodeRichText.value = !enableNodeRichText.value
    })
}

function onToggleOpenNodeRichText(val: boolean) {
  setLocalConfig({ openNodeRichText: val })
  enableNodeRichText.value = val
}

function updateLocalConfig(key: string, value: any) {
  setLocalConfig({ [key]: value })
}

watch(activeSidebar, (val) => {
  const s = sidebar.value as { setShow?: (v: boolean) => void } | null
  if (!s?.setShow) return
  if (val === 'setting') {
    s.setShow(true)
    initLoacalConfig()
    initConfig()
    initWatermark()
  } else {
    s.setShow(false)
  }
})

onMounted(() => {
  initLoacalConfig()
  bus.$on('toggleOpenNodeRichText', onToggleOpenNodeRichText)
})

onBeforeUnmount(() => {
  bus.$off('toggleOpenNodeRichText', onToggleOpenNodeRichText)
})
</script>

<style lang="less" scoped>
.sidebarContent {
  padding: 20px;
  padding-top: 10px;

  &.isDark {
    .title {
      color: #fff;
    }

    .row {
      .rowItem {
        .name {
          color: hsla(0, 0%, 100%, 0.6);
        }
      }
    }
  }

  .title {
    font-size: 16px;
    font-family: PingFangSC-Medium, PingFang SC;
    font-weight: 500;
    color: rgba(26, 26, 26, 0.9);
    margin-bottom: 10px;
    margin-top: 20px;

    &.noTop {
      margin-top: 0;
    }
  }

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .rowItem {
      display: flex;
      align-items: center;
      margin-bottom: 5px;

      .name {
        font-size: 12px;
        margin-right: 10px;
        white-space: nowrap;
      }

      .block {
        display: inline-block;
        width: 30px;
        height: 30px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        cursor: pointer;
      }
    }
  }
}
</style>
