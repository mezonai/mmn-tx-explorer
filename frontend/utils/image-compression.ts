import imageCompression from 'browser-image-compression';

/**
 * Compress an image file to ensure it's under the specified size limit
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum file size in MB 
 * @param maxWidthOrHeight - Maximum width or height in pixels (default: 1920)
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 2,
  maxWidthOrHeight: number = 1920
): Promise<File> {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: file.type,
    initialQuality: 0.9,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Format file size to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
