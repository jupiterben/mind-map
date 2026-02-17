<template>
  <Sidebar ref="sidebar" :title="$t('note.title')">
    <div class="noteContentWrap" ref="noteContentWrap"></div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { storeMixin } from '@/mixins/storeMixin'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

export default {
  mixins: [storeMixin],
  components: {
    Sidebar
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      editor: null,
      node: null
    }
  },
  computed: {},
  watch: {
    activeSidebar(val) {
      if (val === 'noteSidebar') {
        this.$refs.sidebar.show = true
      } else {
        this.$refs.sidebar.show = false
      }
    }
  },
  created() {
    this.$bus.$on('node_active', this.onNodeActive)
    this.mindMap.on('node_note_click', this.onNodeNoteClick)
  },
  mounted() {
    this.initEditor()
  },
  beforeUnmount() {
    this.$bus.$off('node_active', this.onNodeActive)
    this.mindMap.off('node_note_click', this.onNodeNoteClick)
  },
  methods: {
    onNodeActive(...args) {
      if (this.activeSidebar !== 'noteSidebar') {
        return
      }
      const nodes = [...args[1]]
      if (nodes.length > 0) {
        if (nodes[0] !== this.node) {
          this.setActiveSidebar(null)
        }
      } else {
        this.setActiveSidebar(null)
      }
    },

    // 初始化编辑器
    initEditor() {
      if (!this.editor) {
        this.editor = new Viewer({
          el: this.$refs.noteContentWrap
        })
      }
    },

    onNodeNoteClick(node) {
      this.node = node
      this.setActiveSidebar('noteSidebar')
      this.editor.setMarkdown(node.getData('note'))
    }
  }
}
</script>

<style lang="less" scoped>
.noteContentWrap {
  padding: 12px 20px;
}
</style>
