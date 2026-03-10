(function () {
  const container = document.getElementById('mindMapContainer');
  let mindMap = null;

  function getMindMapClass() {
    if (window.simpleMindMap) return window.simpleMindMap.default || window.simpleMindMap;
    return null;
  }

  function render(data) {
    if (!data || !data.root) {
      if (container) container.innerHTML = '<div style="padding:20px;color:#666;">无效或空的 SMM 数据</div>';
      return;
    }
    const MindMapClass = getMindMapClass();
    if (!MindMapClass) {
      if (container) container.innerHTML = '<div style="padding:20px;color:#666;">加载 simple-mind-map 失败</div>';
      return;
    }
    if (mindMap) {
      try {
        if (data.layout || data.theme || data.view) {
          mindMap.setFullData(data);
        } else {
          mindMap.setData(data.root);
        }
      } catch (e) {
        container.innerHTML = '<div style="padding:20px;color:#c00;">渲染失败: ' + (e && e.message) + '</div>';
      }
      return;
    }
    try {
      container.innerHTML = '';
      mindMap = new MindMapClass({
        el: container,
        data: data.root,
        layout: data.layout || 'logicalStructure',
        theme: (data.theme && data.theme.template) || 'default',
        themeConfig: (data.theme && data.theme.config) || {},
        viewData: data.view || null,
        readonly: true,
        fit: true
      });
    } catch (e) {
      container.innerHTML = '<div style="padding:20px;color:#c00;">初始化失败: ' + (e && e.message) + '</div>';
    }
  }

  window.addEventListener('message', function (event) {
    const msg = event.data;
    if (msg.type === 'update' && msg.data !== undefined) render(msg.data);
  });
})();
