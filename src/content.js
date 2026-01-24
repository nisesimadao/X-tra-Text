(function () {
  console.log("X Text-to-Image Loaded");

  const renderer = new ImageRenderer('editor-canvas');
  const settingsUI = new SettingsUI();

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

    const container = document.createElement('div');
    container.style.cssText = `
      background-color: transparent;
      padding-top: 2px;
    `;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
    `;

    const btn = document.createElement('button');
    btn.id = 'text-to-img-btn';
    btn.setAttribute('aria-label', 'テキストを画像に変換');
    btn.setAttribute('role', 'button');
    btn.type = 'button';

    btn.style.cssText = `
      border: none;
      background-color: transparent;
      padding: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      transition: background-color 0.2s ease;
    `;

    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-z80fyv r-19wmn03" style="color: rgb(29, 155, 240); width: 20px; height: 20px;"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g></svg>';

    btn.onmouseover = () => btn.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
    btn.onmouseout = () => btn.style.backgroundColor = 'transparent';

    btn.onclick = (e) => {
      e.preventDefault();
      const text = Utils.getEditorText();
      ui.setText(text);
      ui.mount();
    };

    wrapper.appendChild(btn);
    container.appendChild(wrapper);
    target.appendChild(container);
  };

  const injectSettingsButton = () => {
    if (document.getElementById('text-to-img-settings-btn')) return;

    let target = document.querySelector('nav');
    if (!target) return;

    const link = document.createElement('a');
    link.id = 'text-to-img-settings-btn';
    link.href = 'javascript:void(0)';
    link.setAttribute('aria-label', 'テキスト画像変換の設定');
    link.setAttribute('role', 'link');
    link.className = 'css-175oi2r r-6koalj r-eqz5dr r-16y2uox r-1habvwh r-cnw61z r-13qz1uu r-1ny4l3l r-1loqt21';

    link.innerHTML = `
      <div class="css-175oi2r r-sdzlij r-dnmrzs r-1awozwy r-18u37iz r-1777fci r-xyw6el r-o7ynqc r-6416eg"><div class="css-175oi2r"><svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1nao33i r-lwhw9o r-cnnz9e"><g><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></g></svg></div><div dir="ltr" class="css-146c3p1 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc r-adyw6z r-135wba7 r-16dba41 r-dlybji r-nazi8o" style="color: rgb(231, 233, 234);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc">テキスト画像設定</span><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-1tl8opc"> </span></div></div>
    `;

    link.onclick = (e) => {
      e.preventDefault();
      settingsUI.mount();
    };

    target.appendChild(link);
  };

  const observer = new MutationObserver(() => {
    injectButton();
    injectSettingsButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  injectButton();
  injectSettingsButton();

})();
