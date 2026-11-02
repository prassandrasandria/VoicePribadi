import {
  Project,
  SystemConfig,
  StandaloneAudio,
  NarrationStyle,
  VoiceId,
} from '../types';
import { loadBundledVoicePreview } from './voicePreviews';

export const DEFAULT_CONFIG: SystemConfig = {
  hasGeminiKey: false,
  isBackendConnected: false,
  textModel: 'gemini-3.8-flash',
  imagePromptModel: 'gemini-3.8-flash',
  imageModel: 'gemini-3.8-flash (TTS Audio)',
  ttsModel: 'gemini-3.8-flash-lite-tts',
  languageCode: 'id-ID',
  voiceOptions: [
    // Anak-Anak
    {
      id: 'anak_pria',
      name: 'Anak Laki-Laki (Bocah Ceria)',
      gender: 'Pria',
      category: 'anak',
      badge: 'Anak Pria (7-10 Thn)',
      description: 'Suara anak kecil laki-laki yang lincah, polos, antusias, dan ceria',
      recommendedFor: 'Animasi kartun anak, dongeng petualangan, edukasi bermain, konten keluarga',
    },
    {
      id: 'anak_wanita',
      name: 'Anak Perempuan (Gadis Cilik)',
      gender: 'Wanita',
      category: 'anak',
      badge: 'Anak Wanita (6-9 Thn)',
      description: 'Suara anak kecil perempuan yang manis, imut, gembira, dan menggemaskan',
      recommendedFor: 'Dongeng putri & fabel anak, lagu & edukasi balita, animasi ramah anak',
    },
    // Orang Tua (Bapak, Ibu, Kakek, Nenek)
    {
      id: 'bapak',
      name: 'Bapak (Ayah Bijak & Hangat)',
      gender: 'Pria',
      category: 'orang_tua',
      badge: 'Figur Ayah & Dewasa',
      description: 'Suara pria dewasa matang, kebapakan, hangat, berwibawa, dan menenangkan',
      recommendedFor: 'Nasihat keluarga, narasi motivasi hidup, edukasi finansial, refleksi',
    },
    {
      id: 'ibu',
      name: 'Ibu (Kasih Ibu Penuh Kasih)',
      gender: 'Wanita',
      category: 'orang_tua',
      badge: 'Figur Ibu & Kasih Sayang',
      description: 'Suara wanita dewasa matang, keibuan, santun, teduh, dan penuh cinta kasih',
      recommendedFor: 'Parenting, resep masakan rumahan, pesan kehangatan keluarga, kisah haru',
    },
    {
      id: 'kakek',
      name: 'Kakek (Lansia Pria Sepuh)',
      gender: 'Pria',
      category: 'orang_tua',
      badge: 'Kakek Bijaksana & Nostalgia',
      description: 'Suara kakek-kakek lanjut usia, serak hangat, tempo lambat, dan penuh petuah bijak',
      recommendedFor: 'Kisah zaman dahulu, dongeng nusantara, hikmah sejarah, petuah sesepuh',
    },
    {
      id: 'nenek',
      name: 'Nenek (Lansia Wanita Penuh Cerita)',
      gender: 'Wanita',
      category: 'orang_tua',
      badge: 'Nenek Lembut & Penyayang',
      description: 'Suara nenek-nenek sepuh, teduh, sangat lembut, penuh kehangatan dan rasa sayang',
      recommendedFor: 'Cerita rakyat, wejangan nenek, dongeng pengantar tidur, kisah syahdu',
    },
    // Karakter Kartun
    {
      id: 'kartun',
      name: 'Karakter Kartun (Lucu & Ekspresif)',
      gender: 'Pria',
      category: 'kartun',
      badge: 'Kartun & Animasi Komikal',
      description: 'Suara tokoh kartun komikal, intonasi meliuk-liuk unik, lincah, dan menggemaskan',
      recommendedFor: 'Dubbing animasi komedi, video lucu TikTok, maskot karakter, hiburan anak',
    },
    // Standar Siaran
    {
      id: 'Charon',
      name: 'Charon (Sinematik Berwibawa)',
      gender: 'Pria',
      category: 'standar',
      badge: 'Unggulan Dokumenter',
      description: 'Berat, tenang, sinematik, berwibawa, dan tidak kaku',
      recommendedFor: 'Dokumenter Sains & Fakta Unik (Unggulan)',
    },
    {
      id: 'Kore',
      name: 'Kore (Artikulatif & Hangat)',
      gender: 'Wanita',
      category: 'standar',
      badge: 'Rekomendasi Umum',
      description: 'Jernih, hangat, artikulatif, ekspresif, dan ramah',
      recommendedFor: 'Narasi Umum, Edukasi & Pengenalan',
    },
    {
      id: 'Zephyr',
      name: 'Zephyr (Lembut Menenangkan)',
      gender: 'Wanita',
      category: 'standar',
      badge: 'Storytelling & Meditasi',
      description: 'Lembut, menenangkan, naratif, dan santai',
      recommendedFor: 'Storytelling & Kisah Inspiratif',
    },
    {
      id: 'Puck',
      name: 'Puck (Kasual & Energik)',
      gender: 'Pria',
      category: 'standar',
      badge: 'Kasual & Reviu',
      description: 'Muda, santai, energik, dan bersahabat',
      recommendedFor: 'Konten Kasual, Tips Harian & Reviu',
    },
    {
      id: 'Aoede',
      name: 'Aoede (Ceria & Dinamis)',
      gender: 'Wanita',
      category: 'standar',
      badge: 'Viral & Lifestyle',
      description: 'Ceria, dinamis, hidup, dan antusias tinggi',
      recommendedFor: 'Konten Viral & Gaya Hidup',
    },
    {
      id: 'Fenrir',
      name: 'Fenrir (Mendalam & Epik)',
      gender: 'Pria',
      category: 'standar',
      badge: 'Misteri & Horor',
      description: 'Intens, tegas, mendalam, dan dramatis',
      recommendedFor: 'Misteri, Horor & Prolog Epik',
    },
    // Storyteller & Narator Konten
    {
      id: 'storyteller_1',
      name: 'Storyteller 1 (Warm, Calm & Intelligent)',
      gender: 'Pria',
      category: 'storytelling',
      badge: 'Warm, Calm & Intelligent',
      description: 'Suara ramah, hangat, cerdas, tidak terlalu ngebass berlebihan, berwibawa dengan nada jernih (clear tone). Nyaman di telinga & membangun rasa percaya.',
      recommendedFor: 'Video essay, penjelasan konsep mendalam, edukasi cerdas, dokumenter hangat, ulasan reflektif, & narasi penambah rasa percaya',
    },
    {
      id: 'storyteller_2',
      name: 'Storyteller 2 (Dynamic Storyteller)',
      gender: 'Pria',
      category: 'storytelling',
      badge: 'Dynamic Storyteller & Hook',
      description: 'Tempo sedang dengan artikulasi poin penting, jeda dramatis (pause 0.5-1 detik) pada titik klimaks atau hook. Menjaga audiens tetap penasaran (hooked).',
      recommendedFor: 'Alur cerita fiksi/fakta berplot twist, video pendek dengan hook kuat, investigasi ringan, narasi viral TikTok/Reels, & petualangan',
    },
    // Tokoh Khusus
    {
      id: 'Wowi',
      name: 'Wowi (Khas Solo Berwibawa)',
      gender: 'Pria',
      category: 'tokoh',
      badge: 'Spesial Khas Solo & Wibawa',
      description: 'Bicara tenang, jeda ritmis berjarak, intonasi medok Solo halus, santai bersahaja namun berwibawa tegas',
      recommendedFor: 'Pidato kenegaraan, wejangan bijak, narasi reflektif, pesan kebangsaan, dan impersonasi santai',
    },
    {
      id: 'gufron_syududu',
      name: 'Gufron Syududu (Orator Berapi-api)',
      gender: 'Pria',
      category: 'tokoh',
      badge: 'Spesial Orator & Berapi-api',
      description: 'Orasi vokal berapi-api, intonasi menggelegar, artikulasi cepat bertenaga ("Betul atau tidak?!", "Hah?!")',
      recommendedFor: 'Orasi komikal, ceramah viral bersemangat, dialog emosional, drama satiris, konten meme & parodi',
    },
  ],
};

const voicePreviewCache = new Map<string, { audioUrl: string; voice: string; cached?: boolean }>();

export const getApiBaseUrl = (): string => {
  return '';
};

export const setCustomBackendUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    const trimmed = url.trim().replace(/\/$/, '');
    if (!trimmed || trimmed.includes('run.app')) {
      localStorage.removeItem('driacom_backend_url');
    } else {
      localStorage.setItem('driacom_backend_url', trimmed);
    }
  }
};

async function safeFetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-cache');
  }

  const baseUrl = getApiBaseUrl();
  const targetUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Waktu permintaan habis (timeout setelah 45 detik). Silakan coba lagi.');
    }
    console.error(`[API Network Error] ${targetUrl}:`, err);
    throw new Error(`Gagal menghubungi server (${err.message || 'Network Error'}). Pastikan server backend sedang aktif.`);
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawText = await res.text();
    console.warn(`[API Non-JSON Response (status ${res.status})]:`, rawText.slice(0, 150));
    if (res.status === 404) {
      throw new Error('Endpoint API tidak ditemukan (404).');
    }
    throw new Error(`Server backend merespons format tidak valid (status ${res.status}).`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error('Format data JSON dari server tidak valid.');
  }

  if (!res.ok || data.success === false) {
    const errorMsg = data.error || data.message || `Kendala server (status ${res.status})`;
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.isQuotaExceeded = Boolean(
      data.isQuotaExceeded ||
      res.status === 429 ||
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('Batas kuota') ||
      errorMsg.includes('429')
    );
    err.retryAfterSeconds = data.retryAfterSeconds || 25;
    throw err;
  }

  return data as T;
}

export const api = {
  // Config & Health
  async getConfig(): Promise<SystemConfig> {
    try {
      const data = await safeFetchJson<SystemConfig>('/api/config');
      return {
        ...data,
        isBackendConnected: true,
      };
    } catch (e: any) {
      console.warn('Backend /api/config check failed, using default config:', e.message);
      return {
        ...DEFAULT_CONFIG,
        isBackendConnected: false,
      };
    }
  },

  // Project persistence
  async getProjects(): Promise<Project[]> {
    try {
      const res = await safeFetchJson<{ success: boolean; data: Project[] }>('/api/projects');
      if (Array.isArray(res?.data)) {
        try {
          localStorage.setItem('driacom_cached_projects', JSON.stringify(res.data));
        } catch {}
        return res.data;
      }
      return [];
    } catch {
      try {
        const cached = localStorage.getItem('driacom_cached_projects');
        if (cached) return JSON.parse(cached);
      } catch {}
      return [];
    }
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    const res = await safeFetchJson<{ success: boolean; data: Project }>('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return res.data;
  },

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const res = await safeFetchJson<{ success: boolean; data: Project }>(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return res.data;
  },

  async deleteProject(id: string): Promise<boolean> {
    const res = await safeFetchJson<{ success: boolean }>(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.success;
  },

  // Voice Over TTS Generation (Server Gemini Native Indonesian WAV Engine)
  async generateTTS(params: {
    text: string;
    voice: string;
    style: NarrationStyle;
  }): Promise<{
    audioUrl: string;
    voice: string;
    style: string;
    languageCode?: string;
    textLength: number;
    audioSizeBytes?: number;
    notice?: string;
  }> {
    const data = await safeFetchJson<any>('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (data && data.audioUrl) {
      return data;
    }

    throw new Error(data?.error || 'Gagal mensintesis audio WAV penutur asli.');
  },

  // Voice Preview (instant cached sample for auditioning)
  async getVoicePreview(voice: string): Promise<{
    audioUrl: string;
    voice: string;
    cached?: boolean;
  }> {
    if (voicePreviewCache.has(voice)) {
      return voicePreviewCache.get(voice)!;
    }

    // 1. Try bundled code-split dynamic import and static JSON
    try {
      const bundled = await loadBundledVoicePreview(voice);
      if (bundled && bundled.audioUrl) {
        voicePreviewCache.set(voice, bundled);
        return bundled;
      }
    } catch (e) {
      console.warn('Bundled preview lookup failed, trying API:', e);
    }

    // 2. Fallback to API route
    const data = await safeFetchJson<{ success: boolean; audioUrl: string; voice: string; cached?: boolean }>(
      `/api/tts/preview?voice=${encodeURIComponent(voice)}`
    );

    const result = {
      audioUrl: data.audioUrl,
      voice: data.voice,
      cached: data.cached,
    };
    voicePreviewCache.set(voice, result);
    return result;
  },
};
