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

    // localStorageから設定を読み込む
    this.config = {
      ...CONFIG_DEFAULT,
      fontSize: parseInt(localStorage.getItem('x-text-to-img-fontSize')) || CONFIG_DEFAULT.fontSize,
      strokeWidth: parseInt(localStorage.getItem('x-text-to-img-strokeWidth')) || CONFIG_DEFAULT.strokeWidth,
      textColor: localStorage.getItem('x-text-to-img-textColor') || CONFIG_DEFAULT.textColor,
      strokeColor: localStorage.getItem('x-text-to-img-strokeColor') || CONFIG_DEFAULT.strokeColor,
      useBg: localStorage.getItem('x-text-to-img-useBg') === 'true',
      bgColor: localStorage.getItem('x-text-to-img-bgColor') || CONFIG_DEFAULT.bgColor,
      bgAlpha: parseFloat(localStorage.getItem('x-text-to-img-bgAlpha')) || CONFIG_DEFAULT.bgAlpha,
      placeholder: localStorage.getItem('x-text-to-img-placeholder') || CONFIG_DEFAULT.placeholder,
      fontFamily: localStorage.getItem('x-text-to-img-fontFamily') || CONFIG_DEFAULT.fontFamily,
      fontWeight: localStorage.getItem('x-text-to-img-fontWeight') || CONFIG_DEFAULT.fontWeight
    };

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
        position: absolute; top: 24px; right: 24px;
        background: rgba(255,255,255,0.1); border: none; color: white; 
        width: 32px; height: 32px; border-radius: 50%; cursor: pointer; z-index: 10;
        display: flex; align-items: center; justify-content: center; font-size: 20px;
        line-height: 1; transition: all 0.2s;
        opacity: 0; transform: scale(0.8); animation: fadeInScale 0.4s ease 0.4s forwards;
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

        <div id="weight-control-container" style="display: none; opacity: 0; animation: slideInUp 0.5s ease 0.3s forwards;">
          <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
            文字の太さ <span id="val-weight">${this.config.fontWeight}</span>
          </label>
          <input type="range" id="ctrl-weight" min="100" max="900" step="10" value="${this.config.fontWeight}" style="width: 100%; accent-color: #1d9bf0;">
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
          ">画像を生成して挿入</button>
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
        #btn-close-x:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        #btn-close-x:active {
          transform: scale(0.9);
        }
        @keyframes fadeInScale {
          to {
            opacity: 1;
            transform: scale(1);
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
    this._applySmartSettings();

    this._loadLocalFonts();
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
    const text = (this.config.text || "").trim();
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

    this._toggleWeightControl(this.config.fontFamily);
  }

  _isVariableFont(family) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const text = "Hi";

    ctx.font = `400 30px "${family}"`;
    const w1 = ctx.measureText(text).width;

    ctx.font = `500 30px "${family}"`;
    const w2 = ctx.measureText(text).width;

    // 普通のフォントなら400と500で幅が変わることは稀（ウェイト指定が無効なら同じ幅）
    // バリアブルフォントなら幅がわずかに変わることが多い
    return w1 !== w2;
  }

  _toggleWeightControl(family) {
    const container = document.getElementById('weight-control-container');
    if (!container) return;

    if (this._isVariableFont(family)) {
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
      this.config.fontWeight = "800"; // 固定フォントの場合は800（太字）に戻す
      const slider = document.getElementById('ctrl-weight');
      if (slider) slider.value = "800";
    }
  }

  async _loadLocalFonts() {
    const ctrlFont = document.getElementById('ctrl-font');
    if (!ctrlFont) return;

    try {
      if ('queryLocalFonts' in window) {
        // フォント取得中に「読み込み中...」を表示
        const currentSelection = this.config.fontFamily;
        ctrlFont.innerHTML = `<option value="${currentSelection}">${currentSelection}</option><option disabled>フォントを読込中...</option>`;

        const fonts = await window.queryLocalFonts();

        // 重複を除去して名前順にソート（PostScript名またはFamily名を使用）
        const fontMap = new Map();
        fonts.forEach(f => {
          if (!fontMap.has(f.family)) {
            fontMap.set(f.family, f.fullName || f.family);
          }
        });

        const sortedFamilies = Array.from(fontMap.keys()).sort();

        ctrlFont.innerHTML = '';
        sortedFamilies.forEach(family => {
          const option = document.createElement('option');
          option.value = family;
          option.textContent = family;
          option.style.background = '#192734';
          if (family === this.config.fontFamily) {
            option.selected = true;
          }
          ctrlFont.appendChild(option);
        });

        this._toggleWeightControl(this.config.fontFamily);
      }
    } catch (err) {
      console.error("Local Font Access Error:", err);
      // エラー時は既存のHTML（Arial, Georgia等）を維持
    }
  }

  _attachEvents() {
    document.getElementById('btn-close-x').onclick = () => this.unmount();

    const btnInsert = document.getElementById('btn-insert');
    btnInsert.onclick = async () => {
      const originalText = btnInsert.innerText;
      btnInsert.innerText = "生成・挿入中...";
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
        this._toggleWeightControl(this.config.fontFamily);
        this._scheduleRender();
      };
    }

    const ctrlWeight = document.getElementById('ctrl-weight');
    const valWeight = document.getElementById('val-weight');
    if (ctrlWeight) {
      ctrlWeight.oninput = () => {
        this.config.fontWeight = ctrlWeight.value;
        valWeight.innerText = ctrlWeight.value;
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
      strokeWidth: localStorage.getItem('x-text-to-img-strokeWidth') || '8',
      textColor: localStorage.getItem('x-text-to-img-textColor') || '#ffffff',
      strokeColor: localStorage.getItem('x-text-to-img-strokeColor') || '#000000',
      useBg: localStorage.getItem('x-text-to-img-useBg') === 'true',
      bgColor: localStorage.getItem('x-text-to-img-bgColor') || '#000000',
      bgAlpha: localStorage.getItem('x-text-to-img-bgAlpha') || '1.0',
      placeholder: localStorage.getItem('x-text-to-img-placeholder') || 'ここにテキストを入力してください...',
      renderMode: localStorage.getItem('x-text-to-img-renderMode') || 'instant',
      fontFamily: localStorage.getItem('x-text-to-img-fontFamily') || 'Arial',
      fontWeight: localStorage.getItem('x-text-to-img-fontWeight') || '800'
    };
  }

  async mount() {
    if (document.getElementById('settings-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
      z-index: 10001; display: flex; justify-content: center; align-items: center;
      opacity: 0; transition: opacity 0.3s ease;
    `;

    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
      background: rgba(25, 39, 52, 0.9);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 28px; padding: 32px;
      width: 95%; max-width: 550px; height: 85vh; max-height: 800px;
      box-shadow: 0 40px 100px rgba(0,0,0,0.6);
      color: #e7e9ea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative; opacity: 0; transform: scale(0.95);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex; flex-direction: column;
    `;

    dialogContent.innerHTML = `
      <button id="btn-close-settings" style="
        position: absolute; top: 24px; right: 24px;
        background: rgba(255,255,255,0.1); border: none; color: white; 
        width: 32px; height: 32px; border-radius: 50%; cursor: pointer; z-index: 10;
        display: flex; align-items: center; justify-content: center; font-size: 20px;
        line-height: 1; transition: all 0.2s;
        opacity: 0; transform: scale(0.8); animation: fadeInScale 0.4s ease 0.4s forwards;
      ">&times;</button>
      
      <h2 style="margin: 0 0 24px 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">設定</h2>

      <div class="settings-scroll-container" style="flex: 1; overflow-y: auto; padding-right: 8px; display: flex; flex-direction: column; gap: 32px;">
        
        <!-- テキスト設定セクション -->
        <section style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.3s forwards;">
          <h3 style="font-size: 11px; text-transform: uppercase; color: #1d9bf0; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800;">TEXT </h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="settings-item">
              <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">デフォルトフォント</label>
              <select id="settings-ctrl-font" style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white; cursor: pointer;">
                <option value="${this.settings.fontFamily}">${this.settings.fontFamily}</option>
              </select>
            </div>

            <div id="settings-weight-container" style="display: none;">
              <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
                デフォルトの太さ <span id="settings-val-weight">${this.settings.fontWeight}</span>
              </label>
              <input type="range" id="settings-ctrl-weight" min="100" max="900" step="10" value="${this.settings.fontWeight}" style="width: 100%; accent-color: #1d9bf0;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
                  サイズ <span id="settings-val-size">${this.settings.fontSize}px</span>
                </label>
                <input type="range" id="settings-ctrl-size" min="30" max="200" value="${this.settings.fontSize}" style="width: 100%; accent-color: #1d9bf0;">
              </div>
              <div>
                <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
                  縁取り <span id="settings-val-stroke">${this.settings.strokeWidth}px</span>
                </label>
                <input type="range" id="settings-ctrl-stroke" min="0" max="30" value="${this.settings.strokeWidth}" style="width: 100%; accent-color: #1d9bf0;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">文字色</label>
                <input type="color" id="settings-ctrl-color" value="${this.settings.textColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 10px;">
              </div>
              <div>
                <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">縁色</label>
                <input type="color" id="settings-ctrl-stroke-color" value="${this.settings.strokeColor}" style="border:none; padding:0; width: 100%; height: 40px; cursor: pointer; border-radius: 10px;">
              </div>
            </div>
          </div>
        </section>

        <!-- 背景設定セクション -->
        <section style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.4s forwards;">
          <h3 style="font-size: 11px; text-transform: uppercase; color: #1d9bf0; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800;">BACKGROUND</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.05);">
              <label style="display:flex; align-items:center; gap:12px; font-size: 14px; cursor: pointer;">
                <input type="checkbox" id="settings-ctrl-use-bg" ${this.settings.useBg ? 'checked' : ''} style="width:20px; height:20px; accent-color: #1d9bf0;">
                <span>標準で背景色を使用する</span>
              </label>
              
              <div id="settings-bg-options" style="margin-top: 20px; display: ${this.settings.useBg ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">背景色</label>
                  <input type="color" id="settings-ctrl-bg-color" value="${this.settings.bgColor}" style="border:none; padding:0; width: 100%; height: 36px; cursor: pointer; border-radius: 8px;">
                </div>
                <div>
                  <label style="display:flex; justify-content:space-between; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">
                    透明度 <span id="settings-val-bg-alpha">${Math.round(this.settings.bgAlpha * 100)}%</span>
                  </label>
                  <input type="range" id="settings-ctrl-bg-alpha" min="0" max="100" value="${Math.round(this.settings.bgAlpha * 100)}" style="width: 100%; accent-color: #1d9bf0;">
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- システム設定セクション -->
        <section style="opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.5s forwards; margin-bottom: 20px;">
          <h3 style="font-size: 11px; text-transform: uppercase; color: #1d9bf0; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800;">SYSTEM</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 8px;">デフォルトのプレースホルダー</label>
              <input type="text" id="settings-ctrl-placeholder" value="${this.settings.placeholder}" style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white; font-size: 13px; outline: none;">
            </div>

            <div>
              <label style="display:block; font-size: 13px; color: #8b98a5; margin-bottom: 12px;">描画モード</label>
              <div style="display: flex; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 4px;">
                <button class="render-mode-btn" data-mode="instant" style="flex:1; border:none; background: linear-gradient(90deg, rgba(29, 155, 240, 0.3) 0%, rgba(29, 155, 240, 0.3) 50%, transparent 50%, transparent 100%); background-size: 200% 100%; background-position: ${this.settings.renderMode === 'instant' ? '0 0' : '100% 0'}; color:${this.settings.renderMode === 'instant' ? '#1d9bf0' : '#8b98a5'}; padding:10px; cursor:pointer; border-radius:8px; font-size: 13px; font-weight: 600; transition: background-position 0.3s ease, color 0.3s ease;">
                  即座
                </button>
                <button class="render-mode-btn" data-mode="light" style="flex:1; border:none; background: linear-gradient(90deg, rgba(29, 155, 240, 0.3) 0%, rgba(29, 155, 240, 0.3) 50%, transparent 50%, transparent 100%); background-size: 200% 100%; background-position: ${this.settings.renderMode === 'light' ? '0 0' : '100% 0'}; color:${this.settings.renderMode === 'light' ? '#1d9bf0' : '#8b98a5'}; padding:10px; cursor:pointer; border-radius:8px; font-size: 13px; font-weight: 600; transition: background-position 0.3s ease, color 0.3s ease;">
                  低負荷
                </button>
              </div>
              <div style="font-size: 11px; color: #8b98a5; margin-top: 10px; line-height: 1.4;">
                即座: 入力時にリアルタイム描画 / 低負荷: 300ms待機後に描画
              </div>
            </div>
          </div>
        </section>

      </div>

      <div style="padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); opacity: 0; transform: translateY(15px); animation: slideInUp 0.5s ease 0.6s forwards;">
        <button id="btn-save-settings" style="
          width: 100%; padding: 16px; border-radius: 16px; border: none; 
          background: #1d9bf0; color: white; cursor: pointer; font-weight: 800; font-size: 16px;
          box-shadow: 0 8px 24px rgba(29, 155, 240, 0.3); transition: transform 0.1s, background 0.2s;
        ">設定を保存</button>
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
        /* スクロールバーのカスタマイズ */
        .settings-scroll-container::-webkit-scrollbar {
          width: 5px;
        }
        .settings-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .settings-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        #btn-close-settings:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        #btn-close-settings:active {
          transform: scale(0.9);
        }
        @keyframes fadeInScale {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      </style>
    `;

    modal.appendChild(dialogContent);
    document.body.appendChild(modal);

    modal.onclick = (e) => { if (e.target === modal) this.unmount(); };
    dialogContent.onclick = (e) => e.stopPropagation();

    this._attachEvents();
    this._loadFontsIntoSettings();

    setTimeout(() => modal.style.opacity = '1', 10);
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

  async _loadFontsIntoSettings() {
    const ctrlFont = document.getElementById('settings-ctrl-font');
    if (!ctrlFont) return;

    try {
      if ('queryLocalFonts' in window) {
        const fonts = await window.queryLocalFonts();
        const fontMap = new Map();
        fonts.forEach(f => { if (!fontMap.has(f.family)) fontMap.set(f.family, f.fullName || f.family); });
        const sortedFamilies = Array.from(fontMap.keys()).sort();

        ctrlFont.innerHTML = '';
        sortedFamilies.forEach(family => {
          const option = document.createElement('option');
          option.value = family;
          option.textContent = family;
          option.style.background = '#192734';
          if (family === this.settings.fontFamily) option.selected = true;
          ctrlFont.appendChild(option);
        });

        this._updateWeightControlVisibility(this.settings.fontFamily);
      }
    } catch (err) { console.error("Settings Font Load Error:", err); }
  }

  _isVariableFont(family) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const text = "Hi";
    ctx.font = `400 30px "${family}"`;
    const w1 = ctx.measureText(text).width;
    ctx.font = `500 30px "${family}"`;
    const w2 = ctx.measureText(text).width;
    return w1 !== w2;
  }

  _updateWeightControlVisibility(family) {
    const container = document.getElementById('settings-weight-container');
    if (container) container.style.display = this._isVariableFont(family) ? 'block' : 'none';
  }

  _attachEvents() {
    document.getElementById('btn-close-settings').onclick = () => this.unmount();

    const addInputListener = (id, prop, displayId = null, suffix = '') => {
      const input = document.getElementById(id);
      input.addEventListener('input', (e) => {
        this.settings[prop] = e.target.value;
        if (displayId) document.getElementById(displayId).textContent = e.target.value + suffix;
      });
    };

    addInputListener('settings-ctrl-size', 'fontSize', 'settings-val-size', 'px');
    addInputListener('settings-ctrl-stroke', 'strokeWidth', 'settings-val-stroke', 'px');
    addInputListener('settings-ctrl-weight', 'fontWeight', 'settings-val-weight');

    document.getElementById('settings-ctrl-color').onchange = (e) => this.settings.textColor = e.target.value;
    document.getElementById('settings-ctrl-stroke-color').onchange = (e) => this.settings.strokeColor = e.target.value;

    const useBg = document.getElementById('settings-ctrl-use-bg');
    const bgOptions = document.getElementById('settings-bg-options');
    useBg.onchange = (e) => {
      this.settings.useBg = e.target.checked;
      bgOptions.style.display = e.target.checked ? 'grid' : 'none';
    };

    document.getElementById('settings-ctrl-bg-color').onchange = (e) => this.settings.bgColor = e.target.value;
    document.getElementById('settings-ctrl-bg-alpha').oninput = (e) => {
      this.settings.bgAlpha = e.target.value / 100;
      document.getElementById('settings-val-bg-alpha').textContent = e.target.value + '%';
    };

    const ctrlFont = document.getElementById('settings-ctrl-font');
    ctrlFont.onchange = () => {
      this.settings.fontFamily = ctrlFont.value;
      this._updateWeightControlVisibility(ctrlFont.value);
    };

    const ctrlPlaceholder = document.getElementById('settings-ctrl-placeholder');
    ctrlPlaceholder.oninput = () => this.settings.placeholder = ctrlPlaceholder.value;

    const renderModeBtns = document.querySelectorAll('.render-mode-btn');
    renderModeBtns.forEach(btn => {
      btn.onclick = () => {
        this.settings.renderMode = btn.getAttribute('data-mode');
        renderModeBtns.forEach(b => {
          b.style.backgroundPosition = '100% 0';
          b.style.color = '#8b98a5';
        });
        btn.style.backgroundPosition = '0 0';
        btn.style.color = '#1d9bf0';
      };
    });

    document.getElementById('btn-save-settings').onclick = () => {
      const s = this.settings;
      localStorage.setItem('x-text-to-img-fontSize', s.fontSize);
      localStorage.setItem('x-text-to-img-strokeWidth', s.strokeWidth);
      localStorage.setItem('x-text-to-img-textColor', s.textColor);
      localStorage.setItem('x-text-to-img-strokeColor', s.strokeColor);
      localStorage.setItem('x-text-to-img-useBg', s.useBg);
      localStorage.setItem('x-text-to-img-bgColor', s.bgColor);
      localStorage.setItem('x-text-to-img-bgAlpha', s.bgAlpha);
      localStorage.setItem('x-text-to-img-placeholder', s.placeholder);
      localStorage.setItem('x-text-to-img-renderMode', s.renderMode);
      localStorage.setItem('x-text-to-img-fontFamily', s.fontFamily);
      localStorage.setItem('x-text-to-img-fontWeight', s.fontWeight);
      this.unmount();
    };
  }
}