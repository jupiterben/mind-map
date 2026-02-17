import MindMap from './index'
import MiniMap from './src/plugins/MiniMap'
import Watermark from './src/plugins/Watermark'
import KeyboardNavigation from './src/plugins/KeyboardNavigation'
import ExportXMind from './src/plugins/ExportXMind'
import ExportPDF from './src/plugins/ExportPDF'
import Export from './src/plugins/Export'
import Drag from './src/plugins/Drag'
import Select from './src/plugins/Select'
import AssociativeLine from './src/plugins/AssociativeLine'
import RichText from './src/plugins/RichText'
import NodeImgAdjust from './src/plugins/NodeImgAdjust'
import TouchEvent from './src/plugins/TouchEvent'
import Search from './src/plugins/Search'
import Painter from './src/plugins/Painter'
import Scrollbar from './src/plugins/Scrollbar'
import Formula from './src/plugins/Formula'
import RainbowLines from './src/plugins/RainbowLines'
import Demonstrate from './src/plugins/Demonstrate'
import OuterFrame from './src/plugins/OuterFrame'
import MindMapLayoutPro from './src/plugins/MindMapLayoutPro'
import NodeBase64ImageStorage from './src/plugins/NodeBase64ImageStorage'
import xmind from './src/parse/xmind'
import markdown from './src/parse/markdown'
import icons from './src/svg/icons'
import * as constants from './src/constants/constant'
import * as defaultTheme from './src/theme/default'

const M = MindMap as unknown as Record<string, unknown> & { usePlugin: (p: any, o?: any) => typeof MindMap }
M.xmind = xmind
M.markdown = markdown
M.iconList = icons.nodeIconList
M.constants = constants
M.defaultTheme = defaultTheme
M.version = '0.14.0-fix.1'

M.usePlugin(MiniMap)
  .usePlugin(Watermark)
  .usePlugin(Drag)
  .usePlugin(KeyboardNavigation)
  .usePlugin(ExportXMind)
  .usePlugin(ExportPDF)
  .usePlugin(Export)
  .usePlugin(Select)
  .usePlugin(AssociativeLine)
  .usePlugin(RichText)
  .usePlugin(TouchEvent)
  .usePlugin(NodeImgAdjust)
  .usePlugin(Search)
  .usePlugin(Painter)
  .usePlugin(Scrollbar)
  .usePlugin(Formula)
  .usePlugin(RainbowLines)
  .usePlugin(Demonstrate)
  .usePlugin(OuterFrame)
  .usePlugin(MindMapLayoutPro)
  .usePlugin(NodeBase64ImageStorage)

export default MindMap
