import { toast } from 'sonner';

import { MAX_FILE_SIZE } from '../../../constants';

export interface AttachmentPreview {
  url: string;
  file: File;
}

export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / 1024 / 1024;

export const notifyFileTooLarge = (file: File) => {
  toast.error(`File ${file.name} is too large. Max is ${MAX_FILE_SIZE_MB}MB`);
};

export const revokePreviewUrl = (preview: AttachmentPreview) => {
  if (preview.url && preview.url.startsWith('blob:')) URL.revokeObjectURL(preview.url);
};
