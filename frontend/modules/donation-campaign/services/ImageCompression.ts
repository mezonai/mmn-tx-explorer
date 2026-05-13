import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

export const ImageCompression = () => {
  const compressImage = async (processedFile: File): Promise<File | null> => {
    try {
      return await imageCompression(processedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.85,
      });
    } catch {
      toast.error(`Failed to compress ${processedFile.name}. Please try a different image.`);
      return null;
    }
  };

  const compressImages = async (files: File[]): Promise<File[]> => {
    const results = await Promise.all(files.map(compressImage));
    return results.filter((f): f is File => f !== null);
  };

  return {
    compressImage,
    compressImages,
  };
};
