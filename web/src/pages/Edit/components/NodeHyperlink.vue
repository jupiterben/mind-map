<template>
  <el-dialog
    class="nodeHyperlinkDialog"
    :title="$t('nodeHyperlink.title')"
    v-model="dialogVisible"
    :width="isMobile ? '90%' : '50%'"
    :top="isMobile ? '20px' : '15vh'"
  >
    <div class="item">
      <span class="name">{{ $t('nodeHyperlink.link') }}</span>
      <el-input
        v-model="link"
        size="small"
        placeholder="http://xxxx.com/"
        @keyup.stop
        @keydown.stop
        @blur="handleUrl()"
      >
        <template #prepend>
          <el-select v-model="protocol" style="width: 80px">
            <el-option label="https" value="https"></el-option>
            <el-option label="http" value="http"></el-option>
            <el-option label="无" value="none"></el-option>
          </el-select>
        </template>
      </el-input>
    </div>
    <div class="item">
      <span class="name">{{ $t('nodeHyperlink.name') }}</span>
      <el-input v-model="linkTitle" size="small" @keyup.stop @keydown.stop></el-input>
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
import { getBus } from '@/bus'
import { isMobile as checkIsMobile } from 'simple-mind-map/src/utils/index'

const bus = getBus()

const dialogVisible = ref(false)
const link = ref('')
const linkTitle = ref('')
const activeNodes = ref<any[]>([])
const protocol = ref('https')
const isMobile = checkIsMobile()

function handleNodeActive(...args: any[]) {
  activeNodes.value = [...args[1]]
  if (activeNodes.value.length > 0) {
    const firstNode = activeNodes.value[0]
    link.value = firstNode.getData('hyperlink') || ''
    handleUrl(true)
    linkTitle.value = firstNode.getData('hyperlinkTitle') || ''
  } else {
    link.value = ''
    linkTitle.value = ''
  }
}

function removeProtocol(url: string) {
  return url.replace(/^https?:\/\//, '')
}

function handleUrl(setProtocolNoneIfNotExist?: boolean) {
  const res = link.value.match(/^(https?):\/\//)
  if (res?.[1]) {
    protocol.value = res[1]
  } else if (!link.value) {
    protocol.value = 'https'
  } else if (setProtocolNoneIfNotExist) {
    protocol.value = 'none'
  }
  link.value = removeProtocol(link.value)
}

function handleShowNodeLink() {
  dialogVisible.value = true
}

function cancel() {
  dialogVisible.value = false
}

function confirm() {
  activeNodes.value.forEach((node) => {
    node.setHyperlink(
      (protocol.value === 'none' ? '' : protocol.value + '://') + link.value,
      linkTitle.value
    )
  })
  cancel()
}

onMounted(() => {
  bus.$on('node_active', handleNodeActive)
  bus.$on('showNodeLink', handleShowNodeLink)
})

onBeforeUnmount(() => {
  bus.$off('node_active', handleNodeActive)
  bus.$off('showNodeLink', handleShowNodeLink)
})
</script>

<style lang="less" scoped>
.nodeHyperlinkDialog {
  .item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .name {
      display: block;
      width: 50px;
    }
  }
}
</style>
