<template>
  <el-dialog
    class="nodeTagDialog"
    :title="$t('nodeTag.title')"
    v-model="dialogVisible"
    :width="isMobile ? '90%' : '50%'"
    :top="isMobile ? '20px' : '15vh'"
  >
    <el-input
      v-model="tag"
      @keyup.enter="add"
      @keyup.stop
      @keydown.stop
      :disabled="tagArr.length >= max"
      :placeholder="$t('nodeTag.addTip')"
    ></el-input>
    <div class="tagList">
      <div
        class="tagItem"
        v-for="(item, index) in tagArr"
        :key="index"
        :style="{ backgroundColor: generateColorByContent(item) }"
      >
        {{ typeof item === 'string' ? item : item.text }}
        <div class="delBtn" @click="del(index)">
          <span class="iconfont iconshanchu"></span>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancel">{{ $t('dialog.cancel') }}</el-button>
        <el-button type="primary" @click="confirm">{{ $t('dialog.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { getBus } from '@/bus'
import { generateColorByContent, isMobile as checkIsMobile } from 'simple-mind-map/src/utils/index'

const bus = getBus()

const dialogVisible = ref(false)
const tagArr = ref<any[]>([])
const tag = ref('')
const activeNodes = ref<any[]>([])
const max = 5
const isMobile = checkIsMobile()

function handleNodeActive(...args: any[]) {
  activeNodes.value = [...args[1]]
  if (activeNodes.value.length > 0) {
    tagArr.value = activeNodes.value[0].getData('tag') || []
  } else {
    tagArr.value = []
    tag.value = ''
  }
}

function handleShowNodeTag() {
  bus.$emit('startTextEdit')
  dialogVisible.value = true
}

function add() {
  const text = tag.value.trim()
  if (!text) return
  tagArr.value.push(text)
  tag.value = ''
}

function del(index: number) {
  tagArr.value.splice(index, 1)
}

function cancel() {
  dialogVisible.value = false
}

function confirm() {
  activeNodes.value.forEach((node) => node.setTag(tagArr.value))
  cancel()
}

watch(dialogVisible, (val, oldVal) => {
  if (!val && oldVal) bus.$emit('endTextEdit')
})

onMounted(() => {
  bus.$on('node_active', handleNodeActive)
  bus.$on('showNodeTag', handleShowNodeTag)
})

onBeforeUnmount(() => {
  bus.$off('node_active', handleNodeActive)
  bus.$off('showNodeTag', handleShowNodeTag)
})
</script>

<style lang="less" scoped>
.nodeTagDialog {
  .tagList {
    display: flex;
    flex-wrap: wrap;
    margin-top: 5px;

    .tagItem {
      position: relative;
      padding: 3px 5px;
      margin-right: 5px;
      margin-bottom: 5px;
      color: #fff;

      .delBtn {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        visibility: hidden;
      }

      &:hover {
        .delBtn {
          visibility: visible;
        }
      }
    }
  }
}
</style>
