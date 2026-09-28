# X-tra Text

X-tra Text is a Chrome extension for turning long X (Twitter) posts into images.
It can render text beyond the normal post-length limit and copy the generated image to the clipboard.

[日本語版 README](README-ja.md)

## Key Features

- **Image generation**: render long text as an image and copy it to the clipboard.
- **Automatic layout adjustment**: choose font size and center or left alignment based on the amount of text.
- **Background customization**: use a solid color or an uploaded image as the background.
- **Translucent overlay**: place a semi-transparent layer over image backgrounds to preserve text readability.
- **Live editing**: preview font-size and outline changes while adjusting the controls.
- **Settings**: configure the available rendering and display options.

## Install in Developer Mode

1. Clone this repository, or download and extract the ZIP archive.
2. Open `chrome://extensions/` in Google Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted directory.
5. Open X (`x.com`) and use the image button added to the post composer.

## Tech Stack

- **Language**: JavaScript (Vanilla JS)
- **Rendering**: Canvas API with 2× scaling for high-DPI output
- **Architecture**:
  - `renderer.js`: image rendering
  - `ui.js`: editor UI
  - `utils.js`: clipboard and editor utilities

## Contributing

Bug reports, feature requests, and pull requests are welcome.
Please open an Issue or PR with enough detail to reproduce a problem or explain the proposed change.

## License

MIT License

Designed by Naikaku.
