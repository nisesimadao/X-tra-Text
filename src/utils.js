const Utils = {
  async copyToClipboard(blob) {
    try {
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
    } catch (err) {
      console.error("クリップボード書き込みエラー:", err);
      throw err;
    }
  },

  async pasteToEditor(blob) {
    const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (editor) {
      editor.focus();

      try {
        const file = new File([blob], "image.png", { type: "image/png" });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });

        editor.dispatchEvent(pasteEvent);
      } catch (err) {
        console.error("貼り付けエラー:", err);
        // フォールバックとして従来の形式も試みる
        document.execCommand('paste');
      }
    }
  },

  clearEditorText() {
    const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (editor) {
      editor.focus();

      const textLength = editor.innerText.length;
      for (let i = 0; i < textLength; i++) {
        const event = new KeyboardEvent('keydown', {
          key: 'Backspace',
          code: 'Backspace',
          keyCode: 8,
          which: 8,
          bubbles: true,
          cancelable: true
        });
        editor.dispatchEvent(event);
      }

      editor.innerHTML = '';
      editor.textContent = '';
      editor.innerText = '';

      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContentBackward'
      });
      editor.dispatchEvent(inputEvent);
    }
  },

  getEditorText() {
    const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
    return editor ? editor.innerText.trim() : "";
  }
};
