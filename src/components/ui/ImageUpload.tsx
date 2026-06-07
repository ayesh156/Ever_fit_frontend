import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ImagePlus, X, Loader2, Clipboard, Upload } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  dark?: boolean;
  className?: string;
  /** Max dimension (width/height) for compression. Default 800 */
  maxDimension?: number;
  /** Quality 0-1 for compression. Default 0.8 */
  quality?: number;
}

/**
 * Compress an image file using canvas.
 * Returns a base64 data URL.
 */
async function compressImage(
  file: File | Blob,
  maxDimension: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }

      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  dark = false,
  className,
  maxDimension = 800,
  quality = 0.8,
}) => {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback(async (file: File | Blob) => {
    // Validate type
    if (file instanceof File && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const compressed = await compressImage(file, maxDimension, quality);
      onChange(compressed);
    } catch {
      setError('Failed to process image');
    } finally {
      setLoading(false);
    }
  }, [maxDimension, quality, onChange]);

  // Handle file input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Handle paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only process if this component or its children are focused/hovered
      if (!containerRef.current) return;
      const activeEl = document.activeElement;
      if (containerRef.current.contains(activeEl) || containerRef.current.matches(':hover')) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (blob) processFile(blob);
            return;
          }
        }

        // Check for URL text
        const text = e.clipboardData?.getData('text/plain');
        if (text && (text.startsWith('http://') || text.startsWith('https://')) && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(text)) {
          e.preventDefault();
          onChange(text);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFile, onChange]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setError(null);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)} tabIndex={0}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        /* Image Preview */
        <div className={cn(
          'relative group rounded-xl overflow-hidden border transition-all',
          dark ? 'border-neutral-700/50' : 'border-gray-200'
        )}>
          <img
            src={value}
            alt="Product"
            className="w-full h-40 sm:h-48 object-contain bg-neutral-900/20"
            onError={() => setError('Failed to load image')}
          />
          {/* Overlay actions */}
          <div className={cn(
            'absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity',
            'bg-black/50 backdrop-blur-sm'
          )}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors backdrop-blur"
            >
              <Upload className="w-3.5 h-3.5" />
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/30 text-white text-xs font-medium hover:bg-red-500/50 transition-colors backdrop-blur"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Upload Zone */
        <div
          onClick={() => !loading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all py-8 sm:py-10',
            loading && 'pointer-events-none',
            dragOver
              ? dark
                ? 'border-white/40 bg-white/5'
                : 'border-gray-400 bg-gray-50'
              : dark
                ? 'border-neutral-700/50 hover:border-neutral-600 bg-neutral-800/30 hover:bg-neutral-800/50'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50',
            error && (dark ? 'border-red-500/40' : 'border-red-300')
          )}
        >
          {loading ? (
            <>
              <Loader2 className={cn('w-8 h-8 animate-spin', dark ? 'text-neutral-400' : 'text-gray-400')} />
              <p className={cn('text-xs font-medium', dark ? 'text-neutral-400' : 'text-gray-500')}>
                Compressing image…
              </p>
            </>
          ) : (
            <>
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                dark ? 'bg-neutral-700/50' : 'bg-gray-100'
              )}>
                <ImagePlus className={cn('w-6 h-6', dark ? 'text-neutral-400' : 'text-gray-400')} />
              </div>
              <div className="text-center px-4">
                <p className={cn('text-sm font-medium', dark ? 'text-neutral-300' : 'text-gray-600')}>
                  Drop image here, click to browse
                </p>
                <p className={cn('text-[11px] mt-1 flex items-center justify-center gap-1', dark ? 'text-neutral-500' : 'text-gray-400')}>
                  <Clipboard className="w-3 h-3" /> or paste with Ctrl+V
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  );
};
