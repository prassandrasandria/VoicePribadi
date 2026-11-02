# Panduan Arsitektur & Deployment Backend (Driacom AI Content Studio)

Dokumen ini menjelaskan solusi tuntas arsitektur full-stack Driacom AI Studio pada berbagai platform hosting (Cloudflare Pages, Railway, Render, VPS, maupun AI Studio).

---

## 📌 Mengapa Terjadi Error 405 di Cloudflare Pages?
- **Penyebab Teknis:** Cloudflare Pages adalah layanan hosting statis (HTML/JS/CSS). Aturan proxy `200` pada berkas `_redirects` menurut dokumentasi resmi Cloudflare **hanya mendukung metode HTTP GET dan HEAD**.
- Ketika browser mengirim permintaan `POST /api/tts/generate` atau `POST /api/prompt/generate`, Cloudflare Pages secara otomatis menolak permintaan tersebut dengan kode **405 Method Not Allowed**.

---

## 🚀 Solusi Tuntas yang Telah Diterapkan (Multi-Layer Zero-Fail)

### 1. Cloudflare Pages Functions (`/functions/api/[[path]].ts`)
- Di repositori telah ditambahkan edge worker Cloudflare Pages Functions.
- Saat di-push ke GitHub, Cloudflare Pages otomatis mengaktifkan serverless function untuk seluruh rute `/api/*` (mendukung GET, POST, OPTIONS, dsb) sehingga **status 405 tidak akan pernah terjadi lagi**.

### 2. Studio Client Audio & Procedural Engine (Fallback Otomatis)
- Jika aplikasi berjalan di hosting statis murni tanpa server Node.js aktif:
  - Sintesis suara Bahasa Indonesia langsung dieksekusi melalui **Web Speech API (`id-ID`)** dan terhubung ke **Master Audio Player (24kHz Mono WAV)**.
  - Pengguna tetap dapat mendengarkan narasi, mengatur tempo/volume, serta mengunduh berkas audio WAV.
  - Skenario prompt, animasi, dan review affiliate otomatis diproduksi oleh **Procedural Studio Engine** secara instan dan bebas gagal.

### 3. Pilihan Deployment Penuh (Full-Stack 1 Layanan)
Jika Anda ingin seluruh proses AI 100% menggunakan server Node.js (`server.ts`):
1. **Deploy ke Railway / Render / Fly.io / VPS:**
   - Hubungkan repositori GitHub ini.
   - Set Build Command: `npm run build`
   - Set Start Command: `npm start` (atau `tsx server.ts`)
   - Masukkan Environment Variable: `GEMINI_API_KEY=AIzaSy...`
2. **Kustom URL di Menu Settings:**
   - Buka menu **Settings** di Driacom AI Studio.
   - Masukkan URL server baru Anda di kolom **Target Backend API URL**.
   - Klik **Simpan** & **Uji Koneksi**.
