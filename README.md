

# <img src="./public/icon-128.png" width="32" alt="MindEchoS Icon">  MindEchoS      

AI-powered knowledge management Chrome extension

![Chrome](https://img.shields.io/badge/Chrome-138%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)


## 🌟 Features

- **Effortless Capture**: 
  - Right-click, keyboard shortcut (WIN:`Ctrl+Shift+S`/ MAC:`Cmd+Shift+S`)
  - or Click ➕ Button -> SELECTION / WEBPAGE
- **AI Auto-Summarization**: Chrome Summarizer API generates titles and summaries
- **Context-Aware AI Assistant**: Select cards and use quick actions (Understand, Compare, Quiz, Write)
- **AI Search**: AI-powered search finds cards by meaning, not just keywords
- **Privacy-First**: All processing runs locally using Chrome's built-in Gemini Nano

## 🎬 Demo Video

https://www.youtube.com/watch?v=FmjwWfoiFgI

## 🚀 Installation 

### Option 1: Download Release (Recommended - Fastest)

1. **Download** the extension package:
    - Go to [Releases](https://github.com/RubyXZZZ/MindEchoS-chrome-extension/releases/tag/v1.0.0)
    - Download `MindEchoS-v1.0.0.zip`

2. **Install** in Chrome:
    - Unzip the downloaded file
    - Open Chrome → `chrome://extensions/`
    - Enable **Developer mode** (toggle in top right)
    - Click **Load unpacked**
    - Select the unzipped folder
    - Done! Extension is ready to test.

### Option 2: Clone Repository

1. **Clone** this repository:
```
   git clone https://github.com/RubyXZZZ/MindEchoS-chrome-extension.git
```

2. **Install** in Chrome:
   - Open Chrome → `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist` folder from cloned repository
   - Done!
   
## Requirements
- Chrome 138+

⚠️ First Use Note: When using AI features for the first time, Chrome will download the Gemini Nano model

If prompt API is not available, plz check chrome://flags/#prompt-api-for-gemini-nano or check official doc https://developer.chrome.com/docs/ai/prompt-api

## APIs Used
- Chrome Summarizer API
- Chrome Prompt API 
- Chrome Extension APIs (storage, sidePanel, contextMenus, scripting, commands)

## License
MIT License