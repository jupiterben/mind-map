---
name: smm-file
description: Create or modify Simple Mind Map (.smm) files. Use when the user asks to create, edit, or change .smm files, mind map JSON data, or simple-mind-map node trees.
---

# SMM 文件创建与修改

SMM 是 simple-mind-map 的专有格式，本质为 **JSON**。用于创建或修改 `.smm` 文件时按下列规范操作。

## 何时使用

- 用户要求「创建 / 修改 / 编辑 .smm 文件」或「生成 / 改思维导图数据」
- 需要读写 mind map 节点树（与 simple-mind-map 兼容的 JSON）

## 节点树结构

每个节点形如：

```json
{
  "data": {
    "text": "节点文案",
    "expand": true,
    "richText": false
  },
  "children": []
}
```

- **data**（必填）：`data.text` 为节点显示文字；`data.expand` 控制是否展开子节点（根节点强制为 true）；可含 `icon`、`tag`、`note`、`hyperlink`、`image` 等。
- **children**（必填）：子节点数组，结构同上；无子节点时用 `[]`。

根节点必须有 `data` 和 `children`；若缺少 `data` 或 `data.text` 为空，补为默认根文案（如「中心主题」）。

## 两种文件形式

1. **仅节点树**：直接是根节点对象 `{ data: {...}, children: [...] }`。用 simple-mind-map 打开时，应用会套上默认的 layout/theme。
2. **完整数据**：`{ "root": <节点树>, "layout": "...", "theme": { "template": "...", "config": {} }, "view": {...} }`。含布局、主题、视图等，与 `getData(true)` 导出一致。

创建新文件时，用「仅节点树」即可；若需保留布局/主题，用完整数据并保留 `layout`、`theme`、`view` 等字段。

## 操作流程

### 新建 .smm

1. 构建根节点：`{ data: { text: "中心主题" }, children: [] }`。
2. 按需添加子节点：在对应节点的 `children` 中 push `{ data: { text: "..." }, children: [] }`。
3. 将根节点或完整数据对象 `JSON.stringify` 后写入 `.smm` 文件（UTF-8）。

### 修改已有 .smm

1. 读取文件内容，`JSON.parse` 得到 `data`。
2. 若存在 `data.root`，则实际节点树为 `data.root`；否则整份 `data` 即为节点树。
3. 在节点树上做增删改（改 `data.text`、增删 `children` 等）。
4. 若原文件是完整数据，写回时保留顶层 `layout`、`theme`、`view`，只替换 `root`。
5. 写回前确保根节点有 `data` 和 `children`；根节点 `data.expand` 若为 false 应改为 true（与 simple-mind-map 行为一致）。

### 校验要点

- 根节点：`data`、`children` 存在；`data` 为对象；`children` 为数组。
- 任意节点：`data` 缺失时补 `{}`，`children` 缺失时补 `[]`。
- 不依赖 `uid`：应用加载时会自动生成；若原数据带 `uid` 可保留。

## 最小示例

**仅节点树（新建）：**

```json
{
  "data": { "text": "中心主题" },
  "children": [
    {
      "data": { "text": "分支 A" },
      "children": []
    },
    {
      "data": { "text": "分支 B" },
      "children": []
    }
  ]
}
```

**完整数据（含布局/主题）：**

```json
{
  "root": { "data": { "text": "中心主题" }, "children": [] },
  "layout": "logicalStructure",
  "theme": { "template": "default", "config": {} }
}
```

## 参考

- 节点可选字段与完整结构见 [reference.md](reference.md)。
- 本项目导出逻辑：`simple-mind-map` 中 `export('smm')` = `getData(withConfig)` 的 JSON；导入时支持「仅 root」或「root + layout + theme + view」。
