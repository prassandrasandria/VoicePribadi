import React, { useState, useRef } from 'react';
import {
  Video,
  Upload,
  Link as LinkIcon,
  FileText,
  Sparkles,
  Copy,
  Download,
  Check,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  HelpCircle,
  Clock,
  Mic2,
  Share2,
  Film,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { VideoExtractionResult, VideoSubtitleSegment } from '../types';

interface VideoToTextViewProps {
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onSendToVoiceOver: (text: string) => void;
  onSaveToProject?: (item: any) => void;
}

export const VideoToTextView: React.FC<VideoToTextViewProps> = ({
  onNotify,
  onSendToVoiceOver,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'url' | 'sosmed'>('upload');

  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL States
  const [videoUrl, setVideoUrl] = useState<string>('');

  // Processing States
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractionResult, setExtractionResult] = useState<VideoExtractionResult | null>(null);

  // Results View Tab
  const [activeResultTab, setActiveResultTab] = useState<'timeline' | 'script' | 'summary'>('timeline');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Video playback ref for timestamp clicking
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file) return;

    // Check size limit: 45MB
    if (file.size > 45 * 1024 * 1024) {
      onNotify('error', 'File Terlalu Besar', 'Batas maksimal ukuran video/audio saat ini adalah 45MB.');
      return;
    }

    setSelectedFile(file);
    if (previewVideoUrl) {
      URL.revokeObjectURL(previewVideoUrl);
    }
    const localUrl = URL.createObjectURL(file);
    setPreviewVideoUrl(localUrl);
    onNotify('info', 'File Siap', `Berkas ${file.name} siap untuk diekstrak teksnya.`);
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // 1. Process Uploaded File
  const handleExtractUploadedFile = async () => {
    if (!selectedFile) {
      onNotify('error', 'Pilih File', 'Silakan pilih atau seret berkas video terlebih dahulu.');
      return;
    }

    setLoading(true);
    setStatusMessage('Membaca berkas dan mengunggah ke AI Gemini Multimodal...');

    try {
      const base64Data = await fileToBase64(selectedFile);
      setStatusMessage('AI Gemini sedang mendengarkan dan mentranskripsi percakapan video...');

      const response = await fetch('/api/video-to-text/extract-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoData: base64Data,
          mimeType: selectedFile.type || 'video/mp4',
          fileName: selectedFile.name,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengekstrak teks dari video.');
      }

      setExtractionResult(json.data);
      onNotify('success', 'Ekstraksi Berhasil', `Transkripsi dari ${selectedFile.name} berhasil dibuat.`);
      setActiveResultTab('timeline');
    } catch (err: any) {
      onNotify('error', 'Gagal Ekstraksi', err.message || 'Terjadi kesalahan saat memproses video.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // 2. Process Video URL / YouTube
  const handleExtractUrl = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || videoUrl).trim();

    if (!targetUrl) {
      onNotify('error', 'Masukkan Tautan', 'Silakan tempelkan tautan video YouTube atau URL media.');
      return;
    }

    setLoading(true);
    setStatusMessage('Mengakses tautan video dan memeriksa subtitle/transkrip...');

    try {
      const response = await fetch('/api/video-to-text/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        if (json.isSocialMedia) {
          onNotify('info', `Tautan ${json.platform}`, json.guidance || json.error);
          return;
        }
        if (json.noCaptions) {
          onNotify('info', 'Subtitle Belum Tersedia', json.guidance || json.error);
          return;
        }
        throw new Error(json.error || 'Gagal mengekstrak video dari tautan.');
      }

      setExtractionResult(json.data);
      onNotify('success', 'Ekstraksi Berhasil', `Teks berhasil diekstrak dari "${json.data.title}".`);
      setActiveResultTab('timeline');
    } catch (err: any) {
      onNotify('error', 'Gagal Ekstraksi', err.message || 'Terjadi kendala saat membaca tautan.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // Seek video player to specific second
  const handleSeekVideo = (seconds: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = seconds;
      videoPlayerRef.current.play().catch(() => {});
    }
  };

  // Copy helpers
  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    onNotify('success', 'Disalin ke Clipboard', 'Teks berhasil disalin.');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Download TXT
  const handleDownloadTxt = () => {
    if (!extractionResult) return;
    const content = `JUDUL: ${extractionResult.title}
SUMBER: ${extractionResult.sourceType}
DURASI: ${extractionResult.durationFormatted || 'N/A'}
TANGGAL: ${new Date(extractionResult.createdAt).toLocaleString('id-ID')}

=== RINGKASAN INTISARI ===
${extractionResult.summary}

=== POIN-POIN PENTING ===
${(extractionResult.keyTakeaways || []).map((p, i) => `${i + 1}. ${p}`).join('\n')}

=== TRANSKRIP LENGKAP BERTANDA WAKTU ===
${extractionResult.fullTranscript}

=== NASKAH BERSIH SIAP SULIH SUARA (VOICE OVER) ===
${extractionResult.cleanVoiceOverScript}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transkrip_${extractionResult.title.slice(0, 30).replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('success', 'Unduhan Berhasil', 'Berkas TXT transkrip telah diunduh.');
  };

  // Download SRT (SubRip Subtitle format)
  const handleDownloadSrt = () => {
    if (!extractionResult || !extractionResult.segments) return;

    const formatSrtTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    let srtContent = '';
    extractionResult.segments.forEach((seg, idx) => {
      srtContent += `${idx + 1}\n`;
      srtContent += `${formatSrtTime(seg.startSeconds)} --> ${formatSrtTime(seg.endSeconds)}\n`;
      srtContent += `${seg.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'application/x-subrip;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitle_${extractionResult.title.slice(0, 30).replace(/\s+/g, '_')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('success', 'Subtitle SRT Diunduh', 'Berkas .SRT siap diimpor ke CapCut / Premiere.');
  };

  // Filtered segments based on search
  const filteredSegments = (extractionResult?.segments || []).filter((seg) =>
    seg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-emerald-950/40 border border-slate-800/80 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekstraksi AI Video ke Teks (Multimodal Gemini)</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Ekstrak Suara Video Menjadi Naskah & Teks
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ubah percakapan dari video menjadi transkrip bertimestamp, naskah narasi bersih, dan ringkasan intisari. Hasil ekstraksi dapat langsung dikirim ke <strong>Studio Voice Over</strong> untuk diisi suara kembali!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-cyan-400 bg-slate-900/90 border border-cyan-800/40 px-3 py-1.5 rounded-xl shadow-inner">
              Gemini 3.5 & 3.8
            </span>
          </div>
        </div>

        {/* Navigation Tabs between Upload, URL, and Sosmed Info */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveInputTab('upload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeInputTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Unggah Berkas Video / Audio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInputTab('url')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeInputTab === 'url'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Tautan YouTube & Media URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInputTab('sosmed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeInputTab === 'sosmed'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4 text-rose-400" />
            <span>Media Sosial (TikTok / Reels / IG)</span>
          </button>
        </div>
      </div>

      {/* Input Section Card */}
      <div className="rounded-2xl bg-[#0b101d] border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-4">
        {/* TAB 1: UPLOAD FILE */}
        {activeInputTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-700/80 bg-slate-900/40 hover:border-indigo-500/60 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.mp3,.wav,.m4a"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shadow-inner">
                {selectedFile ? <Film className="w-7 h-7 text-emerald-400" /> : <Upload className="w-7 h-7" />}
              </div>

              <div>
                <span className="text-sm sm:text-base font-bold text-white block">
                  {selectedFile ? selectedFile.name : 'Pilih atau Seret (Drag & Drop) Berkas Video ke Sini'}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Format: ${selectedFile.type || 'Media'}`
                    : 'Mendukung MP4, WebM, MOV, MKV, MP3, M4A, WAV (Maksimal 45MB)'}
                </span>
              </div>

              {!selectedFile && (
                <span className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm">
                  Cari Berkas di Perangkat
                </span>
              )}
            </div>

            {/* Video Player Preview if uploaded */}
            {previewVideoUrl && selectedFile?.type.startsWith('video/') && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">
                  Pratinjau Video Pemutar:
                </span>
                <div className="relative aspect-video max-h-[300px] w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoPlayerRef}
                    src={previewVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleExtractUploadedFile}
                disabled={loading || !selectedFile}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition transform active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{statusMessage || 'Mengekstrak Teks Video...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Mulai Ekstrak Teks (AI Multimodal)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: URL / YOUTUBE */}
        {activeInputTab === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Tempelkan Tautan YouTube atau URL Media Langsung
              </label>
              <div className="relative flex items-center">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/... atau URL video .mp4"
                  className="w-full pl-10 pr-24 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition"
                />
                <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5" />
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    className="absolute right-3 text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Mendukung video YouTube standar, YouTube Shorts, serta link direct media video (.mp4, .webm).
              </p>
            </div>

            {/* Quick Test Links */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="text-slate-500">Coba Tautan Contoh:</span>
              <button
                type="button"
                onClick={() => {
                  setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                  handleExtractUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 transition cursor-pointer"
              >
                Klip Musik Populer
              </button>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleExtractUrl()}
                disabled={loading || !videoUrl.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition transform active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{statusMessage || 'Mengekstrak Teks Video...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Ekstrak Teks dari Tautan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PANDUAN MEDIA SOSIAL (TIKTOK / REELS / IG) */}
        {activeInputTab === 'sosmed' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs sm:text-sm">
                <Share2 className="w-4 h-4 text-rose-400" />
                <span>Apakah bisa mengambil video langsung dari link TikTok / Instagram?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Platform media sosial (seperti <strong>TikTok, Instagram Reels, X/Twitter, dan Facebook</strong>) menerapkan sistem proteksi bot dan pembatasan login (*login-wall / anti-scraping*) yang ketat sehingga tautan publik mereka memblokir server eksternal untuk mengunduh video secara langsung tanpa izin akun.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white block">
                Solusi Praktis & Tercepat untuk TikTok & Instagram:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                  <span className="text-xs font-bold text-slate-200 block">Unduh Video</span>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Simpan video dari TikTok atau Instagram ke galeri HP atau komputer Anda.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-200 block">Seret Berkas ke Sini</span>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Buka tab <strong>"Unggah Berkas Video"</strong> di samping lalu drag & drop berkas videonya.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-200 block">Ekstraksi Seketika</span>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    AI Gemini akan mendengarkan percakapan video dan langsung menghasilkan teks lengkap serta naskah bersih!
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveInputTab('upload')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Buka Tab Unggah Video Sekarang</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-center space-y-3 shadow-xl animate-in fade-in">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <h3 className="text-base font-bold text-white">AI Sedang Mengekstrak Percakapan Video</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            {statusMessage || 'Sedang mendengarkan audio, mendeteksi intonasi kalimat, dan menyusun transkrip berwaktu...'}
          </p>
        </div>
      )}

      {/* EXTRACTION RESULTS CARD */}
      {extractionResult && (
        <div className="rounded-2xl bg-[#0c1222] border border-slate-800/90 p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Result Header & Metadata */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 uppercase">
                  Sumber: {extractionResult.sourceType}
                </span>
                {extractionResult.durationFormatted && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    Durasi: {extractionResult.durationFormatted}
                  </span>
                )}
                {extractionResult.language && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                    Bahasa: {extractionResult.language}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                {extractionResult.title}
              </h3>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Unduh Teks Transkrip (.TXT)"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Unduh TXT</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSrt}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Unduh Subtitle SubRip (.SRT) untuk CapCut/Premiere"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unduh SRT</span>
              </button>

              {/* ⭐ Primary Action: Send to Voice Over Studio */}
              <button
                type="button"
                onClick={() => {
                  onSendToVoiceOver(extractionResult.cleanVoiceOverScript || extractionResult.fullTranscript);
                  onNotify('success', 'Naskah Dipindahkan', 'Naskah video telah siap di Studio Voice Over!');
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition transform active:scale-95 cursor-pointer"
              >
                <Mic2 className="w-3.5 h-3.5 text-white" />
                <span>Kirim ke Studio Voice Over</span>
              </button>
            </div>
          </div>

          {/* Results Tabs: Timeline, Clean Script, Summary */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <button
              type="button"
              onClick={() => setActiveResultTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'timeline'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Transkrip Bertimestamp ({extractionResult.segments?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveResultTab('script')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'script'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Naskah Bersih Voice Over</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveResultTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'summary'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ringkasan & Intisari</span>
            </button>
          </div>

          {/* TAB CONTENT 1: TIMELINE WITH INTERACTIVE TIMESTAMPS */}
          {activeResultTab === 'timeline' && (
            <div className="space-y-3">
              {/* Search bar inside segments */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari kata di transkrip..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyText(extractionResult.fullTranscript, 'full')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedType === 'full' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'full' ? 'Tersalin' : 'Salin Semua'}</span>
                </button>
              </div>

              {/* Segments List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredSegments.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">Tidak ada kalimat yang sesuai pencarian.</p>
                ) : (
                  filteredSegments.map((seg) => (
                    <div
                      key={seg.id}
                      onClick={() => handleSeekVideo(seg.startSeconds)}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-850 transition flex items-start gap-3 cursor-pointer group"
                    >
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0 mt-0.5 flex items-center gap-1"
                        title="Klik untuk memutar video dari detik ini"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{seg.start}</span>
                      </button>

                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1">
                        {seg.text}
                      </p>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(seg.text, seg.id);
                        }}
                        className="text-slate-500 hover:text-white p-1 transition"
                        title="Salin kalimat ini"
                      >
                        {copiedType === seg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: CLEAN SCRIPT (SIAP VOICE OVER) */}
          {activeResultTab === 'script' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-700/40 flex items-center justify-between gap-3 text-xs text-indigo-200">
                <div className="flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Naskah ini telah dibersihkan dari kata terbata-bata atau jeda kosong, siap untuk diisi suara ulang (voice-over).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(extractionResult.cleanVoiceOverScript, 'clean')}
                  className="px-2.5 py-1 rounded bg-indigo-600/60 hover:bg-indigo-600 text-[10px] font-bold text-white transition shrink-0"
                >
                  {copiedType === 'clean' ? 'Tersalin' : 'Salin Naskah'}
                </button>
              </div>

              <textarea
                readOnly
                value={extractionResult.cleanVoiceOverScript}
                rows={10}
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed outline-none"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onSendToVoiceOver(extractionResult.cleanVoiceOverScript);
                    onNotify('success', 'Naskah Dipindahkan', 'Naskah siap diisi suara di Studio Voice Over!');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Mic2 className="w-4 h-4" />
                  <span>Buka Naskah Ini di Studio Voice Over</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: SUMMARY & KEY TAKEAWAYS */}
          {activeResultTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                  Ringkasan Eksekutif
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {extractionResult.summary}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  Poin-Poin Intisari
                </span>
                <ul className="space-y-1.5">
                  {(extractionResult.keyTakeaways || []).map((point, i) => (
                    <li key={i} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
