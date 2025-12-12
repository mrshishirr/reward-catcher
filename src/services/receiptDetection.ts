import { createWorker } from 'tesseract.js';

// Common receipt-related keywords to identify receipts
const RECEIPT_KEYWORDS = [
  'total', 'subtotal', 'tax', 'change', 'cash', 'visa', 'mastercard',
  'debit', 'credit', 'receipt', 'invoice', 'change', 'amount', 'paid',
  'thank you', 'change due', 'balance', 'tender', 'card', 'cashier',
  'date', 'time', 'item', 'qty', 'quantity', 'price', 'store', 'shop'
];

// Minimum confidence threshold for receipt detection (0-1)
const MIN_CONFIDENCE = 0.3;

/**
 * Processes an image to determine if it contains a receipt
 * @param imageFile - The image file to process
 * @returns Promise that resolves to a boolean indicating if the image is a receipt
 */
export const isReceipt = async (imageFile: File): Promise<{ isReceipt: boolean; confidence: number }> => {
  try {
    // Create and configure worker
    const worker = await createWorker();
    // await worker.load();
    
    // Process the image
    const { data } = await worker.recognize(imageFile);
    console.log('Processed receipt detection for image');
    
    // Extract text and convert to lowercase for case-insensitive matching
    const text = data.text.toLowerCase();
    
    // Count how many receipt keywords are found in the text
    const matches = RECEIPT_KEYWORDS.filter(keyword => 
      text.includes(keyword)
    ).length;
    
    // Calculate a confidence score (0-1)
    const confidence = Math.min(1, matches / 10);
    
    // Clean up
    await worker.terminate();
    
    return {
      isReceipt: confidence >= MIN_CONFIDENCE,
      confidence
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      isReceipt: false,
      confidence: 0,
    };
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
