<template>
  <Sidebar ref="sidebar" :title="$t('style.title')">
    <div
      class="styleBox"
      :class="{ isDark: isDark }"
      v-if="activeNodes.length > 0"
    >
      <div class="sidebarContent customScrollbar">
        <!-- 文字 -->
        <div class="title noTop">{{ $t('style.text') }}</div>
        <div class="row">
          <div class="rowItem">
            <!-- <span class="name">{{ $t('style.fontFamily') }}</span> -->
            <el-select
              size="small"
              style="width: 100px"
              v-model="style.fontFamily"
              placeholder=""
              @change="update('fontFamily')"
            >
              <el-option
                v-for="item in fontFamilyList"
                :key="item.value"
                :label="item.name"
                :value="item.value"
                :style="{ fontFamily: item.value }"
              >
              </el-option>
            </el-select>
          </div>
          <div class="rowItem">
            <!-- <span class="name">{{ $t('style.fontSize') }}</span> -->
            <el-select
              size="small"
              style="width: 60px"
              v-model="style.fontSize"
              placeholder=""
              @change="update('fontSize')"
            >
              <el-option
                v-for="item in fontSizeList"
                :key="item"
                :label="item"
                :value="item"
                :style="{ fontSize: item + 'px' }"
              >
              </el-option>
            </el-select>
          </div>
          <div class="rowItem">
            <el-select
              size="small"
              style="width: 80px"
              v-model="style.textAlign"
              placeholder=""
              @change="update('textAlign')"
            >
              <el-option
                v-for="item in alignList"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </div>
        </div>
        <div class="row">
          <div class="btnGroup">
            <el-popover ref="popover" placement="bottom" trigger="hover">
              <template #reference>
                <div class="reference-wrap">
                  <el-tooltip :content="$t('style.color')" placement="bottom">
                    <div class="styleBtn">
                      A
                      <span
                        class="colorShow"
                        :style="{ backgroundColor: style.color || '#eee' }"
                      ></span>
                    </div>
                  </el-tooltip>
                </div>
              </template>
              <Color :color="style.color" @change="changeFontColor"></Color>
            </el-popover>
            <el-tooltip :content="$t('style.addFontWeight')" placement="bottom">
              <div
                class="styleBtn"
                :class="{
                  actived: style.fontWeight === 'bold'
                }"
                @click="toggleFontWeight"
              >
                B
              </div>
            </el-tooltip>
            <el-tooltip :content="$t('style.italic')" placement="bottom">
              <div
                class="styleBtn i"
                :class="{
                  actived: style.fontStyle === 'italic'
                }"
                @click="toggleFontStyle"
              >
                I
              </div>
            </el-tooltip>
            <el-popover ref="popover2" placement="bottom" trigger="hover">
              <template #reference>
                <div class="reference-wrap">
                  <el-tooltip
                    :content="$t('style.textDecoration')"
                    placement="bottom"
                  >
                    <div
                      class="styleBtn u"
                      :style="{ textDecoration: style.textDecoration || 'none' }"
                    >
                      U
                    </div>
                  </el-tooltip>
                </div>
              </template>
              <el-radio-group
                size="small"
                v-model="style.textDecoration"
                @change="update('textDecoration')"
              >
                <el-radio-button value="none">{{
                  $t('style.none')
                }}</el-radio-button>
                <el-radio-button value="underline">{{
                  $t('style.underline')
                }}</el-radio-button>
                <el-radio-button value="line-through">{{
                  $t('style.lineThrough')
                }}</el-radio-button>
                <el-radio-button value="overline">{{
                  $t('style.overline')
                }}</el-radio-button>
              </el-radio-group>
            </el-popover>
          </div>
        </div>
        <!-- 边框 -->
        <div class="title">{{ $t('style.border') }}</div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.color') }}</span>
            <el-popover ref="popover3" placement="bottom" trigger="hover">
              <template #reference>
                <span
                  class="block"
                  :style="{ width: '80px', backgroundColor: style.borderColor }"
                ></span>
              </template>
              <Color
                :color="style.borderColor"
                @change="changeBorderColor"
              ></Color>
            </el-popover>
          </div>
          <div class="rowItem">
            <span class="name">{{ $t('style.style') }}</span>
            <el-select
              size="small"
              style="width: 80px"
              v-model="style.borderDasharray"
              placeholder=""
              @change="update('borderDasharray')"
            >
              <el-option
                v-for="item in borderDasharrayList"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              >
                <svg width="120" height="34">
                  <line
                    x1="10"
                    y1="17"
                    x2="110"
                    y2="17"
                    stroke-width="2"
                    :stroke="
                      style.borderDasharray === item.value
                        ? '#409eff'
                        : isDark
                        ? '#fff'
                        : '#000'
                    "
                    :stroke-dasharray="item.value"
                  ></line>
                </svg>
              </el-option>
            </el-select>
          </div>
        </div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.width') }}</span>
            <el-select
              size="small"
              style="width: 80px"
              v-model="style.borderWidth"
              placeholder=""
              @change="update('borderWidth')"
            >
              <el-option
                v-for="item in borderWidthList"
                :key="item"
                :label="item"
                :value="item"
              >
                <span
                  v-if="item > 0"
                  class="borderLine"
                  :class="{ isDark: isDark }"
                  :style="{ height: item + 'px' }"
                ></span>
              </el-option>
            </el-select>
          </div>
          <div class="rowItem" v-show="style.shape === 'rectangle'">
            <span class="name">{{ $t('style.borderRadius') }}</span>
            <el-select
              size="small"
              style="width: 80px"
              v-model="style.borderRadius"
              placeholder=""
              @change="update('borderRadius')"
            >
              <el-option
                v-for="item in borderRadiusList"
                :key="item"
                :label="item"
                :value="item"
              >
              </el-option>
            </el-select>
          </div>
        </div>
        <!-- 背景 -->
        <div class="title">{{ $t('style.background') }}</div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.color') }}</span>
            <el-popover ref="popover4" placement="bottom" trigger="hover">
              <template #reference>
                <span
                  class="block"
                  :style="{ backgroundColor: style.fillColor }"
                ></span>
              </template>
              <Color :color="style.fillColor" @change="changeFillColor"></Color>
            </el-popover>
            <span class="name" style="margin-left: 20px;">{{
              $t('style.gradientStyle')
            }}</span>
            <el-checkbox
              v-model="style.gradientStyle"
              @change="update('gradientStyle')"
            ></el-checkbox>
          </div>
        </div>
        <div class="row" v-if="style.gradientStyle">
          <div class="rowItem">
            <span class="name">{{ $t('style.startColor') }}</span>
            <el-popover ref="popover6" placement="bottom" trigger="hover">
              <template #reference>
                <span
                  class="block"
                  :style="{ backgroundColor: style.startColor }"
                ></span>
              </template>
              <Color
                :color="style.startColor"
                @change="changeStartColor"
              ></Color>
            </el-popover>
          </div>
          <div class="rowItem">
            <span class="name">{{ $t('style.endColor') }}</span>
            <el-popover ref="popover7" placement="bottom" trigger="hover">
              <template #reference>
                <span
                  class="block"
                  :style="{ backgroundColor: style.endColor }"
                ></span>
              </template>
              <Color :color="style.endColor" @change="changeEndColor"></Color>
            </el-popover>
          </div>
          <div class="rowItem">
            <span class="name">{{ $t('style.direction') }}</span>
            <el-select
              size="small"
              style="width: 80px"
              v-model="style.linearGradientDir"
              placeholder=""
              @change="update('linearGradientDir')"
            >
              <el-option
                v-for="item in linearGradientDirList"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </div>
        </div>
        <!-- 形状 -->
        <div class="title">{{ $t('style.shape') }}</div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.shape') }}</span>
            <el-select
              size="small"
              style="width: 120px"
              v-model="style.shape"
              placeholder=""
              @change="update('shape')"
            >
              <el-option
                v-for="item in shapeList"
                :key="item.value"
                :label="item.name"
                :value="item.value"
                style="display: flex; justify-content: center; align-items: center;"
              >
                <svg
                  :width="item.width || 60"
                  :height="item.height || 26"
                  style="margin-top: 5px"
                >
                  <path
                    :d="shapeListMap[item.value]"
                    fill="none"
                    :stroke="
                      style.shape === item.value
                        ? '#409eff'
                        : isDark
                        ? '#fff'
                        : '#000'
                    "
                    stroke-width="2"
                  ></path>
                </svg>
              </el-option>
            </el-select>
          </div>
        </div>
        <!-- 线条 -->
        <div class="title">{{ $t('style.line') }}</div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.color') }}</span>
            <el-popover ref="popover5" placement="bottom" trigger="hover">
              <template #reference>
                <span
                  class="block"
                  :style="{ width: '80px', backgroundColor: style.lineColor }"
                ></span>
              </template>
              <Color :color="style.lineColor" @change="changeLineColor"></Color>
            </el-popover>
          </div>
          <div class="rowItem">
            <span class="name">{{ $t('style.style') }}</span>
            <el-select
              size="small"
              style="width: 80px"
              v-model="style.lineDasharray"
              placeholder=""
              @change="update('lineDasharray')"
            >
              <el-option
                v-for="item in borderDasharrayList"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              >
                <svg width="120" height="34">
                  <line
                    x1="10"
                    y1="17"
                    x2="110"
                    y2="17"
                    stroke-width="2"
                    :stroke="
                      style.lineDasharray === item.value
                        ? '#409eff'
                        : isDark
                        ? '#fff'
                        : '#000'
                    "
                    :stroke-dasharray="item.value"
                  ></line>
                </svg>
              </el-option>
            </el-select>
          </div>
        </div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.width') }}</span>
            <el-select
              size="small"
              style="width: 80px"
              v-model="style.lineWidth"
              placeholder=""
              @change="update('lineWidth')"
            >
              <el-option
                v-for="item in borderWidthList"
                :key="item"
                :label="item"
                :value="item"
              >
                <span
                  v-if="item > 0"
                  class="borderLine"
                  :class="{ isDark: isDark }"
                  :style="{ height: item + 'px' }"
                ></span>
              </el-option>
            </el-select>
          </div>
          <div class="rowItem">
            <span class="name">{{ $t('style.arrowDir') }}</span>
            <el-select
              size="small"
              style="width: 80px"
              v-model="style.lineMarkerDir"
              placeholder=""
              @change="update('lineMarkerDir')"
            >
              <el-option
                key="start"
                :label="$t('style.arrowDirStart')"
                value="start"
              ></el-option>
              <el-option
                key="end"
                :label="$t('style.arrowDirEnd')"
                value="end"
              ></el-option>
            </el-select>
          </div>
        </div>
        <!-- 节点内边距 -->
        <div class="title">{{ $t('style.nodePadding') }}</div>
        <div class="row noBottom">
          <div class="rowItem">
            <span class="name">{{ $t('style.horizontal') }}</span>
            <el-slider
              style="width: 200px"
              v-model="style.paddingX"
              @change="update('paddingX')"
            ></el-slider>
          </div>
        </div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.vertical') }}</span>
            <el-slider
              style="width: 200px"
              v-model="style.paddingY"
              @change="update('paddingY')"
            ></el-slider>
          </div>
        </div>
        <!-- 节点图片布局 -->
        <div class="title">{{ $t('style.img') }}</div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.placement') }}</span>
            <el-radio-group
              v-model="style.imgPlacement"
              size="small"
              @change="update('imgPlacement')"
            >
              <el-radio-button value="top">{{
                $t('style.top')
              }}</el-radio-button>
              <el-radio-button value="bottom">{{
                $t('style.bottom')
              }}</el-radio-button>
              <el-radio-button value="left">{{
                $t('style.left')
              }}</el-radio-button>
              <el-radio-button value="right">{{
                $t('style.right')
              }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <!-- 节点标签布局 -->
        <div class="title">{{ $t('style.tag') }}</div>
        <div class="row">
          <div class="rowItem">
            <span class="name">{{ $t('style.placement') }}</span>
            <el-radio-group
              v-model="style.tagPlacement"
              size="small"
              @change="update('tagPlacement')"
            >
              <el-radio-button value="right">{{
                $t('style.right')
              }}</el-radio-button>
              <el-radio-button value="bottom">{{
                $t('style.bottom')
              }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>
    </div>
    <div class="tipBox" v-else>
      <div class="tipIcon iconfont icontianjiazijiedian"></div>
      <div class="tipText">{{ $t('style.selectNodeTip') }}</div>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Sidebar from './Sidebar.vue'
import Color from './Color.vue'
import {
  fontFamilyList as fontFamilyConfig,
  fontSizeList,
  borderWidthList,
  borderDasharrayList as borderDasharrayConfig,
  borderRadiusList,
  shapeList as shapeListConfig,
  shapeListMap as shapeListMapConfig,
  linearGradientDirList as linearGradientDirConfig,
  alignList as alignListConfig
} from '@/config'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ mindMap: any }>()
const store = useStore()
const { activeSidebar } = storeToRefs(store)
const { setActiveSidebar } = store
const bus = getBus()
const { locale } = useI18n()
type LocaleKey = 'zh' | 'en' | 'zhtw' | 'vi'
const localeKey = computed(() => (locale.value ?? (locale as any)) as LocaleKey)

const sidebar = ref<InstanceType<typeof Sidebar> | null>(null)
const activeNodes = ref<any[]>([])
const style = reactive({
  shape: '',
  paddingX: 0,
  paddingY: 0,
  color: '',
  fontFamily: '',
  fontSize: '',
  textDecoration: '',
  fontWeight: '',
  fontStyle: '',
  borderWidth: '',
  borderColor: '',
  fillColor: '',
  borderDasharray: '',
  borderRadius: '',
  lineColor: '',
  lineDasharray: '',
  lineWidth: '',
  lineMarkerDir: '',
  gradientStyle: false,
  startColor: '',
  endColor: '',
  linearGradientDir: '',
  lineFlow: false,
  lineFlowForward: true,
  lineFlowDuration: 1,
  textAlign: '',
  imgPlacement: '',
  tagPlacement: ''
})

const isDark = computed(() => useStore().isDark ?? false)
const fontFamilyList = computed(
  () => fontFamilyConfig[localeKey.value] || fontFamilyConfig.zh
)
const borderDasharrayList = computed(
  () => borderDasharrayConfig[localeKey.value] || borderDasharrayConfig.zh
)
const shapeList = computed(() => [
  ...(shapeListConfig[localeKey.value] || shapeListConfig.zh),
  ...props.mindMap.extendShapeList
    .filter((item: any) => !['fishHead'].includes(item.name))
    .map((item: any) => ({ width: '40px', name: item.nameShow, value: item.name }))
])
const shapeListMap = computed(() => {
  const map2: Record<string, string> = {}
  props.mindMap.extendShapeList.forEach((item: any) => {
    map2[item.name] = item.path
  })
  return { ...shapeListMapConfig, ...map2 } as Record<string, string>
})
const linearGradientDirList = computed(
  () => linearGradientDirConfig[localeKey.value] || linearGradientDirConfig.zh
)
const alignList = computed(
  () => alignListConfig[localeKey.value] || alignListConfig.zh
)

function onNodeActive(...args: any[]) {
  nextTick(() => {
    activeNodes.value = [...args[1]]
    initNodeStyle()
    if (activeNodes.value.length > 0) {
      setActiveSidebar('nodeStyle')
    } else {
      if (activeSidebar.value === 'nodeStyle') setActiveSidebar(null)
    }
  })
}

function initNodeStyle() {
  if (activeNodes.value.length <= 0) return
  Object.keys(style).forEach((key) => {
    ;(style as any)[key] = activeNodes.value[0].getStyle(key, false)
  })
  initLinearGradientDir()
}

function initLinearGradientDir() {
  const startDir = activeNodes.value[0].getStyle('startDir', false)
  const endDir = activeNodes.value[0].getStyle('endDir', false)
  const target = linearGradientDirList.value.find(
    (item: any) =>
      item.start[0] === startDir[0] &&
      item.start[1] === startDir[1] &&
      item.end[0] === endDir[0] &&
      item.end[1] === endDir[1]
  )
  if (target) (style as any).linearGradientDir = target.value
}

function update(prop: string) {
  if (prop === 'linearGradientDir') {
    const target = linearGradientDirList.value.find(
      (item: any) => item.value === (style as any).linearGradientDir
    )
    if (target) {
      activeNodes.value.forEach((node) => {
        node.setStyles({ startDir: [...target.start], endDir: [...target.end] })
      })
    }
  } else {
    activeNodes.value.forEach((node) => node.setStyle(prop, (style as any)[prop]))
  }
}

function toggleFontWeight() {
  ;(style as any).fontWeight = (style as any).fontWeight === 'bold' ? 'normal' : 'bold'
  update('fontWeight')
}

function toggleFontStyle() {
  ;(style as any).fontStyle = (style as any).fontStyle === 'italic' ? 'normal' : 'italic'
  update('fontStyle')
}

function changeFontColor(color: string) {
  ;(style as any).color = color
  update('color')
}

function changeBorderColor(color: string) {
  ;(style as any).borderColor = color
  update('borderColor')
}

function changeLineColor(color: string) {
  ;(style as any).lineColor = color
  update('lineColor')
}

function changeFillColor(color: string) {
  ;(style as any).fillColor = color
  update('fillColor')
}

function changeStartColor(color: string) {
  ;(style as any).startColor = color
  update('startColor')
}

function changeEndColor(color: string) {
  ;(style as any).endColor = color
  update('endColor')
}

watch(activeSidebar, (val) => {
  const s = sidebar.value as { setShow?: (v: boolean) => void } | null
  if (s?.setShow) s.setShow(val === 'nodeStyle')
})

function onNodeClick() {
  setActiveSidebar('nodeStyle')
}

onMounted(() => {
  bus.$on('node_active', onNodeActive)
  bus.$on('node_click', onNodeClick)
})

onBeforeUnmount(() => {
  bus.$off('node_active', onNodeActive)
  bus.$off('node_click', onNodeClick)
})
</script>

<style lang="less" scoped>
.styleBox {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  &.isDark {
    .sidebarContent {
      .title {
        color: #fff;
      }

      .row {
        .rowItem {
          .name {
            color: hsla(0, 0%, 100%, 0.6);
          }
        }

        .styleBtn {
          background-color: #363b3f;
          color: hsla(0, 0%, 100%, 0.6);
          border-color: hsla(0, 0%, 100%, 0.1);
        }
      }
    }
  }

  .tab {
    flex-grow: 0;
    flex-shrink: 0;
    padding: 0 20px;
  }
}

.tipBox {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #666;

  .tipIcon {
    font-size: 100px;
  }
}

.sidebarContent {
  padding: 20px;
  padding-top: 10px;

  .title {
    font-size: 16px;
    font-family: PingFangSC-Medium, PingFang SC;
    font-weight: 500;
    color: rgba(26, 26, 26, 0.9);
    margin-bottom: 10px;
    margin-top: 35px;

    &.noTop {
      margin-top: 0;
    }
  }

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    &.noBottom {
      margin-bottom: 0;
    }

    .btnGroup {
      width: 100%;
      display: flex;
      justify-content: space-between;
    }

    .reference-wrap {
      display: inline-block;
    }

    .rowItem {
      display: flex;
      align-items: center;

      .name {
        font-size: 12px;
        margin-right: 10px;
      }

      .block {
        display: inline-block;
        width: 30px;
        height: 30px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        cursor: pointer;

        &.disabled {
          background-color: #f5f7fa !important;
          border-color: #e4e7ed !important;
          color: #c0c4cc !important;
          cursor: not-allowed !important;
        }
      }
    }

    .styleBtn {
      position: relative;
      width: 50px;
      height: 30px;
      background: #fff;
      border: 1px solid #eee;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      cursor: pointer;
      border-radius: 4px;

      &.actived {
        background-color: #eee;
      }

      &.disabled {
        background-color: #f5f7fa !important;
        border-color: #e4e7ed !important;
        color: #c0c4cc !important;
        cursor: not-allowed !important;
      }

      &.i {
        font-style: italic;
      }

      &.u {
      }

      .colorShow {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
      }
    }
  }
}

.borderLine {
  display: inline-block;
  width: 100%;
  background-color: #000;

  &.isDark {
    background-color: #fff;
  }
}
</style>
<style lang="less">
.el-select-dropdown__item.selected {
  .borderLine {
    background-color: #409eff;
  }
}
</style>
