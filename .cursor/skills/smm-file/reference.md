# SMM 节点 data 字段参考

`data` 为节点对象，以下为常用/可选字段（均放在 `node.data` 下）。

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 节点显示文字（必填时至少给空字符串） |
| expand | boolean | 是否展开子节点，默认 true；根节点会被强制为 true |
| richText | boolean | 是否富文本内容 |
| icon | string[] | 图标列表，如 `['priority_1']` |
| tag | string[] | 标签列表 |
| note | string | 备注内容 |
| hyperlink | string | 超链接 URL |
| hyperlinkTitle | string | 超链接标题 |
| image | string | 图片 URL 或 base64 |
| imageTitle | string | 图片标题 |
| imageSize | { width?, height?, custom? } | 图片尺寸 |
| checkbox | object | 复选框状态（插件） |
| generalization | array | 概要节点（插件） |
| outerFrame | object | 外框样式（插件） |
| associativeLineTargets | string[] | 关联线目标 uid（插件） |
| uid | string | 节点唯一 id，可省略（加载时自动生成） |

完整数据文件顶层除 `root` 外还可包含：

- **layout**：布局名，如 `logicalStructure`、`mindMap` 等
- **theme**：`{ template: string, config: object }`
- **view**：视图变换数据（缩放、平移等）

编辑时保留原有 `layout`、`theme`、`view` 可维持用户界面一致。
