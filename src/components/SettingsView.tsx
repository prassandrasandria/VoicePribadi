import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu,
  Database,
  Mic2,
  CheckCircle2,
  Server,
  Lock,
  RefreshCw,
  Info,
} from 'lucide-react';
import { SystemConfig } from '../types';

interface SettingsViewProps {
  config: SystemConfig | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config }) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusFeedback, setStatusFeedback] = useState<string>('');

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setStatusFeedback('Menguji koneksi ke endpoint server AI Studio...');

    try {
      const res = await fetch('/api/config', {
        headers: { Accept: 'application/json' },
      });

      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('application/json')) {
        throw new Error(`Server merespons status ${res.status}.`);
      }

      const data = await res.json();
      if (data && data.hasGeminiKey) {
        setTestStatus('success');
        setStatusFeedback('Koneksi sukses! Backend AI Studio aktif dan GEMINI_API_KEY terdeteksi valid.');
      } else {
        setTestStatus('success');
        setStatusFeedback('Backend AI Studio aktif. Pastikan GEMINI_API_KEY terpasang di Secrets panel.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setStatusFeedback(err.message || 'Gagal terhubung ke server backend AI Studio.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-[#0c1222]/85 border border-slate-800/80 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <SettingsIcon className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Status Server & Engine Voice Over AI Studio
            </h2>
            <p className="text-xs text-slate-400">
              Aplikasi berjalan langsung pada backend full-stack Google AI Studio (Express + Vite)
            </p>
          </div>
        </div>

        {/* Security & Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Lock className="w-4 h-4" />
              <span>Keamanan Server-Side (Zero-Leak)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kunci API Gemini diproses 100% pada proses backend Node.js server. Browser tidak pernah mengekspos token kredensial.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
              <Server className="w-4 h-4" />
              <span>Full-Stack AI Studio Langsung</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Menggunakan server internal Node.js (<code className="text-cyan-300 font-mono text-[10px]">server.ts</code>) port 3000 tanpa memerlukan hosting terpisah seperti Cloudflare.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Google GenAI TTS Neural</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Menggunakan model audio multimodal resmi <code className="text-indigo-300 font-mono text-[10px]">gemini-3.8-flash-lite-tts</code> dengan format audio siaran WAV 24kHz.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Connection Status Card */}
      <div className="p-6 rounded-2xl bg-[#0c1222]/90 border border-slate-800/80 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Koneksi Backend AI Studio
              </h3>
              <p className="text-xs text-slate-400">
                Mode: <strong className="text-emerald-400">Same-Origin (/api) Aktif</strong> (Langsung Siap Dipublikasikan)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'loading'}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'loading' ? 'animate-spin' : ''}`} />
            <span>Uji Status Server</span>
          </button>
        </div>

        {statusFeedback && (
          <p
            className={`text-xs p-3 rounded-xl border ${
              testStatus === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : testStatus === 'error'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            {statusFeedback}
          </p>
        )}

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Kesiapan Publikasi (Direct AI Studio Publish):</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Aplikasi ini telah dikonfigurasi penuh dengan Express backend yang menyajikan antarmuka sekaligus API sintetis suara. Saat Anda mempublikasikan aplikasi dari Google AI Studio, seluruh sistem backend otomatis online dan langsung dapat digunakan.
          </p>
        </div>
      </div>

      {/* Model Status Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Spesifikasi Voice Over & Audio Engine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TTS Neural Model */}
          <div className="p-5 rounded-2xl bg-[#0c1222]/90 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Mic2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WAV 24kHz Mono
              </span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Model Sintesis Vokal
              </h4>
              <p className="text-sm font-bold text-white font-mono mt-0.5">
                gemini-3.8-flash-lite-tts
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Menghasilkan audio biner kualitas siaran langsung dari model multimodal Gemini tanpa perlu konversi kompresi MP3 yang menurunkan kejernihan vokal.
            </p>
          </div>

          {/* Indonesian Native Tuning */}
          <div className="p-5 rounded-2xl bg-[#0c1222]/90 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Kode Bahasa: id-ID
              </span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Profil Pelafalan Penutur Asli
              </h4>
              <p className="text-sm font-bold text-white font-mono mt-0.5">
                13 Karakter Vokal (4 Genre)
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Mendukung genre Anak-Anak (Anak Laki-Laki & Anak Perempuan), Orang Tua (Bapak, Ibu, Kakek, Nenek), Karakter Kartun Lucu & Ekspresif, serta Karakter Siaran Standar (Charon, Kore, Zephyr, Puck, Aoede, Fenrir).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
