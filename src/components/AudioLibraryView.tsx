import React, { useState, useRef } from 'react';
import {
  FolderKanban,
  Search,
  Filter,
  Trash2,
  Copy,
  Download,
  Calendar,
  Mic2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  Music,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { StandaloneAudio, Project, VoiceId, NarrationStyle } from '../types';

interface AudioLibraryViewProps {
  projects: Project[];
  onDeleteAudio: (projectId: string, audioId: string) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToStudio: (textToLoad?: string) => void;
}

export const AudioLibraryView: React.FC<AudioLibraryViewProps> = ({
  projects,
  onDeleteAudio,
  onNotify,
  onNavigateToStudio,
}) => {
  const [search, setSearch] = useState('');
  const [filterVoice, setFilterVoice] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<string>('all');

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Flatten all standaloneAudios across all projects
  const allAudios: { audio: StandaloneAudio; projectId: string; projectTitle: string }[] = [];
  projects.forEach((p) => {
    if (Array.isArray(p.standaloneAudios)) {
      p.standaloneAudios.forEach((audio) => {
        allAudios.push({ audio, projectId: p.id, projectTitle: p.title });
      });
    }
  });

  // Filter audios
  const filtered = allAudios.filter(({ audio }) => {
    const textMatch = audio.text.toLowerCase().includes(search.toLowerCase());
    const voiceMatch = filterVoice === 'all' || audio.voice === filterVoice;
    const styleMatch = filterStyle === 'all' || audio.style === filterStyle;
    return textMatch && voiceMatch && styleMatch;
  });

  const handlePlayToggle = (audioId: string, url: string) => {
    if (!audioRef.current) return;

    if (playingAudioId === audioId) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
        setPlayingAudioId(null);
      }
    } else {
      audioRef.current.src = url;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(console.error);
      setPlayingAudioId(audioId);
    }
  };

  const handleDownloadWav = (url: string, voice: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `driacom_vo_${voice}_${id.slice(-6)}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('info', 'Mengunduh Audio', 'File WAV kualitas siaran sedang diunduh.');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onNotify('success', 'Naskah Disalin', 'Teks narasi berhasil disalin ke clipboard.');
  };

  const handleDelete = async (projectId: string, audioId: string) => {
    setDeletingId(audioId);
    try {
      if (playingAudioId === audioId && audioRef.current) {
        audioRef.current.pause();
        setPlayingAudioId(null);
      }
      await onDeleteAudio(projectId, audioId);
      onNotify('success', 'Audio Dihapus', 'Klip audio berhasil dihapus dari koleksi.');
    } catch (err: any) {
      onNotify('error', 'Gagal Menghapus', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hidden Audio Player element */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudioId(null)}
        onError={() => setPlayingAudioId(null)}
      />

      {/* Header bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0c1222]/85 border border-slate-800/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Koleksi & Riwayat Audio Pribadi</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total tersimpan: <span className="text-cyan-300 font-bold font-mono">{allAudios.length}</span> file audio master WAV
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToStudio()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Voice Over Baru</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-xl bg-[#0c1222]/70 border border-slate-800/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari teks naskah audio..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Filter Voice */}
          <select
            value={filterVoice}
            onChange={(e) => setFilterVoice(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">Semua Karakter Suara</option>
            <optgroup label="👶 Anak-Anak">
              <option value="anak_pria">Anak Laki-Laki (Bocah Ceria)</option>
              <option value="anak_wanita">Anak Perempuan (Gadis Cilik)</option>
            </optgroup>
            <optgroup label="👴👵 Orang Tua / Keluarga">
              <option value="bapak">Bapak (Ayah Bijak & Hangat)</option>
              <option value="ibu">Ibu (Kasih Ibu Penuh Kasih)</option>
              <option value="kakek">Kakek (Lansia Pria Sepuh)</option>
              <option value="nenek">Nenek (Lansia Wanita Penuh Cerita)</option>
            </optgroup>
            <optgroup label="🎭 Kartun & Karakter">
              <option value="kartun">Karakter Kartun (Lucu & Ekspresif)</option>
            </optgroup>
            <optgroup label="🎙️ Standar Siaran">
              <option value="Charon">Charon (Sinematik Dokumenter)</option>
              <option value="Kore">Kore (Artikulatif Naratif)</option>
              <option value="Zephyr">Zephyr (Lembut Storytelling)</option>
              <option value="Puck">Puck (Kasual Energik)</option>
              <option value="Aoede">Aoede (Viral Ceria)</option>
              <option value="Fenrir">Fenrir (Dramatis Horor)</option>
            </optgroup>
          </select>

          {/* Filter Style */}
          <select
            value={filterStyle}
            onChange={(e) => setFilterStyle(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">Semua Gaya</option>
            <option value="dokumenter">Dokumenter</option>
            <option value="natural">Natural</option>
            <option value="energik">Energik</option>
            <option value="edukatif">Edukatif</option>
            <option value="emosional">Emosional</option>
            <option value="promosi">Promosi</option>
          </select>
        </div>
      </div>

      {/* Audio List Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0c1222]/50 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
            <Music className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Belum Ada Audio Tersimpan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {allAudios.length === 0
              ? 'Anda belum memiliki riwayat audio. Buka Studio Voice Over untuk mengetikkan naskah dan menghasilkan audio WAV penutur asli Indonesia.'
              : 'Tidak ada audio yang cocok dengan filter pencarian.'}
          </p>
          {allAudios.length === 0 && (
            <button
              type="button"
              onClick={() => onNavigateToStudio()}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer"
            >
              <Mic2 className="w-4 h-4" />
              <span>Buka Studio Voice Over</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(({ audio, projectId }) => {
            const isPlaying = playingAudioId === audio.id;
            const isDeleting = deletingId === audio.id;

            return (
              <div
                key={audio.id}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                  isPlaying
                    ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border-cyan-400 shadow-xl ring-1 ring-cyan-500/30'
                    : 'bg-[#0c1222]/85 border-slate-800/80 hover:border-slate-700/90'
                }`}
              >
                <div className="space-y-3">
                  {/* Top metadata tags */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <Mic2 className="w-3 h-3" />
                        {audio.voice}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {audio.style}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        WAV 24kHz
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(audio.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Naskah Text Box */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
                    <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed italic">
                      "{audio.text}"
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {audio.text.length} karakter
                    </span>
                  </div>
                </div>

                {/* Bottom Controls Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                  <div className="flex items-center gap-2">
                    {/* Play / Pause Toggle */}
                    <button
                      type="button"
                      onClick={() => handlePlayToggle(audio.id, audio.url)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        isPlaying
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Jeda</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span>Putar</span>
                        </>
                      )}
                    </button>

                    {/* Download WAV */}
                    <button
                      type="button"
                      onClick={() => handleDownloadWav(audio.url, audio.voice, audio.id)}
                      className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                      title="Download Master WAV"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                    </button>

                    {/* Copy Text */}
                    <button
                      type="button"
                      onClick={() => handleCopyText(audio.text, audio.id)}
                      className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                      title="Salin Naskah Teks"
                    >
                      {copiedId === audio.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Load to Studio */}
                    <button
                      type="button"
                      onClick={() => onNavigateToStudio(audio.text)}
                      className="text-[11px] text-cyan-400 hover:underline px-2 py-1"
                      title="Buka kembali naskah ini di studio"
                    >
                      Buka di Studio
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(projectId, audio.id)}
                    disabled={isDeleting}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition disabled:opacity-40"
                    title="Hapus klip ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
