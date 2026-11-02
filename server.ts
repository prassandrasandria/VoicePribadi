import crypto from 'crypto';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

// Privacy & Strict Anti-Crawl Headers
app.use((_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  next();
});

// CORS for custom domain and client apps
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve pre-generated voice preview files statically for instant auditioning
app.use('/previews', express.static(path.resolve(__dirname, 'public/previews')));
app.use('/previews', express.static(path.resolve(__dirname, 'data/previews')));

// Explicit Robots.txt - strictly block all search crawlers (Private Personal Use)
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain; charset=utf-8');
  res.send('User-agent: *\nDisallow: /\n');
});

// Statically serve public directory assets
app.use(express.static(path.resolve(__dirname, 'public')));

// Storage directory for persistent projects & voice previews
const DATA_DIR = path.resolve(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const PREVIEWS_DIR = path.join(DATA_DIR, 'previews');
const AUDIO_CACHE_DIR = path.join(DATA_DIR, 'cache', 'audio');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PREVIEWS_DIR)) {
  fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

// Initial projects storage
if (!fs.existsSync(PROJECTS_FILE)) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function readProjects(): any[] {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return [];
    const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading projects:', err);
    return [];
  }
}

function writeProjects(projects: any[]): void {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing projects:', err);
  }
}

// Server-side Gemini initialization
function getApiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

function getAi(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: getApiKey(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ai = {
  get models() {
    return getAi().models;
  },
};

// System Info & Config for Voice Over Studio
interface VoiceDefinition {
  id: string;
  name: string;
  gender: 'Pria' | 'Wanita';
  category: 'storytelling' | 'anak' | 'orang_tua' | 'kartun' | 'standar' | 'tokoh';
  baseVoice: 'Puck' | 'Charon' | 'Kore' | 'Zephyr' | 'Aoede' | 'Fenrir';
  badge: string;
  description: string;
  recommendedFor: string;
  previewText: string;
  previewStyle: string;
  personaDirective: string;
}

const VOICE_DEFINITIONS: Record<string, VoiceDefinition> = {
  // 1. Kategori Anak-Anak
  anak_pria: {
    id: 'anak_pria',
    name: 'Anak Laki-Laki (Bocah Ceria)',
    gender: 'Pria',
    category: 'anak',
    baseVoice: 'Puck',
    badge: 'Anak Pria (7-10 Thn)',
    description: 'Suara anak kecil laki-laki yang lincah, polos, antusias, dan ceria',
    recommendedFor: 'Animasi kartun anak, dongeng petualangan, edukasi bermain, konten keluarga',
    previewText: 'Halo semuanya! Aku mau cerita hal seru banget hari ini. Dengarkan ceritaku ya!',
    previewStyle: 'energik',
    personaDirective: 'Young Indonesian boy voice (anak kecil laki-laki usia 7-10 tahun), high-pitched boyish timbre, innocent, cheerful, lively, and energetic Indonesian child intonation, pure clear native articulation',
  },
  anak_wanita: {
    id: 'anak_wanita',
    name: 'Anak Perempuan (Gadis Cilik)',
    gender: 'Wanita',
    category: 'anak',
    baseVoice: 'Aoede',
    badge: 'Anak Wanita (6-9 Thn)',
    description: 'Suara anak kecil perempuan yang manis, imut, gembira, dan menggemaskan',
    recommendedFor: 'Dongeng putri & fabel anak, lagu & edukasi balita, animasi ramah anak',
    previewText: 'Hai teman-teman! Namaku Cika. Aku senang sekali bisa bermain dan belajar bersama kalian hari ini!',
    previewStyle: 'energik',
    personaDirective: 'Young Indonesian girl voice (anak kecil perempuan usia 6-9 tahun), sweet, cute, bubbly, bright high-pitched vocal timbre, innocent, playful, polite Indonesian child intonation',
  },

  // 2. Kategori Orang Tua (Bapak, Ibu, Kakek, Nenek)
  bapak: {
    id: 'bapak',
    name: 'Bapak (Ayah Bijak & Hangat)',
    gender: 'Pria',
    category: 'orang_tua',
    baseVoice: 'Charon',
    badge: 'Figur Ayah & Dewasa',
    description: 'Suara pria dewasa matang, kebapakan, hangat, berwibawa, dan menenangkan',
    recommendedFor: 'Nasihat keluarga, narasi motivasi hidup, edukasi finansial, refleksi',
    previewText: 'Halo anak muda. Ingatlah, setiap usaha yang kamu lakukan dengan sungguh-sungguh pasti akan berbuah manis.',
    previewStyle: 'natural',
    personaDirective: 'Mature, warm, respected Indonesian father figure (suara bapak-bapak ramah dan berwibawa), reassuring baritone resonance, steady paternal pacing, patient and wise Indonesian speech',
  },
  ibu: {
    id: 'ibu',
    name: 'Ibu (Kasih Ibu Penuh Kasih)',
    gender: 'Wanita',
    category: 'orang_tua',
    baseVoice: 'Kore',
    badge: 'Figur Ibu & Kasih Sayang',
    description: 'Suara wanita dewasa matang, keibuan, santun, teduh, dan penuh cinta kasih',
    recommendedFor: 'Parenting, resep masakan rumahan, pesan kehangatan keluarga, kisah haru',
    previewText: 'Halo anakku sayang. Jangan lupa makan teratur, jaga kesehatan, dan tetap semangat ya.',
    previewStyle: 'natural',
    personaDirective: 'Warm, nurturing, caring Indonesian mother figure (suara ibu penuh kasih sayang dan santun), gentle, comforting maternal timbre, patient and heartfelt cadence in natural standard Indonesian',
  },
  kakek: {
    id: 'kakek',
    name: 'Kakek (Lansia Pria Sepuh)',
    gender: 'Pria',
    category: 'orang_tua',
    baseVoice: 'Charon',
    badge: 'Kakek Bijaksana & Nostalgia',
    description: 'Suara kakek-kakek lanjut usia, serak hangat, tempo lambat, dan penuh petuah bijak',
    recommendedFor: 'Kisah zaman dahulu, dongeng nusantara, hikmah sejarah, petuah sesepuh',
    previewText: 'Dahulu kala, waktu kakek masih muda... ada banyak cerita berharga yang ingin kakek ceritakan kepada kalian.',
    previewStyle: 'emosional',
    personaDirective: 'Elderly Indonesian grandfather voice (kakek-kakek sepuh dan bijaksana), aged, weathered, warm, slightly raspy, slow and deliberate tempo, full of grandfatherly warmth and nostalgic wisdom',
  },
  nenek: {
    id: 'nenek',
    name: 'Nenek (Lansia Wanita Penuh Cerita)',
    gender: 'Wanita',
    category: 'orang_tua',
    baseVoice: 'Zephyr',
    badge: 'Nenek Lembut & Penyayang',
    description: 'Suara nenek-nenek sepuh, teduh, sangat lembut, penuh kehangatan dan rasa sayang',
    recommendedFor: 'Cerita rakyat, wejangan nenek, dongeng pengantar tidur, kisah syahdu',
    previewText: 'Aduh cucu nenek yang manis... sini duduk dekat nenek, nenek punya cerita istimewa untukmu hari ini.',
    previewStyle: 'emosional',
    personaDirective: 'Elderly Indonesian grandmother voice (nenek-nenek lembut dan penyayang), aged, soft, mellow, loving grandmotherly intimacy, slow and tender pacing with gentle Indonesian warmth',
  },

  // 3. Kategori Karakter Kartun
  kartun: {
    id: 'kartun',
    name: 'Karakter Kartun (Lucu & Ekspresif)',
    gender: 'Pria',
    category: 'kartun',
    baseVoice: 'Puck',
    badge: 'Kartun & Animasi Komikal',
    description: 'Suara tokoh kartun komikal, intonasi meliuk-liuk unik, lincah, dan menggemaskan',
    recommendedFor: 'Dubbing animasi komedi, video lucu TikTok, maskot karakter, hiburan anak',
    previewText: 'Waaah, lihat itu kawan! Petualangan super seru kita baru saja dimulai! Ayo meluncur sekarang, wusss!',
    previewStyle: 'energik',
    personaDirective: 'Playful, exaggerated, quirky animated cartoon character in Indonesian (karakter kartun komikal dan ekspresif), bouncy theatrical pitch inflections, comic enthusiasm, humorous, and entertaining delivery',
  },

  // 4. Kategori Tokoh & Karakter Khusus
  Wowi: {
    id: 'Wowi',
    name: 'Wowi (Khas Solo Berwibawa)',
    gender: 'Pria',
    category: 'tokoh',
    baseVoice: 'Charon',
    badge: 'Spesial Khas Solo & Wibawa',
    description: 'Bicara tenang, jeda ritmis berjarak, intonasi medok Solo halus, santai bersahaja namun berwibawa tegas',
    recommendedFor: 'Pidato kenegaraan, wejangan bijak, narasi reflektif, pesan kebangsaan, dan impersonasi santai',
    previewText: 'Saudara-saudara sekalian... ya kerja keras dan kebersamaan kita semua, itu adalah kunci paling utama untuk melangkah maju ke depan.',
    previewStyle: 'natural',
    personaDirective: 'Distinctive voice of a calm, humble, yet authoritative Javanese leader from Solo (gaya bicara khas Solo santai berwibawa, intonasi tenang berjarak khas Pak Jokowi), characterized by relaxed tempo, thoughtful rhythmic pauses marked by gentle breathing breaks, signature conversational cadence, subtle soft Javanese medok accent on syllables, warm baritone resonance, and approachable down-to-earth delivery in Indonesian',
  },
  gufron_syududu: {
    id: 'gufron_syududu',
    name: 'Gufron Syududu (Orator Berapi-api)',
    gender: 'Pria',
    category: 'tokoh',
    baseVoice: 'Fenrir',
    badge: 'Spesial Orator & Berapi-api',
    description: 'Orasi vokal berapi-api, intonasi menggelegar, artikulasi cepat bertenaga dengan celetukan retoris khas ("Betul atau tidak?!", "Hah?!")',
    recommendedFor: 'Orasi komikal, ceramah viral bersemangat, dialog emosional, drama satiris, konten meme & parodi',
    previewText: 'Pondok gratis nggak nyumbang dibilang sesat! Waduh... yang sesat itu mana?! Hah?! Betul atau tidak?!',
    previewStyle: 'energik',
    personaDirective: 'Extremely fiery, intense, and passionate Indonesian orator and preacher voice (gaya orasi berapi-api khas Abuya Mama Gufron), roaring energetic volume, fast-paced emphatic cadence, high dramatic passion, raspy fiery vocal resonance, spontaneous explosive rhetorical questions ("Betul atau tidak?!", "Hah?!"), commanding and eccentric Indonesian delivery',
  },

  // 4.1 Kategori Storytelling & Narator Konten
  storyteller_1: {
    id: 'storyteller_1',
    name: 'Storyteller 1 (Warm, Calm & Intelligent)',
    gender: 'Pria',
    category: 'storytelling',
    baseVoice: 'Charon',
    badge: 'Warm, Calm & Intelligent',
    description: 'Suara ramah, hangat, cerdas, tidak terlalu berat/ngebass berlebihan, berwibawa dengan nada jernih (clear tone). Nyaman di telinga & membangun rasa percaya.',
    recommendedFor: 'Video essay, penjelasan konsep mendalam, edukasi cerdas, dokumenter hangat, ulasan reflektif, & narasi penambah rasa percaya',
    previewText: 'Di balik setiap ide dan penemuan besar dunia, selalu ada proses sunyi yang penuh ketekunan. Mari kita pahami bersama rahasianya langkah demi langkah.',
    previewStyle: 'natural',
    personaDirective: 'Warm, calm, and intelligent Indonesian storyteller voice (suara cerdas, ramah, hangat, dan tenang), clear tone without excessive heavy bass, authoritative yet soothing and comforting to the ear, articulate and measured enunciation that makes complex information effortless to understand and builds deep trust with listeners',
  },
  storyteller_2: {
    id: 'storyteller_2',
    name: 'Storyteller 2 (Dynamic Storyteller)',
    gender: 'Pria',
    category: 'storytelling',
    baseVoice: 'Puck',
    badge: 'Dynamic Storyteller & Hook',
    description: 'Tempo sedang dengan artikulasi poin penting, jeda dramatis (pause 0.5-1 detik) pada titik klimaks atau hook. Menjaga audiens tetap penasaran (hooked).',
    recommendedFor: 'Alur cerita fiksi/fakta berplot twist, video pendek dengan hook kuat, investigasi ringan, narasi viral TikTok/Reels/Shorts, & petualangan',
    previewText: 'Semua orang mengira kisahnya sudah berakhir malam itu. Tapi tunggu... ada satu rahasia besar yang belum terungkap.',
    previewStyle: 'emosional',
    personaDirective: 'Dynamic Indonesian storyteller voice with moderate pacing and emphasized key articulation (narator dinamis pemikat rasa penasaran), dramatic pauses on climax points and hooks, engaging narrative tempo that keeps listeners hooked without feeling rushed or monotonous, expressive and captivating Indonesian storytelling cadence',
  },

  // 5. Kategori Siaran & Standar
  Charon: {
    id: 'Charon',
    name: 'Charon (Sinematik Berwibawa)',
    gender: 'Pria',
    category: 'standar',
    baseVoice: 'Charon',
    badge: 'Unggulan Dokumenter',
    description: 'Berat, tenang, sinematik, berwibawa, dan tidak kaku',
    recommendedFor: 'Dokumenter sains, sejarah, neurosains, & fakta unik',
    previewText: 'Halo, saya Charon. Dengan vokal berat, berwibawa, dan sinematik, saya siap menarasikan dokumenter sains dan fakta unik Anda.',
    previewStyle: 'dokumenter',
    personaDirective: 'Deep, resonant, authoritative baritone male voice with calm, serious, and dignified cinematic gravitas',
  },
  Kore: {
    id: 'Kore',
    name: 'Kore (Artikulatif & Hangat)',
    gender: 'Wanita',
    category: 'standar',
    baseVoice: 'Kore',
    badge: 'Rekomendasi Umum',
    description: 'Jernih, hangat, artikulatif, ekspresif, dan ramah',
    recommendedFor: 'Narasi umum, edukasi & pengenalan',
    previewText: 'Halo! Saya Kore. Siap membawakan naskah Anda dengan pelafalan bahasa Indonesia yang jernih, artikulatif, dan ramah.',
    previewStyle: 'natural',
    personaDirective: 'Clear, warm, articulate, and welcoming female voice with polite, natural, and professional inflection',
  },
  Zephyr: {
    id: 'Zephyr',
    name: 'Zephyr (Lembut Menenangkan)',
    gender: 'Wanita',
    category: 'standar',
    baseVoice: 'Zephyr',
    badge: 'Storytelling & Meditasi',
    description: 'Lembut, menenangkan, naratif, dan santai',
    recommendedFor: 'Storytelling & kisah inspiratif',
    previewText: 'Halo, saya Zephyr. Suara saya lembut dan tenang, cocok untuk menghidupkan kisah dan narasi inspiratif Anda.',
    previewStyle: 'natural',
    personaDirective: 'Soft, gentle, soothing, and intimate female voice with relaxing storytelling cadence',
  },
  Puck: {
    id: 'Puck',
    name: 'Puck (Kasual & Energik)',
    gender: 'Pria',
    category: 'standar',
    baseVoice: 'Puck',
    badge: 'Kasual & Reviu',
    description: 'Muda, santai, energik, dan bersahabat',
    recommendedFor: 'Konten kasual, tips harian & reviu',
    previewText: 'Hai kawan! Saya Puck. Gaya bicara saya santai dan bersahabat, sangat pas untuk tips harian dan konten kekinian.',
    previewStyle: 'natural',
    personaDirective: 'Youthful, vibrant, friendly, and casual male voice with relaxed, dynamic, and upbeat conversational pacing',
  },
  Aoede: {
    id: 'Aoede',
    name: 'Aoede (Ceria & Dinamis)',
    gender: 'Wanita',
    category: 'standar',
    baseVoice: 'Aoede',
    badge: 'Viral & Lifestyle',
    description: 'Ceria, dinamis, hidup, dan antusias tinggi',
    recommendedFor: 'Konten viral TikTok & gaya hidup',
    previewText: 'Halo semuanya! Saya Aoede. Gaya bicara saya ceria dan dinamis, pas untuk konten kreatif yang energik dan viral.',
    previewStyle: 'energik',
    personaDirective: 'Cheerful, lively, bubbly, and high-energy female voice with bright, expressive, and enthusiastic delivery',
  },
  Fenrir: {
    id: 'Fenrir',
    name: 'Fenrir (Mendalam & Epik)',
    gender: 'Pria',
    category: 'standar',
    baseVoice: 'Fenrir',
    badge: 'Misteri & Horor',
    description: 'Intens, tegas, mendalam, dan dramatis',
    recommendedFor: 'Misteri, horor & prolog epik',
    previewText: 'Saya Fenrir. Suara saya dalam dan tegas, memberikan bobot dramatis serta intensitas pada setiap kisah Anda.',
    previewStyle: 'emosional',
    personaDirective: 'Deep, intense, commanding, and dramatic male voice with powerful suspenseful emotional weight',
  },
};

// System Info & Config for Voice Over Studio
app.get('/api/config', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    hasGeminiKey: Boolean(getApiKey() && getApiKey().trim().length > 5),
    textModel: 'gemini-3.8-flash',
    ttsModel: 'gemini-3.8-flash-lite-tts',
    languageCode: 'id-ID',
    voiceOptions: Object.values(VOICE_DEFINITIONS).map((v) => ({
      id: v.id,
      name: v.name,
      gender: v.gender,
      category: v.category,
      badge: v.badge,
      description: v.description,
      recommendedFor: v.recommendedFor,
    })),
  });
});

// Helper to stitch multiple 24kHz mono 16-bit WAV buffers into one continuous WAV file
function stitchWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  const pcmList = buffers.map((b) => (b.length > 44 ? b.subarray(44) : Buffer.alloc(0)));
  const totalPcm = Buffer.concat(pcmList);
  const header = Buffer.from(buffers[0].subarray(0, 44));

  header.writeUInt32LE(header.length + totalPcm.length - 8, 4);
  header.writeUInt32LE(totalPcm.length, 40);

  return Buffer.concat([header, totalPcm]);
}

// Helper to enrich and format script with authentic vocal acting tags for special personas
function enhanceTextForPersona(voiceId: string, text: string): string {
  if (voiceId === 'Wowi') {
    // Pak Jokowi signature speech cadence:
    // Insert rhythmic pauses and gentle breathing points, with '...' elongation
    let processed = text.trim();
    processed = processed
      .replace(/,\s*/g, ', <short pause> ')
      .replace(/\.\.\.\s*/g, '... <short pause> <breath> ')
      .replace(/\.\s+/g, '. <short pause> <breath> ')
      .replace(/;\s*/g, ' <short pause> ')
      .replace(/\n+/g, ' <short pause> <breath> ');

    // Smooth out multiple tags
    processed = processed.replace(/(<short pause>\s*)+/g, '<short pause> ');
    return processed;
  }

  if (voiceId === 'gufron_syududu') {
    // Abuya Mama Gufron signature fiery preacher delivery:
    // Emphatic punctuation and rhetorical bursts
    let processed = text.trim();
    processed = processed
      .replace(/,\s*/g, ', <short pause> ')
      .replace(/\?\s*/g, '?! <short pause> ')
      .replace(/!\s*/g, '! <short pause> ')
      .replace(/\.\s+/g, '! <short pause> ')
      .replace(/\n+/g, '! <short pause> ');

    processed = processed.replace(/(<short pause>\s*)+/g, '<short pause> ');
    return processed;
  }

  if (voiceId === 'storyteller_1') {
    // Warm, calm & intelligent: soothing, measured breathing and thoughtful cadence
    let processed = text.trim();
    processed = processed
      .replace(/,\s*/g, ', <short pause> ')
      .replace(/\.\s+/g, '. <short pause> <breath> ')
      .replace(/;\s*/g, ' <short pause> ');
    processed = processed.replace(/(<short pause>\s*)+/g, '<short pause> ');
    return processed;
  }

  if (voiceId === 'storyteller_2') {
    // Dynamic storyteller: dramatic pauses (0.5-1s) on hooks, ellipsis, and climax points
    let processed = text.trim();
    processed = processed
      .replace(/\.\.\.\s*/g, '... <short pause> <breath> ')
      .replace(/Tapi tunggu[.,]?\s*/gi, 'Tapi tunggu... <short pause> ')
      .replace(/Namun siapa sangka[.,]?\s*/gi, 'Namun siapa sangka... <short pause> ')
      .replace(/!\s+/g, '! <short pause> ')
      .replace(/\?\s+/g, '? <short pause> ');
    processed = processed.replace(/(<short pause>\s*)+/g, '<short pause> ');
    return processed;
  }

  return text;
}

// Helper: Indonesian Native Speaker style & vocal personality directive builder
function buildSpeechStyleDirective(voiceId: string, style: string): { directive: string; baseVoice: 'Puck' | 'Charon' | 'Kore' | 'Zephyr' | 'Aoede' | 'Fenrir' } {
  const persona = VOICE_DEFINITIONS[voiceId] || VOICE_DEFINITIONS.Charon;

  if (voiceId === 'Wowi') {
    return {
      directive:
        'Gaya bicara bahasa Indonesia berlogat medok Solo (Jawa Tengah) yang sangat kental, santai, tempo lambat, intonasi khas Pak Jokowi yang bersahaja dan ramah, banyak jeda tenang di antara kata-kata, vokal sedikit serak hangat, artikulasi huruf b, d, g mantap dan lembut.',
      baseVoice: 'Charon',
    };
  }

  if (voiceId === 'gufron_syududu') {
    return {
      directive:
        'Gaya orasi dan ceramah berapi-api yang sangat bersemangat, menggelegar, dan lantang khas Abuya Mama Ghufron. Suara lantang bervolume tinggi, nada vokal dinamis ekspresif, artikulasi cepat bertenaga, intonasi retoris tegas dan menghentak-hentak, penuh semangat menggelora.',
      baseVoice: 'Puck',
    };
  }

  if (voiceId === 'storyteller_1') {
    return {
      directive:
        'Warm, calm, and intelligent Indonesian storyteller voice (suara cerdas, hangat, ramah, dan tenang), clear tone without excessive heavy bass, authoritative yet soothing and comforting to the ear, articulate and measured enunciation that makes complex information effortless to understand and builds deep trust with listeners. Authentic standard Indonesian pacing, soothing natural tone.',
      baseVoice: 'Charon',
    };
  }

  if (voiceId === 'storyteller_2') {
    return {
      directive:
        'Dynamic Indonesian storyteller voice with moderate pacing and emphasized key articulation (narator dinamis pemikat rasa penasaran), dramatic pauses on climax points and hooks, engaging narrative tempo that keeps listeners hooked without feeling rushed or monotonous, expressive and captivating Indonesian storytelling cadence.',
      baseVoice: 'Puck',
    };
  }

  const styleProfiles: Record<string, string> = {
    dokumenter: 'cinematic documentary narration in fluent standard Indonesian, steady measured pacing, authoritative weight, clear enunciation for science, nature, and history facts',
    natural: 'warm, relaxed, conversational Indonesian tone, natural everyday Indonesian speech rhythm as if chatting casually with a close friend',
    energik: 'viral short-form creator delivery in Indonesian, high enthusiasm, punchy, fast, dynamic cadence, exciting and engaging from the very first word',
    edukatif: 'structured, professional Indonesian educational lecture, very articulate, didactic, clear, and easy to comprehend step by step',
    emosional: 'deeply touching dramatic Indonesian narration, poignant emotional inflections, and impactful pauses on significant moments',
    promosi: 'persuasive commercial broadcast pitch in Indonesian, confident, engaging, upbeat, compelling call-to-action energy',
  };

  const sp = styleProfiles[style] || 'Clear, natural Indonesian speech';
  const directive = `${persona.personaDirective}, delivering ${sp}. Native Indonesian pronunciation, natural Indonesian intonation, authentic Indonesian vocal character, no foreign accent.`;

  return { directive, baseVoice: persona.baseVoice };
}

// 1. Voice Preview (instant cached sample for auditioning) - supports query and route param
const handleVoicePreview = async (req: Request, res: Response) => {
  const reqVoice = (req.params.voice || req.query.voice as string || 'Charon').trim();
  const persona = VOICE_DEFINITIONS[reqVoice] || VOICE_DEFINITIONS.Charon;
  const validVoiceId = persona.id;
  const cacheFile = path.join(PREVIEWS_DIR, `${validVoiceId}.json`);
  const publicCacheFile = path.join(path.resolve(__dirname, 'public/previews'), `${validVoiceId}.json`);

  // Serve instantly from cache if available in data/previews or public/previews
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      if (cached?.audioUrl) {
        return res.json({ success: true, audioUrl: cached.audioUrl, voice: validVoiceId, cached: true });
      }
    } catch (e) {
      console.warn('Cache read error for voice preview:', e);
    }
  } else if (fs.existsSync(publicCacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(publicCacheFile, 'utf-8'));
      if (cached?.audioUrl) {
        return res.json({ success: true, audioUrl: cached.audioUrl, voice: validVoiceId, cached: true });
      }
    } catch (e) {
      console.warn('Public preview cache read error:', e);
    }
  }

  if (!getApiKey()) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di environment server.' });
  }

  try {
    const { directive: styleInstruction, baseVoice } = buildSpeechStyleDirective(validVoiceId, persona.previewStyle);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: persona.previewText,
              speechMetadata: {
                style: styleInstruction,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: baseVoice },
          },
        },
      },
    });

    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) {
      return res.status(422).json({ error: 'Tidak dapat menghasilkan pratinjau audio.' });
    }

    const audioUrl = `data:audio/wav;base64,${base64Data}`;
    try {
      fs.writeFileSync(
        cacheFile,
        JSON.stringify({ audioUrl, voice: validVoiceId, name: persona.name, createdAt: new Date().toISOString() }),
        'utf-8'
      );
    } catch (writeErr) {
      console.warn('Failed to cache preview audio:', writeErr);
    }

    return res.json({ success: true, audioUrl, voice: validVoiceId, cached: false });
  } catch (err: any) {
    console.error('Error generating voice preview:', err);
    return res.status(500).json({ error: err.message || 'Gagal memuat pratinjau suara.' });
  }
};

app.get('/api/tts/preview', handleVoicePreview);
app.get('/api/tts/preview/:voice', handleVoicePreview);

// 2. Main TTS Generator with Indonesian Native Speaker Settings
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    const {
      text,
      voice = 'Charon',
      style = 'dokumenter',
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Naskah teks untuk voice-over wajib diisi.' });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        error: 'Teks narasi melebihi batas maksimal 5.000 karakter per sesi. Silakan perpendek naskah.',
      });
    }

    if (!getApiKey()) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di environment server.',
      });
    }

    const persona = VOICE_DEFINITIONS[voice] || VOICE_DEFINITIONS.Charon;
    const personaId = persona.id;
    const cleanText = text.trim();
    const { directive: styleInstruction, baseVoice } = buildSpeechStyleDirective(personaId, style);

    // Check disk & memory cache to save API quota and provide instant responses
    const cacheKey = crypto
      .createHash('sha256')
      .update(`${personaId}:${style}:${cleanText}`)
      .digest('hex');
    const cachedFile = path.join(AUDIO_CACHE_DIR, `${cacheKey}.json`);

    if (fs.existsSync(cachedFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cachedFile, 'utf-8'));
        if (cached && cached.audioUrl) {
          return res.json({
            success: true,
            audioUrl: cached.audioUrl,
            voice: personaId,
            style,
            languageCode: 'id-ID',
            textLength: cleanText.length,
            chunksProcessed: 1,
            audioSizeBytes: cached.audioSizeBytes || 0,
            cached: true,
          });
        }
      } catch (readErr) {
        console.warn('Failed reading audio cache file:', readErr);
      }
    }

    // Chunk text only if exceeding 2000 characters to keep sentence intonation smooth
    const chunks: string[] = [];
    if (cleanText.length <= 2000) {
      chunks.push(cleanText);
    } else {
      const sentences = cleanText.split(/(?<=[.!?\n])\s+/);
      let currentChunk = '';
      for (const sent of sentences) {
        if ((currentChunk + ' ' + sent).length > 1800 && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = sent;
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent;
        }
      }
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
    }

    const candidateModels = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];
    const wavBuffers: Buffer[] = [];
    let successfulModel = '';

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      if (i > 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }

      let response: any = null;
      let lastChunkErr: any = null;

      for (const m of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: enhanceTextForPersona(personaId, chunk),
                    speechMetadata: {
                      style: styleInstruction,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: baseVoice },
                },
              },
            },
          });

          const base64Data = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Data) {
            successfulModel = m;
            wavBuffers.push(Buffer.from(base64Data, 'base64'));
            break;
          }
        } catch (modelErr: any) {
          lastChunkErr = modelErr;
          console.warn(`[Gemini TTS Pool] Model ${m} tidak tersedia (${modelErr?.message?.slice(0, 100)}), beralih ke model cadangan...`);
        }
      }

      if (!response || wavBuffers.length <= i) {
        throw lastChunkErr || new Error('Semua model suara Gemini AI sedang sibuk. Silakan coba kembali.');
      }
    }

    if (wavBuffers.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Model TTS tidak mengembalikan data audio biner. Silakan coba kembali.',
      });
    }

    const finalWavBuffer = stitchWavBuffers(wavBuffers);
    const audioUrl = `data:audio/wav;base64,${finalWavBuffer.toString('base64')}`;

    try {
      fs.writeFileSync(
        cachedFile,
        JSON.stringify({
          audioUrl,
          audioSizeBytes: finalWavBuffer.length,
          voice: personaId,
          baseVoice,
          style,
          model: successfulModel,
          createdAt: new Date().toISOString(),
        }),
        'utf-8'
      );
    } catch (saveErr) {
      console.warn('Failed saving audio to cache:', saveErr);
    }

    return res.json({
      success: true,
      audioUrl,
      voice: personaId,
      style,
      languageCode: 'id-ID',
      modelUsed: successfulModel === 'gemini-3.8-flash-tts' ? 'Gemini 3.8 Flash TTS (Studio Neural)' : 'Gemini 3.8 Flash-Lite TTS',
      textLength: cleanText.length,
      chunksProcessed: chunks.length,
      audioSizeBytes: finalWavBuffer.length,
      cached: false,
    });
  } catch (error: any) {
    const msg = error.message || '';
    const isQuota = msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('quota');

    if (isQuota) {
      console.warn('[Gemini TTS Rate Limit/Quota]: Batas laju permintaan tercapai.');
    } else {
      console.error('Error generating TTS:', error);
    }

    return res.status(isQuota ? 429 : 500).json({
      success: false,
      isQuotaExceeded: isQuota,
      error: isQuota
        ? 'Batas laju permintaan Gemini Free Tier tercapai. Silakan tunggu beberapa saat lalu coba lagi.'
        : `Kesalahan Voice Over: ${msg || 'Gagal mengubah teks menjadi audio.'}`,
    });
  }
});

// 3. Audio & Projects Persistence
app.get('/api/projects', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const projects = readProjects();
  res.json({ success: true, data: projects });
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const projects = readProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
  }
  res.json({ success: true, data: project });
});

app.post('/api/projects', (req: Request, res: Response) => {
  try {
    const projects = readProjects();
    const newProject = {
      id: req.body.id || `audio_proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: req.body.title || 'Koleksi Audio Voice Over',
      description: req.body.description || '',
      topic: req.body.topic || '',
      engineType: 'voice_over',
      contentType: 'audio',
      standaloneAudios: req.body.standaloneAudios || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projects.unshift(newProject);
    writeProjects(projects);
    res.status(201).json({ success: true, data: newProject });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal membuat proyek audio.' });
  }
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projects = readProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    }

    const updated = {
      ...projects[index],
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };

    projects[index] = updated;
    writeProjects(projects);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui proyek.' });
  }
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projects = readProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) {
      return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    }
    writeProjects(filtered);
    res.json({ success: true, message: 'Proyek audio berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus proyek audio.' });
  }
});

// ==========================================
// 3. VIDEO KE TEKS & EKSTRAKSI AI MULTIMODAL
// ==========================================

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#xA;/g, '\n')
    .replace(/&nbsp;/g, ' ');
}

function extractJsonObject(str: string, startIdx: number): string | null {
  let open = 0;
  let found = false;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '{') {
      open++;
      found = true;
    } else if (str[i] === '}') {
      open--;
      if (open === 0 && found) {
        return str.slice(startIdx, i + 1);
      }
    }
  }
  return null;
}

function parseCaptionsXml(xml: string) {
  const segments: any[] = [];
  const regex = /<text\s+start=\"([\d\.]+)\"\s+dur=\"([\d\.]+)\"[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  let id = 1;
  while ((match = regex.exec(xml)) !== null) {
    const startSec = parseFloat(match[1]) || 0;
    const durSec = parseFloat(match[2]) || 0;
    const endSec = startSec + durSec;
    const rawText = match[3] || '';
    const clean = decodeHtmlEntities(rawText).replace(/<[^>]+>/g, '').trim();
    if (clean) {
      const min = Math.floor(startSec / 60);
      const sec = Math.floor(startSec % 60);
      const startStr = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');

      const endMin = Math.floor(endSec / 60);
      const endSecRemainder = Math.floor(endSec % 60);
      const endStr = String(endMin).padStart(2, '0') + ':' + String(endSecRemainder).padStart(2, '0');

      segments.push({
        id: `seg_${id++}`,
        start: startStr,
        end: endStr,
        startSeconds: startSec,
        endSeconds: endSec,
        text: clean,
      });
    }
  }
  return segments;
}

// 3.1 Ekstraksi dari Tautan URL (YouTube / Video URL)
app.post('/api/video-to-text/extract-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Tautan URL video wajib diisi.' });
    }

    const cleanUrl = url.trim();

    // Check for social media platforms that strictly block external server requests (TikTok, Instagram, Twitter)
    const isTikTok = /tiktok\.com/i.test(cleanUrl);
    const isInstagram = /instagram\.com|threads\.net/i.test(cleanUrl);
    const isTwitter = /twitter\.com|x\.com/i.test(cleanUrl);
    const isFacebook = /facebook\.com|fb\.watch/i.test(cleanUrl);

    if (isTikTok || isInstagram || isTwitter || isFacebook) {
      const platformName = isTikTok ? 'TikTok' : isInstagram ? 'Instagram Reels' : isTwitter ? 'X (Twitter)' : 'Facebook';
      return res.status(400).json({
        success: false,
        isSocialMedia: true,
        platform: platformName,
        error: `Tautan ${platformName} memiliki proteksi bot/login-wall ketat dari platform terkait.`,
        guidance: `Untuk mengekstrak video dari ${platformName}, silakan simpan/unduh videonya terlebih dahulu, lalu seret (drag & drop) berkas videonya langsung ke tab "Unggah Berkas Video" di atas. AI Gemini akan langsung mengekstrak teksnya!`,
      });
    }

    // YouTube handling
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const ytPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      const html = await ytPageRes.text();
      const marker = 'ytInitialPlayerResponse = ';
      const markerIdx = html.indexOf(marker);

      if (markerIdx === -1) {
        return res.status(404).json({ error: 'Gagal mengambil informasi video YouTube. Pastikan video bersifat publik.' });
      }

      const jsonStr = extractJsonObject(html, markerIdx + marker.length);
      if (!jsonStr) {
        return res.status(404).json({ error: 'Gagal membaca metadata video YouTube.' });
      }

      const playerResponse = JSON.parse(jsonStr);
      const videoDetails = playerResponse.videoDetails || {};
      const title = videoDetails.title || 'Video YouTube';
      const durationSeconds = parseInt(videoDetails.lengthSeconds, 10) || 0;
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const durationFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      const thumbnails = videoDetails.thumbnail?.thumbnails || [];
      const thumbnailUrl = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const captionTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

      if (!captionTracks || captionTracks.length === 0) {
        return res.status(404).json({
          success: false,
          noCaptions: true,
          title,
          thumbnailUrl,
          durationFormatted,
          error: 'Video YouTube ini belum memiliki subtitle atau transkrip otomatis yang aktif di YouTube.',
          guidance: 'Untuk video tanpa subtitle bawaan, Anda dapat mengunduh klip videonya lalu memasukkannya ke tab "Unggah Berkas Video" agar AI Gemini mentranskripsikannya secara langsung.',
        });
      }

      // Prioritize Indonesian track, else first track
      let selectedTrack = captionTracks.find((t: any) => t.languageCode === 'id' || (t.vssId && t.vssId.includes('.id')));
      if (!selectedTrack) {
        selectedTrack = captionTracks[0];
      }

      const captionRes = await fetch(selectedTrack.baseUrl);
      const captionXml = await captionRes.text();
      const segments = parseCaptionsXml(captionXml);

      if (segments.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Gagal mengekstrak isi teks subtitle dari video YouTube ini.',
        });
      }

      const fullTranscript = segments.map((s) => `[${s.start}] ${s.text}`).join('\n');
      const rawTextOnly = segments.map((s) => s.text).join(' ');

      // Use Gemini to clean for Voice Over and summarize
      let summary = `Video membahas tentang "${title}".`;
      let keyTakeaways = [title];
      let cleanVoiceOverScript = rawTextOnly.slice(0, 3000);

      try {
        const aiPrompt = `Berikut adalah transkrip video YouTube berjudul "${title}":\n\n${rawTextOnly.slice(0, 4000)}\n\nTolong buatkan dalam format JSON:\n1. "summary": Ringkasan intisari 2-3 kalimat dalam bahasa Indonesia.\n2. "keyTakeaways": Array 3-5 poin penting yang dibahas.\n3. "cleanVoiceOverScript": Naskah bersih dalam bahasa Indonesia yang mengalir lancar, tanpa kata terbata-bata, siap dibacakan ulang oleh pengisi suara (voice-over studio).`;

        const summaryRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
          config: { responseMimeType: 'application/json' },
        });

        if (summaryRes.text) {
          const parsedSummary = JSON.parse(summaryRes.text);
          if (parsedSummary.summary) summary = parsedSummary.summary;
          if (Array.isArray(parsedSummary.keyTakeaways)) keyTakeaways = parsedSummary.keyTakeaways;
          if (parsedSummary.cleanVoiceOverScript) cleanVoiceOverScript = parsedSummary.cleanVoiceOverScript;
        }
      } catch (sumErr) {
        console.warn('Gemini summary notice:', sumErr);
      }

      return res.json({
        success: true,
        data: {
          id: `ext_yt_${Date.now()}`,
          title,
          sourceType: 'youtube',
          sourceUrl: cleanUrl,
          durationFormatted,
          durationSeconds,
          language: selectedTrack.name?.simpleText || selectedTrack.languageCode || 'id',
          summary,
          keyTakeaways,
          fullTranscript,
          cleanVoiceOverScript,
          segments,
          createdAt: new Date().toISOString(),
          thumbnailUrl,
        },
      });
    }

    // Direct Media URL (e.g. .mp4, .mp3, .webm, .wav, .m4a)
    const isDirectMedia = /\.(mp4|webm|mp3|wav|m4a|ogg|mov)($|\?)/i.test(cleanUrl);
    if (isDirectMedia) {
      const mediaFetch = await fetch(cleanUrl);
      if (!mediaFetch.ok) {
        return res.status(400).json({ error: `Gagal mengunduh berkas media dari URL (${mediaFetch.status} ${mediaFetch.statusText}).` });
      }

      const arrayBuf = await mediaFetch.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length > 40 * 1024 * 1024) {
        return res.status(400).json({ error: 'Ukuran file media melebihi batas 40MB. Silakan gunakan berkas berukuran lebih kecil.' });
      }

      let contentType = mediaFetch.headers.get('content-type') || '';
      const urlExt = cleanUrl.split('?')[0].split('.').pop()?.toLowerCase();
      if (!contentType || contentType === 'application/octet-stream') {
        if (urlExt === 'mp4') contentType = 'video/mp4';
        else if (urlExt === 'webm') contentType = 'video/webm';
        else if (urlExt === 'mov') contentType = 'video/quicktime';
        else if (urlExt === 'mp3') contentType = 'audio/mp3';
        else if (urlExt === 'wav') contentType = 'audio/wav';
        else if (urlExt === 'm4a') contentType = 'audio/m4a';
        else contentType = 'video/mp4';
      }
      const cleanMime = contentType.split(';')[0].trim().toLowerCase();

      const base64Data = buffer.toString('base64');
      const genRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: cleanMime, data: base64Data } },
              {
                text: `Dengarkan audio dan tonton video ini secara seksama.
Transkripsikan seluruh percakapan dalam bahasa Indonesia secara lengkap dan akurat kata demi kata.
Kembalikan respon DALAM FORMAT JSON SAJA dengan format:
{
  "fullTranscript": "Teks transkripsi lengkap...",
  "sentences": ["Kalimat 1", "Kalimat 2"],
  "summary": "Ringkasan intisari 2-3 kalimat",
  "keyTakeaways": ["Poin penting 1", "Poin penting 2", "Poin penting 3"],
  "cleanVoiceOverScript": "Naskah narasi bersih siap dibacakan studio voice over"
}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      let fullTranscript = '';
      let sentences: string[] = [];
      let summary = `Hasil transkripsi dari tautan media ${cleanUrl.slice(0, 30)}...`;
      let keyTakeaways = ['Ekstraksi otomatis berhasil menggunakan AI Gemini 3.8 Flash.'];
      let cleanVoiceOverScript = '';

      if (genRes.text) {
        try {
          const parsed = JSON.parse(genRes.text);
          if (parsed.fullTranscript) fullTranscript = parsed.fullTranscript;
          if (Array.isArray(parsed.sentences) && parsed.sentences.length > 0) sentences = parsed.sentences;
          if (parsed.summary) summary = parsed.summary;
          if (Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0) keyTakeaways = parsed.keyTakeaways;
          if (parsed.cleanVoiceOverScript) cleanVoiceOverScript = parsed.cleanVoiceOverScript;
        } catch {
          fullTranscript = genRes.text;
        }
      }

      if (!fullTranscript && !cleanVoiceOverScript && sentences.length === 0) {
        return res.status(500).json({ error: 'AI tidak mendeteksi suara percakapan pada berkas video ini. Pastikan berkas memiliki audio yang jelas.' });
      }

      if (!fullTranscript) fullTranscript = cleanVoiceOverScript || sentences.join(' ');
      if (!cleanVoiceOverScript) cleanVoiceOverScript = fullTranscript;
      if (sentences.length === 0) {
        sentences = fullTranscript.split(/(?<=[.!?\n])\s+/).filter(Boolean);
      }

      let cumulativeSec = 0;
      const segments = sentences.map((sent: string, idx: number) => {
        const startSec = cumulativeSec;
        const dur = Math.max(2, Math.round(sent.split(' ').length * 0.4));
        const endSec = startSec + dur;
        cumulativeSec = endSec;

        const min = Math.floor(startSec / 60);
        const sec = Math.floor(startSec % 60);
        const startStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

        const endMin = Math.floor(endSec / 60);
        const endSecRem = Math.floor(endSec % 60);
        const endStr = `${String(endMin).padStart(2, '0')}:${String(endSecRem).padStart(2, '0')}`;

        return {
          id: `seg_${idx + 1}`,
          start: startStr,
          end: endStr,
          startSeconds: startSec,
          endSeconds: endSec,
          text: sent.trim(),
        };
      });

      return res.json({
        success: true,
        data: {
          id: `ext_url_${Date.now()}`,
          title: cleanUrl.split('/').pop()?.split('?')[0] || 'Media URL',
          sourceType: 'url',
          sourceUrl: cleanUrl,
          durationFormatted: `${Math.floor(cumulativeSec / 60)}m ${cumulativeSec % 60}s`,
          durationSeconds: cumulativeSec,
          language: 'id-ID',
          summary,
          keyTakeaways,
          fullTranscript: segments.map((s: any) => `[${s.start}] ${s.text}`).join('\n') || fullTranscript,
          cleanVoiceOverScript,
          segments,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return res.status(400).json({
      error: 'Tautan tidak dikenali. Masukkan tautan YouTube yang valid (youtube.com/watch... atau youtu.be/...) atau tautan berkas video langsung (.mp4/.webm).',
    });
  } catch (err: any) {
    console.error('Error in extract-url:', err);
    res.status(500).json({ error: err.message || 'Gagal mengekstrak teks dari tautan video.' });
  }
});

// 3.2 Ekstraksi dari Unggahan Berkas Video / Audio Langsung
app.post('/api/video-to-text/extract-upload', async (req: Request, res: Response) => {
  try {
    const { videoData, mimeType = 'video/mp4', fileName = 'video.mp4' } = req.body;
    if (!videoData || typeof videoData !== 'string') {
      return res.status(400).json({ error: 'Data video tidak ditemukan dalam permintaan.' });
    }

    const cleanBase64 = videoData.replace(/^data:[^;]+;base64,/, '');

    let cleanMime = mimeType.split(';')[0].trim().toLowerCase();
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    if (!cleanMime || cleanMime === 'application/octet-stream') {
      if (['mp4', 'm4v'].includes(fileExt)) cleanMime = 'video/mp4';
      else if (fileExt === 'webm') cleanMime = 'video/webm';
      else if (fileExt === 'mov') cleanMime = 'video/quicktime';
      else if (fileExt === 'mp3') cleanMime = 'audio/mp3';
      else if (fileExt === 'wav') cleanMime = 'audio/wav';
      else if (fileExt === 'm4a') cleanMime = 'audio/m4a';
      else if (fileExt === 'ogg') cleanMime = 'audio/ogg';
      else cleanMime = 'video/mp4';
    }

    // Direct multimodal extraction with gemini-3.8-flash
    const prompt = `Dengarkan audio dan tonton video ini secara seksama.
Transkripsikan seluruh isi percakapan kata demi kata secara lengkap dan akurat dalam bahasa Indonesia.
Kembalikan respon DALAM FORMAT JSON SAJA dengan format:
{
  "fullTranscript": "Seluruh teks transkripsi percakapan lengkap...",
  "sentences": ["Kalimat 1", "Kalimat 2"],
  "summary": "Ringkasan intisari video dalam 2-3 kalimat",
  "keyTakeaways": ["Poin penting 1", "Poin penting 2", "Poin penting 3"],
  "cleanVoiceOverScript": "Naskah narasi voice over bersih siap dibacakan ulang"
}`;

    const flashRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: cleanMime, data: cleanBase64 } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    let fullTranscript = '';
    let sentences: string[] = [];
    let summary = `Transkripsi berhasil diekstrak dari berkas "${fileName}".`;
    let keyTakeaways = [fileName, 'Transkripsi percakapan bahasa Indonesia lengkap.'];
    let cleanVoiceOverScript = '';

    if (flashRes.text) {
      try {
        const parsed = JSON.parse(flashRes.text);
        if (parsed.fullTranscript) fullTranscript = parsed.fullTranscript;
        if (Array.isArray(parsed.sentences) && parsed.sentences.length > 0) sentences = parsed.sentences;
        if (parsed.summary) summary = parsed.summary;
        if (Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0) keyTakeaways = parsed.keyTakeaways;
        if (parsed.cleanVoiceOverScript) cleanVoiceOverScript = parsed.cleanVoiceOverScript;
      } catch {
        fullTranscript = flashRes.text;
      }
    }

    if (!fullTranscript && !cleanVoiceOverScript && sentences.length === 0) {
      return res.status(500).json({ error: 'AI tidak mendeteksi suara percakapan pada berkas video ini. Pastikan video memiliki audio yang jelas.' });
    }

    if (!fullTranscript) fullTranscript = cleanVoiceOverScript || sentences.join(' ');
    if (!cleanVoiceOverScript) cleanVoiceOverScript = fullTranscript;
    if (sentences.length === 0) {
      sentences = fullTranscript.split(/(?<=[.!?\n])\s+/).filter(Boolean);
    }

    let cumulativeSec = 0;
    const segments = sentences.map((sent: string, idx: number) => {
      const startSec = cumulativeSec;
      const dur = Math.max(2, Math.round(sent.split(' ').length * 0.38));
      const endSec = startSec + dur;
      cumulativeSec = endSec;

      const min = Math.floor(startSec / 60);
      const sec = Math.floor(startSec % 60);
      const startStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

      const endMin = Math.floor(endSec / 60);
      const endSecRem = Math.floor(endSec % 60);
      const endStr = `${String(endMin).padStart(2, '0')}:${String(endSecRem).padStart(2, '0')}`;

      return {
        id: `seg_${idx + 1}`,
        start: startStr,
        end: endStr,
        startSeconds: startSec,
        endSeconds: endSec,
        text: sent.trim(),
      };
    });

    const totalMin = Math.floor(cumulativeSec / 60);
    const totalSec = cumulativeSec % 60;
    const durationFormatted = `${String(totalMin).padStart(2, '0')}:${String(totalSec).padStart(2, '0')}`;

    return res.json({
      success: true,
      data: {
        id: `ext_file_${Date.now()}`,
        title: fileName.replace(/\.[^/.]+$/, ''),
        sourceType: 'upload',
        fileName,
        durationFormatted,
        durationSeconds: cumulativeSec,
        language: 'id-ID',
        summary,
        keyTakeaways,
        fullTranscript,
        cleanVoiceOverScript,
        segments,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error in extract-upload:', err);
    res.status(500).json({ error: err.message || 'Gagal mengekstrak teks dari unggahan video.' });
  }
});

// Any unmatched /api route returns JSON 404
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint API tidak ditemukan.' });
});

// Vite & Static server setup
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎙️ Driacom AI Voice Over Studio berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
