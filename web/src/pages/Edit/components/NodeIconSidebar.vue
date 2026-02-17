<template>
  <Sidebar ref="sidebar" :title="$t('nodeIconSidebar.title')">
    <div class="box" :class="{ isDark: isDark }">
      <el-tabs v-model="activeName">
        <el-tab-pane :label="$t('nodeIconSidebar.icon')" name="icon"></el-tab-pane>
        <el-tab-pane :label="$t('nodeIconSidebar.sticker')" name="image"></el-tab-pane>
      </el-tabs>
      <div class="boxContent">
        <div class="iconBox" v-if="activeName === 'icon'">
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
        </div>
        <div class="imageBox" v-if="activeName === 'image'">
          <div class="item" v-for="item in nodeImageList" :key="item.name">
            <div class="title">{{ item.name }}</div>
            <div class="list">
              <div
                class="icon"
                v-for="image in item.list"
                :key="image.url"
                :class="{ selected: nodeImage === image.url }"
                @click="setImage(image)"
              >
                <img :src="image.url" alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Sidebar from './Sidebar.vue'
import { useStoreMixin } from '@/mixins/storeMixin'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { nodeIconList as _nodeIconList } from 'simple-mind-map/src/svg/icons'
import { mergerIconList } from 'simple-mind-map/src/utils/index'
import icon from '@/config/icon'
import image from '@/config/image'

const { activeSidebar, setActiveSidebar } = useStoreMixin()
const bus = getBus()

const sidebar = ref<InstanceType<typeof Sidebar> | null>(null)
const activeName = ref('icon')
const nodeIconList = ref(mergerIconList([..._nodeIconList, ...icon]))
const nodeImageList = ref([...image])
const iconList = ref<string[]>([])
const nodeImage = ref<string | string[]>('')
const activeNodes = ref<any[]>([])

const isDark = computed(() => useStore().isDark ?? false)

watch(activeSidebar, (val) => {
  const s = sidebar.value as { setShow?: (v: boolean) => void } | null
  if (s?.setShow) s.setShow(val === 'nodeIconSidebar')
})

function handleNodeActive(...args: any[]) {
  activeNodes.value = [...args[1]]
  if (activeNodes.value.length > 0) {
    if (activeNodes.value.length === 1) {
      const firstNode = activeNodes.value[0]
      const img = firstNode.getData('image')
      nodeImage.value = img?.url ?? (typeof img === 'string' ? img : '')
      iconList.value = firstNode.getData('icon') || []
    } else {
      nodeImage.value = []
      iconList.value = []
    }
  } else {
    iconList.value = []
    nodeImage.value = ''
  }
}

function handleShowNodeIcon() {
  setActiveSidebar('nodeIconSidebar')
}

function getHtml(iconStr: string) {
  return /^<svg/.test(iconStr) ? iconStr : `<img src="${iconStr}" />`
}

function setIcon(type: string, name: string) {
  activeNodes.value.forEach((node) => {
    const list = [...(node.getData('icon') || [])]
    const key = type + '_' + name
    const index = list.findIndex((item) => item === key)
    if (index !== -1) {
      list.splice(index, 1)
    } else {
      const typeIndex = list.findIndex((item) => item.split('_')[0] === type)
      if (typeIndex !== -1) list.splice(typeIndex, 1, key)
      else list.push(key)
    }
    node.setIcon(list)
    if (activeNodes.value.length === 1) iconList.value = list
  })
}

function setImage(img: any) {
  activeNodes.value.forEach((node) => {
    nodeImage.value = img.url
    node.setImage({ ...img })
  })
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
.box {
  padding: 0 20px;

  &.isDark {
    .title {
      color: #fff;
    }
  }

  .title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }

  .boxContent {
    .iconBox {
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

    .imageBox {
      margin-bottom: 20px;
      font-weight: bold;

      .title {
        margin-bottom: 10px;
      }

      .list {
        display: flex;
        flex-wrap: wrap;

        .icon {
          width: 50px;
          height: 50px;
          margin-right: 10px;
          margin-bottom: 10px;
          cursor: pointer;
          position: relative;

          :deep(img) {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          &.selected {
            &::after {
              content: '';
              position: absolute;
              left: -4px;
              top: -4px;
              width: 54px;
              height: 54px;
              border: 2px solid #409eff;
            }
          }
        }
      }
    }
  }
}
</style>
