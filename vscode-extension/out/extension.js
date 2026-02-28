"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const SMM_PREVIEW_VIEW_TYPE = 'smmPreview';
function getPreviewHtml(webview, umdUri, scriptUri, nonce) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} data: https:;">
  <style>
    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
    #mindMapContainer { width: 100%; height: 100%; }
    .smm-mind-map-container { background: #f5f5f5; }
  </style>
</head>
<body>
  <div id="mindMapContainer"></div>
  <script nonce="${nonce}" src="${umdUri}"></script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
function parseSmmContent(content) {
    try {
        const data = JSON.parse(content);
        if (!data || typeof data !== 'object')
            return null;
        if (data.root !== undefined && data.root !== null) {
            return {
                root: data.root,
                layout: data.layout,
                theme: data.theme,
                view: data.view
            };
        }
        return { root: data };
    }
    catch {
        return null;
    }
}
class SmmPreviewEditorProvider {
    constructor(context) {
        this.context = context;
    }
    openCustomDocument(uri) {
        return { uri, dispose: () => { } };
    }
    async resolveCustomEditor(document, webviewPanel) {
        webviewPanel.webview.options = { enableScripts: true };
        webviewPanel.webview.html = await this.getHtml(webviewPanel.webview);
        const update = async () => {
            let content;
            const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === document.uri.toString());
            if (doc)
                content = doc.getText();
            else
                content = (await vscode.workspace.fs.readFile(document.uri)).toString();
            const payload = parseSmmContent(content);
            webviewPanel.webview.postMessage({ type: 'update', data: payload });
        };
        await update();
        const subDoc = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString())
                update();
        });
        const watcher = vscode.workspace.createFileSystemWatcher(document.uri.fsPath);
        const subWatcher = watcher.onDidChange(() => update());
        webviewPanel.onDidDispose(() => {
            subDoc.dispose();
            watcher.dispose();
            subWatcher.dispose();
        });
    }
    async getHtml(webview) {
        const umdPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'simpleMindMap.umd.min.js');
        const scriptPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'preview.js');
        const umdUri = webview.asWebviewUri(umdPath);
        const scriptUri = webview.asWebviewUri(scriptPath);
        const nonce = Date.now().toString(36) + Math.random().toString(36).slice(2);
        return getPreviewHtml(webview, umdUri, scriptUri, nonce);
    }
}
async function activate(context) {
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(SMM_PREVIEW_VIEW_TYPE, new SmmPreviewEditorProvider(context), { webviewOptions: { retainContextWhenHidden: true } }));
    context.subscriptions.push(vscode.commands.registerCommand('smm.openPreview', () => {
        const active = vscode.window.activeTextEditor;
        if (active?.document.languageId === 'smm' || active?.document.uri.fsPath.endsWith('.smm')) {
            vscode.commands.executeCommand('vscode.openWith', active.document.uri, SMM_PREVIEW_VIEW_TYPE);
        }
        else {
            vscode.window.showInformationMessage('请先打开一个 .smm 文件');
        }
    }));
    const configPath = vscode.Uri.joinPath(context.extensionUri, 'smm.language-configuration.json');
    try {
        const configBuf = await vscode.workspace.fs.readFile(configPath);
        const config = JSON.parse(configBuf.toString());
        context.subscriptions.push(vscode.languages.setLanguageConfiguration('smm', config));
    }
    catch (_) { }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map