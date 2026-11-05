import { X } from 'lucide-react';

import { FileTypeIcon } from './file-type-icon';
import { AttachmentPreview } from './utils';

interface AttachmentPreviewListProps {
  previews: AttachmentPreview[];
  onRemove: (index: number) => void;
}

export const AttachmentPreviewList = ({ previews, onRemove }: AttachmentPreviewListProps) => (
  <div className="mb-3 flex flex-wrap gap-2 pb-2">
    {previews.map((p, i) => (
      <div
        key={i}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
      >
        {p.file.type.startsWith('image/') ? (
          <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1">
            <FileTypeIcon filename={p.file.name} filetype={p.file.type} />
            <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">
              {p.file.name.split('.').pop()?.toUpperCase()}
            </span>
          </div>
        )}
        <button
          onClick={() => onRemove(i)}
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    ))}
  </div>
);
