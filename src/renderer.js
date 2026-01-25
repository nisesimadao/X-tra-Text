class ImageRenderer {
  constructor(canvasId) {
    this.canvasId = canvasId;
  }

  get canvas() {
    const el = document.getElementById(this.canvasId);
    if (!el) {
      console.error(`Error: Canvas要素(ID: ${this.canvasId})が見つかりません！`);
    }
    return el;
  }

  render(config) {
    const canvas = this.canvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // プレースホルダー表示処理
    let text = config.text || "";
    const isPlaceholder = text.trim() === "";
    if (isPlaceholder) {
      text = config.placeholder || "ここにテキストを入力してください...";
    }

    const scale = config.scaleFactor || 2.0;
    const baseWidth = config.baseWidth || 1200;

    const width = baseWidth * scale;
    const fontSize = config.fontSize * scale;
    const strokeWidth = config.strokeWidth * scale;
    const lineHeight = fontSize * 1.3;
    const padding = 60 * scale;
    const align = config.textAlign || "left";

    const MAX_HEIGHT = 4096;

    const fontFamily = config.fontFamily || "Arial";
    const fontWeight = config.fontWeight || "800";
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    const words = text.split('');
    let line = '';
    const lines = [];
    const maxWidth = width - (padding * 2);

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      if (words[n] === '\n' || (metrics.width > maxWidth && n > 0)) {
        lines.push(line);
        line = words[n] === '\n' ? '' : words[n];
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    let height = (lines.length * lineHeight) + (padding * 2);

    let isClipped = false;
    if (height > MAX_HEIGHT) {
      height = MAX_HEIGHT;
      isClipped = true;
    }

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = (width / scale) + "px";
    canvas.style.height = "auto";

    if (config.bgImage) {
      return this._renderWithBgImage(ctx, width, height, config);
    } else if (config.useBg) {
      // bgAlphaが設定されている場合はそれを使用、なければ1（完全不透明）
      const bgAlpha = config.bgAlpha !== undefined ? config.bgAlpha : 1;
      // HEX色をrgbaに変換
      const rgb = this._hexToRgb(config.bgColor);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgAlpha})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    this._renderText(ctx, width, height, config, fontSize, strokeWidth, padding, lineHeight, lines);

    if (isClipped) {
      ctx.fillStyle = "rgba(255, 50, 50, 0.8)";
      ctx.fillRect(0, height - 20, width, 20);
    }

    return canvas;
  }

  _renderWithBgImage(ctx, width, height, config) {
    const img = new Image();
    img.src = config.bgImage;

    return new Promise((resolve) => {
      img.onload = () => {
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
          drawHeight = height;
          drawWidth = img.width * (height / img.height);
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = width;
          drawHeight = img.height * (width / img.width);
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // ガラス効果: 半透明の白いレイヤーを上から被せる
        ctx.globalAlpha = config.bgOpacity;
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1.0; // 不透明度をリセット

        // テキスト描画
        const fontSize = config.fontSize * (config.scaleFactor || 2.0);
        const strokeWidth = config.strokeWidth * (config.scaleFactor || 2.0);
        const padding = 60 * (config.scaleFactor || 2.0);
        const lineHeight = fontSize * 1.3;

        // 再計算が必要なので、lines配列を再構築
        let text = config.text || "";
        // プレースホルダー表示処理
        if (text.trim() === "") {
          text = config.placeholder || "ここにテキストを入力してください...";
        }
        const baseWidth = config.baseWidth || 1200;
        const scale = config.scaleFactor || 2.0;
        const maxWidth = width - (padding * 2);

        const fontFamily = config.fontFamily || "Arial";
        const fontWeight = config.fontWeight || "800";
        ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

        const words = text.split('');
        let line = '';
        const lines = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n];
          const metrics = ctx.measureText(testLine);
          if (words[n] === '\n' || (metrics.width > maxWidth && n > 0)) {
            lines.push(line);
            line = words[n] === '\n' ? '' : words[n];
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        this._renderText(ctx, width, height, config, fontSize, strokeWidth, padding, lineHeight, lines);

        // 高さ制限チェック
        const MAX_HEIGHT = 4096;
        const calculatedHeight = (lines.length * lineHeight) + (padding * 2);
        if (calculatedHeight > MAX_HEIGHT) {
          ctx.fillStyle = "rgba(255, 50, 50, 0.8)";
          ctx.fillRect(0, height - 20, width, 20);
        }

        resolve(this.canvas);
      };

      img.onerror = () => {
        console.error("背景画像の読み込みに失敗しました");
        if (config.useBg) {
          ctx.fillStyle = config.bgColor;
          ctx.fillRect(0, 0, width, height);
        } else {
          ctx.clearRect(0, 0, width, height);
        }
        resolve(this.canvas);
      };
    });
  }

  _renderText(ctx, width, height, config, fontSize, strokeWidth, padding, lineHeight, lines) {
    const align = config.textAlign || "left";
    const fontFamily = config.fontFamily || "Arial";
    const fontWeight = config.fontWeight || "800";
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.textAlign = align;

    let x;
    if (align === 'center') x = width / 2;
    else if (align === 'right') x = width - padding;
    else x = padding;

    let y = padding;
    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > height) break;

      if (strokeWidth > 0) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = config.strokeColor;
        ctx.strokeText(lines[i], x, y);
      }
      ctx.fillStyle = config.textColor;
      ctx.fillText(lines[i], x, y);
      y += lineHeight;
    }
  }

  async toBlob() {
    const canvas = this.canvas;

    if (!canvas) {
      console.error("toBlob失敗: Canvas要素が存在しません");
      return null;
    }

    if (canvas.width === 0 || canvas.height === 0) {
      console.error("toBlob失敗: Canvasのサイズが0です");
      return null;
    }

    // Xの透過PNG安定化のため、長辺を900px以内にリサイズする
    const MAX_X_DIM = 900;
    let targetCanvas = canvas;

    if (canvas.width > MAX_X_DIM || canvas.height > MAX_X_DIM) {
      const offscreen = document.createElement('canvas');
      const ratio = Math.min(MAX_X_DIM / canvas.width, MAX_X_DIM / canvas.height);
      offscreen.width = canvas.width * ratio;
      offscreen.height = canvas.height * ratio;
      const oCtx = offscreen.getContext('2d');
      oCtx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
      targetCanvas = offscreen;
    }

    return new Promise(resolve => {
      targetCanvas.toBlob((blob) => {
        if (!blob) {
          console.error("toBlob失敗: Blob生成がnullを返しました");
        }
        resolve(blob);
      }, 'image/png', 1.0);
    });
  }

  _hexToRgb(hex) {
    // #RRGGBB形式をRGB値に変換
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
