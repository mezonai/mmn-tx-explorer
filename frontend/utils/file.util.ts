import Bottleneck from 'bottleneck';
import type { ClipboardEvent, DragEvent } from 'react';

/**
 * Normalize filename to remove special characters and spaces
 * @param name - Original filename
 * @returns Normalized filename
 */
export const normalizeFilename = (name: string): string => {
    return name
        .normalize('NFD')                     // Normalize to decomposite accented characters
        .replace(/[\u0300-\u036f]/g, '')      // Remove accents
        .replace(/\s+/g, '_')                 // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, '');     // Remove any other special characters except . _ -
};

/**
 * Get a safe filetype for gRPC upload
 * @param file - File object
 * @returns Safe MIME type or extension
 */
export const getSafeFileType = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Keep original mime type for images
    if (file.type.startsWith('image/')) {
        return file.type;
    }

    // For document types, some servers/Protobuf definitions prefer extension or simpler types
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'json'].includes(extension || '')) {
        // PDF seems to be okay with application/pdf
        if (extension === 'pdf') return 'application/pdf';
        // For others, use the extension as the type if it's one of these
        return extension || file.type || 'application/octet-stream';
    }

    return file.type || 'application/octet-stream';
};

/**
 * Extract files from a clipboard event
 * @param e - ClipboardEvent
 * @returns Array of File objects
 */
export const getFilesFromClipboard = (e: ClipboardEvent): File[] => {
    const items = e.clipboardData?.items;
    if (!items) return [];

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) files.push(file);
        }
    }
    return files;
};

/**
 * Extract files from a drag event
 * @param e - DragEvent
 * @returns Array of File objects
 */
export const getFilesFromDragEvent = (e: DragEvent): File[] => {
    if (!e.dataTransfer) return [];
    return Array.from(e.dataTransfer.files);
};

export interface UploadResult {
    filename: string;
    url: string;
    size: number;
    filetype: string;
}

/**
 * Upload a single file to Mezon CDN/S3 using the provided lightClient and limiter
 * @param lightClient - Mezon LightClient instance
 * @param file - File to upload
 * @param limiter - Bottleneck limiter for rate limiting
 * @returns UploadResult or null if failed
 */
export const uploadAttachmentFile = async (
    lightClient: any, // Using any to avoid strict dependency on LightClient type if not needed
    file: File,
    limiter: Bottleneck
): Promise<UploadResult | null> => {
    try {
        const safeName = normalizeFilename(file.name);
        const safeType = getSafeFileType(file);
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeName}`;

        // Use the limiter to schedule the uploadAttachment call
        const response: { url: string } | null = await limiter.schedule(() =>
            lightClient.uploadAttachment({
                filename: uniqueName,
                filetype: safeType,
                size: file.size,
            })
        );

        if (response?.url) {
            const uploadRes = await fetch(response.url, {
                method: 'PUT',
                headers: { 'Content-Type': safeType },
                body: file,
            });

            if (uploadRes.ok) {
                const urlObj = new URL(response.url);
                const cdnUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

                return {
                    filename: file.name,
                    url: cdnUrl,
                    size: file.size,
                    filetype: safeType,
                };
            } else {
                throw new Error(`PUT Error: ${uploadRes.status}`);
            }
        }
    } catch (err: any) {
        console.error(`[Upload] Failed for ${file.name}:`, err.message);
        throw err; // Let the caller handle retries if needed
    }
    return null;
};
