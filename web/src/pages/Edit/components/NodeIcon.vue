<template>
  <el-dialog
    class="nodeIconDialog"
    :title="$t('nodeIcon.title')"
    v-model="dialogVisible"
    width="500"
  >
    <div class="item" v-for="item in nodeIconList" :key="item.name">
      <div class="title">{{ item.name }}</div>
      <div class="list">
        <div
          class="icon"
          v-for="icon in item.list"
          :key="icon.name"
          v-html="getHtml(icon.icon)"
          :class="{ selected: iconList.includes(item.type + '_' + icon.name) }"
          @click="setIcon(item.type, icon.name)"
        ></div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { nodeIconList as _nodeIconList } from 'simple-mind-map/src/svg/icons'
import icon from '@/config/icon'
import { getBus } from '@/bus'

const nodeIconList = ref([..._nodeIconList, ...icon])
const bus = getBus()

const dialogVisible = ref(false)
const iconList = ref<string[]>([])
const activeNodes = ref<any[]>([])

function handleNodeActive(...args: any[]) {
  activeNodes.value = [...args[1]]
  if (activeNodes.value.length > 0) {
    iconList.value = activeNodes.value[0].getData('icon') || []
  } else {
    iconList.value = []
  }
}

function handleShowNodeIcon() {
  dialogVisible.value = true
}

function getHtml(iconStr: string) {
  return /^<svg/.test(iconStr) ? iconStr : `<img src="${iconStr}" />`
}

function setIcon(type: string, name: string) {
  const key = type + '_' + name
  const index = iconList.value.findIndex((item) => item === key)
  if (index !== -1) {
    iconList.value.splice(index, 1)
  } else {
    const typeIndex = iconList.value.findIndex((item) => item.split('_')[0] === type)
    if (typeIndex !== -1) {
      iconList.value.splice(typeIndex, 1, key)
    } else {
      iconList.value.push(key)
    }
  }
  activeNodes.value.forEach((node) => node.setIcon([...iconList.value]))
}

onMounted(() => {
  bus.$on('node_active', handleNodeActive)
  bus.$on('showNodeIcon', handleShowNodeIcon)
})

onBeforeUnmount(() => {
  bus.$off('node_active', handleNodeActive)
  bus.$off('showNodeIcon', handleShowNodeIcon)
})
</script>

<style lang="less" scoped>
.nodeIconDialog {
  :deep(.el-dialog__body) {
    padding: 0 20px;
  }

  .deleteBtn {
    margin-bottom: 20px;
  }

  .item {
    margin-bottom: 20px;
    font-weight: bold;

    .title {
      margin-bottom: 10px;
    }

    .list {
      display: flex;
      flex-wrap: wrap;

      .icon {
        width: 24px;
        height: 24px;
        margin-right: 10px;
        margin-bottom: 10px;
        cursor: pointer;
        position: relative;

        :deep(img) {
          width: 100%;
          height: 100%;
        }

        :deep(svg) {
          width: 100%;
          height: 100%;
        }

        &.selected {
          &::after {
            content: '';
            position: absolute;
            left: -4px;
            top: -4px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid #409eff;
          }
        }
      }
    }
  }
}
</style>
