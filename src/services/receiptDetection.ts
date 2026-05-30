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

/**
 * Processes an image to determine if it contains a receipt
 * @param imageFile - The image file to process
 * @returns Promise that resolves to a boolean indicating if the image is a receipt
 */
export const isReceipt = async (imageFile: File): Promise<{ isReceipt: boolean; confidence: number }> => {
  let worker;
  try {
    worker = await createWorker('eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@4/tesseract-core.wasm.js',
      logger: (m) => console.log('[Tesseract]', m),
    });

    const { data } = await worker.recognize(imageFile);
    console.log('[Receipt] OCR text:', data.text);

    const text = data.text.toLowerCase();
    const keywordMatches = RECEIPT_KEYWORDS.filter(keyword => text.includes(keyword)).length;
    const patternMatches = RECEIPT_PATTERNS.filter(p => p.test(data.text)).length;
    const confidence = Math.min(1, (keywordMatches + patternMatches * 3) / 10);
    console.log('[Receipt] keywords:', keywordMatches, 'patterns:', patternMatches, 'confidence:', confidence);

    return { isReceipt: confidence >= MIN_CONFIDENCE, confidence };
  } catch (error) {
    console.error('[Receipt] Error:', error);
    return { isReceipt: false, confidence: 0 };
  } finally {
    await worker?.terminate();
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
