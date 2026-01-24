function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

class EditorUI {
  constructor(renderer, onInsert) {
    this.renderer = renderer;
    this.onInsert = onInsert;
    this.config = { ...CONFIG_DEFAULT };
  }

  mount() {
    if (document.getElementById('img-editor-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'img-editor-modal';

    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(4px);
      z-index: 10000; display: flex; justify-content: center; align-items: center;
      opacity: 0; transition: opacity 0.3s ease;
    `;

    modal.innerHTML = `
      <div style="
        background: rgba(25, 39, 52, 0.85); /* 背景を少し濃く */
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 32px;
        width: 95%; max-width: 1000px; 
        height: 85vh; max-height: 900px;
        display: flex; gap: 24px; /* 左右カラムの間隔 */
        box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        color: #e7e9ea;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: relative;
      ">
        <button id="btn-close-x" style="
          position: absolute; top: 20px; right: 20px;
          background: none; border: none; color: #8b98a5; 
          font-size: 24px; cursor: pointer; z-index: 10;
        ">&times;</button>
        
        <div style="
          flex: 2; display: flex; flex-direction: column; gap: 16px; 
          overflow: hidden; /* ★重要：はみ出し防止 */
          min-height: 0;    /* ★重要：Flexアイテムの縮小を許可 */
        ">
          <div style="
            flex: 1; /* 余ったスペースを全部使う */
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAjyQc6wcEGAIAoLwXkwwEHW8AAAAASUVORK5CYII=');
            border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);
            overflow: auto; /* ★中身が大きい時はスクロール */
            display: flex; justify-content: center; align-items: flex-start; 
            padding: 20px;
            min-height: 0; /* ★重要 */
          ">
            <canvas id="editor-canvas" style="max-width: 100%; height: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.2);"></canvas>
          </div>
          
          <textarea id="editor-text" style="
            height: 150px; flex-shrink: 0; /* ★潰れないように固定 */
            background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
            color: white; padding: 16px; font-size: 16px; resize: none; outline: none;
            font-family: inherit;
          " placeholder="ここにテキストを入力..."></textarea>
        </div>

        <div style="
          flex: 1; max-width: 300px; display: flex; flex-direction: column; gap: 24px;
          background: rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; 
          overflow-y: auto; padding-top: 40px; /* 閉じるボタン避け */
        ">
          
          <div>
             <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">配置</label>
             <div style="display: flex; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 4px;">
               <button class="align-btn" data-align="left" style="flex:1; border:none; background:none; color:white; padding:8px; cursor:pointer; border-radius:4px;">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 7h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm0 4h12a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm0 4h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm0 4h12a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2z"/></svg>
               </button>
               <button class="align-btn" data-align="center" style="flex:1; border:none; background:none; color:white; padding:8px; cursor:pointer; border-radius:4px;">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 7h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm3 4h12a1 1 0 1 0 0-2H6a1 1 0 1 0 0 2zm-3 4h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm3 4h12a1 1 0 1 0 0-2H6a1 1 0 1 0 0 2z"/></svg>
               </button>
               <button class="align-btn" data-align="right" style="flex:1; border:none; background:none; color:white; padding:8px; cursor:pointer; border-radius:4px;">
                 <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 7h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm6 4h12a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2zm-6 4h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm6 4h12a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2z"/></svg>
               </button>
             </div>
          </div>

          <div>
            <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
              文字サイズ <span id="val-size">${this.config.fontSize}px</span>
            </label>
            <input type="range" id="ctrl-size" min="30" max="200" value="${this.config.fontSize}" style="width: 100%; accent-color: #1d9bf0;">
          </div>

          <div>
             <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
              縁取り太さ <span id="val-stroke">${this.config.strokeWidth}px</span>
            </label>
            <input type="range" id="ctrl-stroke" min="0" max="30" value="${this.config.strokeWidth}" style="width: 100%; accent-color: #1d9bf0;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">文字色</label>
              <input type="color" id="ctrl-color" value="${this.config.textColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 8px;">
            </div>
            <div>
              <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">縁色</label>
              <input type="color" id="ctrl-stroke-color" value="${this.config.strokeColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 8px;">
            </div>
          </div>

          <div>
            <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">背景画像</label>
            <input type="file" id="ctrl-bg-image" accept="image/*" style="display: none;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button id="btn-upload-bg" style="
                width: 100%; padding: 12px; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.3);
                background: rgba(0,0,0,0.2); color: #8b98a5; cursor: pointer; font-size: 14px;
                transition: all 0.2s;
              ">画像をアップロード</button>
              
              <div id="bg-preview-container" style="display: none; position: relative; width: 100%; height: 80px; border-radius: 8px; overflow: hidden;">
                <img id="bg-preview" style="width: 100%; height: 100%; object-fit: cover;">
                <button id="btn-clear-bg" style="
                  position: absolute; top: 4px; right: 4px; 
                  background: rgba(0,0,0,0.7); border: none; color: white; 
                  width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 16px; line-height: 1;
                ">×</button>
              </div>
            </div>
          </div>

          <div id="bg-opacity-control" style="display: none;">
            <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
              ガラス効果 <span id="val-bg-opacity">${Math.round(this.config.bgOpacity * 100)}%</span>
            </label>
            <input type="range" id="ctrl-bg-opacity" min="0" max="100" value="${Math.round(this.config.bgOpacity * 100)}" style="width: 100%; accent-color: #1d9bf0;">
          </div>

          <div>
            <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">背景色</label>
            <div style="display:flex; align-items:center; gap:12px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
               <input type="checkbox" id="ctrl-use-bg" ${this.config.useBg ? 'checked' : ''} style="width:20px; height:20px; accent-color: #1d9bf0;">
               <input type="color" id="ctrl-bg-color" value="${this.config.bgColor}" style="border:none; padding:0; flex:1; height: 30px; cursor: pointer; border-radius: 4px;">
            </div>
          </div>

          <div style="margin-top: auto;">
            <button id="btn-insert" style="
              width: 100%; padding: 16px; border-radius: 99px; border: none; 
              background: #1d9bf0; color: white; cursor: pointer; font-weight: 800; font-size: 16px;
              box-shadow: 0 4px 12px rgba(29, 155, 240, 0.3); transition: transform 0.1s;
              display: flex; justify-content: center; align-items: center; /* ★テキスト中央寄せ */
            ">画像を生成してコピー</button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._attachEvents();
    this._applySmartSettings();

    this.renderer.render(this.config);
    this._updateAlignButtonsUI();

    setTimeout(() => modal.style.opacity = '1', 10);
  }

  unmount() {
    const modal = document.getElementById('img-editor-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }
  }

  setText(text) {
    this.config.text = text;
    const textarea = document.getElementById('editor-text');
    if (textarea) textarea.value = text;
  }

  _applySmartSettings() {
    const text = this.config.text;
    const length = text.length;
    const lineCount = (text.match(/\n/g) || []).length;

    if (length <= 60 && lineCount < 3) {
      this.config.textAlign = 'center';
      this.config.fontSize = 90;
    } else {
      this.config.textAlign = 'left';
      this.config.fontSize = 60;
    }

    const sizeSlider = document.getElementById('ctrl-size');
    if (sizeSlider) sizeSlider.value = this.config.fontSize;
    const valSize = document.getElementById('val-size');
    if (valSize) valSize.innerText = this.config.fontSize + 'px';
  }

  _attachEvents() {
    document.getElementById('btn-close-x').onclick = () => this.unmount();

    const btnInsert = document.getElementById('btn-insert');
    btnInsert.onclick = async () => {
      const originalText = btnInsert.innerText;
      btnInsert.innerText = "生成中...";
      btnInsert.style.opacity = "0.7";
      await new Promise(r => setTimeout(r, 50));

      const blob = await this.renderer.toBlob();
      await this.onInsert(blob);
      btnInsert.innerText = originalText;
      btnInsert.style.opacity = "1";
    };

    const textarea = document.getElementById('editor-text');
    textarea.value = this.config.text;

    const debouncedText = debounce(() => {
      this.config.text = textarea.value;
      this.renderer.render(this.config);
    }, 300);
    textarea.oninput = debouncedText;

    const alignBtns = document.querySelectorAll('.align-btn');
    alignBtns.forEach(btn => {
      btn.onclick = () => {
        this.config.textAlign = btn.getAttribute('data-align');
        this._updateAlignButtonsUI();
        this.renderer.render(this.config);
      };
    });

    const debouncedUpdate = debounce(() => {
      this.config.fontSize = parseInt(document.getElementById('ctrl-size').value);
      this.config.strokeWidth = parseInt(document.getElementById('ctrl-stroke').value);
      this.config.textColor = document.getElementById('ctrl-color').value;
      this.config.strokeColor = document.getElementById('ctrl-stroke-color').value;
      this.config.bgColor = document.getElementById('ctrl-bg-color').value;
      this.config.useBg = document.getElementById('ctrl-use-bg').checked;

      this.renderer.render(this.config);
    }, 50);

    const updateLabels = () => {
      document.getElementById('val-size').innerText = document.getElementById('ctrl-size').value + 'px';
      document.getElementById('val-stroke').innerText = document.getElementById('ctrl-stroke').value + 'px';
      debouncedUpdate();
    };


    ['ctrl-size', 'ctrl-stroke', 'ctrl-color', 'ctrl-stroke-color', 'ctrl-bg-color', 'ctrl-use-bg'].forEach(id => {
      document.getElementById(id).oninput = updateLabels;
    });

    const btnUploadBg = document.getElementById('btn-upload-bg');
    const ctrlBgImage = document.getElementById('ctrl-bg-image');

    btnUploadBg.onclick = () => ctrlBgImage.click();

    ctrlBgImage.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        this.config.bgImage = event.target.result;
        this._updateBgImageUI();
        this.renderer.render(this.config);
      };
      reader.readAsDataURL(file);
    };

    const btnClearBg = document.getElementById('btn-clear-bg');
    btnClearBg.onclick = () => {
      this.config.bgImage = null;
      this._updateBgImageUI();
      ctrlBgImage.value = '';
      this.renderer.render(this.config);
    };

    const ctrlBgOpacity = document.getElementById('ctrl-bg-opacity');
    const valBgOpacity = document.getElementById('val-bg-opacity');

    ctrlBgOpacity.oninput = () => {
      this.config.bgOpacity = parseInt(ctrlBgOpacity.value) / 100;
      valBgOpacity.innerText = ctrlBgOpacity.value + '%';
      this.renderer.render(this.config);
    };
  }

  _updateAlignButtonsUI() {
    const alignBtns = document.querySelectorAll('.align-btn');
    alignBtns.forEach(btn => {
      const align = btn.getAttribute('data-align');
      if (align === this.config.textAlign) {
        btn.style.backgroundColor = 'rgba(29, 155, 240, 0.3)';
        btn.style.color = '#1d9bf0';
      } else {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = 'white';
      }
    });
  }

  _updateBgImageUI() {
    const previewContainer = document.getElementById('bg-preview-container');
    const preview = document.getElementById('bg-preview');
    const opacityControl = document.getElementById('bg-opacity-control');

    if (this.config.bgImage) {
      preview.src = this.config.bgImage;
      previewContainer.style.display = 'block';
      opacityControl.style.display = 'block';
    } else {
      previewContainer.style.display = 'none';
      opacityControl.style.display = 'none';
    }
  }
}
