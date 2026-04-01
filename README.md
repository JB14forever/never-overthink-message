# 💬 Never Overthink a Message Again

> **AI-powered message generator** — craft the perfect message for any real-life situation in seconds.

![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Powered by OpenAI](https://img.shields.io/badge/powered%20by-OpenAI-412991?style=flat-square&logo=openai)
![Deployed on Vercel](https://img.shields.io/badge/backend-Vercel-black?style=flat-square&logo=vercel)
![Hosted on GitHub Pages](https://img.shields.io/badge/frontend-GitHub%20Pages-222?style=flat-square&logo=github)

---

## 🧠 What Is This?

We've all been there — staring at a blank message box for 10 minutes trying to figure out *exactly* what to say.

**Never Overthink a Message Again** eliminates that friction. It uses AI to instantly generate three ready-to-send message variations tailored to your situation — whether you're running late, apologizing to your boss, rescheduling with a client, or navigating an awkward conversation.

No login. No database. No overthinking.

---

## ✨ Features

- ⚡ **Instant results** — 3 message variations in under 3 seconds
- 🎭 **3 styles every time** — Professional, Casual, and Smart/Creative
- 🎯 **Fully customizable** — recipient, tone, relationship level, context
- 📋 **One-click copy** — copy any message straight to your clipboard
- 🔐 **Private & secure** — no data stored, API key never exposed
- 📱 **Mobile-first** — works beautifully on any screen size
- 🆓 **Free to use** — powered by affordable AI models

---

## 🎯 Use Cases

| Situation | Example |
|---|---|
| Running late | "I'm stuck in traffic and will be 20 mins late to the meeting" |
| Missed a deadline | "I missed the project submission due to an emergency" |
| Rescheduling | "Can we move tomorrow's call to next week?" |
| Awkward follow-up | "I haven't heard back and wanted to check in" |
| Apology to boss | "I forgot to reply to an important client email" |
| Cancelling plans | "Something came up last minute and I can't make it" |

---

## 🧩 How It Works

1. **Fill in the form** — describe your situation, pick the recipient, tone, and relationship level
2. **Click Generate** — the app sends your inputs to a secure backend
3. **Get 3 messages** — Professional, Casual, and Smart variations appear instantly
4. **Copy & send** — hit the copy button and paste into WhatsApp, email, Slack, anything

---

## 🎨 Input Options

| Field | Options |
|---|---|
| **Recipient** | Boss, Teacher, Friend, Family, Client, Other |
| **Tone** | Professional, Casual, Apologetic, Urgent, Neutral |
| **Relationship** | Formal, Semi-formal, Close |
| **Context** | Free text (optional) |
| **Include Explanation** | Yes / No toggle |

---

## 🏗️ Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│   Frontend (GitHub Pages)   │  POST  │   Backend (Vercel Function)  │
│                             │───────▶│                              │
│  • HTML + Tailwind CSS      │        │  • Input validation          │
│  • Vanilla JavaScript       │        │  • Prompt injection guard    │
│  • No API key               │◀───────│  • Rate limiting (10 req/min)│
│  • No backend logic         │  JSON  │  • OpenAI API call           │
└─────────────────────────────┘        │  • Returns 3 variations      │
                                       └──────────────────────────────┘
```

**Key principle:** The API key lives *only* in Vercel's encrypted environment variables. It never touches the frontend code.

---

## 🔐 Security

| Feature | Implementation |
|---|---|
| API key protection | Stored only in Vercel env vars, never in frontend |
| CORS | Restricted to the GitHub Pages domain |
| Rate limiting | 10 requests/minute per IP (in-memory) |
| Input validation | Required fields, 500 character max |
| Prompt injection | Banned phrases detected and sanitized |
| Request size | 5KB hard limit |
| Sensitive logging | Disabled — no user input is logged |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Tailwind CSS (CDN), Vanilla JavaScript |
| Backend | Vercel Serverless Functions (Node.js) |
| AI | OpenAI `gpt-4o-mini` |
| Hosting (frontend) | GitHub Pages |
| Hosting (backend) | Vercel |

---

## 📁 Project Structure

```
never-overthink-message/
├── index.html          ← Complete single-page frontend
├── vercel.json         ← Vercel routing configuration
├── api/
│   └── generate.js     ← Serverless backend function
└── README.md           ← You are here
```

---

## 🚀 Self-Hosting Guide

### Prerequisites
- [GitHub account](https://github.com)
- [Vercel account](https://vercel.com) (free)
- [OpenAI API key](https://platform.openai.com/api-keys) (~$5 free credits on signup)

### 1. Fork & Clone

```bash
git clone https://github.com/JB14forever/never-overthink-message.git
cd never-overthink-message
```

### 2. Deploy Backend to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add your environment variable:
```bash
vercel env add OPENAI_API_KEY
# Paste your key when prompted

vercel env add ALLOWED_ORIGIN
# Enter your GitHub Pages URL: https://JB14forever.github.io
```

Redeploy to apply env vars:
```bash
vercel --prod
```

### 3. Update the API URL

In `index.html`, find and replace:
```js
const API_URL = 'https://YOUR-VERCEL-URL.vercel.app/api/generate';
// Replace with your actual Vercel deployment URL
```

### 4. Enable GitHub Pages

Go to your repo → **Settings** → **Pages** → Source: `main` branch, root `/` → Save.

---

## 💡 AI Prompt Design

The system prompt instructs the model to:
- Keep messages **40–120 words** — concise and natural
- Be grounded and realistic — no unethical or extreme excuses
- Match the tone to the recipient type and relationship level
- Output exactly 3 variations in structured JSON format

---

## 📄 License

MIT — free to use, fork, and deploy. No attribution required.

---

## 🙌 Built With

- [OpenAI API](https://platform.openai.com) — AI backbone
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Vercel](https://vercel.com) — serverless backend
- [GitHub Pages](https://pages.github.com) — frontend hosting
