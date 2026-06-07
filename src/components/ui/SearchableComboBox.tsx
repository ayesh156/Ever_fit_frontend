import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Renders at document.body so it is never clipped by overflow containers */
function DropdownPortal({
  triggerRef,
  open,
  children,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  children: React.ReactNode;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const recalc = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropH = 290;
      const goUp = spaceBelow < dropH && rect.top > dropH;
      const dropWidth = Math.max(rect.width, 200);
      const maxLeft = window.innerWidth - dropWidth - 8;
      const clampedLeft = Math.min(rect.left, Math.max(0, maxLeft));
      setStyle({
        position: 'fixed',
        left: clampedLeft,
        width: Math.min(dropWidth, window.innerWidth - 16),
        ...(goUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        zIndex: 9999,
      });
    };
    recalc();
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [open, triggerRef]);

  if (!open) return null;
  return createPortal(<div style={style}>{children}</div>, document.body);
}

export interface ComboBoxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
  /** Colour dot shown beside the label */
  colorDot?: string;
}

interface BaseProps {
  options: ComboBoxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  dark?: boolean;
  /** Allow user to type a custom value not in list */
  allowCustom?: boolean;
}

interface SingleProps extends BaseProps {
  multi?: false;
  value: string;
  onValueChange: (value: string) => void;
}

interface MultiProps extends BaseProps {
  multi: true;
  value: string[];
  onValueChange: (value: string[]) => void;
}

type SearchableComboBoxProps = SingleProps | MultiProps;

export function SearchableComboBox(props: SearchableComboBoxProps) {
  const {
    options,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyMessage = 'No results found.',
    className,
    triggerClassName,
    disabled = false,
    dark = false,
    allowCustom = false,
  } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMulti = props.multi === true;

  // Filtered options
  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, search]);

  // Reset highlight when filter changes
  useEffect(() => { setHighlightIndex(0); }, [filtered.length]);

  // Close on click outside (checks both trigger and portal dropdown)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
    }
  }, [open]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-combo-item]');
    if (items[highlightIndex]) {
      items[highlightIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, open]);

  const selectOption = useCallback((opt: ComboBoxOption) => {
    if (opt.disabled) return;
    if (isMulti) {
      const multiProps = props as MultiProps;
      const vals = multiProps.value;
      if (vals.includes(opt.value)) {
        multiProps.onValueChange(vals.filter(v => v !== opt.value));
      } else {
        multiProps.onValueChange([...vals, opt.value]);
      }
    } else {
      (props as SingleProps).onValueChange(opt.value);
      setOpen(false);
    }
  }, [isMulti, props]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) {
          selectOption(filtered[highlightIndex]);
        } else if (allowCustom && search.trim()) {
          // Add custom value
          if (isMulti) {
            const multiProps = props as MultiProps;
            if (!multiProps.value.includes(search.trim())) {
              multiProps.onValueChange([...multiProps.value, search.trim()]);
            }
          } else {
            (props as SingleProps).onValueChange(search.trim());
          }
          setSearch('');
          if (!isMulti) setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Build display text
  const getDisplayContent = () => {
    if (isMulti) {
      const vals = (props as MultiProps).value;
      if (vals.length === 0) return <span className={dark ? 'text-neutral-500' : 'text-gray-400'}>{placeholder}</span>;
      if (vals.length <= 2) {
        return (
          <span className="flex items-center gap-1 flex-wrap">
            {vals.map(v => {
              const opt = options.find(o => o.value === v);
              return (
                <span key={v} className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium',
                  dark ? 'bg-neutral-700 text-neutral-200' : 'bg-gray-100 text-gray-700'
                )}>
                  {opt?.colorDot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.colorDot }} />}
                  {opt?.label || v}
                </span>
              );
            })}
          </span>
        );
      }
      return <span className={dark ? 'text-neutral-200' : 'text-gray-700'}>{vals.length} selected</span>;
    }
    const val = (props as SingleProps).value;
    if (!val) return <span className={dark ? 'text-neutral-500' : 'text-gray-400'}>{placeholder}</span>;
    const selected = options.find(o => o.value === val);
    return (
      <span className="flex items-center gap-2 truncate">
        {selected?.icon}
        {selected?.colorDot && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.colorDot }} />}
        <span className={dark ? 'text-white' : 'text-gray-900'}>{selected?.label || val}</span>
        {selected?.count !== undefined && (
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', dark ? 'bg-neutral-700 text-neutral-300' : 'bg-gray-100 text-gray-500')}>
            {selected.count}
          </span>
        )}
      </span>
    );
  };

  const isSelected = (optValue: string) => {
    if (isMulti) return (props as MultiProps).value.includes(optValue);
    return (props as SingleProps).value === optValue;
  };

  // Clear all (multi only)
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMulti) (props as MultiProps).onValueChange([]);
    else (props as SingleProps).onValueChange('');
  };

  const hasValue = isMulti ? (props as MultiProps).value.length > 0 : !!(props as SingleProps).value;

  // Panel shared between portal and any render context
  const dropdownPanel = (
    <div
      ref={dropdownRef}
      className={cn(
        'rounded-xl border shadow-2xl overflow-hidden',
        'animate-in fade-in-0 zoom-in-95 duration-100',
        dark ? 'bg-neutral-900 border-neutral-700/80' : 'bg-white border-gray-200',
      )}
    >
      {/* Search */}
      <div className={cn('flex items-center gap-2 px-3 py-2 border-b', dark ? 'border-neutral-800' : 'border-gray-100')}>
        <Search className={cn('w-3.5 h-3.5 flex-shrink-0', dark ? 'text-neutral-500' : 'text-gray-400')} />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className={cn(
            'flex-1 bg-transparent border-none outline-none text-sm',
            dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400',
          )}
        />
        {search && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setSearch(''); }}
            className={cn('p-0.5 rounded', dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-400')}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* List */}
      <div ref={listRef} className="max-h-52 overflow-y-auto py-1 overscroll-contain">
        {filtered.length === 0 ? (
          <div className={cn('px-3 py-6 text-center text-sm', dark ? 'text-neutral-500' : 'text-gray-400')}>
            {allowCustom && search.trim() ? (
              <span>
                Press{' '}
                <kbd className={cn('px-1.5 py-0.5 rounded text-[10px] font-mono', dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-600')}>
                  Enter
                </kbd>{' '}
                to add "<strong>{search.trim()}</strong>"
              </span>
            ) : (
              emptyMessage
            )}
          </div>
        ) : (
          filtered.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              data-combo-item
              disabled={opt.disabled}
              onMouseDown={e => { e.preventDefault(); selectOption(opt); }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                opt.disabled && 'opacity-40 cursor-not-allowed',
                i === highlightIndex
                  ? dark ? 'bg-neutral-800' : 'bg-gray-50'
                  : dark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50',
                dark ? 'text-neutral-200' : 'text-gray-700',
              )}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span className={cn(
                'w-4 h-4 flex items-center justify-center flex-shrink-0 rounded',
                isSelected(opt.value)
                  ? dark ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100'
                  : 'opacity-0',
              )}>
                <Check className="w-3 h-3" />
              </span>
              {opt.colorDot && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10"
                  style={{ backgroundColor: opt.colorDot }}
                />
              )}
              {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
              <span className="flex-1 truncate">{opt.label}</span>
              {opt.count !== undefined && (
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500')}>
                  {opt.count}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Multi footer */}
      {isMulti && (props as MultiProps).value.length > 0 && (
        <div className={cn(
          'flex items-center justify-between px-3 py-2 border-t text-xs',
          dark ? 'border-neutral-800 text-neutral-400' : 'border-gray-100 text-gray-400',
        )}>
          <span>{(props as MultiProps).value.length} selected</span>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); handleClear(e as unknown as React.MouseEvent); }}
            className={cn('hover:underline', dark ? 'text-neutral-300' : 'text-gray-600')}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('relative', className)} onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left',
          dark
            ? 'bg-neutral-800/60 border-neutral-700/50 hover:border-neutral-600 hover:bg-neutral-800'
            : 'bg-white border-gray-200 hover:border-gray-300',
          open && (dark
            ? 'border-neutral-500/80 ring-2 ring-neutral-500/10'
            : 'border-gray-400 ring-2 ring-gray-200'),
          disabled && 'opacity-50 cursor-not-allowed',
          triggerClassName,
        )}
      >
        <span className="flex-1 min-w-0 truncate">{getDisplayContent()}</span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {hasValue && !disabled && (
            <span
              onMouseDown={e => { e.stopPropagation(); handleClear(e as unknown as React.MouseEvent); }}
              className={cn(
                'p-0.5 rounded-md transition-colors',
                dark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-gray-100 text-gray-400',
              )}
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={cn(
            'w-3.5 h-3.5 transition-transform duration-200',
            dark ? 'text-neutral-500' : 'text-gray-400',
            open && 'rotate-180',
          )} />
        </span>
      </button>

      {/* Portal dropdown — renders at body level, never clipped */}
      <DropdownPortal triggerRef={triggerRef} open={open}>
        {dropdownPanel}
      </DropdownPortal>
    </div>
  );
}
