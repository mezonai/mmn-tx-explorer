import { toast } from 'sonner';
import { DONATION_ENDPOINTS } from '../constants';

const getOutputFormat = (file: File): 'jpeg' | 'png' => {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.png')) return 'png';
  return 'jpeg';
};

export const ImageCompression = () => {
  const compressImage = async (processedFile: File): Promise<File | null> => {
    try {
      const response = await fetch(DONATION_ENDPOINTS.IMAGE_COMPRESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(processedFile);
          }),
          originalName: processedFile.name,
          outputFormat: getOutputFormat(processedFile),
        }),
      });
      const result = await response.json();

      if (response.ok) {
        const compressedDataB64 = result.buffer as string;
        // decode base64 to Uint8Array in browser
        const binary = atob(compressedDataB64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

        const compressedFile = new File([bytes], result.filename, { type: result.mime });
        return compressedFile;
      } else {
        toast.error(`Image compression failed for ${processedFile.name}`);
        return null;
      }
    } catch (err) {
      toast.error(`Failed to compress ${processedFile.name}. Please try a different image.`);
      return null;
    } finally {
    }
  };

  const compressImages = async (files: File[]): Promise<File[]> => {
    try {
      const compressedFiles = await Promise.all(files.map(async (file) => await compressImage(file)));
      return compressedFiles.filter((file): file is File => file !== null);
    } finally {
    }
  };

  return {
    compressImage,
    compressImages,
  };
};
