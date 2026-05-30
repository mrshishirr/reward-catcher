# Reward Catcher

A browser-based receipt scanner that uses OCR to detect receipts in uploaded images, lets you review and select them, then emails them to a destination address via EmailJS.

Live demo: https://mrshishirr.github.io/reward-catcher

---

## What it does

1. **Upload** — drag and drop (or click to select) one or more JPG/PNG images.
2. **Detect** — each image is run through Tesseract.js OCR to determine whether it looks like a receipt.
3. **Review** — a grid shows every uploaded image with its detection result. You can toggle individual images on or off.
4. **Send** — confirmed receipts are emailed to the configured address using EmailJS. Your EmailJS credentials are saved in `localStorage` so you only need to enter them once.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 4 |
| Component library | MUI (Material UI) v5 |
| OCR engine | Tesseract.js 4 |
| Email delivery | EmailJS (`@emailjs/browser`) |
| File drag-and-drop | react-dropzone |
| Deployment | GitHub Pages (`gh-pages`) |

---

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- An [EmailJS](https://www.emailjs.com/) account with a service, template, and public key

---

## Getting started

```bash
# 1. Clone the repository
git clone https://github.com/mrshishirr/reward-catcher.git
cd reward-catcher

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open http://localhost:5173 in your browser.

### EmailJS setup

The app does not use a `.env` file — credentials are entered in the **Email** step of the UI and persisted in your browser's `localStorage`.

You will need:
- **Service ID** — from your EmailJS dashboard → Email Services
- **Template ID** — from EmailJS → Email Templates
- **Public Key** — from EmailJS → Account → API Keys
- **Recipient email** — the address receipts should be sent to

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | Build and publish to GitHub Pages |

---

## Project structure

```
src/
├── components/       # UI steps: AppBar, UploadStep, ReviewStep, EmailStep
├── services/         # receiptDetection.ts, emailService.ts
├── utils/            # imageUtils.ts, storage.ts
├── types/            # Shared TypeScript interfaces
└── App.tsx           # Root component and application state
```

---

## Copyright and developer info

© 2024 mrshishirr. All rights reserved.

GitHub: https://github.com/mrshishirr

This project is provided as-is for personal use. No warranty is expressed or implied.
