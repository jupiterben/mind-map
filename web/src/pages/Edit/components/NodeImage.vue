<template>
  <el-dialog
    class="nodeImageDialog"
    :title="$t('nodeImage.title')"
    v-model="dialogVisible"
    :width="isMobile ? '90%' : '600px'"
    :top="isMobile ? '20px' : '15vh'"
  >
    <div class="title">方式一</div>
    <ImgUpload ref="ImgUploadRef" v-model="img" style="margin-bottom: 12px;"></ImgUpload>
    <div class="title">方式二</div>
    <div class="inputBox">
      <span class="label">请输入图片地址</span>
      <el-input
        v-model="imgUrl"
        size="small"
        placeholder="http://xxx.com/xx.jpg"
        @keydown.stop
      ></el-input>
    </div>
    <div class="title">可选</div>
    <div class="inputBox">
      <span class="label">{{ $t('nodeImage.imgTitle') }}</span>
      <el-input v-model="imgTitle" size="small" @keydown.stop></el-input>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ImgUpload from '@/components/ImgUpload/index.vue'
import { getBus } from '@/bus'
import { getImageSize, isMobile as checkIsMobile } from 'simple-mind-map/src/utils/index'

const bus = getBus()

const ImgUploadRef = ref<InstanceType<typeof ImgUpload> | null>(null)
const dialogVisible = ref(false)
const img = ref('')
const imgUrl = ref('')
const imgTitle = ref('')
const activeNodes = ref<any[]>([])
const isMobile = checkIsMobile()

function handleNodeActive(...args: any[]) {
  activeNodes.value = [...args[1]]
}

function handleShowNodeImage() {
  reset()
  if (activeNodes.value.length > 0) {
    const firstNode = activeNodes.value[0]
    const imgVal = firstNode.getImageUrl() || ''
    if (imgVal) {
      if (/^https?:\/\//.test(imgVal)) {
        imgUrl.value = imgVal
      } else {
        img.value = imgVal
      }
    }
    imgTitle.value = firstNode.getData('imageTitle') || ''
  }
  dialogVisible.value = true
}

function cancel() {
  dialogVisible.value = false
  reset()
}

function reset() {
  img.value = ''
  imgTitle.value = ''
  imgUrl.value = ''
}

async function confirm() {
  try {
    if (!img.value && !imgUrl.value) {
      cancel()
      activeNodes.value.forEach((node) => node.setImage(null))
      return
    }
    let res: { width?: number; height?: number } | null = null
    let imgSrc = ''
    if (img.value) {
      imgSrc = img.value
      res = await ImgUploadRef.value?.getSize?.()
    } else if (imgUrl.value) {
      imgSrc = imgUrl.value
      res = await getImageSize(imgSrc)
    }
    activeNodes.value.forEach((node) => {
      node.setImage({
        url: imgSrc || 'none',
        title: imgTitle.value,
        width: res?.width || 100,
        height: res?.height || 100
      })
    })
    cancel()
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  bus.$on('node_active', handleNodeActive)
  bus.$on('showNodeImage', handleShowNodeImage)
})

onBeforeUnmount(() => {
  bus.$off('node_active', handleNodeActive)
  bus.$off('showNodeImage', handleShowNodeImage)
})
</script>

<style lang="less" scoped>
.nodeImageDialog {
  .title {
    font-size: 18px;
    margin-bottom: 12px;
  }

  .inputBox {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .label {
      width: 150px;
    }
  }
}
</style>
