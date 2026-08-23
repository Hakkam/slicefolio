import type { Canvas, Image } from '@napi-rs/canvas';

export type OutputMode = 'portrait' | 'tall' | 'square';
export type ExportFormat = 'png' | 'jpeg';
export type PaddingScope = 'all' | 'selected';
export type SourceKind = 'pdf' | 'image';

export interface PaddingSettings {
  enabled: boolean;
  scope: PaddingScope;
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

export interface SourceSegment {
  source: Canvas | Image;
  width: number;
  height: number;
  normalizedHeight: number;
}

export interface SourceDocument {
  name: string;
  fileType: SourceKind;
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
  rotation: 0 | -90;
}

export interface GeneratedSlice extends SlicePlan {
  fileName: string;
  buffer: Buffer;
}

export interface ProcessingLimits {
  maxFileSizeBytes: number;
  maxPdfPages: number;
  maxSlides: number;
}

export interface SourceInput {
  name: string;
  mimeType?: string;
  buffer: Buffer;
}
