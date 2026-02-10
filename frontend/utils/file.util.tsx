import React from 'react';
import { FileText, File } from 'lucide-react';

/**
 * Get the appropriate icon for a file based on its name and type
 * @param filename - Name of the file
 * @param filetype - MIME type of the file
 * @returns React element or null for images
 */
export const getFileIcon = (filename: string, filetype?: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (filetype?.startsWith('image/')) return null;
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (['json', 'html', 'js', 'ts', 'jsx', 'tsx'].includes(ext || ''))
        return <FileText className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
};

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
 * @param e - React ClipboardEvent
 * @returns Array of File objects
 */
export const getFilesFromClipboard = (e: React.ClipboardEvent): File[] => {
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
 * @param e - React DragEvent
 * @returns Array of File objects
 */
export const getFilesFromDragEvent = (e: React.DragEvent): File[] => {
    if (!e.dataTransfer) return [];
    return Array.from(e.dataTransfer.files);
};

