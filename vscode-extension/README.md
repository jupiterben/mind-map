# SMM 思维导图 (VSCode 扩展)

在 VSCode 中编辑与预览 **Simple Mind Map** 格式的 `.smm` 文件。

## 功能

- **编辑**：`.smm` 按 JSON 语法高亮与括号匹配，支持 JSON Schema 校验
- **预览**：用「用其他方式打开」→「SMM 思维导图预览」或命令 `SMM: 打开思维导图预览` 查看思维导图
- 预览为只读，编辑请在文本编辑器中修改 JSON，保存后预览会自动刷新

## 安装

1. 在 `vscode-extension` 下执行 `npm install` 后执行 `npm run copy-umd`（将 simple-mind-map 的 UMD 复制到 `media/`）
2. 执行 `npm run compile`
3. 在 VSCode 中按 F5 启动扩展开发主机，或打包为 vsix 后安装

预览使用本地 `media/simpleMindMap.umd.min.js`，不再依赖 CDN。

## 开发调试

1. 用 VSCode 打开 **本仓库根目录**（`mind-map`）或只打开 **`vscode-extension`** 文件夹。
2. 若只打开 `vscode-extension`：按 **F5** 会先执行 `npm run compile`，再启动「扩展开发主机」新窗口。
3. 若打开的是仓库根目录：在「运行和调试」里选择 **「启动扩展」**（会传入 `../` 作为测试用工作区），再按 F5。
4. 在扩展开发主机里：打开任意 `.smm` 文件，或「用其他方式打开」→「SMM 思维导图预览」进行测试。
5. **断点**：在 `src/extension.ts` 里打断点即可；修改代码后在新窗口按 **Ctrl+R**（或命令「开发人员: 重新加载窗口」）重载扩展后再测。

## 打包为 vsix

```bash
cd vscode-extension
npm install
npm run copy-umd   # 若未执行，vsce package 时的 prepublish 也会执行
vsce package
```

安装生成的 `smm-mind-map-0.1.0.vsix`：命令面板 →「从 VSIX 安装扩展」。

## 格式说明

- SMM 本质为 JSON，可为「仅节点树」或「完整数据」两种形式，详见项目内 `.cursor/skills/smm-file/` 说明。
