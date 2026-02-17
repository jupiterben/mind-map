<template>
  <div class="imgUploadContainer">
    <div class="imgUploadPanel">
      <div class="upBtn" v-if="!modelValue">
        <label
          for="imgUploadInput"
          class="imgUploadInputArea"
          @dragenter.stop.prevent
          @dragover.stop.prevent
          @drop.stop.prevent="onDrop"
          >点击此处选择图片、或拖动图片到此</label
        >
        <input
          type="file"
          accept="image/*"
          id="imgUploadInput"
          @change="onImgUploadInputChange"
        />
      </div>
      <div v-if="modelValue" class="uploadInfoBox">
        <div
          class="previewBox"
          :style="{ backgroundImage: `url('${modelValue}')` }"
        ></div>
        <span class="delBtn el-icon-close" @click="deleteImg"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const modelValue = defineModel<string>({ default: '' })
const file = ref<File | null>(null)

function onImgUploadInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  const f = target.files?.[0]
  if (f) selectImg(f)
}

function onDrop(e: DragEvent) {
  const dt = e.dataTransfer
  const f = dt?.files?.[0]
  if (f) selectImg(f)
}

function selectImg(f: File) {
  file.value = f
  const fr = new FileReader()
  fr.readAsDataURL(f)
  fr.onload = (ev) => {
    const result = (ev.target as FileReader).result as string
    modelValue.value = result
  }
}

function getSize(): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = modelValue.value || ''
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
  })
}

function deleteImg() {
  modelValue.value = ''
  file.value = null
}

defineExpose({ getSize })
</script>

<style lang="less" scoped>
@import './style.less';
</style>
