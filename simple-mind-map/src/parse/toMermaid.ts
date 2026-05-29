import { walk, nodeRichTextToTextWithWrap } from '../utils'

const getNodeText = data => {
  return data.richText ? nodeRichTextToTextWithWrap(data.text) : data.text
}

// 转义Mermaid特殊字符
const escapeMermaidText = text => {
  if (!text) return ''
  return text
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    .replace(/</g, '&#60;')
    .replace(/>/g, '&#62;')
    .replace(/"/g, '&#34;')
}

// 获取Mermaid shape前缀和后缀
// Mermaid mindmap支持: rectangle(默认), diamond[[]], ellipse(()), circle((())), stadium(), hexagonal{{}}, parallelogram[/], subroutine[], cylinder[]
const getMermaidShapeMarkers = shape => {
  const shapeMap = {
    rectangle: { prefix: '', suffix: '' },
    diamond: { prefix: '[[', suffix: ']]' },
    ellipse: { prefix: '((', suffix: '))' },
    circle: { prefix: '(((', suffix: ')))' },
    stadium: { prefix: '=', suffix: '' },
    roundedRectangle: { prefix: '(', suffix: ')' },
    hexagonal: { prefix: '{{', suffix: '}}' },
    parallelogram: { prefix: '/', suffix: '' },
    subroutine: { prefix: '[', suffix: ']' },
    cylinder: { prefix: '[(', suffix: ')]' }
  }
  return shapeMap[shape] || { prefix: '', suffix: '' }
}

// Mermaid形状映射
const shapeMap = {
  rectangle: 'rect',
  diamond: 'diamond',
  ellipse: 'ellipse',
  circle: 'circle',
  stadium: 'stadium',
  roundedRectangle: 'roundedRect',
  hexagonal: 'hexagon',
  parallelogram: 'parallelogram',
  subroutine: 'subroutine',
  cylinder: 'cylinder'
}

// 转换成mermaid格式
export const transformToMermaid = root => {
  const lines = ['mindmap']
  const nodeStyles = []

  // 第一遍：生成树结构
  walk(
    root,
    null,
    (node, parent, isRoot, layerIndex) => {
      const text = escapeMermaidText(getNodeText(node.data))
      const { prefix, suffix } = getMermaidShapeMarkers(node.data.shape)
      const indent = '  '.repeat(layerIndex + 1)

      if (isRoot) {
        // 根节点使用粗体标记
        lines.push(`${indent}**${text}**`)
      } else {
        // 子节点
        if (prefix || suffix) {
          lines.push(`${indent}${prefix}${text}${suffix}`)
        } else {
          lines.push(`${indent}${text}`)
        }
      }

      // 收集需要样式的节点信息
      const data = node.data
      const hasStyle =
        data.fillColor ||
        data.borderColor ||
        data.borderWidth ||
        (data.borderDasharray && data.borderDasharray !== 'none')

      if (hasStyle && !isRoot) {
        // Mermaid mindmap 使用节点文本作为 style 的目标标识
        const styles = []

        if (data.fillColor) {
          styles.push(`fill:${data.fillColor}`)
        }
        if (data.borderColor) {
          styles.push(`stroke:${data.borderColor}`)
        }
        if (data.borderWidth) {
          styles.push(`stroke-width:${data.borderWidth}`)
        }
        if (data.borderDasharray && data.borderDasharray !== 'none') {
          styles.push(`stroke-dasharray:${data.borderDasharray}`)
        }

        if (styles.length > 0) {
          // 使用带引号的文本作为节点标识
          nodeStyles.push(`    style "${text}" ${styles.join(',')}`)
        }
      }
    },
    () => {},
    true
  )

  // 添加样式定义
  if (nodeStyles.length > 0) {
    lines.push('')
    lines.push('%% Styles %%')
    nodeStyles.forEach(style => {
      lines.push(style)
    })
  }

  return lines.join('\n')
}
