import { createWorker } from 'tesseract.js';

// Common receipt-related keywords to identify receipts
const RECEIPT_KEYWORDS = [
  'total', 'subtotal', 'tax', 'change', 'cash', 'visa', 'mastercard',
  'debit', 'credit', 'receipt', 'invoice', 'amount', 'paid',
  'thank you', 'balance', 'tender', 'card', 'cashier',
  'date', 'time', 'item', 'qty', 'quantity', 'price', 'store', 'shop',
  'sale', 'purchase', 'order', 'payment', 'approved', 'transaction',
  'change due', 'net', 'gross', 'discount', 'savings', 'member',
  'ref', 'auth', 'terminal', 'merchant', 'customer', 'register',
];

// Regex patterns that strongly indicate a receipt regardless of keywords
const RECEIPT_PATTERNS = [
  /\$\s*\d+\.\d{2}/,          // dollar amounts like $12.99
  /\d+\.\d{2}\s*(usd|aud|cad|gbp|eur)?/i, // decimal prices
  /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,   // dates like 05/29/2024
  /\d{1,2}:\d{2}\s*(am|pm)?/i,            // times like 3:45 PM
];

// Minimum confidence threshold for receipt detection (0-1)
const MIN_CONFIDENCE = 0.15;

// Persistent worker — created once, reused across all photos
let workerInstance: Awaited<ReturnType<typeof createWorker>> | null = null;

const getWorker = async () => {
  if (!workerInstance) {
    workerInstance = await createWorker('eng', 1, {
      workerPath: '/reward-catcher/worker.min.js',
      corePath: '/reward-catcher/tesseract-core.wasm.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      workerBlobURL: false,
    });
  }
  return workerInstance;
};

// Resize image to max width for faster OCR (Tesseract doesn't need full resolution)
const resizeForOcr = (file: File, maxDim = 1000): Promise<File> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const longest = Math.max(img.width, img.height);
      if (longest <= maxDim) { URL.revokeObjectURL(img.src); resolve(file); return; }
      const scale = maxDim / longest;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      canvas.toBlob(blob => {
        resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file);
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
const rotateImage = (file: File, degrees: 90 | 180 | 270): Promise<File> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const swap = degrees === 90 || degrees === 270;
      const canvas = document.createElement('canvas');
      canvas.width = swap ? img.height : img.width;
      canvas.height = swap ? img.width : img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('rotate failed')); return; }
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

const scoreText = (text: string): number => {
  const lower = text.toLowerCase();
  const keywords = RECEIPT_KEYWORDS.filter(k => lower.includes(k)).length;
  const patterns = RECEIPT_PATTERNS.filter(p => p.test(text)).length;
  return keywords + patterns * 3;
};
export const isReceipt = async (imageFile: File): Promise<{ isReceipt: boolean; confidence: number }> => {
  const t0 = performance.now();
  try {
    const worker = await getWorker();
    console.log(`[Receipt] worker ready: ${(performance.now() - t0).toFixed(0)}ms`);

    // Log original photo metadata (no extra Image load needed — use file directly)
    console.log(`[Receipt] photo: ${imageFile.name} ${(imageFile.size / 1024).toFixed(0)}KB type:${imageFile.type}`);

    const ocrFile = await resizeForOcr(imageFile);

    // Get dims of the OCR file (resized or original) — reuse for landscape check
    const ocrImg = new Image();
    const dims = await new Promise<{w: number, h: number}>(res => {
      ocrImg.onload = () => { res({w: ocrImg.width, h: ocrImg.height}); URL.revokeObjectURL(ocrImg.src); };
      ocrImg.src = URL.createObjectURL(ocrFile);
    });
    if (ocrFile !== imageFile) {
      console.log(`[Receipt] resized for OCR: ${dims.w}x${dims.h} ${(ocrFile.size / 1024).toFixed(0)}KB`);
    } else {
      console.log(`[Receipt] OCR dims: ${dims.w}x${dims.h}`);
    }

    const t1 = performance.now();
    const { data } = await worker.recognize(ocrFile);
    console.log(`[Receipt] OCR pass 1: ${(performance.now() - t1).toFixed(0)}ms score:`, scoreText(data.text));
    let bestScore = scoreText(data.text);

    if (dims.w > dims.h) {
      for (const deg of [90, 180, 270] as const) {
        const t2 = performance.now();
        const rotated = await rotateImage(ocrFile, deg);
        const { data: rotData } = await worker.recognize(rotated);
        const rotScore = scoreText(rotData.text);
        console.log(`[Receipt] ${deg}° pass: ${(performance.now() - t2).toFixed(0)}ms score:`, rotScore);
        if (rotScore > bestScore) bestScore = rotScore;
      }
    }

    const confidence = Math.min(1, bestScore / 10);
    console.log(`[Receipt] total: ${(performance.now() - t0).toFixed(0)}ms confidence:`, confidence);
    return { isReceipt: confidence >= MIN_CONFIDENCE, confidence };
  } catch (error) {
    console.error('[Receipt] Error:', String(error));
    return { isReceipt: false, confidence: 0 };
  }
};

/**
 * Processes multiple images in parallel with a concurrency limit
 * @param images - Array of image files to process
 * @param concurrency - Maximum number of images to process in parallel
 * @returns Array of results indicating whether each image is a receipt
 */
const processImages = async (
  images: File[], 
  concurrency = 3
): Promise<{ file: File; isReceipt: boolean; confidence: number }[]> => {
  const results: { file: File; isReceipt: boolean; confidence: number }[] = [];

  // Process images in batches
  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const result = await isReceipt(file);
        return { file, ...result };
      })
    );
    results.push(...batchResults);
  }

  return results;
};

export { processImages };
