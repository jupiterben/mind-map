<template>
  <div
    class="nodeTagStyleContainer"
    ref="elRef"
    :style="position"
    v-show="show"
    :class="{ isDark: isDark }"
  >
    <div class="row">
      <el-input
        v-model="text"
        :placeholder="$t('nodeTagStyle.placeholder')"
        size="small"
        @blur="updateTagText"
        @keydown.stop
        @keyup.enter.stop="updateTagText"
      ></el-input>
      <div class="deleteBtn" @click.stop="deleteTag">
        <span class="iconfont iconshanchu"></span>
        <span class="text">{{ $t('nodeTagStyle.delete') }}</span>
      </div>
    </div>
    <div class="row">
      <Color :color="fill" @change="updateTagFill"></Color>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import Color from './Color.vue'
import { useStore } from '@/store'

const props = defineProps<{
  mindMap: any
}>()

const isDark = computed(() => useStore().isDark ?? false)

const elRef = ref<HTMLElement | null>(null)
const show = ref(false)
const position = reactive({ left: '0px', top: '0px' })
const node = ref<any>(null)
const index = ref(0)
const text = ref('')
const fill = ref('')

function onNodeTagClick(n: any, tag: any, i: number, el: any) {
  node.value = n
  index.value = i
  if (typeof tag === 'string') {
    text.value = tag
  } else {
    text.value = tag.text
    fill.value = tag.style?.fill ?? ''
  }
  const { x, y, width, height } = el.rbox()
  const boxWidth = 260
  const boxHeight = 152
  let left = x + width / 2 - boxWidth / 2
  if (left < 0) left = 0
  if (left + boxWidth > window.innerWidth) left = window.innerWidth - boxWidth
  position.left = left + 'px'
  let top = y + height + 5
  if (top + boxHeight > window.innerHeight) top = window.innerHeight - boxHeight
  position.top = top + 'px'
  show.value = true
}

function updateTagText() {
  const t = text.value.trim()
  if (!t) return
  updateTagInfo({ text: t })
}

function updateTagFill(color: string) {
  updateTagInfo({ style: { fill: color } })
  fill.value = color
}

function updateTagInfo(payload: { text?: string; style?: Record<string, string> }) {
  if (!node.value) return
  const tagData = [...node.value.getData('tag')]
  let item: { text: string; style: Record<string, string> }
  if (typeof tagData[index.value] === 'string') {
    item = { text: tagData[index.value], style: {} }
  } else {
    item = tagData[index.value]
    if (!item.style) item.style = {}
  }
  if (payload.text) item.text = payload.text
  if (payload.style) {
    Object.keys(payload.style).forEach((k) => {
      item.style[k] = payload.style![k]
    })
  }
  tagData[index.value] = item
  props.mindMap.execCommand('SET_NODE_TAG', node.value, tagData)
}

function deleteTag() {
  if (!node.value) return
  const tagData = [...node.value.getData('tag')]
  tagData.splice(index.value, 1)
  props.mindMap.execCommand('SET_NODE_TAG', node.value, tagData)
  hide()
}

function hide() {
  show.value = false
  node.value = null
  index.value = 0
  text.value = ''
  fill.value = ''
}

onMounted(() => {
  props.mindMap.on('node_tag_click', onNodeTagClick)
  props.mindMap.on('scale', hide)
  props.mindMap.on('translate', hide)
  props.mindMap.on('svg_mousedown', hide)
  props.mindMap.on('expand_btn_click', hide)
  if (elRef.value) document.body.appendChild(elRef.value)
})

onBeforeUnmount(() => {
  props.mindMap.off('node_tag_click', onNodeTagClick)
  props.mindMap.off('scale', hide)
  props.mindMap.off('translate', hide)
  props.mindMap.off('svg_mousedown', hide)
  props.mindMap.off('expand_btn_click', hide)
})
</script>

<style lang="less" scoped>
.nodeTagStyleContainer {
  position: fixed;
  width: 260px;
  padding: 12px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);

  &.isDark {
    background-color: #262a2e;
    border-left-color: hsla(0, 0%, 100%, 0.1);
  }

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    &:last-of-type {
      margin-bottom: 0px;
    }

    .colorItem {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
    }

    .colorItemBox {
      height: 20px;
      cursor: pointer;

      .colorTriggerBtn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .colorItem {
          height: 5px;
        }
      }
    }

    .deleteBtn {
      white-space: nowrap;
      display: flex;
      align-items: center;
      margin-left: 5px;
      cursor: pointer;
      color: #9aa5b8;
      font-size: 12px;
      user-select: none;

      &:hover {
        color: #eb5555;
      }

      .iconfont {
        font-size: 12px;
        margin-right: 2px;
      }

      .text {
      }
    }
  }
}
</style>
