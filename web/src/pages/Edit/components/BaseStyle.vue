<template>
  <Sidebar ref="sidebar" :title="$t('baseStyle.title')">
    <div
      class="sidebarContent customScrollbar"
      :class="{ isDark: isDark }"
      v-if="data"
    >
      <!-- 背景 -->
      <div class="title noTop">{{ $t('baseStyle.background') }}</div>
      <div class="row">
        <el-tabs class="tab" v-model="activeTab">
          <el-tab-pane :label="$t('baseStyle.color')" name="color">
            <Color
              :color="style.backgroundColor"
              @change="
                color => {
                  update('backgroundColor', color)
                }
              "
            ></Color>
          </el-tab-pane>
          <el-tab-pane :label="$t('baseStyle.image')" name="image">
            <ImgUpload
              class="imgUpload"
              v-model="style.backgroundImage"
              @change="
                img => {
                  update('backgroundImage', img)
                }
              "
            ></ImgUpload>
            <!-- 图片重复方式 -->
            <div class="rowItem">
              <span class="name">{{ $t('baseStyle.imageRepeat') }}</span>
              <el-select
                size="small"
                style="width: 120px"
                v-model="style.backgroundRepeat"
                placeholder=""
                @change="
                  value => {
                    update('backgroundRepeat', value)
                  }
                "
              >
                <el-option
                  v-for="item in backgroundRepeatList"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </div>
            <!-- 图片位置 -->
            <div class="rowItem">
              <span class="name">{{ $t('baseStyle.imagePosition') }}</span>
              <el-select
                size="small"
                style="width: 120px"
                v-model="style.backgroundPosition"
                placeholder=""
                @change="
                  value => {
                    update('backgroundPosition', value)
                  }
                "
              >
                <el-option
                  v-for="item in backgroundPositionList"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </div>
            <!-- 图片大小 -->
            <div class="rowItem">
              <span class="name">{{ $t('baseStyle.imageSize') }}</span>
              <el-select
                size="small"
                style="width: 120px"
                v-model="style.backgroundSize"
                placeholder=""
                @change="
                  value => {
                    update('backgroundSize', value)
                  }
                "
              >
                <el-option
                  v-for="item in backgroundSizeList"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </div>
            <!-- 内置背景图片 -->
            <div
              class="rowItem spaceBetween"
              style="margin-top: 8px; margin-bottom: 8px;"
              v-if="(bgList || []).length > 0"
            >
              <div class="name">{{ $t('baseStyle.builtInBackgroundImage') }}</div>
              <div
                class="iconBtn el-icon-arrow-down"
                :class="{ top: !bgListExpand }"
                @click="bgListExpand = !bgListExpand"
              ></div>
            </div>
            <div class="bgList" :class="{ expand: bgListExpand }">
              <div
                class="bgItem"
                v-for="(item, index) in (bgList || [])"
                :key="index"
                :class="{active: style.backgroundImage === item}"
                @click="useBg(item)"
              >
                <img :src="item" alt="" />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <!-- 连线 -->
      <div class="title">{{ $t('baseStyle.line') }}</div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.color') }}</span>
          <el-popover ref="popover" placement="bottom" trigger="click">
            <template #reference>
              <span
                class="block"
                :style="{ backgroundColor: style.lineColor }"
              ></span>
            </template>
            <Color
              :color="style.lineColor"
              @change="
                color => {
                  update('lineColor', color)
                }
              "
            ></Color>
          </el-popover>
        </div>
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.width') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.lineWidth"
            placeholder=""
            @change="
              value => {
                update('lineWidth', value)
              }
            "
          >
            <el-option
              v-for="item in lineWidthList"
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
      </div>
      <div class="row">
        <!-- 线宽 -->
        <div class="rowItem" v-if="lineStyleListShow.length > 1">
          <span class="name">{{ $t('baseStyle.style') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.lineStyle"
            placeholder=""
            @change="
              value => {
                update('lineStyle', value)
              }
            "
          >
            <el-option
              v-for="item in lineStyleListShow"
              :key="item.value"
              :label="item.name"
              :value="item.value"
              class="lineStyleOption"
              :class="{
                isDark: isDark,
                isSelected: style.lineStyle === item.value
              }"
              v-html="lineStyleMap[item.value]"
            >
            </el-option>
          </el-select>
        </div>
        <!-- 根节点连线样式 -->
        <div
          class="rowItem"
          v-if="
            style.lineStyle === 'curve' && showRootLineKeepSameInCurveLayouts
          "
        >
          <span class="name">{{ $t('baseStyle.rootStyle') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.rootLineKeepSameInCurve"
            placeholder=""
            @change="
              value => {
                update('rootLineKeepSameInCurve', value)
              }
            "
          >
            <el-option
              v-for="item in rootLineKeepSameInCurveList"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="rowItem" v-if="showLineRadius">
          <!-- 连线圆角大小 -->
          <span class="name">{{ $t('baseStyle.lineRadius') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.lineRadius"
            placeholder=""
            @change="
              value => {
                update('lineRadius', value)
              }
            "
          >
            <el-option
              v-for="item in [0, 2, 5, 7, 10, 12, 15]"
              :key="item"
              :label="item"
              :value="item"
            >
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="row">
        <!-- 根节点连线起始位置 -->
        <div
          class="rowItem"
          v-if="
            style.lineStyle === 'curve' && showRootLineKeepSameInCurveLayouts
          "
        >
          <span class="name">{{ $t('baseStyle.rootLineStartPos') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.rootLineStartPositionKeepSameInCurve"
            placeholder=""
            @change="
              value => {
                update('rootLineStartPositionKeepSameInCurve', value)
              }
            "
          >
            <el-option
              key="center"
              :label="$t('baseStyle.center')"
              :value="false"
            >
            </el-option>
            <el-option key="right" :label="$t('baseStyle.edge')" :value="true">
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="row">
        <div class="rowItem">
          <el-checkbox
            v-model="style.showLineMarker"
            @change="
              value => {
                update('showLineMarker', value)
              }
            "
            >{{ $t('baseStyle.showArrow') }}</el-checkbox
          >
        </div>
      </div>
      <!-- 彩虹线条 -->
      <div class="title">{{ $t('baseStyle.rainbowLines') }}</div>
      <div class="row">
        <div class="rowItem">
          <el-popover
            placement="right"
            trigger="click"
            v-model="rainbowLinesPopoverVisible"
          >
            <template #default>
              <div class="rainbowLinesOptionsBox" :class="{ isDark: isDark }">
                <div
                  class="optionItem"
                  v-for="item in rainbowLinesOptions"
                  :key="item.value"
                >
                  <div
                    class="colorsBar"
                    v-if="item.list"
                    @click="updateRainbowLinesConfig(item)"
                  >
                    <span
                      class="colorItem"
                      v-for="color in item.list"
                      :style="{ backgroundColor: color }"
                    ></span>
                  </div>
                  <span v-else @click="updateRainbowLinesConfig(item)">{{
                    $t('baseStyle.notUseRainbowLines')
                  }}</span>
                </div>
              </div>
            </template>
            <template #reference>
              <div class="curRainbowLine">
                <div class="colorsBar" v-if="curRainbowLineColorList">
                  <span
                    class="colorItem"
                    v-for="color in curRainbowLineColorList"
                    :style="{ backgroundColor: color }"
                  ></span>
                </div>
                <span v-else>{{ $t('baseStyle.notUseRainbowLines') }}</span>
              </div>
            </template>
          </el-popover>
        </div>
      </div>
      <!-- 概要连线 -->
      <div class="title">{{ $t('baseStyle.lineOfOutline') }}</div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.color') }}</span>
          <el-popover ref="popover2" placement="bottom" trigger="click">
            <template #reference>
              <span
                class="block"
                :style="{ backgroundColor: style.generalizationLineColor }"
              ></span>
            </template>
            <Color
              :color="style.generalizationLineColor"
              @change="
                color => {
                  update('generalizationLineColor', color)
                }
              "
            ></Color>
          </el-popover>
        </div>
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.width') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.generalizationLineWidth"
            placeholder=""
            @change="
              value => {
                update('generalizationLineWidth', value)
              }
            "
          >
            <el-option
              v-for="item in lineWidthList"
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
      </div>
      <!-- 关联线 -->
      <div class="title">{{ $t('baseStyle.associativeLine') }}</div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.associativeLineColor') }}</span>
          <el-popover ref="popover4" placement="bottom" trigger="click">
            <template #reference>
              <span
                class="block"
                :style="{ backgroundColor: style.associativeLineColor }"
              ></span>
            </template>
            <Color
              :color="style.associativeLineColor"
              @change="
                color => {
                  update('associativeLineColor', color)
                }
              "
            ></Color>
          </el-popover>
        </div>
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.associativeLineWidth') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.associativeLineWidth"
            placeholder=""
            @change="
              value => {
                update('associativeLineWidth', value)
              }
            "
          >
            <el-option
              v-for="item in lineWidthList"
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
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{
            $t('baseStyle.associativeLineActiveColor')
          }}</span>
          <el-popover ref="popover5" placement="bottom" trigger="click">
            <template #reference>
              <span
                class="block"
                :style="{ backgroundColor: style.associativeLineActiveColor }"
              ></span>
            </template>
            <Color
              :color="style.associativeLineActiveColor"
              @change="
                color => {
                  update('associativeLineActiveColor', color)
                }
              "
            ></Color>
          </el-popover>
        </div>
        <div class="rowItem">
          <span class="name">{{
            $t('baseStyle.associativeLineActiveWidth')
          }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.associativeLineActiveWidth"
            placeholder=""
            @change="
              value => {
                update('associativeLineActiveWidth', value)
              }
            "
          >
            <el-option
              v-for="item in lineWidthList"
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
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('style.style') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.associativeLineDasharray"
            placeholder=""
            @change="
              value => {
                update('associativeLineDasharray', value)
              }
            "
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
                    style.associativeLineDasharray === item.value
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
      <!-- 关联线文字 -->
      <div class="title">{{ $t('baseStyle.associativeLineText') }}</div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.fontFamily') }}</span>
          <el-select
            size="small"
            v-model="style.associativeLineTextFontFamily"
            placeholder=""
            @change="update('associativeLineTextFontFamily', $event)"
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
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.color') }}</span>
          <el-popover ref="popover6" placement="bottom" trigger="click">
            <template #reference>
              <span
                class="block"
                :style="{ backgroundColor: style.associativeLineTextColor }"
              ></span>
            </template>
            <Color
              :color="style.associativeLineTextColor"
              @change="
                color => {
                  update('associativeLineTextColor', color)
                }
              "
            ></Color>
          </el-popover>
        </div>
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.fontSize') }}</span>
          <el-select
            size="small"
            style="width: 80px"
            v-model="style.associativeLineTextFontSize"
            placeholder=""
            @change="update('associativeLineTextFontSize', $event)"
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
      </div>
      <!-- 节点边框风格 -->
      <template v-if="showNodeUseLineStyle">
        <div class="title">{{ $t('baseStyle.nodeBorderType') }}</div>
        <div class="row">
          <div class="rowItem">
            <el-checkbox
              v-model="style.nodeUseLineStyle"
              @change="
                value => {
                  update('nodeUseLineStyle', value)
                }
              "
              >{{ $t('baseStyle.nodeUseLineStyle') }}</el-checkbox
            >
          </div>
        </div>
      </template>
      <!-- 内边距 -->
      <div class="title">{{ $t('baseStyle.nodePadding') }}</div>
      <div class="row noBottom">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.horizontal') }}</span>
          <el-slider
            style="width: 200px"
            v-model="style.paddingX"
            @change="
              value => {
                update('paddingX', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.vertical') }}</span>
          <el-slider
            style="width: 200px"
            v-model="style.paddingY"
            @change="
              value => {
                update('paddingY', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <!-- 图片 -->
      <div class="title">{{ $t('baseStyle.image') }}</div>
      <div class="row noBottom">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.maximumWidth') }}</span>
          <el-slider
            style="width: 140px"
            v-model="style.imgMaxWidth"
            :min="10"
            :max="500"
            @change="
              value => {
                update('imgMaxWidth', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.maximumHeight') }}</span>
          <el-slider
            style="width: 140px"
            v-model="style.imgMaxHeight"
            :min="10"
            :max="500"
            @change="
              value => {
                update('imgMaxHeight', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <!-- 图标 -->
      <div class="title">{{ $t('baseStyle.icon') }}</div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.size') }}</span>
          <el-slider
            style="width: 200px"
            v-model="style.iconSize"
            :min="12"
            :max="50"
            @change="
              value => {
                update('iconSize', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <!-- 二级节点外边距 -->
      <div class="title">{{ $t('baseStyle.nodeMargin') }}</div>
      <div class="row column noBottom">
        <el-tabs
          class="tab"
          v-model="marginActiveTab"
          @tab-click="initMarginStyle"
        >
          <el-tab-pane
            :label="$t('baseStyle.level2Node')"
            name="second"
          ></el-tab-pane>
          <el-tab-pane
            :label="$t('baseStyle.belowLevel2Node')"
            name="node"
          ></el-tab-pane>
        </el-tabs>
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.horizontal') }}</span>
          <el-slider
            :max="200"
            style="width: 200px"
            v-model="style.marginX"
            @change="
              value => {
                updateMargin('marginX', value)
              }
            "
          ></el-slider>
        </div>
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.vertical') }}</span>
          <el-slider
            :max="200"
            style="width: 200px"
            v-model="style.marginY"
            @change="
              value => {
                updateMargin('marginY', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <!-- 外框内边距 -->
      <div class="title">{{ $t('baseStyle.outerFramePadding') }}</div>
      <div class="row noBottom">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.horizontal') }}</span>
          <el-slider
            style="width: 200px"
            v-model="outerFramePadding.outerFramePaddingX"
            @change="
              value => {
                updateOuterFramePadding('outerFramePaddingX', value)
              }
            "
          ></el-slider>
        </div>
      </div>
      <div class="row">
        <div class="rowItem">
          <span class="name">{{ $t('baseStyle.vertical') }}</span>
          <el-slider
            style="width: 200px"
            v-model="outerFramePadding.outerFramePaddingY"
            @change="
              value => {
                updateOuterFramePadding('outerFramePaddingY', value)
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
import { storeToRefs } from 'pinia'
import Sidebar from './Sidebar.vue'
import Color from './Color.vue'
import {
  lineWidthList,
  lineStyleList as lineStyleListConfig,
  backgroundRepeatList as backgroundRepeatListConfig,
  backgroundPositionList as backgroundPositionListConfig,
  backgroundSizeList as backgroundSizeListConfig,
  fontFamilyList as fontFamilyListConfig,
  fontSizeList,
  rootLineKeepSameInCurveList as rootLineKeepSameInCurveListConfig,
  lineStyleMap,
  borderDasharrayList as borderDasharrayListConfig
} from '@/config'
import ImgUpload from '@/components/ImgUpload/index.vue'
import { storeData, storeConfig } from '@/api'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { useI18n } from 'vue-i18n'
import {
  supportLineStyleLayoutsMap,
  supportLineRadiusLayouts,
  supportNodeUseLineStyleLayouts,
  supportRootLineKeepSameInCurveLayouts,
  rainbowLinesOptions
} from '@/config/constant'

type LocaleKey = 'zh' | 'en' | 'zhtw' | 'vi'

const props = defineProps<{
  data: Record<string, any> | null
  configData: Record<string, any>
  mindMap: any
}>()

const store = useStore()
const { activeSidebar } = storeToRefs(store)
const bus = getBus()
const { locale } = useI18n()
const localeKey = computed(() => (locale.value ?? (locale as any)) as LocaleKey)

const sidebar = ref<InstanceType<typeof Sidebar> | null>(null)
const activeTab = ref('color')
const marginActiveTab = ref('second')
const style = reactive({
  backgroundColor: '',
  lineColor: '',
  lineWidth: '',
  lineStyle: '',
  showLineMarker: '',
  rootLineKeepSameInCurve: '',
  rootLineStartPositionKeepSameInCurve: '',
  lineRadius: 0,
  lineFlow: false,
  lineFlowForward: true,
  lineFlowDuration: 1,
  generalizationLineWidth: '',
  generalizationLineColor: '',
  associativeLineColor: '',
  associativeLineWidth: 0,
  associativeLineActiveWidth: 0,
  associativeLineDasharray: '',
  associativeLineActiveColor: '',
  associativeLineTextFontSize: 0,
  associativeLineTextColor: '',
  associativeLineTextFontFamily: '',
  paddingX: 0,
  paddingY: 0,
  imgMaxWidth: 0,
  imgMaxHeight: 0,
  iconSize: 0,
  backgroundImage: '',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '',
  backgroundSize: '',
  marginX: 0,
  marginY: 0,
  nodeUseLineStyle: false
})
const rainbowLinesPopoverVisible = ref(false)
const curRainbowLineColorList = ref<string[] | null>(null)
const currentLayout = ref('')
const outerFramePadding = reactive({
  outerFramePaddingX: 0,
  outerFramePaddingY: 0
})
const bgListExpand = ref(true)

const isDark = computed(() => useStore().isDark ?? false)
const bgList = computed(() => useStore().bgList ?? [])
const lineStyleList = computed(
  () => lineStyleListConfig[localeKey.value] || lineStyleListConfig.zh
)
const rootLineKeepSameInCurveList = computed(
  () =>
    rootLineKeepSameInCurveListConfig[localeKey.value] ||
    rootLineKeepSameInCurveListConfig.zh
)
const backgroundRepeatList = computed(
  () => backgroundRepeatListConfig[localeKey.value] || backgroundRepeatListConfig.zh
)
const backgroundPositionList = computed(
  () =>
    backgroundPositionListConfig[localeKey.value] ||
    backgroundPositionListConfig.zh
)
const backgroundSizeList = computed(
  () => backgroundSizeListConfig[localeKey.value] || backgroundSizeListConfig.zh
)
const fontFamilyList = computed(
  () => fontFamilyListConfig[localeKey.value] || fontFamilyListConfig.zh
)
const showNodeUseLineStyle = computed(() =>
  supportNodeUseLineStyleLayouts.includes(currentLayout.value)
)
const showLineRadius = computed(
  () =>
    (style as any).lineStyle === 'straight' &&
    supportLineRadiusLayouts.includes(currentLayout.value)
)
const lineStyleListShow = computed(() => {
  const res: { value: string; name: string }[] = []
  lineStyleList.value.forEach((item: { value: string; name: string }) => {
    const list = supportLineStyleLayoutsMap[item.value]
    if (list) {
      if (list.includes(currentLayout.value)) res.push(item)
    } else {
      res.push(item)
    }
  })
  return res
})
const showRootLineKeepSameInCurveLayouts = computed(() =>
  supportRootLineKeepSameInCurveLayouts.includes(currentLayout.value)
)
const borderDasharrayList = computed(
  () => borderDasharrayListConfig[localeKey.value] || borderDasharrayListConfig.zh
)

function onSetData() {
  if (activeSidebar.value !== 'baseStyle') return
  setTimeout(() => initStyle(), 0)
}

function initStyle() {
  if (!props.mindMap) return
  Object.keys(style).forEach((key) => {
    ;(style as any)[key] = props.mindMap.getThemeConfig(key)
    if (key === 'backgroundImage' && (style as any)[key] === 'none') {
      ;(style as any)[key] = ''
    }
  })
  initMarginStyle()
}

function initRainbowLines() {
  if (!props.mindMap) return
  const config = props.mindMap.getConfig('rainbowLinesConfig') || {}
  curRainbowLineColorList.value = config.open
    ? props.mindMap.rainbowLines
      ? props.mindMap.rainbowLines.getColorsList()
      : null
    : null
}

function initOuterFramePadding() {
  if (!props.mindMap) return
  outerFramePadding.outerFramePaddingX = props.mindMap.getConfig(
    'outerFramePaddingX'
  )
  outerFramePadding.outerFramePaddingY = props.mindMap.getConfig(
    'outerFramePaddingX'
  )
}

function initMarginStyle() {
  if (!props.mindMap || !props.data) return
  ;['marginX', 'marginY'].forEach((key) => {
    const theme = props.mindMap.getThemeConfig()
    ;(style as any)[key] = theme[marginActiveTab.value]?.[key]
  })
}

function update(key: string, value: any) {
  if (key === 'backgroundImage' && value === 'none') {
    ;(style as any)[key] = ''
  } else {
    ;(style as any)[key] = value
  }
  if (!props.data?.theme?.config) return
  props.data.theme.config[key] = value
  bus.$emit('showLoading')
  props.mindMap.setThemeConfig(props.data.theme.config)
  storeData({
    theme: {
      template: props.mindMap.getTheme(),
      config: props.data.theme.config
    }
  })
}

function updateRainbowLinesConfig(item: { list?: string[] | null }) {
  rainbowLinesPopoverVisible.value = false
  curRainbowLineColorList.value = item.list ?? null
  let newConfig: { open: boolean; colorsList?: string[] } | null = null
  if (item.list) {
    newConfig = { open: true, colorsList: item.list }
  } else {
    newConfig = { open: false }
  }
  props.configData.rainbowLinesConfig = newConfig
  props.mindMap.rainbowLines?.updateRainLinesConfig(newConfig)
  storeConfig(props.configData)
}

function updateOuterFramePadding(prop: string, value: number) {
  ;(outerFramePadding as any)[prop] = value
  ;(props.configData as any)[prop] = value
  props.mindMap.updateConfig({ [prop]: value })
  storeConfig(props.configData)
  props.mindMap.render()
}

function updateMargin(type: string, value: number) {
  ;(style as any)[type] = value
  if (!props.data?.theme?.config) return
  if (!props.data.theme.config[marginActiveTab.value]) {
    props.data.theme.config[marginActiveTab.value] = {}
  }
  props.data.theme.config[marginActiveTab.value][type] = value
  props.mindMap.setThemeConfig(props.data.theme.config)
  storeData({
    theme: {
      template: props.mindMap.getTheme(),
      config: props.data.theme.config
    }
  })
}

function useBg(bg: string) {
  update('backgroundImage', bg)
}

watch(activeSidebar, (val) => {
  const s = sidebar.value as { setShow?: (v: boolean) => void } | null
  if (!s?.setShow) return
  if (val === 'baseStyle') {
    s.setShow(true)
    initStyle()
    initRainbowLines()
    initOuterFramePadding()
    if (props.mindMap) currentLayout.value = props.mindMap.getLayout()
  } else {
    s.setShow(false)
  }
})

watch(
  lineStyleListShow,
  () => {
    const has = lineStyleListShow.value.find(
      (item) => item.value === (style as any).lineStyle
    )
    if (!has && lineStyleListShow.value.length > 0) {
      ;(style as any).lineStyle = lineStyleListShow.value[0].value
    }
  },
  { deep: true }
)

onMounted(() => {
  bus.$on('setData', onSetData)
})

onBeforeUnmount(() => {
  bus.$off('setData', onSetData)
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
        .name,
        .curRainbowLine {
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

    &.column {
      flex-direction: column;
    }

    .tab {
      width: 100%;
    }

    .imgUpload {
      margin-bottom: 5px;
    }

    .btnGroup {
      width: 100%;
      display: flex;
      justify-content: space-between;
    }

    .rowItem {
      display: flex;
      align-items: center;
      margin-bottom: 5px;

      &.spaceBetween {
        justify-content: space-between;
      }

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

      .curRainbowLine {
        height: 24px;
        border: 1px solid #dcdfe6;
        font-size: 12px;
        width: 240px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .iconBtn {
        cursor: pointer;
        transition: all 0.3s;

        &.top {
          transform: rotateZ(-180deg);
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

      .colorShow {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
      }
    }

    .bgList {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      height: 75px;

      &.expand {
        height: max-content;
      }

      .bgItem {
        width: 120px;
        height: 73px;
        border: 1px solid #e9e9e9;
        border-radius: 5px;
        overflow: hidden;
        padding: 5px;
        margin-bottom: 8px;
        cursor: pointer;

        &.active {
          border-color: #409eff;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
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

.lineStyleOption {
  &.isDark {
    svg {
      path {
        stroke: #fff;
      }
    }
  }

  &.isSelected {
    svg {
      path {
        stroke: #409eff;
      }
    }
  }

  svg {
    margin-top: 4px;

    path {
      stroke: #000;
    }
  }
}

.rainbowLinesOptionsBox {
  width: 200px;

  &.isDark {
    .optionItem {
      color: hsla(0, 0%, 100%, 0.6);

      &:hover {
        background-color: hsla(0, 0%, 100%, 0.05);
      }
    }
  }

  .optionItem {
    width: 100%;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

.colorsBar {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;

  .colorItem {
    flex: 1;
    height: 15px;
  }
}
</style>
