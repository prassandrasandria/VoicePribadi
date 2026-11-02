// Pre-generated static voice samples loaded on-demand.
// Fetches static JSON from /previews/{voice}.json or /api/tts/preview/{voice}
// without bundling multi-megabyte base64 audio strings into the JavaScript payload.

export interface VoicePreviewData {
  audioUrl: string;
  voice: string;
  cached?: boolean;
}

const memoryCache = new Map<string, VoicePreviewData>();

export async function loadBundledVoicePreview(voice: string): Promise<VoicePreviewData | null> {
  const normVoice = voice.trim();
  if (memoryCache.has(normVoice)) {
    return memoryCache.get(normVoice)!;
  }

  const CACHE_KEY = `driacom_voice_preview_v3_${normVoice}`;

  // 1. Try static public file (/previews/{voice}.json?v=3) first for latest authentic voice
  try {
    const res = await fetch(`/previews/${encodeURIComponent(normVoice)}.json?v=3`, {
      headers: { Accept: 'application/json' },
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && !ct.includes('text/html')) {
      const json = await res.json();
      if (json?.audioUrl) {
        const result: VoicePreviewData = {
          audioUrl: json.audioUrl,
          voice: json.voice || normVoice,
          cached: true,
        };
        memoryCache.set(normVoice, result);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch {}
        return result;
      }
    }
  } catch (staticErr) {
    console.debug(`[VoicePreview] Static URL fetch for ${normVoice} notice:`, staticErr);
  }

  // 2. Try localStorage cache
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        parsed?.audioUrl &&
        typeof parsed.audioUrl === 'string' &&
        (parsed.audioUrl.startsWith('data:audio') || parsed.audioUrl.startsWith('/') || parsed.audioUrl.startsWith('http'))
      ) {
        memoryCache.set(normVoice, parsed);
        return parsed;
      }
    }
  } catch {}

  // 3. Fallback to API route /api/tts/preview/{voice}
  try {
    const res = await fetch(`/api/tts/preview/${encodeURIComponent(normVoice)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.audioUrl) {
        const result: VoicePreviewData = {
          audioUrl: json.audioUrl,
          voice: json.voice || normVoice,
          cached: true,
        };
        memoryCache.set(normVoice, result);
        return result;
      }
    }
  } catch {}

  return null;
}
