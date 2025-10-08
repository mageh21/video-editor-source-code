/**
 * Advanced rendering types for professional video export
 */

export type RenderFormat = 'mp4' | 'webm-alpha' | 'mov-alpha' | 'gif' | 'apng' | 'webp' | 'prores';

export interface RenderSettings {
  format: RenderFormat;
  quality: 'low' | 'medium' | 'high' | 'ultra' | 'lossless';
  resolution: string;
  fps: number;
  bitrate?: string;
  preset?: string;
  
  // Transparency settings
  alphaChannel?: boolean;
  backgroundColor?: string;
  
  // Advanced options
  chromaKey?: {
    enabled: boolean;
    color: string;
    similarity: number;
    blend: number;
  };
  
  // Hardware acceleration
  hwAccel?: 'none' | 'auto' | 'cuda' | 'videotoolbox' | 'qsv';
}

export interface AnimatedAsset {
  id: string;
  type: 'gif' | 'apng' | 'webp' | 'lottie' | 'svg';
  url: string;
  frames?: number;
  duration?: number;
  loop?: boolean;
  hasAlpha?: boolean;
}

export interface FilterPipeline {
  id: string;
  name: string;
  filters: FilterNode[];
}

export interface FilterNode {
  type: 'scale' | 'overlay' | 'chromakey' | 'fade' | 'blur' | 'rotate' | 'mask';
  params: Record<string, any>;
  input?: string;
  output?: string;
}

export const FORMAT_CONFIGS: Record<RenderFormat, any> = {
  'mp4': {
    extension: 'mp4',
    codec: 'libx264',
    pixelFormat: 'yuv420p',
    supportAlpha: false,
    ffmpegArgs: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
  },
  'webm-alpha': {
    extension: 'webm',
    codec: 'libvpx-vp9',
    pixelFormat: 'yuva420p',
    supportAlpha: true,
    ffmpegArgs: [
      '-c:v', 'libvpx-vp9', 
      '-pix_fmt', 'yuva420p', 
      '-auto-alt-ref', '0',
      '-lag-in-frames', '0',
      '-g', '30',
      '-cpu-used', '1',
      '-row-mt', '1'
    ]
  },
  'mov-alpha': {
    extension: 'mov',
    codec: 'qtrle',
    pixelFormat: 'argb',
    supportAlpha: true,
    ffmpegArgs: ['-c:v', 'qtrle', '-pix_fmt', 'argb']
  },
  'gif': {
    extension: 'gif',
    codec: 'gif',
    pixelFormat: 'pal8',
    supportAlpha: true,
    needsPalette: true,
    ffmpegArgs: ['-f', 'gif']
  },
  'apng': {
    extension: 'apng',
    codec: 'apng',
    pixelFormat: 'rgba',
    supportAlpha: true,
    ffmpegArgs: ['-c:v', 'apng', '-pix_fmt', 'rgba', '-plays', '0']
  },
  'webp': {
    extension: 'webp',
    codec: 'libwebp_anim',
    pixelFormat: 'yuva420p',
    supportAlpha: true,
    ffmpegArgs: ['-c:v', 'libwebp_anim', '-lossless', '0', '-compression_level', '6']
  },
  'prores': {
    extension: 'mov',
    codec: 'prores_ks',
    pixelFormat: 'yuva444p10le',
    supportAlpha: true,
    ffmpegArgs: ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0']
  }
};

export const QUALITY_PRESETS = {
  low: { crf: 28, bitrate: '1M' },
  medium: { crf: 23, bitrate: '2M' },
  high: { crf: 18, bitrate: '5M' },
  ultra: { crf: 15, bitrate: '10M' },
  lossless: { crf: 0, bitrate: '50M' }
};

export const CHROMAKEY_PRESETS = {
  greenScreen: { color: '0x00FF00', similarity: 0.15, blend: 0.2 },
  blueScreen: { color: '0x0000FF', similarity: 0.15, blend: 0.2 },
  whiteScreen: { color: '0xFFFFFF', similarity: 0.10, blend: 0.1 },
  blackScreen: { color: '0x000000', similarity: 0.10, blend: 0.1 }
};