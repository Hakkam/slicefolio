export type OutputMode = 'portrait' | 'tall' | 'square';
export type ExportFormat = 'png' | 'jpeg';
export type SliceRotation = 0 | -90;
export type PaddingScope = 'all' | 'selected';

export interface SourceSegment {
  source: CanvasImageSource;
  width: number;
  height: number;
  normalizedHeight: number;
}

export interface SourceDocument {
  name: string;
  fileType: 'pdf' | 'image';
  fileSize: number;
  width: number;
  totalHeight: number;
  pageCount: number;
  segments: SourceSegment[];
}

export interface SlicePlan {
  index: number;
  role: 'cover' | 'body';
  width: number;
  height: number;
  sourceStart: number;
  sourceEnd: number;
  rotation: SliceRotation;
}

export interface SliceAsset extends SlicePlan {
  id: string;
  blob: Blob;
  url: string;
  fileName: string;
}

export interface PaddingSettings {
  enabled: boolean;
  scope: PaddingScope;
  linked: boolean;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SliceOptions {
  mode: OutputMode;
  background: string;
  format: ExportFormat;
  jpegQuality: number;
  padding: PaddingSettings;
}

export type ProgressCallback = (progress: number, label: string) => void;
