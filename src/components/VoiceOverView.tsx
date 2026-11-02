import React, { useState, useRef, useEffect } from 'react';
import {
  Mic2,
  Play,
  Pause,
  Square,
  Download,
  Save,
  RefreshCw,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ListOrdered,
  RotateCcw,
  Music,
  Sliders,
  Check,
  Radio,
  FileCheck2,
  Headphones,
  FlaskConical,
  ChevronDown,
  Clock,
  X,
} from 'lucide-react';
import { NarrationStyle, StandaloneAudio, Project, SceneItem, VoiceId, VoiceCategory } from '../types';
import { api } from '../services/api';

interface VoiceOverViewProps {
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onSaveToProject: (audio: StandaloneAudio) => void;
  initialText?: string;
  activeProject?: Project | null;
}

export const VoiceOverView: React.FC<VoiceOverViewProps> = ({
  onNotify,
  onSaveToProject,
  initialText = '',
  activeProject,
}) => {
  const [text, setText] = useState(initialText || '');
  const [voice, setVoice] = useState<VoiceId>('Charon');
  const [style, setStyle] = useState<NarrationStyle>('dokumenter');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentAudioMeta, setCurrentAudioMeta] = useState<{
    url: string;
    voice: VoiceId;
    style: NarrationStyle;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Voice Preview states
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [playingPreviewVoice, setPlayingPreviewVoice] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Multi-scene batch states
  const [isSceneMode, setIsSceneMode] = useState(Boolean(activeProject?.script?.scenes?.length));
  const [sceneBatchProgress, setSceneBatchProgress] = useState<{
    current: number;
    total: number;
    sceneTitle: string;
  } | null>(null);
  const [sceneAudios, setSceneAudios] = useState<Record<string, string>>({});
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);
  const [sequentialIndex, setSequentialIndex] = useState<number | null>(null);

  // Test Lab Comparison state
  const [showTestLab, setShowTestLab] = useState(false);
  const [testSentence, setTestSentence] = useState('');
  const [testResults, setTestResults] = useState<
    Record<
      string,
      {
        audioUrl: string;
        voice: string;
        style: string;
        loading?: boolean;
      }
    >
  >({});
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

  // Custom Voice & Narration Style Dropdown states
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const voiceDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const styleDropdownRef = useRef<HTMLDivElement | null>(null);

  // Quota & Rate Limit State
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voices: {
    id: VoiceId;
    name: string;
    gender: 'Wanita' | 'Pria';
    category: 'storytelling' | 'anak' | 'orang_tua' | 'kartun' | 'standar' | 'tokoh';
    categoryLabel: string;
    desc: string;
    badge: string;
    highlight?: boolean;
    recommendedFor: string;
  }[] = [
    // 0. Kategori Storytelling & Narator Konten
    {
      id: 'storyteller_1',
      name: 'Storyteller 1 (Warm, Calm & Intelligent)',
      gender: 'Pria',
      category: 'storytelling',
      categoryLabel: 'Storyteller & Narator',
      desc: 'Suara ramah, hangat, cerdas, tidak terlalu berat/ngebass berlebihan, berwibawa dengan nada jernih (clear tone). Nyaman di telinga & membangun rasa percaya.',
      badge: 'Warm, Calm & Intelligent',
      highlight: true,
      recommendedFor: 'Video essay, penjelasan konsep mendalam, edukasi cerdas, dokumenter hangat, ulasan reflektif, & narasi penambah rasa percaya (trust).',
    },
    {
      id: 'storyteller_2',
      name: 'Storyteller 2 (Dynamic Storyteller)',
      gender: 'Pria',
      category: 'storytelling',
      categoryLabel: 'Storyteller & Narator',
      desc: 'Tempo sedang dengan artikulasi poin penting, jeda dramatis (pause 0.5-1 detik) pada titik klimaks atau hook. Menjaga audiens tetap penasaran (hooked).',
      badge: 'Dynamic Storyteller & Hook',
      highlight: true,
      recommendedFor: 'Alur cerita fiksi/fakta berplot twist, video pendek dengan hook kuat, investigasi ringan, narasi viral TikTok/Reels/Shorts, & petualangan.',
    },

    // 0.1 Kategori Tokoh & Karakter Khusus
    {
      id: 'Wowi',
      name: 'Wowi (Khas Solo Berwibawa)',
      gender: 'Pria',
      category: 'tokoh',
      categoryLabel: 'Tokoh Khusus',
      desc: 'Bicara tenang, jeda ritmis berjarak, intonasi medok Solo halus, santai bersahaja namun berwibawa tegas.',
      badge: 'Spesial Khas Solo & Wibawa',
      highlight: true,
      recommendedFor: 'Pidato kenegaraan, wejangan bijak, narasi reflektif, pesan kebangsaan, & impersonasi santai.',
    },
    {
      id: 'gufron_syududu',
      name: 'Gufron Syududu (Orator Berapi-api)',
      gender: 'Pria',
      category: 'tokoh',
      categoryLabel: 'Tokoh Khusus',
      desc: 'Orasi vokal berapi-api, intonasi menggelegar, artikulasi cepat bertenaga ("Betul atau tidak?!", "Hah?!").',
      badge: 'Spesial Orator & Berapi-api',
      highlight: true,
      recommendedFor: 'Orasi komikal, ceramah viral bersemangat, dialog emosional, drama satiris, konten meme & parodi.',
    },

    // 1. Kategori Anak-Anak
    {
      id: 'anak_pria',
      name: 'Anak Laki-Laki (Bocah Ceria)',
      gender: 'Pria',
      category: 'anak',
      categoryLabel: 'Anak-Anak',
      desc: 'Suara anak kecil laki-laki (usia 7-10 tahun), lincah, polos, antusias, dan ceria.',
      badge: 'Anak Pria (7-10 Thn)',
      highlight: true,
      recommendedFor: 'Animasi kartun anak, dongeng petualangan, edukasi bermain, konten keluarga.',
    },
    {
      id: 'anak_wanita',
      name: 'Anak Perempuan (Gadis Cilik)',
      gender: 'Wanita',
      category: 'anak',
      categoryLabel: 'Anak-Anak',
      desc: 'Suara anak kecil perempuan (usia 6-9 tahun), manis, imut, gembira, dan menggemaskan.',
      badge: 'Anak Wanita (6-9 Thn)',
      highlight: true,
      recommendedFor: 'Dongeng putri & fabel anak, lagu & edukasi balita, animasi ramah anak.',
    },

    // 2. Kategori Orang Tua (Bapak, Ibu, Kakek, Nenek)
    {
      id: 'bapak',
      name: 'Bapak (Ayah Bijak & Hangat)',
      gender: 'Pria',
      category: 'orang_tua',
      categoryLabel: 'Orang Tua',
      desc: 'Suara pria dewasa matang, kebapakan, hangat, bersahabat, tenang, dan berwibawa.',
      badge: 'Figur Ayah & Dewasa',
      highlight: true,
      recommendedFor: 'Nasihat keluarga, narasi motivasi hidup, edukasi finansial, refleksi.',
    },
    {
      id: 'ibu',
      name: 'Ibu (Kasih Ibu Penuh Kasih)',
      gender: 'Wanita',
      category: 'orang_tua',
      categoryLabel: 'Orang Tua',
      desc: 'Suara wanita dewasa matang, keibuan, santun, teduh, dan penuh cinta kasih.',
      badge: 'Figur Ibu & Kasih Sayang',
      highlight: true,
      recommendedFor: 'Parenting, resep masakan rumahan, pesan kehangatan keluarga, kisah haru.',
    },
    {
      id: 'kakek',
      name: 'Kakek (Lansia Pria Sepuh)',
      gender: 'Pria',
      category: 'orang_tua',
      categoryLabel: 'Orang Tua',
      desc: 'Suara kakek-kakek lanjut usia, serak hangat, tempo lambat, bijaksana, dan bernostalgia.',
      badge: 'Kakek Bijaksana & Sepuh',
      highlight: true,
      recommendedFor: 'Kisah zaman dahulu, dongeng nusantara, hikmah sejarah, petuah sesepuh.',
    },
    {
      id: 'nenek',
      name: 'Nenek (Lansia Wanita Penuh Cerita)',
      gender: 'Wanita',
      category: 'orang_tua',
      categoryLabel: 'Orang Tua',
      desc: 'Suara nenek-nenek sepuh, teduh, sangat lembut, penuh kehangatan dan rasa sayang.',
      badge: 'Nenek Lembut & Penyayang',
      highlight: true,
      recommendedFor: 'Cerita rakyat, wejangan nenek, dongeng pengantar tidur, kisah syahdu.',
    },

    // 3. Kategori Kartun
    {
      id: 'kartun',
      name: 'Karakter Kartun (Lucu & Ekspresif)',
      gender: 'Pria',
      category: 'kartun',
      categoryLabel: 'Kartun & Animasi',
      desc: 'Suara tokoh kartun komikal, intonasi meliuk-liuk unik, lincah, dan menggemaskan.',
      badge: 'Kartun & Animasi Komikal',
      highlight: true,
      recommendedFor: 'Dubbing animasi komedi, video lucu TikTok, maskot karakter, hiburan anak.',
    },

    // 4. Kategori Siaran & Standar
    {
      id: 'Charon',
      name: 'Charon (Sinematik)',
      gender: 'Pria',
      category: 'standar',
      categoryLabel: 'Standar Siaran',
      desc: 'Berat, tenang, sinematik, berwibawa, dan tidak kaku.',
      badge: 'Unggulan Fakta & Dokumenter',
      highlight: true,
      recommendedFor: 'Dokumenter sains, sejarah, neurosains, & fakta unik.',
    },
    {
      id: 'Kore',
      name: 'Kore (Artikulatif)',
      gender: 'Wanita',
      category: 'standar',
      categoryLabel: 'Standar Siaran',
      desc: 'Jernih, artikulatif, ekspresif, hangat, dan ramah.',
      badge: 'Rekomendasi Umum',
      highlight: true,
      recommendedFor: 'Narasi umum, edukasi, tutorial, & profil.',
    },
    {
      id: 'Zephyr',
      name: 'Zephyr (Lembut)',
      gender: 'Wanita',
      category: 'standar',
      categoryLabel: 'Standar Siaran',
      desc: 'Lembut, menenangkan, naratif, dan santai.',
      badge: 'Storytelling',
      recommendedFor: 'Kisah inspiratif, refleksi, audiobook, & meditasi.',
    },
    {
      id: 'Puck',
      name: 'Puck (Kasual)',
      gender: 'Pria',
      category: 'standar',
      categoryLabel: 'Standar Siaran',
      desc: 'Muda, santai, energik, dinamis, dan bersahabat.',
      badge: 'Konten Kasual & Tips',
      recommendedFor: 'Tips harian, podcast santai, & reviu produk.',
    },
    {
      id: 'Aoede',
      name: 'Aoede (Viral Ceria)',
      gender: 'Wanita',
      category: 'standar',
      categoryLabel: 'Standar Siaran',
      desc: 'Ceria, bersemangat, ekspresif, dan dinamis.',
      badge: 'Viral & Lifestyle',
      recommendedFor: 'Video pendek viral TikTok/Reels & gaya hidup.',
    },
    {
      id: 'Fenrir',
      name: 'Fenrir (Dramatis)',
      gender: 'Pria',
      category: 'standar',
      categoryLabel: 'Standar Siaran',
      desc: 'Intens, tegas, mendalam, berbobot, dan dramatis.',
      badge: 'Misteri & Horor',
      recommendedFor: 'Misteri, horor, prolog epik, & narasi intens.',
    },
  ];

  // Sync initialText if changes
  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText);
    }
  }, [initialText]);

  // Custom Narration Style Options with rich metadata
  const narrationStyleOptions: {
    value: NarrationStyle;
    title: string;
    badge: string;
    badgeColor: string;
    description: string;
    suitableFor: string;
  }[] = [
    {
      value: 'dokumenter',
      title: 'Dokumenter Sinematik',
      badge: 'Fakta & Sains',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      description: 'Berat, berwibawa, tenang, ekspresif, dan tidak kaku.',
      suitableFor: 'Fakta unik, sains, sejarah, dan dokumenter mendalam.',
    },
    {
      value: 'natural',
      title: 'Natural & Bersahabat',
      badge: 'Percakapan Khas',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Percakapan santai mengalir khas penutur asli Indonesia.',
      suitableFor: 'Vlog harian, obrolan akrab, dan tips keseharian.',
    },
    {
      value: 'energik',
      title: 'Energik & Viral',
      badge: 'TikTok & Reels',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Cepat, lincah, dinamis, dan antusiasme tinggi sejak detik awal.',
      suitableFor: 'Video pendek viral, hiburan, dan konten tren.',
    },
    {
      value: 'edukatif',
      title: 'Edukatif Profesional',
      badge: 'Edukasi & Tutorial',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      description: 'Artikulasi jernih, runtut, mendidik, dan sangat mudah dipahami.',
      suitableFor: 'Tutorial langkah demi langkah, kursus, dan pemaparan materi.',
    },
    {
      value: 'emosional',
      title: 'Emosional & Dramatis',
      badge: 'Storytelling',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Menyentuh perasaan dengan jeda dramatis yang berbobot.',
      suitableFor: 'Kisah inspiratif, puisi, renungan, dan prolog naratif.',
    },
    {
      value: 'promosi',
      title: 'Promosi & Iklan',
      badge: 'CTA & Penjualan',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      description: 'Persuasif, meyakinkan, bersemangat, dan mengajak bertindak.',
      suitableFor: 'Iklan komersial, affiliate TikTok Shop, dan review produk.',
    },
  ];

  const currentStyleObj =
    narrationStyleOptions.find((opt) => opt.value === style) || narrationStyleOptions[0];

  const selectedVoiceObj = voices.find((v) => v.id === voice) || voices[0];

  // Grouped voices for clean dropdown display
  const voiceCategoryGroups = [
    {
      category: 'storytelling',
      label: 'Suara Storyteller & Narator Konten',
      icon: '📖',
      desc: 'Narator memikat pendengar (Storyteller 1 - Warm Calm & Intelligent, Storyteller 2 - Dynamic Storyteller)',
      items: voices.filter((v) => v.category === 'storytelling'),
    },
    {
      category: 'tokoh',
      label: 'Suara Tokoh & Karakter Khusus',
      icon: '👑',
      desc: 'Tokoh berwibawa & viral (Wowi - khas Solo, Gufron Syududu - orator berapi-api)',
      items: voices.filter((v) => v.category === 'tokoh'),
    },
    {
      category: 'standar',
      label: 'Suara Penyiar / Standar Siaran',
      icon: '🎙️',
      desc: 'Standar siaran jernih (dokumenter, berita, narasi umum, kasual, viral)',
      items: voices.filter((v) => v.category === 'standar'),
    },
    {
      category: 'anak',
      label: 'Suara Anak-Anak',
      icon: '👶',
      desc: 'Anak kecil usia 6-10 tahun (ceria, polos, imut, dongeng & edukasi)',
      items: voices.filter((v) => v.category === 'anak'),
    },
    {
      category: 'orang_tua',
      label: 'Suara Orang Dewasa & Lansia',
      icon: '👴👵',
      desc: 'Figur keluarga & sepuh (Bapak bijak, Ibu kasih sayang, Kakek & Nenek)',
      items: voices.filter((v) => v.category === 'orang_tua'),
    },
    {
      category: 'kartun',
      label: 'Suara Karakter & Kartun',
      icon: '🎭',
      desc: 'Karakter animasi komikal & maskot (intonasi meliuk-liuk & lucu)',
      items: voices.filter((v) => v.category === 'kartun'),
    },
  ];

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(e.target as Node)) {
        setIsVoiceDropdownOpen(false);
      }
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(e.target as Node)) {
        setIsStyleDropdownOpen(false);
      }
    };
    if (isVoiceDropdownOpen || isStyleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVoiceDropdownOpen, isStyleDropdownOpen]);

  // Playback speed and volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [playbackSpeed, volume, isMuted, currentAudioUrl]);


  // Handle Play Voice Preview (Sample Audio)
  const handlePlayVoicePreview = async (e: React.MouseEvent, voiceId: VoiceId) => {
    e.stopPropagation();

    // If currently playing this preview, stop it
    if (playingPreviewVoice === voiceId) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPlayingPreviewVoice(null);
      return;
    }

    setPreviewLoading(voiceId);
    try {
      const res = await api.getVoicePreview(voiceId);
      if (previewAudioRef.current) {
        previewAudioRef.current.src = res.audioUrl;
        previewAudioRef.current.play().catch((err) => console.warn('Preview play error:', err));
        setPlayingPreviewVoice(voiceId);

        previewAudioRef.current.onended = () => {
          setPlayingPreviewVoice(null);
        };
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      onNotify('error', 'Gagal Memutar Contoh Suara', err.message || 'Coba lagi nanti.');
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPlayingPreviewVoice(null);
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying && currentAudioUrl) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleGenerateVoice = async () => {
    const textToUse = text.trim();
    if (!textToUse) {
      onNotify('info', 'Naskah Masih Kosong', 'Tuliskan atau tempel naskah narasi Anda terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    handleStopAudio();

    const selectedVoice = voice;
    const selectedStyle = style;

    try {
      const result = await api.generateTTS({
        text: textToUse,
        voice: selectedVoice,
        style: selectedStyle,
      });

      if (result && result.audioUrl) {
        setIsQuotaExceeded(false);
        setCurrentAudioUrl(result.audioUrl);
        setCurrentAudioMeta({
          url: result.audioUrl,
          voice: selectedVoice,
          style: selectedStyle,
        });
        setIsPlaying(false);
        setCurrentTime(0);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = result.audioUrl;
          audioRef.current.currentTime = 0;
          // Crucial: Forces browser media decoder to flush old buffer and load fresh voice WAV
          audioRef.current.load();
        }
        onNotify(
          'success',
          'Voice Over Diperbarui',
          `Audio vokal "${selectedVoice}" (Gaya: ${selectedStyle}) berhasil dibuat dan siap diputar.`
        );
      } else {
        throw new Error('Server tidak mengembalikan audio yang valid.');
      }
    } catch (err: any) {
      let cleanMsg = err?.message || 'Gagal mengubah naskah menjadi audio.';
      try {
        if (cleanMsg.includes('{') && cleanMsg.includes('}')) {
          const match = cleanMsg.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.error?.message) {
              cleanMsg = parsed.error.message;
            } else if (parsed.message) {
              cleanMsg = parsed.message;
            }
          }
        }
      } catch {}

      const isQuota = Boolean(
        err?.isQuotaExceeded ||
        cleanMsg.includes('RESOURCE_EXHAUSTED') ||
        cleanMsg.includes('Batas kuota') ||
        cleanMsg.includes('429') ||
        cleanMsg.includes('quota')
      );

      if (isQuota) {
        console.warn('[Gemini TTS] Batas kuota Free Tier tercapai:', cleanMsg);
        setIsQuotaExceeded(true);
        const safeQuotaMessage =
          'Batas kuota laju permintaan Gemini Free Tier tercapai. Silakan tunggu beberapa saat lalu coba lagi.';
        setError(safeQuotaMessage);
        onNotify(
          'error',
          'Batas Kuota / Laju Permintaan',
          safeQuotaMessage
        );
      } else {
        console.error('TTS error:', err);
        setError(cleanMsg);
        onNotify('error', 'Gagal Generate Suara', cleanMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Run Test Lab voice generation
  const handleRunVoiceTest = async (targetVoice: VoiceId) => {
    if (!testSentence.trim()) {
      onNotify('error', 'Teks Pengujian Kosong', 'Ketik teks uji coba terlebih dahulu.');
      return;
    }

    setTestingVoiceId(targetVoice);
    try {
      const res = await api.generateTTS({
        text: testSentence,
        voice: targetVoice,
        style,
      });
      setTestResults((prev) => ({
        ...prev,
        [targetVoice]: {
          audioUrl: res.audioUrl,
          voice: targetVoice,
          style,
        },
      }));
      onNotify('success', `Uji Suara ${targetVoice} Selesai`, 'Audio perbandingan siap diputar.');
    } catch (err: any) {
      onNotify('error', `Gagal Uji ${targetVoice}`, err.message);
    } finally {
      setTestingVoiceId(null);
    }
  };

  const togglePlay = () => {
    // If browser speech synthesis is running
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (!currentAudioUrl && !audio.src) {
      if (text.trim()) {
        handleGenerateVoice();
      } else {
        onNotify('info', 'Belum Ada Audio', 'Masukkan naskah terlebih dahulu lalu klik "Generate Voice Over".');
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentAudioUrl && audio.src !== currentAudioUrl) {
        audio.src = currentAudioUrl;
        audio.load();
      }
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Audio play error:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const target = Number(e.target.value);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleDownloadWav = (url?: string, _suffix?: string) => {
    const targetUrl = url || currentAudioUrl;
    if (!targetUrl) return;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = 'driacom_audio.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('info', 'Mengunduh Audio', 'File audio driacom_audio.wav sedang diunduh.');
  };

  const handleSaveToProjectClick = () => {
    if (!currentAudioUrl) return;
    const item: StandaloneAudio = {
      id: `audio_${Date.now()}`,
      text,
      voice,
      style,
      url: currentAudioUrl,
      createdAt: new Date().toISOString(),
    };
    onSaveToProject(item);
    onNotify('success', 'Tersimpan ke Proyek', 'Klip voice-over telah ditambahkan ke proyek aktif.');
  };

  // Import scenes from active project
  const handleImportProjectScenes = () => {
    if (!activeProject?.script?.scenes || activeProject.script.scenes.length === 0) {
      onNotify('info', 'Tidak Ada Scene', 'Proyek aktif tidak memiliki naskah scene.');
      return;
    }

    const combined = activeProject.script.scenes
      .map((sc) => `[Scene ${sc.sceneNumber}: ${sc.title}]\n${sc.voiceoverText}`)
      .join('\n\n');

    setText(combined);
    onNotify('success', 'Naskah Diimpor', `${activeProject.script.scenes.length} scene berhasil dimuat ke naskah.`);
  };

  const handleGenerateSingleSceneAudio = async (scene: SceneItem) => {
    setPlayingSceneId(scene.id);
    try {
      const res = await api.generateTTS({
        text: scene.voiceoverText,
        voice,
        style,
      });
      setSceneAudios((prev) => ({ ...prev, [scene.id]: res.audioUrl }));
      onNotify('success', `Audio Scene ${scene.sceneNumber} Siap`, `Voice over suara ${voice} berhasil di-generate.`);
    } catch (err: any) {
      onNotify('error', `Gagal Scene ${scene.sceneNumber}`, err.message);
    } finally {
      setPlayingSceneId(null);
    }
  };

  const handleGenerateAllScenes = async () => {
    if (!activeProject?.script?.scenes?.length) return;
    const scenes = activeProject.script.scenes;

    for (let i = 0; i < scenes.length; i++) {
      const sc = scenes[i];
      setSceneBatchProgress({
        current: i + 1,
        total: scenes.length,
        sceneTitle: sc.title,
      });

      try {
        const res = await api.generateTTS({
          text: sc.voiceoverText,
          voice,
          style,
        });
        setSceneAudios((prev) => ({ ...prev, [sc.id]: res.audioUrl }));
      } catch (err: any) {
        console.error('Batch scene VO error:', err);
      }
    }

    setSceneBatchProgress(null);
    onNotify('success', 'Batch Voice Over Selesai', `Seluruh audio untuk ${scenes.length} scene telah siap diputar.`);
  };

  const handlePlayScene = (sceneId: string, url: string) => {
    if (!audioRef.current) return;
    if (playingSceneId === sceneId && isPlaying) {
      audioRef.current.pause();
      setPlayingSceneId(null);
    } else {
      audioRef.current.src = url;
      audioRef.current.play().catch(console.error);
      setPlayingSceneId(sceneId);
      setCurrentAudioUrl(url);
    }
  };

  const handlePlayAllSequential = () => {
    if (!activeProject?.script?.scenes?.length) return;
    const scenes = activeProject.script.scenes;
    const available = scenes.filter((s) => sceneAudios[s.id] || s.generatedAudio?.url);
    if (available.length === 0) {
      onNotify('info', 'Belum Ada Audio', 'Generate audio untuk scene terlebih dahulu.');
      return;
    }

    let currentIndex = 0;
    const playNext = () => {
      if (currentIndex >= available.length) {
        setSequentialIndex(null);
        setPlayingSceneId(null);
        return;
      }

      const sc = available[currentIndex];
      const url = sceneAudios[sc.id] || sc.generatedAudio?.url;
      if (url && audioRef.current) {
        setSequentialIndex(currentIndex);
        setPlayingSceneId(sc.id);
        setCurrentAudioUrl(url);
        audioRef.current.src = url;
        audioRef.current.play().catch(console.error);

        audioRef.current.onended = () => {
          currentIndex++;
          playNext();
        };
      }
    };

    playNext();
    onNotify('info', 'Memutar Seluruh Scene', `Memulai pemutaran berurutan untuk ${available.length} scene.`);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasProjectScenes = Boolean(activeProject?.script?.scenes?.length);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hidden audio players with reactive event bindings */}
      <audio
        ref={audioRef}
        src={currentAudioUrl || undefined}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onError={() => {
          setIsPlaying(false);
        }}
      />
      <audio ref={previewAudioRef} preload="auto" />

      {/* Subtle Native Tuning & Lab Toggle Bar */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-300 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-semibold text-white truncate">Bahasa Indonesia (id-ID)</span>
          <span className="text-slate-500 hidden sm:inline">· Format Siaran WAV 24kHz</span>
        </div>

        <button
          type="button"
          onClick={() => setShowTestLab(!showTestLab)}
          className="text-xs text-indigo-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>{showTestLab ? 'Tutup Lab Uji' : 'Lab Uji Suara'}</span>
        </button>
      </div>

      {/* Lab Uji Banding Suara Indonesia (Side-by-side Voice Comparison Test) */}
      {showTestLab && (
        <div className="p-5 rounded-2xl bg-[#090e1a] border border-emerald-500/40 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Lab Uji Banding Suara (Native Indonesian Voice Lab)</h4>
            </div>
            <span className="text-[11px] text-slate-400">
              Bandingkan intonasi tiap karakter suara menggunakan teks Indonesia yang sama persis
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-200">Teks Uji Coba Perbandingan:</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setTestSentence(
                      'Tahukah kamu, otak manusia dapat menghasilkan daya listrik sekitar 20 watt saat terjaga? Cukup untuk menyalakan sebuah lampu kecil.'
                    )
                  }
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Fakta Otak (Dokumenter)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTestSentence(
                      'Di kedalaman palung samudra yang gelap gulita, tekanan air mencapai seribu kali lebih besar daripada di permukaan laut.'
                    )
                  }
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Sains Laut
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTestSentence(
                      'Halo semuanya! Selamat datang kembali. Hari ini kita punya kabar teknologi yang sangat menarik untuk kalian simak.'
                    )
                  }
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Kasual Harian
                </button>
              </div>
            </div>
            <textarea
              value={testSentence}
              onChange={(e) => setTestSentence(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs leading-relaxed outline-none"
            />
          </div>

          {/* Voices Test Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {voices.map((v) => {
              const result = testResults[v.id];
              const isTesting = testingVoiceId === v.id;
              return (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{v.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({v.gender})</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {v.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{v.recommendedFor}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleRunVoiceTest(v.id)}
                      disabled={isTesting}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Driacom sedang memproses.. </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>{result ? 'Uji Ulang' : 'Uji Suara Ini'}</span>
                        </>
                      )}
                    </button>

                    {result?.audioUrl && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.src = result.audioUrl;
                              audioRef.current.play();
                              setCurrentAudioUrl(result.audioUrl);
                              setVoice(v.id);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1 transition"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Putar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadWav(result.audioUrl, `uji-${v.id}`)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                          title="Unduh WAV"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-6">
        {/* Form: Voice Characters, Narration Style, Script Input, and Generate Button */}
        <div className="w-full space-y-6">
          <div className="p-6 rounded-2xl bg-[#0c1222]/85 border border-slate-800/80 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Mic2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Pengaturan Suara & Naskah Voice-Over</h3>
              </div>

              {/* Mode switch: Free text vs Scene breakdown */}
              {hasProjectScenes && (
                <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSceneMode(false)}
                    className={`px-3 py-1 text-xs rounded-md transition ${
                      !isSceneMode
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Naskah Bebas
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSceneMode(true)}
                    className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${
                      isSceneMode
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListOrdered className="w-3 h-3" />
                    <span>Per-Scene ({activeProject?.script?.scenes?.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* 1. Voice Character Selection - Clean Category Dropdown (Anak, Penyiar, Orang Dewasa, Kartun) */}
            <div className="space-y-2.5 relative" ref={voiceDropdownRef}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>1. Pilih Karakter Suara Penutur Asli (Neural TTS id-ID)</span>
                </label>
                <span className="text-[10px] text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40">
                  {voices.length} Karakter Suara Tersedia
                </span>
              </div>

              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                className={`w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-3 shadow-md cursor-pointer ${
                  isVoiceDropdownOpen
                    ? 'bg-slate-900 border-indigo-500 shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    {selectedVoiceObj.category === 'storytelling'
                      ? '📖'
                      : selectedVoiceObj.category === 'tokoh'
                      ? '👑'
                      : selectedVoiceObj.category === 'anak'
                      ? '👶'
                      : selectedVoiceObj.category === 'orang_tua'
                      ? '👴'
                      : selectedVoiceObj.category === 'kartun'
                      ? '🎭'
                      : '🎙️'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                        {selectedVoiceObj.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        ({selectedVoiceObj.gender})
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold border bg-indigo-950/80 text-indigo-300 border-indigo-700/50">
                        {selectedVoiceObj.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">
                      Kategori: <strong className="text-cyan-300">{selectedVoiceObj.categoryLabel}</strong> · {selectedVoiceObj.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Pilih Karakter</span>
                  <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-300">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isVoiceDropdownOpen ? 'rotate-180 text-cyan-300' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Dropdown Menu Popover Grouped by Category - Muncul tepat di bawah pengaturan suara */}
              {isVoiceDropdownOpen && (
                <div className="mt-2.5 w-full p-3 rounded-2xl bg-[#090d19]/98 backdrop-blur-xl border border-indigo-500/40 shadow-2xl space-y-3 animate-in fade-in duration-150 max-h-[420px] overflow-y-auto">
                  <div className="px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Pilih Kategori & Karakter Suara
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Klik salah satu karakter untuk memilih suara voice-over
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      id-ID (Indonesia)
                    </span>
                  </div>

                  {/* Grouped Category Sections */}
                  <div className="space-y-3">
                    {voiceCategoryGroups.map((grp) => (
                      <div key={grp.category} className="space-y-1.5">
                        {/* Category Header */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                            <span className="text-sm">{grp.icon}</span>
                            <span>{grp.label}</span>
                          </div>
                          <span className="text-[10px] text-cyan-300 font-mono bg-slate-900/80 px-2 py-0.5 rounded">
                            {grp.items.length} Suara
                          </span>
                        </div>

                        {/* Voices in this category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {grp.items.map((v) => {
                            const isSelected = voice === v.id;
                            const isPreviewing = playingPreviewVoice === v.id;
                            const isPrvLoading = previewLoading === v.id;

                            return (
                              <div
                                key={v.id}
                                onClick={() => {
                                  setVoice(v.id);
                                  setIsVoiceDropdownOpen(false);
                                }}
                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-indigo-950/90 border-indigo-500 ring-1 ring-indigo-500/40 shadow-sm'
                                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-xs font-bold truncate ${
                                        isSelected ? 'text-cyan-200' : 'text-white'
                                      }`}
                                    >
                                      {v.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      ({v.gender})
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                    {v.desc}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Quick preview mini button inside dropdown */}
                                  <button
                                    type="button"
                                    onClick={(e) => handlePlayVoicePreview(e, v.id)}
                                    disabled={isPrvLoading}
                                    className={`p-1.5 rounded-lg text-[10px] transition cursor-pointer ${
                                      isPreviewing
                                        ? 'bg-emerald-600 text-white animate-pulse'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    }`}
                                    title="Dengar contoh suara ini"
                                  >
                                    {isPrvLoading ? (
                                      <RefreshCw className="w-3 h-3 animate-spin text-white" />
                                    ) : isPreviewing ? (
                                      <Pause className="w-3 h-3 fill-white" />
                                    ) : (
                                      <Volume2 className="w-3 h-3 text-cyan-400" />
                                    )}
                                  </button>

                                  {isSelected && (
                                    <Check className="w-4 h-4 text-cyan-300 shrink-0 stroke-[2.5]" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact Active Voice Card & Instant Preview Bar (Only 1 item rendered, ultra tidy!) */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-white">
                      Karakter Terpilih: <span className="text-cyan-300">{selectedVoiceObj.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">({selectedVoiceObj.gender})</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                      selectedVoiceObj.category === 'anak'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                        : selectedVoiceObj.category === 'orang_tua'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                        : selectedVoiceObj.category === 'kartun'
                        ? 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-800/50'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                    }`}>
                      {selectedVoiceObj.badge}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-600/40">
                      Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {selectedVoiceObj.desc}
                  </p>
                  <p className="text-[10px] text-indigo-300/90 font-medium italic">
                    Cocok untuk: {selectedVoiceObj.recommendedFor}
                  </p>
                </div>

                {/* Instant Preview Audio Button */}
                <button
                  type="button"
                  onClick={(e) => handlePlayVoicePreview(e, selectedVoiceObj.id)}
                  disabled={previewLoading === selectedVoiceObj.id}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm ${
                    playingPreviewVoice === selectedVoiceObj.id
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50'
                  }`}
                  title="Dengar contoh pelafalan suara ini"
                >
                  {previewLoading === selectedVoiceObj.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Memproses...</span>
                    </>
                  ) : playingPreviewVoice === selectedVoiceObj.id ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>Berhenti</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-white" />
                      <span>Dengar Contoh Suara</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Custom Interactive Narration Style Dropdown */}
            <div className="space-y-1.5 relative" ref={styleDropdownRef}>
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>2. Pilih Gaya Narasi & Intonasi</span>
                <span className="text-[10px] text-emerald-400 font-medium">Dipisahkan dari naskah audio</span>
              </label>

              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                className={`w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-3 shadow-md cursor-pointer ${
                  isStyleDropdownOpen
                    ? 'bg-slate-900 border-indigo-500 shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                        {currentStyleObj.title}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${currentStyleObj.badgeColor}`}
                      >
                        {currentStyleObj.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">
                      {currentStyleObj.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Ubah Intonasi</span>
                  <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-300">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isStyleDropdownOpen ? 'rotate-180 text-cyan-300' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Custom Dropdown Popover - Muncul tepat di bawah pengaturan gaya narasi */}
              {isStyleDropdownOpen && (
                <div className="mt-2.5 w-full p-3 rounded-2xl bg-[#090d19]/95 backdrop-blur-xl border border-indigo-500/40 shadow-2xl space-y-2 animate-in fade-in duration-150">
                  <div className="px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Pilih Gaya Narasi & Intonasi
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Intonasi penutur asli Indonesia disesuaikan otomatis oleh neural engine
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      id-ID
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {narrationStyleOptions.map((opt) => {
                      const isSelected = style === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => {
                            setStyle(opt.value);
                            setIsStyleDropdownOpen(false);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'border-cyan-400 bg-cyan-500/20 shadow-sm shadow-cyan-500/50'
                                    : 'border-slate-600 bg-slate-800'
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-cyan-300" />
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-bold ${
                                    isSelected ? 'text-white' : 'text-slate-200'
                                  }`}
                                >
                                  {opt.title}
                                </span>
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-medium border ${opt.badgeColor}`}
                                >
                                  {opt.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                                {opt.description}
                              </p>
                              <p className="text-[10px] text-indigo-300/80 italic mt-0.5">
                                Cocok untuk: {opt.suitableFor}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-cyan-300 shrink-0 stroke-[2.5]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. AREA INPUT NASKAH (Tepat berada di atas tombol Generate Voice Over) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-200 block">
                    3. Tuliskan Naskah Voice Over (Bahasa Indonesia)
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    Maks 5.000 Karakter
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {text.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setText('')}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      Kosongkan Naskah
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {text.length} karakter
                  </span>
                </div>
              </div>

              {/* Mode 1: Multi-Scene List (if active) */}
              {isSceneMode && hasProjectScenes ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/50">
                    <span className="text-xs font-semibold text-indigo-200">
                      Skenario Proyek Aktif ({activeProject?.script?.scenes?.length} Scene)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePlayAllSequential}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Putar Berurutan</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateAllScenes}
                        disabled={Boolean(sceneBatchProgress)}
                        className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                      >
                        {sceneBatchProgress ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Memproses ({sceneBatchProgress.current}/{sceneBatchProgress.total})</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Generate Semua Scene</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {sceneBatchProgress && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-1">
                      <div className="flex justify-between text-xs text-cyan-300 font-medium">
                        <span>Memproses: {sceneBatchProgress.sceneTitle}</span>
                        <span>{sceneBatchProgress.current} dari {sceneBatchProgress.total}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full transition-all duration-300"
                          style={{
                            width: `${(sceneBatchProgress.current / sceneBatchProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {activeProject!.script!.scenes.map((sc, idx) => {
                      const audioUrl = sceneAudios[sc.id] || sc.generatedAudio?.url;
                      const isCurPlaying = playingSceneId === sc.id && isPlaying;
                      return (
                        <div
                          key={sc.id}
                          className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            sequentialIndex === idx
                              ? 'bg-indigo-950/60 border-cyan-400 shadow-md'
                              : 'bg-slate-900/70 border-slate-800/80'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center">
                                {sc.sceneNumber}
                              </span>
                              <span className="text-xs font-bold text-white truncate">
                                {sc.title}
                              </span>
                              <span className="text-[10px] text-slate-400">({sc.durationSeconds}s)</span>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2 italic">
                              "{sc.voiceoverText}"
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {audioUrl ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handlePlayScene(sc.id, audioUrl)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                                >
                                  {isCurPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
                                  <span>{isCurPlaying ? 'Pause' : 'Putar'}</span>
                                </button>
                                <a
                                  href={audioUrl}
                                  download="driacom_audio.wav"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                                  title="Unduh WAV"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleGenerateSingleSceneAudio(sc)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950 hover:text-indigo-200 text-slate-300 border border-slate-700 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Generate</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Mode 2: Free Textarea with Quick Templates */
                <div className="space-y-2">
                  {/* Banner Khusus Tokoh (Wowi / Gufron Syududu) */}
                  {voice === 'Wowi' && (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">👑</span>
                        <span>
                          <strong>Mode Karakter Wowi Aktif:</strong> Intonasi medok Solo, tempo santai lambat, dan jeda bernapas ritmik otomatis disematkan agar vokal persis gaya aslinya.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setText(
                            'Saudara-saudara sekalian... ya kerja keras dan kebersamaan kita semua, itu adalah kunci paling utama untuk melangkah maju ke depan.'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-600/60 hover:bg-amber-600 text-[10px] text-white font-semibold shrink-0 transition cursor-pointer"
                      >
                        Pakai Naskah Contoh Wowi
                      </button>
                    </div>
                  )}

                  {voice === 'gufron_syududu' && (
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔥</span>
                        <span>
                          <strong>Mode Karakter Gufron Syududu Aktif:</strong> Orasi berapi-api, nada lantang menggelegar, dan hentakan retoris ekspresif otomatis dioptimalkan.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setText(
                            'Pondok gratis nggak nyumbang dibilang sesat! Waduh... yang sesat itu mana?! Hah?! Betul atau tidak?!'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-rose-600/60 hover:bg-rose-600 text-[10px] text-white font-semibold shrink-0 transition cursor-pointer"
                      >
                        Pakai Naskah Contoh Gufron
                      </button>
                    </div>
                  )}

                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    placeholder="Tuliskan atau tempelkan naskah Anda di sini dalam bahasa Indonesia... Contoh: 'Tahukah kamu, otak manusia memiliki kapasitas luar biasa yang mampu memproses miliaran sinyal setiap detiknya...'"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 text-white placeholder-slate-500 text-xs sm:text-sm leading-relaxed outline-none transition"
                  />

                  {/* Template Naskah Cepat */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-slate-500">Contoh Cepat:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setText(
                          'Tahukah kamu, otak manusia menghasilkan daya listrik sekitar 20 watt saat terjaga? Cukup untuk menyalakan sebuah lampu kecil. Organ yang berbobot hanya satu setengah kilogram ini menyimpan triliunan koneksi sinapsis yang bekerja tanpa henti.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 transition cursor-pointer"
                    >
                      Fakta Sains
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setText(
                          'Setiap langkah kecil yang kita ambil hari ini adalah fondasi bagi impian besar di masa depan. Jangan pernah meremehkan proses, karena perubahan nyata selalu berawal dari konsistensi yang sunyi.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 transition cursor-pointer"
                    >
                      Storytelling Inspiratif
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setText(
                          'Halo semuanya! Selamat datang kembali. Hari ini kita bakal bahas tiga tips praktis yang bisa langsung kalian coba untuk meningkatkan produktivitas harian. Simak sampai tuntas ya!'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 transition cursor-pointer"
                    >
                      Tips Kasual
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. TOMBOL BUAT AUDIO: TEPAT DI BAWAH AREA INPUT NASKAH */}
            <div className="pt-2">
              <button
                onClick={handleGenerateVoice}
                disabled={loading}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer tracking-wide"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                    <span>Driacom sedang meracik audio</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span>BUAT AUDIO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>


        {/* Audio Player & Controls Section: Positioned Below the Form (Full Width) */}
        <div className="w-full space-y-6">

          <div className="p-6 rounded-2xl bg-[#0c1222]/85 border border-slate-800/80 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Master Audio Monitor</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/50">
                24kHz Mono WAV (id-ID)
              </span>
            </div>

            {/* Error & Quota Recovery Banner */}
            {error && (
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-3 ${
                  isQuotaExceeded
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-100'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isQuotaExceeded ? (
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-2">
                    <span className="font-bold block text-white">
                      {isQuotaExceeded
                        ? 'Batas Kuota Free Tier Tercapai'
                        : 'Status Generator Suara:'}
                    </span>
                    <p className="leading-relaxed">{error}</p>

                    {/* Quick Recovery Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleGenerateVoice}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Coba Generate Lagi</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  title="Tutup pesan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sound Wave Visualization Box */}
            <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 flex flex-col items-center justify-center space-y-4">
              {/* Graphic Wave Bars */}
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-16 w-full px-4 overflow-hidden">
                {[...Array(44)].map((_, idx) => {
                  const heights = [20, 45, 60, 30, 80, 50, 90, 40, 75, 30, 65, 85, 40, 70, 95, 50, 40, 80, 60, 35, 75, 45, 90, 30, 60, 40, 25, 15];
                  const height = heights[idx % heights.length];
                  return (
                    <div
                      key={idx}
                      className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 ${
                        isPlaying
                          ? 'bg-gradient-to-t from-emerald-400 via-indigo-500 to-cyan-400 animate-pulse'
                          : 'bg-slate-700/60'
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(12, height)}%` : '18%',
                        animationDelay: `${idx * 0.05}s`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Status and Info */}
              <div className="text-center">
                <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
                  <span>
                    {loading
                      ? `Meracik Vokal: ${voice}...`
                      : currentAudioMeta
                      ? `Suara: ${currentAudioMeta.voice}`
                      : currentAudioUrl
                      ? `Suara: ${voice}`
                      : 'Belum Ada Audio'}
                  </span>
                  {(currentAudioMeta || currentAudioUrl) && !loading && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      id-ID
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {loading ? (
                    <span className="text-cyan-400 flex items-center justify-center gap-1.5 animate-pulse font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Sedang mensintesis gelombang audio 24kHz dengan gaya & intonasi {style}...
                    </span>
                  ) : currentAudioMeta ? (
                    <div>
                      <span>
                        Gaya:{' '}
                        <strong className="text-slate-300">
                          {narrationStyleOptions.find((o) => o.value === currentAudioMeta.style)?.title ||
                            currentAudioMeta.style}
                        </strong>
                      </span>
                      {(currentAudioMeta.voice !== voice || currentAudioMeta.style !== style) && (
                        <div className="text-[11px] text-amber-400/90 mt-1 flex items-center justify-center gap-1">
                          <span>Karakter/gaya di form telah diubah. Klik "Generate Voice Over" untuk membuat versi {voice} ({style}).</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    'Klik "Generate Voice Over" di atas untuk memproses naskah'
                  )}
                </div>
              </div>

              {/* Progress Slider */}
              <div className="w-full space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!currentAudioUrl}
                  className="w-full accent-indigo-500 bg-slate-800 cursor-pointer disabled:opacity-30"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Play / Pause / Stop Controls */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2">
                {/* Restart / Rewind */}
                <button
                  type="button"
                  onClick={handleRestart}
                  disabled={!currentAudioUrl}
                  className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 transition"
                  title="Ulangi dari Awal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>



                {/* Play / Pause Toggle Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!currentAudioUrl && !isPlaying && !text.trim()}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 via-indigo-600 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-40 transition transform active:scale-95"
                  title={isPlaying ? 'Jeda Audio (Pause)' : 'Putar Audio (Play)'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </button>

                {/* Volume Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  disabled={!currentAudioUrl}
                  className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 transition"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Playback Settings (Speed & Volume) */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Kecepatan Pemutaran:</span>
                <div className="flex items-center gap-1.5">
                  {[0.75, 1, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                        playbackSpeed === spd
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons: Download & Save */}
            {currentAudioUrl && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadWav()}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download WAV</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToProjectClick}
                  className="w-full py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan ke Proyek</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
