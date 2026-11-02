export type ContentType =
  | 'video'
  | 'gambar'
  | 'storytelling'
  | 'iklan'
  | 'affiliate'
  | 'edukasi'
  | 'fakta_unik'
  | 'misteri'
  | 'dokumenter'
  | 'audio';

export type PlatformType =
  | 'tiktok'
  | 'reels'
  | 'shorts'
  | 'youtube'
  | 'instagram';

export type VisualStyleType =
  | 'cinematic'
  | 'photorealistic'
  | '3d_animation'
  | 'anime'
  | 'product_photography'
  | 'cyberpunk'
  | 'minimalist'
  | 'vintage'
  | 'custom';

export type AspectRatioType = '9:16' | '16:9' | '1:1' | '4:5' | '3:4';

export type PromptModeType =
  | 'google_flow'
  | 'text_to_image'
  | 'video'
  | 'custom';

export type VoiceId =
  | 'Kore'
  | 'Zephyr'
  | 'Aoede'
  | 'Charon'
  | 'Puck'
  | 'Fenrir'
  | 'anak_pria'
  | 'anak_wanita'
  | 'bapak'
  | 'kakek'
  | 'ibu'
  | 'nenek'
  | 'kartun'
  | 'Wowi'
  | 'gufron_syududu'
  | 'storyteller_1'
  | 'storyteller_2';

export type VoiceCategory = 'all' | 'storytelling' | 'anak' | 'orang_tua' | 'kartun' | 'standar' | 'tokoh';

export type NarrationStyle =
  | 'dokumenter'
  | 'natural'
  | 'energik'
  | 'edukatif'
  | 'emosional'
  | 'promosi';

export interface SceneImagePromptData {
  prompt: string;
  negativePrompt: string;
  fullPrompt: string;
  aspectRatio: string;
  style: string;
  createdAt: string;
  notes?: string;
}

export interface SceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  voiceoverText: string;
  visualPrompt: string;
  cameraMovement: string;
  soundEffects: string;
  dialogue?: string;
  visualElements?: string;
  completeVideoPrompt?: string;
  sceneImagePrompt?: SceneImagePromptData;
  generatedImage?: {
    url: string;
    aspectRatio: string;
    style: string;
    createdAt: string;
    promptUsed: string;
  };
  generatedAudio?: {
    url: string;
    voice: string;
    style: string;
    createdAt: string;
  };
}

export interface ThumbnailData {
  titleText: string;
  visualPrompt: string;
  negativePrompt: string;
  fullPrompt: string;
  compositionTip?: string;
}

export interface SocialCaptionData {
  captionText: string;
  tags: string[];
  fullCaptionWithTags: string;
  callToAction?: string;
}

export interface GeneratedScript {
  hook: string;
  concept: string;
  targetAudience: string;
  tone: string;
  negativePrompt: string;
  consistencyRules: string;
  hasCharacter?: boolean;
  characterSheetPrompt?: string;
  clipsUsingCharacter?: number[];
  characterConsistencyInstructions?: string;
  tags: string[];
  thumbnail?: ThumbnailData;
  socialCaption?: SocialCaptionData;
  scenes: SceneItem[];
}

export interface SavedImagePrompt {
  id: string;
  title?: string;
  subject: string;
  prompt: string;
  negativePrompt: string;
  fullPrompt?: string;
  aspectRatio: AspectRatioType | string;
  visualStyle: string;
  lighting?: string;
  cameraAngle?: string;
  continuityMode?: 'general' | 'animation' | 'affiliate';
  targetTool?: 'google_flow' | 'gemini_image' | 'midjourney' | 'universal';
  compositionNotes?: string;
  createdAt: string;
  // Legacy compatibility for previously saved standalone images
  url?: string;
}

export interface GeneratedImagePromptResult {
  subject: string;
  visualPrompt: string;
  negativePrompt: string;
  fullPrompt: string;
  aspectRatio: string;
  visualStyle: string;
  compositionNotes: string;
  continuityRules?: string;
  suggestedTools?: string[];
}

export interface StandaloneImage {
  id: string;
  prompt: string;
  aspectRatio: string;
  style: string;
  url: string;
  createdAt: string;
}

export interface StandaloneAudio {
  id: string;
  text: string;
  voice: string;
  style: string;
  url: string;
  createdAt: string;
}

export type EngineType = 'animation' | 'affiliate' | 'general' | 'voice_over';

export type AnimationGenre =
  | 'scifi'
  | 'fantasy'
  | 'slice_of_life'
  | 'mystery'
  | 'cyberpunk'
  | 'comedy'
  | 'action'
  | 'dark_fantasy'
  | 'horror';

export type AnimationArtStyle =
  | 'pixar_3d'
  | 'anime_shinkai'
  | 'ghibli_2d'
  | 'claymation'
  | 'comic_noir'
  | 'watercolor'
  | 'pixel_art'
  | 'cyberpunk_stylized'
  | 'low_poly_3d';

export interface MasterCharacterSheet {
  name: string;
  role: string;
  ageGender: string;
  faceFeatures: string;
  hair: string;
  clothingCostume: string;
  accessoriesProps: string;
  personalityTraits: string;
  colorPalette: string;
  visualAppearance?: string;
  defaultCostume?: string;
}

export interface AnimationSceneItem {
  id: string;
  sceneNumber: number;
  beatTitle: string;
  durationSeconds: number;
  storyContext: string;
  characterAction: string;
  facialExpression: string;
  dialogueOrNarration: string;
  cameraMovement: string;
  lightingAndAtmosphere: string;
  environmentSetting: string;
  sfxAndFoley: string;
  visualPromptGoogleFlow: string;
  continuityChecks: string;
  completeVideoPrompt?: string;
  sceneImagePrompt?: SceneImagePromptData;
  generatedImage?: {
    url: string;
    aspectRatio: string;
    style: string;
    createdAt: string;
    promptUsed: string;
  };
  generatedAudio?: {
    url: string;
    voice: string;
    style: string;
    createdAt: string;
  };
}

export interface AnimationScript {
  logline: string;
  synopsis: string;
  genre: AnimationGenre;
  artStyle: AnimationArtStyle;
  masterCharacterSheet?: MasterCharacterSheet;
  worldSetting: string;
  characterConsistencyPrompt?: string;
  negativePrompt: string;
  hasCharacter?: boolean;
  characterSheetPrompt?: string;
  clipsUsingCharacter?: number[];
  characterConsistencyInstructions?: string;
  scenes: AnimationSceneItem[];
}

export type AffiliateContentType =
  | 'review'
  | 'unboxing'
  | 'ugc_testimoni'
  | 'softselling'
  | 'hardselling'
  | 'problem_solution'
  | 'product_demo';

export type AffiliateCameraStyle =
  | 'smartphone_pov'
  | 'hands_on_macro'
  | 'face_to_camera_ugc'
  | 'mirror_selfie'
  | 'studio_commercial'
  | 'split_screen_demo';

export type AffiliatePlatform =
  | 'tiktok_shop'
  | 'shopee_video'
  | 'reels_affiliate'
  | 'shorts_affiliate';

export interface ProductDetails {
  productName: string;
  brand: string;
  category: string;
  packagingAndColor: string;
  keyLabelText: string;
  verifiedFeatures: string[];
  targetAudiencePainPoint: string;
  priceOrPromoOffer?: string;
  ctaAction: string;
}

export interface AffiliateSceneItem {
  id: string;
  sceneNumber: number;
  stageName: string;
  durationSeconds: number;
  spokenNarration: string;
  onScreenText: string;
  visualPromptGoogleFlow: string;
  productHandlingAction: string;
  cameraStyle: string;
  soundEffects: string;
  conversionTrigger: string;
  completeVideoPrompt?: string;
  sceneImagePrompt?: SceneImagePromptData;
  generatedImage?: {
    url: string;
    aspectRatio: string;
    style: string;
    createdAt: string;
    promptUsed: string;
  };
  generatedAudio?: {
    url: string;
    voice: string;
    style: string;
    createdAt: string;
  };
}

export interface AffiliateScript {
  productDetails: ProductDetails;
  hookHeadline: string;
  angleStrategy: string;
  guaranteedConsistencyRules: string;
  negativePrompt: string;
  ctaSummary: string;
  complianceNote: string;
  hasCharacter?: boolean;
  characterSheetPrompt?: string;
  clipsUsingCharacter?: number[];
  characterConsistencyInstructions?: string;
  scenes: AffiliateSceneItem[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  topic: string;
  engineType: EngineType;
  contentType?: ContentType | AffiliateContentType;
  platform?: PlatformType | AffiliatePlatform;
  visualStyle?: VisualStyleType | AnimationArtStyle;
  aspectRatio: AspectRatioType;
  duration: string;
  sceneCount: number;
  mode: PromptModeType;
  script?: GeneratedScript;
  animationScript?: AnimationScript;
  affiliateScript?: AffiliateScript;
  imagePrompts?: SavedImagePrompt[];
  standaloneImages?: StandaloneImage[];
  standaloneAudios?: StandaloneAudio[];
  createdAt: string;
  updatedAt: string;
}

export interface VoiceOptionItem {
  id: VoiceId | string;
  name: string;
  gender: 'Pria' | 'Wanita';
  category: 'storytelling' | 'anak' | 'orang_tua' | 'kartun' | 'standar' | 'tokoh';
  description: string;
  badge: string;
  highlight?: boolean;
  recommendedFor: string;
}

export interface SystemConfig {
  hasGeminiKey: boolean;
  isBackendConnected?: boolean;
  backendError?: string;
  textModel: string;
  imagePromptModel: string;
  imageModel?: string;
  ttsModel: string;
  languageCode?: string;
  voiceOptions: VoiceOptionItem[];
}

export interface StorylineResult {
  title: string;
  logline: string;
  act1: string;
  act2: string;
  act3: string;
  fullStory: string;
}

export interface VideoSubtitleSegment {
  id: string;
  start: string;
  end: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  speaker?: string;
}

export interface VideoExtractionResult {
  id: string;
  title: string;
  sourceType: 'upload' | 'youtube' | 'url';
  sourceUrl?: string;
  fileName?: string;
  durationFormatted?: string;
  durationSeconds?: number;
  language?: string;
  summary: string;
  keyTakeaways: string[];
  fullTranscript: string;
  cleanVoiceOverScript: string;
  segments: VideoSubtitleSegment[];
  createdAt: string;
  thumbnailUrl?: string;
}


