(function () {
  console.log("X Text-to-Image Loaded");

  const renderer = new ImageRenderer('editor-canvas');

  const handleInsert = async (blob) => {
    try {
      Utils.clearEditorText();
      await new Promise(resolve => setTimeout(resolve, 100));
      await Utils.copyToClipboard(blob);
      await Utils.pasteToEditor();
      ui.unmount();
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました: " + e);
    }
  };

  const ui = new EditorUI(renderer, handleInsert);

  const injectButton = () => {
    if (document.getElementById('text-to-img-btn')) return;

    let target = document.querySelector('[data-testid="toolBar"]');
    if (!target) {
      const icon = document.querySelector('[aria-label="画像"]');
      target = icon?.closest('div[role="button"]')?.parentElement;
    }

    if (!target) return;

    const btn = document.createElement('div');
    btn.id = 'text-to-img-btn';

    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';

    btn.style.cssText = `
      cursor: pointer; 
      color: #1d9bf0; 
      padding: 8px; 
      border-radius: 50%;
      margin-left: 8px; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center;
      transition: background 0.2s;
    `;

    btn.onmouseover = () => btn.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
    btn.onmouseout = () => btn.style.backgroundColor = 'transparent';

    btn.onclick = () => {
      const text = Utils.getEditorText();
      ui.setText(text);
      ui.mount();
    };

    target.appendChild(btn);
  };

  const observer = new MutationObserver(injectButton);
  observer.observe(document.body, { childList: true, subtree: true });

  injectButton();

})();
