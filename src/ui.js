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
    // localStorageからプレースホルダーを読み込む
    const savedPlaceholder = localStorage.getItem('x-text-to-img-placeholder');
    if (savedPlaceholder) {
      this.config.placeholder = savedPlaceholder;
    }
    this.renderMode = localStorage.getItem('x-text-to-img-renderMode') || 'instant';
    this.renderDebounceTimer = null;
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

    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
      background: rgba(25, 39, 52, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px;
      width: 95%; max-width: 1000px; 
      height: 85vh; max-height: 900px;
      display: flex; gap: 24px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.5);
      color: #e7e9ea;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      opacity: 0;
      transform: scale(0.95);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    dialogContent.innerHTML = `
      <button id="btn-close-x" style="
        position: absolute; top: 20px; right: 20px;
        background: none; border: none; color: #8b98a5; 
        font-size: 24px; cursor: pointer; z-index: 10;
      ">&times;</button>
      
      <div style="
        flex: 2; display: flex; flex-direction: column; gap: 16px; 
        overflow: hidden;
        min-height: 0;
        opacity: 0;
        animation: fadeInLeft 0.6s ease 0.2s forwards;
      ">
        <div style="
          flex: 1;
          background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAjyQc6wcEGAIAoLwXkwwEHW8AAAAASUVORK5CYII=');
          border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);
          overflow: auto;
          display: flex; justify-content: center; align-items: flex-start; 
          padding: 20px;
          min-height: 0;
        ">
          <canvas id="editor-canvas" style="max-width: 100%; height: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.2);"></canvas>
        </div>
        
        <textarea id="editor-text" style="
          height: 150px; flex-shrink: 0;
          background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
          color: white; padding: 16px; font-size: 16px; resize: none; outline: none;
          font-family: inherit;
        " placeholder="${this.config.placeholder}"></textarea>
      </div>

      <div style="
        flex: 1; max-width: 300px; display: flex; flex-direction: column; gap: 24px;
        background: rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; 
        overflow-y: auto; padding-top: 40px;
        opacity: 0;
        animation: fadeInRight 0.6s ease 0.2s forwards;
      ">
        
        <div style="opacity: 0; animation: slideInUp 0.5s ease 0.3s forwards;">
           <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">配置</label>
           <div style="display: flex; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 4px;">
             <button class="align-btn" data-align="left" style="flex:1; border:none; background: linear-gradient(90deg, rgba(29, 155, 240, 0.3) 0%, rgba(29, 155, 240, 0.3) 50%, transparent 50%, transparent 100%); background-size: 200% 100%; background-position: 100% 0; color:white; padding:8px; cursor:pointer; border-radius:4px; transition: background-position 0.3s ease, color 0.3s ease;">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 7h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm0 4h12a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm0 4h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm0 4h12a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2z"/></svg>
             </button>
             <button class="align-btn" data-align="center" style="flex:1; border:none; background: linear-gradient(90deg, rgba(29, 155, 240, 0.3) 0%, rgba(29, 155, 240, 0.3) 50%, transparent 50%, transparent 100%); background-size: 200% 100%; background-position: 100% 0; color:white; padding:8px; cursor:pointer; border-radius:4px; transition: background-position 0.3s ease, color 0.3s ease;">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 7h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm3 4h12a1 1 0 1 0 0-2H6a1 1 0 1 0 0 2zm-3 4h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm3 4h12a1 1 0 1 0 0-2H6a1 1 0 1 0 0 2z"/></svg>
             </button>
             <button class="align-btn" data-align="right" style="flex:1; border:none; background: linear-gradient(90deg, rgba(29, 155, 240, 0.3) 0%, rgba(29, 155, 240, 0.3) 50%, transparent 50%, transparent 100%); background-size: 200% 100%; background-position: 100% 0; color:white; padding:8px; cursor:pointer; border-radius:4px; transition: background-position 0.3s ease, color 0.3s ease;">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 7h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm6 4h12a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2zm-6 4h18a1 1 0 1 0 0-2H3a1 1 0 1 0 0 2zm6 4h12a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2z"/></svg>
             </button>
           </div>
        </div>

        <div style="opacity: 0; animation: slideInUp 0.5s ease 0.3s forwards;">
           <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">フォント</label>
           <select id="ctrl-font" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; accent-color: #1d9bf0; cursor: pointer;">
             <option value="Arial" style="background: #192734;">Arial</option>
             <option value="Georgia" style="background: #192734;">Georgia</option>
             <option value="Times New Roman" style="background: #192734;">Times New Roman</option>
             <option value="Courier New" style="background: #192734;">Courier New</option>
             <option value="Verdana" style="background: #192734;">Verdana</option>
             <option value="Comic Sans MS" style="background: #192734;">Comic Sans MS</option>
           </select>
        </div>

        <div style="opacity: 0; animation: slideInUp 0.5s ease 0.35s forwards;">
          <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
            文字サイズ <span id="val-size">${this.config.fontSize}px</span>
          </label>
          <input type="range" id="ctrl-size" min="30" max="200" value="${this.config.fontSize}" style="width: 100%; accent-color: #1d9bf0;">
        </div>

        <div style="opacity: 0; animation: slideInUp 0.5s ease 0.4s forwards;">
           <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
            縁取り太さ <span id="val-stroke">${this.config.strokeWidth}px</span>
          </label>
          <input type="range" id="ctrl-stroke" min="0" max="30" value="${this.config.strokeWidth}" style="width: 100%; accent-color: #1d9bf0;">
        </div>

        <div style="opacity: 0; animation: slideInUp 0.5s ease 0.45s forwards; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">文字色</label>
            <input type="color" id="ctrl-color" value="${this.config.textColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 8px;">
          </div>
          <div>
            <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">縁色</label>
            <input type="color" id="ctrl-stroke-color" value="${this.config.strokeColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 8px;">
          </div>
        </div>

        <div style="opacity: 0; animation: slideInUp 0.5s ease 0.5s forwards;">
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

        <div id="bg-opacity-control" style="display: none; opacity: 0; animation: slideInUp 0.5s ease 0.55s forwards;">
          <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
            ガラス効果 <span id="val-bg-opacity">${Math.round(this.config.bgOpacity * 100)}%</span>
          </label>
          <input type="range" id="ctrl-bg-opacity" min="0" max="100" value="${Math.round(this.config.bgOpacity * 100)}" style="width: 100%; accent-color: #1d9bf0;">
        </div>

        <div style="opacity: 0; animation: slideInUp 0.5s ease 0.6s forwards;">
          <label style="display:flex; gap: 8px; align-items:center; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
            <input type="checkbox" id="ctrl-use-bg" ${this.config.useBg ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #1d9bf0;">
            <span>背景色を使用</span>
          </label>
        </div>

        <div style="opacity: 0; animation: slideInUp 0.5s ease 0.65s forwards; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">色</label>
            <input type="color" id="ctrl-bg-color" value="${this.config.bgColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 8px;">
          </div>
          <div>
            <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
              透明度 <span id="val-bg-alpha">${Math.round((this.config.bgAlpha ?? 1) * 100)}%</span>
            </label>
            <input type="range" id="ctrl-bg-alpha" min="0" max="100" value="${Math.round((this.config.bgAlpha ?? 1) * 100)}" style="width: 100%; accent-color: #1d9bf0;">
          </div>
        </div>

        <div style="margin-top: auto; opacity: 0; animation: slideInUp 0.5s ease 0.65s forwards;">
          <button id="btn-insert" style="
            width: 100%; padding: 16px; border-radius: 99px; border: none; 
            background: #1d9bf0; color: white; cursor: pointer; font-weight: 800; font-size: 16px;
            box-shadow: 0 4px 12px rgba(29, 155, 240, 0.3); transition: transform 0.1s;
            display: flex; justify-content: center; align-items: center;
          ">画像を生成してコピー</button>
        </div>

      </div>

      <style>
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        #editor-text::placeholder {
          color: rgba(139, 152, 165, 0.5);
        }
      </style>
    `;

    modal.appendChild(dialogContent);
    document.body.appendChild(modal);
    
    // モーダル背景クリックで閉じる
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.unmount();
      }
    };
    
    // ダイアログ内のクリックはモーダルを閉じない
    dialogContent.onclick = (e) => {
      e.stopPropagation();
    };
    
    this._attachEvents();
    this._applySmartSettings();

    this.renderer.render(this.config);
    this._updateAlignButtonsUI();

    setTimeout(() => modal.style.opacity = '1', 10);
    setTimeout(() => {
      dialogContent.style.opacity = '1';
      dialogContent.style.transform = 'scale(1)';
    }, 50);
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
    textarea.placeholder = this.config.placeholder;

    // Placeholderをフォーカスで消す処理
    textarea.onfocus = () => {
      if (textarea.value === this.config.text) {
        // フォーカス時の特別な処理が必要な場合はここに
      }
    };

    // レンダリングモード対応のテキスト更新
    const updateText = () => {
      this.config.text = textarea.value;
      if (this.renderMode === 'instant') {
        this.renderer.render(this.config);
      } else {
        // debounceモード（軽いモード）
        clearTimeout(this.renderDebounceTimer);
        this.renderDebounceTimer = setTimeout(() => {
          this.renderer.render(this.config);
        }, 300);
      }
    };
    textarea.oninput = updateText;

    const alignBtns = document.querySelectorAll('.align-btn');
    alignBtns.forEach(btn => {
      btn.onclick = () => {
        this.config.textAlign = btn.getAttribute('data-align');
        this._updateAlignButtonsUI();
        this._scheduleRender();
      };
    });

    const updateLabels = () => {
      document.getElementById('val-size').innerText = document.getElementById('ctrl-size').value + 'px';
      document.getElementById('val-stroke').innerText = document.getElementById('ctrl-stroke').value + 'px';
      this._updateConfigAndRender();
    };

    ['ctrl-size', 'ctrl-stroke', 'ctrl-color', 'ctrl-stroke-color', 'ctrl-bg-color', 'ctrl-use-bg'].forEach(id => {
      document.getElementById(id).oninput = updateLabels;
    });

    const ctrlFont = document.getElementById('ctrl-font');
    if (ctrlFont) {
      ctrlFont.onchange = () => {
        this.config.fontFamily = ctrlFont.value;
        this._scheduleRender();
      };
    }

    const ctrlBgAlpha = document.getElementById('ctrl-bg-alpha');
    const valBgAlpha = document.getElementById('val-bg-alpha');
    if (ctrlBgAlpha) {
      ctrlBgAlpha.oninput = () => {
        this.config.bgAlpha = parseInt(ctrlBgAlpha.value) / 100;
        valBgAlpha.innerText = ctrlBgAlpha.value + '%';
        this._scheduleRender();
      };
    }

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
        this._scheduleRender();
      };
      reader.readAsDataURL(file);
    };

    const btnClearBg = document.getElementById('btn-clear-bg');
    btnClearBg.onclick = () => {
      this.config.bgImage = null;
      this._updateBgImageUI();
      ctrlBgImage.value = '';
      this._scheduleRender();
    };

    const ctrlBgOpacity = document.getElementById('ctrl-bg-opacity');
    const valBgOpacity = document.getElementById('val-bg-opacity');

    ctrlBgOpacity.oninput = () => {
      this.config.bgOpacity = parseInt(ctrlBgOpacity.value) / 100;
      valBgOpacity.innerText = ctrlBgOpacity.value + '%';
      this._scheduleRender();
    };
  }

  _updateConfigAndRender() {
    this.config.fontSize = parseInt(document.getElementById('ctrl-size').value);
    this.config.strokeWidth = parseInt(document.getElementById('ctrl-stroke').value);
    this.config.textColor = document.getElementById('ctrl-color').value;
    this.config.strokeColor = document.getElementById('ctrl-stroke-color').value;
    this.config.bgColor = document.getElementById('ctrl-bg-color').value;
    this.config.useBg = document.getElementById('ctrl-use-bg').checked;
    const ctrlFont = document.getElementById('ctrl-font');
    if (ctrlFont) {
      this.config.fontFamily = ctrlFont.value;
    }
    const ctrlBgAlpha = document.getElementById('ctrl-bg-alpha');
    if (ctrlBgAlpha) {
      this.config.bgAlpha = parseInt(ctrlBgAlpha.value) / 100;
    }
    this._scheduleRender();
  }

  _scheduleRender() {
    if (this.renderMode === 'instant') {
      this.renderer.render(this.config);
    } else {
      clearTimeout(this.renderDebounceTimer);
      this.renderDebounceTimer = setTimeout(() => {
        this.renderer.render(this.config);
      }, 300);
    }
  }

  _updateAlignButtonsUI() {
    const alignBtns = document.querySelectorAll('.align-btn');
    alignBtns.forEach(btn => {
      const align = btn.getAttribute('data-align');
      if (align === this.config.textAlign) {
        btn.style.backgroundPosition = '0 0';
        btn.style.color = '#1d9bf0';
      } else {
        btn.style.backgroundPosition = '100% 0';
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
class SettingsUI {
  constructor() {
    this.settings = {
      fontSize: localStorage.getItem('x-text-to-img-fontSize') || '60',
      strokeWidth: localStorage.getItem('x-text-to-img-strokeWidth') || '3',
      textColor: localStorage.getItem('x-text-to-img-textColor') || '#ffffff',
      strokeColor: localStorage.getItem('x-text-to-img-strokeColor') || '#000000',
      useBg: localStorage.getItem('x-text-to-img-useBg') === 'true',
      bgColor: localStorage.getItem('x-text-to-img-bgColor') || '#000000',
      placeholder: localStorage.getItem('x-text-to-img-placeholder') || 'ここにテキストを入力してください...',
      renderMode: localStorage.getItem('x-text-to-img-renderMode') || 'instant'
    };
  }

  mount() {
    if (document.getElementById('settings-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'settings-modal';

    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(4px);
      z-index: 10000; display: flex; justify-content: center; align-items: center;
      opacity: 0; transition: opacity 0.3s ease;
    `;

    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
      background: rgba(25, 39, 52, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px;
      width: 95%; max-width: 500px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.5);
      color: #e7e9ea;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      opacity: 0;
      transform: scale(0.95);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    dialogContent.innerHTML = `
      <button id="btn-close-settings" style="
        position: absolute; top: 20px; right: 20px;
        background: none; border: none; color: #8b98a5; 
        font-size: 24px; cursor: pointer; z-index: 10;
      ">&times;</button>
      
      <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 800; opacity: 0; transform: translateY(-10px); animation: slideInDown 0.6s ease 0.2s forwards;">
        テキスト画像変換の設定
      </h2>

      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div class="settings-item" style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease forwards;">
          <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
            デフォルト文字サイズ <span id="settings-val-size">${this.settings.fontSize}px</span>
          </label>
          <input type="range" id="settings-ctrl-size" min="30" max="200" value="${this.settings.fontSize}" style="width: 100%; accent-color: #1d9bf0;">
        </div>

        <div class="settings-item" style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.1s forwards;">
          <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
            デフォルト縁取り太さ <span id="settings-val-stroke">${this.settings.strokeWidth}px</span>
          </label>
          <input type="range" id="settings-ctrl-stroke" min="0" max="30" value="${this.settings.strokeWidth}" style="width: 100%; accent-color: #1d9bf0;">
        </div>

        <div class="settings-item" style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.2s forwards; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">デフォルト文字色</label>
            <input type="color" id="settings-ctrl-color" value="${this.settings.textColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 8px;">
          </div>
          <div>
            <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">デフォルト縁色</label>
            <input type="color" id="settings-ctrl-stroke-color" value="${this.settings.strokeColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 8px;">
          </div>
        </div>

        <div class="settings-item" style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.3s forwards;">
          <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">背景色設定</label>
          <div style="display:flex; align-items:center; gap:12px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
            <input type="checkbox" id="settings-ctrl-use-bg" ${this.settings.useBg ? 'checked' : ''} style="width:20px; height:20px; accent-color: #1d9bf0;">
            <input type="color" id="settings-ctrl-bg-color" value="${this.settings.bgColor}" style="border:none; padding:0; flex:1; height: 30px; cursor: pointer; border-radius: 4px;">
          </div>
        </div>

        <div class="settings-item" style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.35s forwards;">
          <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">プレースホルダーテキスト</label>
          <input type="text" id="settings-ctrl-placeholder" value="${this.settings.placeholder}" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; font-size: 12px;">
        </div>

        <div class="settings-item" style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.4s forwards;">
          <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">描画モード</label>
          <div style="display: flex; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 4px;">
            <button class="render-mode-btn" data-mode="instant" style="flex:1; border:none; background: linear-gradient(90deg, rgba(29, 155, 240, 0.3) 0%, rgba(29, 155, 240, 0.3) 50%, transparent 50%, transparent 100%); background-size: 200% 100%; background-position: ${this.settings.renderMode === 'instant' ? '0 0' : '100% 0'}; color:${this.settings.renderMode === 'instant' ? '#1d9bf0' : 'white'}; padding:8px; cursor:pointer; border-radius:4px; font-size: 12px; transition: background-position 0.3s ease, color 0.3s ease;">
              即座に描画
            </button>
            <button class="render-mode-btn" data-mode="light" style="flex:1; border:none; background: linear-gradient(90deg, rgba(29, 155, 240, 0.3) 0%, rgba(29, 155, 240, 0.3) 50%, transparent 50%, transparent 100%); background-size: 200% 100%; background-position: ${this.settings.renderMode === 'light' ? '0 0' : '100% 0'}; color:${this.settings.renderMode === 'light' ? '#1d9bf0' : 'white'}; padding:8px; cursor:pointer; border-radius:4px; font-size: 12px; transition: background-position 0.3s ease, color 0.3s ease;">
              軽いモード
            </button>
          </div>
          <div style="font-size: 11px; color: #8b98a5; margin-top: 6px;">
            即座: プロパティ変更時に即座に描画 / 軽いモード: 300ms待機後に描画
          </div>
        </div>

        <button id="btn-save-settings" style="
          width: 100%; padding: 16px; border-radius: 99px; border: none; 
          background: #1d9bf0; color: white; cursor: pointer; font-weight: 800; font-size: 16px;
          box-shadow: 0 4px 12px rgba(29, 155, 240, 0.3); transition: transform 0.1s;
          margin-top: 16px;
          opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.5s forwards;
        ">保存</button>
      </div>

      <style>
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    `;

    modal.appendChild(dialogContent);
    document.body.appendChild(modal);
    
    // モーダル背景クリックで閉じる
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.unmount();
      }
    };
    
    // ダイアログ内のクリックはモーダルを閉じない
    dialogContent.onclick = (e) => {
      e.stopPropagation();
    };
    
    this._attachEvents();

    // ダイアログ本体をフェードイン
    setTimeout(() => modal.style.opacity = '1', 10);
    
    // ダイアログ内容をアニメーション
    setTimeout(() => {
      dialogContent.style.opacity = '1';
      dialogContent.style.transform = 'scale(1)';
    }, 50);
  }

  unmount() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }
  }

  _attachEvents() {
    document.getElementById('btn-close-settings').onclick = () => this.unmount();
    
    const sizeInput = document.getElementById('settings-ctrl-size');
    const strokeInput = document.getElementById('settings-ctrl-stroke');
    const sizeDisplay = document.getElementById('settings-val-size');
    const strokeDisplay = document.getElementById('settings-val-stroke');

    sizeInput.addEventListener('input', (e) => {
      this.settings.fontSize = e.target.value;
      sizeDisplay.textContent = e.target.value + 'px';
    });

    strokeInput.addEventListener('input', (e) => {
      this.settings.strokeWidth = e.target.value;
      strokeDisplay.textContent = e.target.value + 'px';
    });

    document.getElementById('settings-ctrl-color').addEventListener('change', (e) => {
      this.settings.textColor = e.target.value;
    });

    document.getElementById('settings-ctrl-stroke-color').addEventListener('change', (e) => {
      this.settings.strokeColor = e.target.value;
    });

    document.getElementById('settings-ctrl-use-bg').addEventListener('change', (e) => {
      this.settings.useBg = e.target.checked;
    });

    document.getElementById('settings-ctrl-bg-color').addEventListener('change', (e) => {
      this.settings.bgColor = e.target.value;
    });

    // レンダリングモード切り替え
    const renderModeBtns = document.querySelectorAll('.render-mode-btn');
    renderModeBtns.forEach(btn => {
      btn.onclick = () => {
        const mode = btn.getAttribute('data-mode');
        this.settings.renderMode = mode;
        
        // UIを更新
        renderModeBtns.forEach(b => {
          b.style.backgroundPosition = '100% 0';
          b.style.color = 'white';
        });
        btn.style.backgroundPosition = '0 0';
        btn.style.color = '#1d9bf0';
      };
    });

    // プレースホルダーテキスト入力
    const ctrlPlaceholder = document.getElementById('settings-ctrl-placeholder');
    if (ctrlPlaceholder) {
      ctrlPlaceholder.oninput = () => {
        this.settings.placeholder = ctrlPlaceholder.value;
      };
    }

    document.getElementById('btn-save-settings').onclick = () => {
      localStorage.setItem('x-text-to-img-fontSize', this.settings.fontSize);
      localStorage.setItem('x-text-to-img-strokeWidth', this.settings.strokeWidth);
      localStorage.setItem('x-text-to-img-textColor', this.settings.textColor);
      localStorage.setItem('x-text-to-img-strokeColor', this.settings.strokeColor);
      localStorage.setItem('x-text-to-img-useBg', this.settings.useBg);
      localStorage.setItem('x-text-to-img-bgColor', this.settings.bgColor);
      localStorage.setItem('x-text-to-img-placeholder', this.settings.placeholder);
      localStorage.setItem('x-text-to-img-renderMode', this.settings.renderMode);
      this.unmount();
    };
  }
}