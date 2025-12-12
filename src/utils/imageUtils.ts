/**
 * Compresses and resizes an image file
 * @param file - The image file to process
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @param quality - Image quality (0-1)
 * @returns Promise that resolves to a Blob of the compressed image
 */
export const compressImage = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1600,
  quality = 0.7
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not create canvas context'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      img.src = imgUrl;
    };

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with specified quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // If the compressed size is larger than original, return original
          if (blob.size > file.size) {
            resolve(file);
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a Blob to a File
 * @param blob - The Blob to convert
 * @param filename - The name of the resulting File
 * @returns A File object
 */
export const blobToFile = (blob: Blob, filename: string): File => {
  return new File([blob], filename, {
    type: blob.type || 'application/octet-stream',
    lastModified: Date.now(),
  });
};

/**
 * Creates a preview URL for an image file
 * @param file - The image file
 * @returns A data URL for the image
 */
export const createPreviewUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create preview URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Processes an image file by compressing it and creating a preview
 * @param file - The image file to process
 * @returns An object containing the processed file and preview URL
 */
export const processImageFile = async (file: File): Promise<{ file: File; previewUrl: string }> => {
  try {
    // Compress the image
    const compressedBlob = await compressImage(file);
    
    // Convert back to File if needed
    const processedFile = compressedBlob instanceof File 
      ? compressedBlob 
      : blobToFile(compressedBlob, file.name);
    
    // Create preview URL
    const previewUrl = await createPreviewUrl(processedFile);
    
    return { file: processedFile, previewUrl };
  } catch (error) {
    console.error('Error processing image:', error);
    // If processing fails, return the original file
    const previewUrl = await createPreviewUrl(file);
    return { file, previewUrl };
  }
};
