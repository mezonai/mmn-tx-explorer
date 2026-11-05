import { useState } from 'react';

import { MAX_FILE_SIZE } from '../../../constants';
import { AttachmentPreview, notifyFileTooLarge, revokePreviewUrl } from './utils';

export const useChatAttachments = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<AttachmentPreview[]>([]);

  const addFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const newPreviews: AttachmentPreview[] = [];

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        notifyFileTooLarge(file);
        return;
      }
      validFiles.push(file);
      const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      newPreviews.push({ url, file });
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    revokePreviewUrl(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setPreviews([]);
    setSelectedFiles([]);
  };

  const restoreFiles = (files: File[], filePreviews: AttachmentPreview[]) => {
    setPreviews(filePreviews);
    setSelectedFiles(files);
  };

  return { selectedFiles, previews, addFiles, removeFile, clearFiles, restoreFiles };
};

export type ChatAttachments = ReturnType<typeof useChatAttachments>;
