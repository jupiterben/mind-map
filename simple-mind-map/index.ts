// @ts-nocheck
import View from './src/core/view/View'
import Event from './src/core/event/Event'
import Render from './src/core/render/Render'
import merge from 'deepmerge'
import theme from './src/theme'
import Style from './src/core/render/node/Style'
import KeyCommand from './src/core/command/KeyCommand'
import Command from './src/core/command/Command'
import BatchExecution from './src/utils/BatchExecution'
import {
  layoutValueList,
  CONSTANTS,
  ERROR_TYPES,
  cssContent,
  nodeDataNoStylePropList
} from './src/constants/constant'
import { SVG, G, Rect } from '@svgdotjs/svg.js'
import {
  simpleDeepClone,
  getObjectChangedProps,
  isUndef,
  handleGetSvgDataExtraContent,
  getNodeTreeBoundingRect,
  mergeTheme,
  createUidForAppointNodes
} from './src/utils'
import defaultTheme, {
  checkIsNodeSizeIndependenceConfig
} from './src/theme/default'
import { defaultOpt } from './src/constants/defaultOptions'

//  思维导图
class MindMap {
  opt!: Record<string, unknown>
  el!: HTMLElement
  width!: number
  height!: number
  initWidth!: number
  initHeight!: number
  cssEl!: HTMLStyleElement | null
  cssTextMap!: Record<string, string>
  nodeInnerPrefixList!: unknown[]
  nodeInnerPostfixList!: unknown[]
  editNodeClassList!: string[]
  extendShapeList!: { name: string }[]
  event!: any
  keyCommand!: any
  command!: any
  renderer!: any
  view!: any
  batchExecution!: any
  associativeLineDraw!: any
  draw!: any
  lineDraw!: any
  nodeDraw!: any
  otherDraw!: any
  elRect!: DOMRect
  themeConfig!: Record<string, unknown>
  commonCaches!: Record<string, unknown>
  demonstrate?: any
  doExport?: any
  watermark?: any
  svg!: any

  //  构造函数
  /**
   *
   * @param {defaultOpt} opt
   */
  constructor(opt: Record<string, unknown> = {}) {
    MindMap.instanceCount++
    // 合并选项
    this.opt = this.handleOpt(merge(defaultOpt, opt))
    // 预处理节点数据
    this.opt.data = this.handleData(this.opt.data)

    // 容器元素
    this.el = this.opt.el as HTMLElement
    if (!this.el) throw new Error('缺少容器元素el')

    // 获取容器尺寸位置信息
    this.getElRectInfo()

    // 画布初始大小
    this.initWidth = this.width
    this.initHeight = this.height

    // 必要的css样式
    this.cssEl = null
    this.cssTextMap = {} // 该样式在实例化时会动态添加到页面，同时导出为svg时也会添加到svg源码中

    // 节点前置/后置内容列表
    /*
      {
        name: '',// 一个唯一的类型标识
        // 创建节点的显示内容：节点元素、宽高
        createContent: (node) => {
          return {
            node: null,
            width: 0,
            height: 0
          }
        },
        // 创建保存到节点实例的opt对象中的数据
        createNodeData: () => {},
        // 更新节点实例的opt数据，返回数据是否改变了
        updateNodeData: () => {},
      }
    */
    this.nodeInnerPrefixList = []
    this.nodeInnerPostfixList = []

    // 编辑节点的类名列表，快捷键响应会检查事件目标是否是body或该列表中的元素，是的话才会响应
    // 该检查可以通过customCheckEnableShortcut选项来覆盖
    this.editNodeClassList = []

    // 扩展的节点形状列表
    /*
      {
        createShape: (node) => {
          return path
        },
        getPadding: ({ node, width, height, paddingX, paddingY }) => {
          return {
            paddingX: 0,
            paddingY: 0
          }  
        }
      }
    */
    this.extendShapeList = []

    // 画布
    this.initContainer()

    // 初始化主题
    this.initTheme()

    // 初始化缓存数据
    this.initCache()

    // 注册插件
    MindMap.pluginList
      .filter(plugin => {
        return plugin.preload
      })
      .forEach(plugin => {
        this.initPlugin(plugin)
      })

    // 事件类
    this.event = new Event({
      mindMap: this
    })

    // 按键类
    this.keyCommand = new KeyCommand({
      mindMap: this
    })

    // 命令类
    this.command = new Command({
      mindMap: this
    })

    // 渲染类
    this.renderer = new Render({
      mindMap: this
    })

    // 视图操作类
    this.view = new View({
      mindMap: this
    })

    // 批量执行类
    this.batchExecution = new BatchExecution()

    // 注册插件
    MindMap.pluginList
      .filter(plugin => {
        return !plugin.preload
      })
      .forEach(plugin => {
        this.initPlugin(plugin)
      })

    // 鼠标拖拽画布平移
    this.on('drag', this.onDragCanvas.bind(this))

    // 添加必要的css样式
    this.addCss()

    // 初始渲染
    this.render(this.opt.fit ? () => this.view.fit() : () => {})

    // 将初始数据添加到历史记录堆栈中
    if (this.opt.addHistoryOnInit && this.opt.data) {
      this.command.addHistory()
    }
  }

  //  配置参数处理
  handleOpt(opt: Record<string, unknown>) {
    // 检查布局配置
    if (!layoutValueList.includes(opt.layout as string)) {
      opt.layout = CONSTANTS.LAYOUT.LOGICAL_STRUCTURE
    }
    // 检查主题配置
    opt.theme = opt.theme && theme[opt.theme as string] ? opt.theme : 'default'
    return opt
  }

  // 预处理节点数据
  handleData(data: unknown) {
    if (isUndef(data) || Object.keys(data as object).length <= 0) return null
    data = simpleDeepClone((data as object) || {})
    const d = data as { data?: { expand?: boolean }; children?: unknown[] }
    if (!d.data || typeof d.data !== 'object') d.data = {}
    // 根节点不能收起
    if (d.data && d.data.expand === false) {
      d.data.expand = true
    }
    // 给没有uid的节点添加uid
    createUidForAppointNodes([data], false, null, true)
    return data
  }

  // 创建容器元素
  initContainer() {
    const { associativeLineIsAlwaysAboveNode } = this.opt
    // 给容器元素添加一个类名
    this.el.classList.add('smm-mind-map-container')
    // 节点关联线容器
    const createAssociativeLineDraw = () => {
      this.associativeLineDraw = this.draw.group()
      this.associativeLineDraw.addClass('smm-associative-line-container')
    }
    // 画布
    this.svg = SVG().addTo(this.el).size(this.width, this.height)

    // 容器
    this.draw = this.svg.group()
    this.draw.addClass('smm-container')
    // 节点连线容器
    this.lineDraw = this.draw.group()
    this.lineDraw.addClass('smm-line-container')
    // 默认处于节点下方
    if (!associativeLineIsAlwaysAboveNode) {
      createAssociativeLineDraw()
    }
    // 节点容器
    this.nodeDraw = this.draw.group()
    this.nodeDraw.addClass('smm-node-container')
    // 关联线始终处于节点上方
    if (associativeLineIsAlwaysAboveNode) {
      createAssociativeLineDraw()
    }
    // 其他内容的容器
    this.otherDraw = this.draw.group()
    this.otherDraw.addClass('smm-other-container')
  }

  // 清空各容器
  clearDraw() {
    this.lineDraw.clear()
    this.associativeLineDraw.clear()
    this.nodeDraw.clear()
    this.otherDraw.clear()
  }

  // 追加必要的css样式
  // 该样式在实例化时会动态添加到页面，同时导出为svg时也会添加到svg源码中
  appendCss(key: string, str: string) {
    this.cssTextMap[key] = str
    this.removeCss()
    this.addCss()
  }

  // 移除追加的css样式
  removeAppendCss(key: string) {
    if (this.cssTextMap[key]) {
      delete this.cssTextMap[key]
      this.removeCss()
      this.addCss()
    }
  }

  // 拼接必要的css样式
  joinCss() {
    return (
      cssContent +
      Object.keys(this.cssTextMap)
        .map(key => {
          return this.cssTextMap[key]
        })
        .join('\n')
    )
  }

  // 添加必要的css样式到页面
  addCss() {
    this.cssEl = document.createElement('style')
    this.cssEl.type = 'text/css'
    this.cssEl.innerHTML = this.joinCss()
    document.head.appendChild(this.cssEl)
  }

  // 移除css
  removeCss() {
    if (this.cssEl) document.head.removeChild(this.cssEl)
  }

  // 检查某个编辑节点类名是否存在，返回索引
  checkEditNodeClassIndex(className: string) {
    return this.editNodeClassList.findIndex(item => {
      return item === className
    })
  }

  // 添加一个编辑节点类名
  addEditNodeClass(className: string) {
    const index = this.checkEditNodeClassIndex(className)
    if (index === -1) {
      this.editNodeClassList.push(className)
    }
  }

  // 删除一个编辑节点类名
  deleteEditNodeClass(className: string) {
    const index = this.checkEditNodeClassIndex(className)
    if (index !== -1) {
      this.editNodeClassList.splice(index, 1)
    }
  }

  //  渲染，部分渲染
  render(callback?: (() => void) | null, source = '') {
    this.initTheme()
    this.renderer.render(callback ?? null, source)
  }

  //  重新渲染
  reRender(callback?: (() => void) | null, source = '') {
    this.renderer.reRender = true // 标记为重新渲染
    this.renderer.clearCache() // 清空节点缓存池
    this.clearDraw() // 清空画布
    this.render(callback ?? null, source)
  }

  // 获取或更新容器尺寸位置信息
  getElRectInfo() {
    this.elRect = this.el.getBoundingClientRect()
    this.width = this.elRect.width
    this.height = this.elRect.height
    if (this.width <= 0 || this.height <= 0)
      throw new Error('容器元素el的宽高不能为0')
  }

  //  容器尺寸变化，调整尺寸
  resize() {
    const oldWidth = this.width
    const oldHeight = this.height
    this.getElRectInfo()
    this.svg.size(this.width, this.height)
    if (oldWidth !== this.width || oldHeight !== this.height) {
      // 如果画布宽高改变了需要触发一次渲染
      if (this.demonstrate) {
        // 如果存在演示插件，并且正在演示中，那么不需要触发重新渲染，否则会冲突
        if (!this.demonstrate.isInDemonstrate) {
          this.render(null)
        }
      } else {
        this.render(null)
      }
    }
    this.emit('resize')
  }

  // 鼠标拖拽画布时平移视图（非节点拖拽时）
  onDragCanvas(_e: MouseEvent, eventInstance: any) {
    if (this.opt.readonly) return
    if (this.drag?.mousedownNode) return
    const { mousemoveOffset, mousemovePos } = eventInstance
    this.view.translateXY(mousemoveOffset.x, mousemoveOffset.y)
    eventInstance.mousedownPos.x = mousemovePos.x
    eventInstance.mousedownPos.y = mousemovePos.y
  }

  //  监听事件
  on(event: string, fn: (...args: unknown[]) => void) {
    this.event.on(event, fn)
  }

  //  触发事件
  emit(event: string, ...args: unknown[]) {
    this.event.emit(event, ...args)
  }

  //  解绑事件
  off(event: string, fn: (...args: unknown[]) => void) {
    this.event.off(event, fn)
  }

  // 初始化缓存数据
  initCache() {
    this.commonCaches = {
      measureCustomNodeContentSizeEl: null,
      measureRichtextNodeTextSizeEl: null
    }
  }

  //  设置主题
  initTheme() {
    // 合并主题配置
    this.themeConfig = mergeTheme(
      theme[this.opt.theme as keyof typeof theme] || theme.default,
      this.opt.themeConfig as Record<string, unknown>
    )
    // 设置背景样式
    Style.setBackgroundStyle(this.el, this.themeConfig)
  }

  //  设置主题
  setTheme(themeName: string, notRender = false) {
    this.execCommand('CLEAR_ACTIVE_NODE')
    this.opt.theme = themeName
    if (!notRender) {
      this.render(null, CONSTANTS.CHANGE_THEME)
    }
    this.emit('view_theme_change', themeName)
  }

  //  获取当前主题
  getTheme() {
    return this.opt.theme
  }

  //  设置主题配置
  setThemeConfig(config: Record<string, unknown>, notRender = false) {
    // 计算改变了的配置
    const changedConfig = getObjectChangedProps(this.themeConfig, config)
    this.opt.themeConfig = config
    if (!notRender) {
      // 检查改变的是否是节点大小无关的主题属性
      const res = checkIsNodeSizeIndependenceConfig(changedConfig)
      this.render(null, res ? '' : CONSTANTS.CHANGE_THEME)
    }
  }

  //  获取自定义主题配置
  getCustomThemeConfig() {
    return this.opt.themeConfig
  }

  //  获取某个主题配置值
  getThemeConfig(prop: string) {
    return prop === undefined ? this.themeConfig : this.themeConfig[prop as keyof typeof this.themeConfig]
  }

  // 获取配置
  getConfig(prop: string) {
    return prop === undefined ? this.opt : this.opt[prop]
  }

  // 更新配置
  updateConfig(opt: Record<string, unknown> = {}) {
    this.emit('before_update_config', this.opt)
    const lastOpt = {
      ...this.opt
    }
    this.opt = this.handleOpt((merge as { all: (arr: Record<string, unknown>[]) => Record<string, unknown> }).all([defaultOpt, this.opt, opt]))
    this.emit('after_update_config', this.opt, lastOpt)
  }

  //  获取当前布局结构
  getLayout() {
    return this.opt.layout
  }

  //  设置布局结构
  setLayout(layout: string, notRender = false) {
    // 检查布局配置
    if (!layoutValueList.includes(layout)) {
      layout = CONSTANTS.LAYOUT.LOGICAL_STRUCTURE
    }
    this.opt.layout = layout
    this.view.reset()
    this.renderer.setLayout()
    if (!notRender) {
      this.render(null, CONSTANTS.CHANGE_LAYOUT)
    }
    this.emit('layout_change', layout)
  }

  //  执行命令
  execCommand(...args: any[]) {
    this.command.exec(...args)
  }

  // 更新画布数据，如果新的数据是在当前画布节点数据基础上增删改查后形成的，那么可以使用该方法来更新画布数据
  updateData(data: unknown) {
    data = this.handleData(data)
    this.emit('before_update_data', data)
    this.renderer.setData(data)
    this.render()
    this.command.addHistory()
    this.emit('update_data', data)
  }

  //  动态设置思维导图数据，纯节点数据
  setData(data: unknown) {
    data = this.handleData(data)
    this.emit('before_set_data', data)
    this.opt.data = data
    this.execCommand('CLEAR_ACTIVE_NODE')
    this.command.clearHistory()
    this.command.addHistory()
    this.renderer.setData(data)
    this.reRender()
    this.emit('set_data', data)
  }

  //  动态设置思维导图数据，包括节点数据、布局、主题、视图
  setFullData(data: { root?: unknown; layout?: string; theme?: { template?: string; config?: unknown }; view?: unknown }) {
    if (data.root) {
      this.setData(data.root)
    }
    if (data.layout) {
      this.setLayout(data.layout)
    }
    if (data.theme) {
      if (data.theme.template) {
        this.setTheme(data.theme.template)
      }
      if (data.theme.config) {
        this.setThemeConfig(data.theme.config as Record<string, unknown>)
      }
    }
    if (data.view) {
      this.view.setTransformData(data.view)
    }
  }

  //  获取思维导图数据，节点树、主题、布局等
  getData(withConfig?: boolean) {
    const nodeData = this.command.getCopyData()
    let data: Record<string, unknown> = {}
    if (withConfig) {
      data = {
        layout: this.getLayout(),
        root: nodeData as Record<string, unknown>,
        theme: {
          template: this.getTheme(),
          config: this.getCustomThemeConfig()
        },
        view: this.view.getTransformData()
      }
    } else {
      data = nodeData
    }
    return simpleDeepClone(data)
  }

  //  导出
  async export(...args: unknown[]) {
    try {
      if (!this.doExport) {
        throw new Error('请注册Export插件！')
      }
      let result = await this.doExport.export(...args)
      return result
    } catch (error) {
      this.opt.errorHandler(ERROR_TYPES.EXPORT_ERROR, error)
    }
  }

  //  转换位置
  toPos(x: number, y: number) {
    return {
      x: x - this.elRect.left,
      y: y - this.elRect.top
    }
  }

  //  设置只读模式、编辑模式
  setMode(mode: string) {
    if (![CONSTANTS.MODE.READONLY, CONSTANTS.MODE.EDIT].includes(mode)) {
      return
    }
    const isReadonly = mode === CONSTANTS.MODE.READONLY
    if (isReadonly === this.opt.readonly) return
    if (isReadonly) {
      // 如果处于编辑态，要隐藏所有的编辑框
      if (this.renderer.textEdit.isShowTextEdit()) {
        this.renderer.textEdit.hideEditTextBox()
        this.command.originAddHistory()
      }
      // 取消当前激活的元素
      this.execCommand('CLEAR_ACTIVE_NODE')
    }
    this.opt.readonly = isReadonly
    // 切换为编辑模式时，如果历史记录堆栈是空的，那么进行一次入栈操作
    if (!isReadonly && this.command.history.length <= 0) {
      this.command.originAddHistory()
    }
    this.emit('mode_change', mode)
  }

  // 获取svg数据
  getSvgData({
    paddingX = 0,
    paddingY = 0,
    ignoreWatermark = false,
    addContentToHeader,
    addContentToFooter,
    node
  }: {
    paddingX?: number
    paddingY?: number
    ignoreWatermark?: boolean
    addContentToHeader?: () => unknown
    addContentToFooter?: () => unknown
    node?: unknown
  } = {}) {
    const { watermarkConfig, openPerformance } = this.opt as { watermarkConfig?: { onlyExport?: boolean }; openPerformance?: boolean }
    // 如果开启了性能模式，那么需要先渲染所有节点
    if (openPerformance) {
      this.renderer.forceLoadNode(node)
    }
    const { cssTextList, header, headerHeight, footer, footerHeight } =
      handleGetSvgDataExtraContent({
        addContentToHeader,
        addContentToFooter
      })
    const svg = this.svg
    const draw = this.draw
    // 保存原始信息
    const origWidth = svg.width()
    const origHeight = svg.height()
    const origTransform = draw.transform()
    const elRect = this.elRect
    // 去除放大缩小的变换效果
    draw.scale(1 / origTransform.scaleX, 1 / origTransform.scaleY)
    // 获取变换后的位置尺寸信息，其实是getBoundingClientRect方法的包装方法
    const rect = draw.rbox()
    // 需要裁减的区域
    let clipData = null
    if (node) {
      clipData = getNodeTreeBoundingRect(
        node,
        rect.x,
        rect.y,
        paddingX,
        paddingY
      )
    }
    // 内边距
    const fixHeight = 0
    rect.width += paddingX * 2
    rect.height += paddingY * 2 + fixHeight + headerHeight + footerHeight
    draw.translate(paddingX, paddingY)
    // 将svg设置为实际内容的宽高
    svg.size(rect.width, rect.height)
    // 把实际内容变换
    draw.translate(-rect.x + elRect.left, -rect.y + elRect.top)
    // 克隆一份数据
    let clone = svg.clone()
    // 是否存在水印
    const hasWatermark = this.watermark && this.watermark.hasWatermark()
    if (!ignoreWatermark && hasWatermark) {
      this.watermark.isInExport = true
      // 是否是仅导出时需要水印
      const { onlyExport } = watermarkConfig
      // 是否需要重新绘制水印
      const needReDrawWatermark =
        rect.width > origWidth || rect.height > origHeight
      // 如果实际图形宽高超出了屏幕宽高，且存在水印的话需要重新绘制水印，否则会出现超出部分没有水印的问题
      if (needReDrawWatermark) {
        this.width = rect.width
        this.height = rect.height
        this.watermark.onResize()
        clone = svg.clone()
        this.width = origWidth
        this.height = origHeight
        this.watermark.onResize()
      } else if (onlyExport) {
        // 如果是仅导出时需要水印，那么需要进行绘制
        this.watermark.onResize()
        clone = svg.clone()
      }
      // 如果是仅导出时需要水印，需要清除
      if (onlyExport) {
        this.watermark.clear()
      }
      this.watermark.isInExport = false
    }
    // 添加必要的样式
    [this.joinCss(), ...cssTextList].forEach(s => {
      clone.add(SVG(`<style>${s}</style>`))
    })
    // 附加内容
    if (header && headerHeight > 0) {
      clone.findOne('.smm-container').translate(0, headerHeight)
      header.width(rect.width)
      header.y(paddingY)
      clone.add(header, 0)
    }
    if (footer && footerHeight > 0) {
      footer.width(rect.width)
      footer.y(rect.height - paddingY - footerHeight)
      clone.add(footer)
    }
    // 修正defs里定义的元素的id，因为clone时defs里的元素的id会继续递增，导致和内容中引用的id对不上
    const defs = svg.find('defs')
    const defs2 = clone.find('defs')
    defs.forEach((def: { children: () => unknown[] }, defIndex: number) => {
      const def2 = defs2[defIndex]
      if (!def2) return
      const children = def.children()
      const children2 = def2.children()
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const child2 = children2[i]
        if (child && child2) {
          (child2 as any).attr('id', (child as any).attr('id'))
        }
      }
    })
    // 恢复原先的大小和变换信息
    svg.size(origWidth, origHeight)
    draw.transform(origTransform)
    return {
      svg: clone, // 思维导图图形的整体svg元素，包括：svg（画布容器）、g（实际的思维导图组）
      svgHTML: clone.svg(), // svg字符串
      clipData,
      rect: {
        ...rect, // 思维导图图形未缩放时的位置尺寸等信息
        ratio: rect.width / rect.height // 思维导图图形的宽高比
      },
      origWidth, // 画布宽度
      origHeight, // 画布高度
      scaleX: (origTransform as any).scaleX, // 思维导图图形的水平缩放值
      scaleY: (origTransform as any).scaleY // 思维导图图形的垂直缩放值
    }
  }

  // 扩展节点形状
  addShape(shape: { name: string }) {
    if (!shape) return
    const exist = this.extendShapeList.find(item => {
      return item.name === shape.name
    })
    if (exist) return
    this.extendShapeList.push(shape)
  }

  // 删除扩展的形状
  removeShape(name: string) {
    const index = this.extendShapeList.findIndex(item => {
      return item.name === name
    })
    if (index !== -1) {
      this.extendShapeList.splice(index, 1)
    }
  }

  // 获取SVG.js库的一些对象
  getSvgObjects() {
    return {
      SVG,
      G,
      Rect
    }
  }

  // 添加插件
  addPlugin(plugin: any, opt?: any) {
    let index = MindMap.hasPlugin(plugin)
    if (index === -1) {
      MindMap.usePlugin(plugin, opt ?? {})
    }
    this.initPlugin(plugin)
  }

  // 移除插件
  removePlugin(plugin: { instanceName: string; beforePluginRemove?: () => void }) {
    let index = MindMap.hasPlugin(plugin)
    if (index !== -1) {
      MindMap.pluginList.splice(index, 1)
      if (this[plugin.instanceName]) {
        if (this[plugin.instanceName].beforePluginRemove) {
          this[plugin.instanceName].beforePluginRemove()
        }
        delete this[plugin.instanceName]
      }
    }
  }

  // 实例化插件
  initPlugin(plugin: any) {
    if (this[plugin.instanceName]) return
    this[plugin.instanceName] = new plugin({
      mindMap: this,
      pluginOpt: plugin.pluginOpt
    } as { mindMap: MindMap; pluginOpt?: unknown })
  }

  // 销毁
  destroy() {
    this.emit('beforeDestroy')
    // 清除节点编辑框
    this.renderer.textEdit.hideEditTextBox()
    this.renderer.textEdit.removeTextEditEl()
    // 移除插件
    ;[...MindMap.pluginList].forEach(plugin => {
      if (
        this[plugin.instanceName] &&
        this[plugin.instanceName].beforePluginDestroy
      ) {
        this[plugin.instanceName].beforePluginDestroy()
      }
      this[plugin.instanceName] = null
    })
    // 解绑事件
    this.event.unbind()
    // 移除画布节点
    this.svg.remove()
    // 去除给容器元素设置的背景样式
    Style.removeBackgroundStyle(this.el)
    // 移除给容器元素添加的类名
    this.el.classList.remove('smm-mind-map-container')
    this.el.innerHTML = ''
    this.el = null
    this.removeCss()
    MindMap.instanceCount--
  }
}

// 扩展节点数据中非样式的字段列表
let _extendNodeDataNoStylePropList: string[] = []

namespace MindMap {
  export let pluginList: any[] = []
  export function usePlugin(plugin: any, opt: Record<string, unknown> = {}) {
    if (MindMap.hasPlugin(plugin) !== -1) return MindMap
    plugin.pluginOpt = opt
    MindMap.pluginList.push(plugin)
    return MindMap
  }
  export function hasPlugin(plugin: any) {
    return MindMap.pluginList.findIndex((item: any) => item === plugin)
  }
  export let instanceCount = 0
  export function extendNodeDataNoStylePropList(list: string[] = []) {
    _extendNodeDataNoStylePropList.push(...list)
    nodeDataNoStylePropList.push(...list)
  }
  export function resetNodeDataNoStylePropList() {
    _extendNodeDataNoStylePropList.forEach(item => {
      const index = nodeDataNoStylePropList.findIndex(item2 => item2 === item)
      if (index !== -1) nodeDataNoStylePropList.splice(index, 1)
    })
    _extendNodeDataNoStylePropList = []
  }
  export function defineTheme(name: string, config: Record<string, unknown> = {}) {
    if (theme[name]) return new Error('该主题名称已存在')
    theme[name] = mergeTheme(defaultTheme, config)
  }
  export function removeTheme(name: string) {
    if (theme[name]) theme[name] = null
  }
}

export default MindMap
