import { File as FileIcon, FileText } from 'lucide-react';

interface FileTypeIconProps {
  filename: string;
  filetype?: string;
}

export const FileTypeIcon = ({ filename, filetype }: FileTypeIconProps) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (filetype?.startsWith('image/')) return null;
  if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-500" />;
  if (['json', 'html', 'js', 'ts', 'jsx', 'tsx'].includes(ext || ''))
    return <FileText className="h-5 w-5 text-purple-500" />;
  return <FileIcon className="h-5 w-5 text-gray-500" />;
};
