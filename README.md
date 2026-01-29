
# 🧭 Bookmark Manager Extension

A lightweight browser extension to **add, edit, organize, and export/import bookmarks** — featuring a compact popup UI with **folder support**, **tags**, and **drag-and-drop reordering**.

---

## 🚀 Features

* 📑 Add, edit, and delete bookmarks (title, URL, description, tags)
* 🗂 Organize bookmarks into folders: create, rename, delete
* ↕️ Drag & drop to reorder bookmarks or move them between folders
* 📥 Import bookmarks from standard HTML bookmark files
* 📤 Export bookmarks as an HTML file
* 💾 Persistent storage using `chrome.storage.local` (with fallback to `localStorage`)
* 🧩 Responsive, accessible UI with list/grid toggle
* 🔍 Real-time search filter for bookmarks and folders
* 🌙 Dark, modern gradient-based theme

---

## 📁 Files of Interest

| File                                  | Description                              |
| ------------------------------------- | ---------------------------------------- |
| `manifest.json`                       | Extension manifest (Manifest V3)         |
| `popup.html`, `popup.css`, `popup.js` | Popup UI & logic                         |
| `background.js`                       | Background service worker                |
| `LICENSE`                             | MIT License (free use & credit required) |
| `README.md`                           | This documentation file                  |

---

## 🧰 Installation (Developer Mode)

1. **Clone or download** this repository:

   ```bash
   git clone https://github.com/<your-username>/bookmark-manager-extension.git
   ```
2. Open **Chrome** or **Edge**, then go to:

   ```
   chrome://extensions
   ```
3. Enable **Developer mode** (toggle at top right).
4. Click **Load unpacked** → select your project folder

   ```
   e:\new\bookmark-manager-extension
   ```
5. Click the **Bookmark Manager Extension** icon to open the popup.

---

## 🧭 Usage

* 📝 **Add Bookmark:** Fill the form and click “Add Bookmark”.
* 🌐 **Use Current Page:** Prefills title and URL (requires `tabs` permission).
* 🗂 **Folders:** Create new ones, rename or delete using folder pills.
* 🪄 **Reordering:** Drag bookmarks to reorder or move into folders.
* 💾 **Import / Export:**

  * Import bookmarks from `.html` files
  * Export bookmarks to `.html` format for backup

---

## ⚙️ Development Guide

### Setup

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/bookmark-manager-extension.git
git push -u origin main
```

### Local Testing

* Load the unpacked extension in Chrome (as above).
* Use DevTools to debug popup behavior.

---

## 🧪 Testing & Debugging

* **Inspect Popup:** Right-click popup → Inspect → DevTools
* **Check Storage:**

  * DevTools → Application → Storage → Extensions → `chrome.storage.local`
* **Common Issues:**

  * Missing element IDs in HTML → `popup.js` console errors
  * Tabs API won’t work on restricted Chrome pages (like `chrome://` or Web Store)

---

## 🌐 Publishing

### GitHub

* Push your repo to GitHub.
* (Optional) Enable **GitHub Pages** for static preview or documentation.

### Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Create a developer account.
3. Zip your extension folder.
4. Upload → Add description, screenshots, and publish.

---

## 🔒 Security & Privacy

* Only uses `storage` and `tabs` permissions.
* All bookmarks are stored **locally in the browser**.
* No external API calls or telemetry — 100% private.

---

## 💻 Tech Stack

* HTML5
* CSS3 (Modern gradient, glassmorphism, responsive layout)
* Vanilla JavaScript (ES6+)
* Chrome Extension Manifest V3

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Open a Pull Request

> 💬 Suggestions, UI improvements, and feature ideas are welcome!

---

## 🧾 License

This project is licensed under the **MIT License**.
See the [`LICENSE`](./LICENSE) file for full details.
You are free to use, modify, and distribute this project with proper credit.

---



## 📬 Contact / Support

**Developer:** [Pankaj Adhikari](mailto:pankajadhikari820@gmail.com)
**GitHub Issues:** [Open a new issue] https://github.com/pankajadhikari820/Bookmark-Manager-Extension/issues


---

