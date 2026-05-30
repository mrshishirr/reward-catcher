// Read EXIF orientation from JPEG bytes (1=normal, 3=180°, 6=90°CW, 8=90°CCW)
const getExifOrientation = (buffer: ArrayBuffer): number => {
  const view = new DataView(buffer);
  if (view.getUint16(0) !== 0xFFD8) return 1; // not JPEG
  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint16(offset) === 0xFFE1) {
      if (view.getUint32(offset + 4) !== 0x45786966) return 1; // no Exif
      const little = view.getUint8(offset + 10) === 0x49;
      const ifdOffset = offset + 10 + view.getUint32(offset + 14, little);
      const tags = view.getUint16(ifdOffset, little);
      for (let i = 0; i < tags; i++) {
        if (view.getUint16(ifdOffset + 2 + i * 12, little) === 0x0112) {
          return view.getUint16(ifdOffset + 2 + i * 12 + 8, little);
        }
      }
      return 1;
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return 1;
};

const applyOrientation = (ctx: CanvasRenderingContext2D, orientation: number, w: number, h: number) => {
  switch (orientation) {
    case 3: ctx.transform(-1, 0, 0, -1, w, h); break;
    case 6: ctx.transform(0, 1, -1, 0, h, 0); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, w); break;
  }
};

/**
 * Compresses and resizes an image file, correcting EXIF orientation (important for iOS photos)
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
      const buffer = event.target?.result as ArrayBuffer;
      const orientation = getExifOrientation(buffer);
      const blob = new Blob([buffer], { type: file.type });
      img.src = URL.createObjectURL(blob);

      img.onload = () => {
        const rotated = orientation >= 5; // 5,6,7,8 swap width/height
        let width = rotated ? img.height : img.width;
        let height = rotated ? img.width : img.height;

        if (width > height) {
          if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round(width * maxHeight / height); height = maxHeight; }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.save();
        applyOrientation(ctx, orientation, width, height);
        ctx.drawImage(img, 0, 0, rotated ? height : width, rotated ? width : height);
        ctx.restore();

        URL.revokeObjectURL(img.src);

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Failed to compress image')); return; }
            resolve(blob.size > file.size ? file : blob);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file); // read as ArrayBuffer to parse EXIF
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
