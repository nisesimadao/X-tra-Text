# X-tra Text 
A Chrome extension designed to beautifully and smartly bypass X (Twitter)'s 140-character limit.
Instantly convert long posts into images.

[日本語版 README はこちら](README-ja.md)

## Key Features
- **Automatic Image Generation**: Convert long text exceeding 140 characters into an image and copy it to your clipboard with a single click.
- **Smart Auto-Adjustment**: Automatically suggests the optimal font size and alignment (center/left) based on character count.
- **Background Customization**: Set solid colors or upload your favorite images as backgrounds.
- **Glassmorphism Effect**: Overlay a semi-transparent layer on background images to maintain readability while creating a stylish aesthetic.
- **Real-time Editing**: Instantly preview changes to font size and outlines using sliders.
- **Settings**: Customize various options to suit your preferences.

## How to Use (Installation via Developer Mode)
Please follow these steps for manual installation:

1. Clone this repository or download and extract the ZIP file.
2. Open `chrome://extensions/` in Google Chrome.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the extracted folder.
5. Open X (x.com) and click the new "Image Icon" in the post composer to start!

## Tech Stack
- **Language**: JavaScript (Vanilla JS)
- **Engine**: Canvas API (High-DPI support with 2x scale)
- **Architecture**:
  - `renderer.js`: High-resolution rendering engine
  - `ui.js`: Editor UI featuring Glassmorphism
  - `utils.js`: Clipboard and editor operation utilities

## Contributing & Feedback
Contributions in any form—bug reports, feature requests, or pull requests—are welcome!

- "I want background presets with this kind of design"
- "I want emojis to be displayed more beautifully"
- "I want to refactor the code to be cleaner"

Any feedback, no matter how small, is appreciated. Feel free to create an Issue or submit a PR.
Let's grow this tool together!

## ライセンス
MIT License

Designed by Naikaku.
