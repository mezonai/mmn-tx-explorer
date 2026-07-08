import imageCompression, { Options } from 'browser-image-compression';
import { toast } from 'sonner';
import { IMAGE_CONSTRAINTS } from '../constants';

const COMPRESSION_OPTIONS: Options = {
  maxSizeMB: IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE,
  useWebWorker: true,
  initialQuality: 0.85,
  alwaysKeepResolution: true,
};

export const ImageCompression = () => {
  const compressImage = async (processedFile: File): Promise<File | null> => {
    try {
      return await imageCompression(processedFile, COMPRESSION_OPTIONS);
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
