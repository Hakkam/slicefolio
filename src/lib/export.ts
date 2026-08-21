import type { ProgressCallback, SliceAsset } from '../types';

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSlice(slice: SliceAsset) {
  triggerDownload(slice.blob, slice.fileName);
}

export async function downloadAllSlices(
  slices: SliceAsset[],
  onProgress?: ProgressCallback,
) {
  if (!slices.length) return;

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  slices.forEach((slice) => zip.file(slice.fileName, slice.blob));

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(metadata.percent / 100, 'Packaging ZIP');
    },
  );

  triggerDownload(blob, 'slicefolio-carousel.zip');
  onProgress?.(1, 'Downloaded');
}
