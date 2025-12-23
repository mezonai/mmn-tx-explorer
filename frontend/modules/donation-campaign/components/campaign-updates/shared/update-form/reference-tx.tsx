'use client';

import { useRef, useCallback } from 'react';
import { Chip } from '@/components/shared';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const TX_HASH_REGEX = /^[a-f0-9]{64}$/;
const MAX_HASHES = 10;

interface ReferenceTxProps {
  form: {
    title: string;
    description: string;
    reference_tx_hashes: string[];
    images: string[];
  };
  setForm: (form: { title: string; description: string; reference_tx_hashes: string[]; images: string[] }) => void;
}

export const ReferenceTx = ({ form, setForm }: ReferenceTxProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const hashes = form.reference_tx_hashes || [];

  const addHashes = useCallback(
    (newHashes: string[]) => {
      const totalHashes = hashes.length + newHashes.length;

      if (totalHashes > MAX_HASHES) {
        toast.error(`You can only add up to ${MAX_HASHES} transaction hashes.`);
        return;
      }
      setForm({
        ...form,
        reference_tx_hashes: [...new Set([...hashes, ...newHashes])],
      });
    },
    [form, setForm, hashes]
  );
  const removeHash = useCallback(
    (hashToRemove: string) => {
      setForm({
        ...form,
        reference_tx_hashes: hashes.filter((h) => h !== hashToRemove),
      });
    },
    [form, setForm, hashes]
  );

  const clearTypedText = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPositionRef.current = range.startOffset;
    }

    editorRef.current.innerText = '';
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!editorRef.current) return;

      const text = editorRef.current.innerText.trim();
      const selection = window.getSelection();
      const cursorAtStart = selection && selection.anchorOffset === 0;

      if (e.key === 'Backspace' && !text && cursorAtStart && hashes.length > 0) {
        e.preventDefault();
        const lastHash = hashes[hashes.length - 1];
        removeHash(lastHash);
        return;
      }

      if ([' ', 'Enter', ',', ';'].includes(e.key)) {
        e.preventDefault();

        if (TX_HASH_REGEX.test(text)) {
          addHashes([text]);
          clearTypedText();
        } else if (text && e.key === 'Enter') {
          clearTypedText();
        }
      }
    },
    [addHashes, clearTypedText, hashes, removeHash]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();

      const text = e.clipboardData.getData('text');

      const validHashes = text
        .split(/[\s,;\n]+/)
        .map((h) => h.trim().toLowerCase())
        .filter((h) => TX_HASH_REGEX.test(h));

      if (validHashes.length > 0) {
        addHashes(validHashes);
        clearTypedText();
      } else {
        const plainText = text.replace(/[\n\r]/g, ' ');
        document.execCommand('insertText', false, plainText);
      }
    },
    [addHashes, clearTypedText]
  );

  const handleBlur = useCallback(() => {
    if (!editorRef.current) return;

    const text = editorRef.current.innerText.trim().toLowerCase();

    if (TX_HASH_REGEX.test(text)) {
      addHashes([text]);
      clearTypedText();
    }
  }, [addHashes, clearTypedText]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const text = element.innerText;

    if (text.includes('\n')) {
      element.innerText = text.replace(/\n/g, ' ');

      const selection = window.getSelection();
      const range = document.createRange();

      if (element.childNodes.length > 0) {
        range.setStart(element.childNodes[0], Math.min(cursorPositionRef.current, element.innerText.length));
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, []);

  const handleClearAll = useCallback(() => {
    setForm({
      ...form,
      reference_tx_hashes: [],
    });
  }, [form, setForm]);

  return (
    <div className="space-y-3">
      <div className="flex flex-row items-center justify-between">
        <p className="text-primary text-xs tracking-[0.2em] uppercase dark:text-white">
          Transaction Hashes
          {hashes.length > 0 && <span className="text-muted-foreground ml-2 text-xs">({hashes.length})</span>}
        </p>
        {hashes.length > 0 && (
          <Button
            variant="ghost"
            className="text-destructive/90 text-xs hover:bg-transparent dark:hover:bg-transparent"
            onClick={handleClearAll}
          >
            Clear
          </Button>
        )}
      </div>

      <div
        className="border-input bg-background focus-within:ring-ring flex min-h-[96px] w-full cursor-text flex-wrap content-start items-start gap-2 rounded-md border px-3 py-3 text-sm transition-shadow focus-within:ring-2 focus-within:outline-none"
        onClick={() => editorRef.current?.focus()}
      >
        {hashes.map((hash) => (
          <Chip
            key={hash}
            onClick={(e) => {
              e.stopPropagation();
              removeHash(hash);
            }}
            className="shrink-0 cursor-pointer"
            variant="brand"
          >
            {hash.slice(0, 8)}...{hash.slice(-6)}
            <X className="ml-1 h-3 w-3" />
          </Chip>
        ))}

        <div
          ref={editorRef}
          contentEditable
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onInput={handleInput}
          className="min-w-[120px] flex-1 overflow-hidden outline-none"
          suppressContentEditableWarning
          data-placeholder={hashes.length === 0 ? 'Paste or type transaction hashes...' : ''}
        />
      </div>

      {hashes.length > 0 && (
        <p className="text-xs text-gray-500">You can add up to {MAX_HASHES} referenced transaction hashes.</p>
      )}
      {hashes.length === 0 ? (
        <p className="text-xs text-gray-500">
          Enter valid transaction hashes, separated by Enter, Space, commas, or semicolons.
        </p>
      ) : null}
    </div>
  );
};
