import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ComboBoxOption {
  value: string;
  label: string;
  colorDot?: string;
}

interface ComboBoxProps {
  options: ComboBoxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dark?: boolean;
}

const DROPDOWN_MAX_HEIGHT = 250;
const DROPDOWN_GAP = 4;

export const ComboBox: React.FC<ComboBoxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  dark = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [flipUp, setFlipUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const menuId = `combo-menu-${value.replace(/\s+/g, '-') || 'default'}`;

  // Click outside handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        const menuEl = document.getElementById(menuId);
        if (menuEl && !menuEl.contains(target)) setOpen(false);
        if (!menuEl) setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuId]);

  // Close on Escape key only
  useEffect(() => {
    if (!open) return;
    const escapeHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', escapeHandler);
    return () => document.removeEventListener('keydown', escapeHandler);
  }, [open]);

  const toggle = () => {
    if (!open) {
      const btn = buttonRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        // True dynamic flip: if not enough space below, position above
        // When flipped, the bottom edge of the menu sits at the top edge of the button
        const shouldFlip = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
        setFlipUp(shouldFlip);
        setMenuStyle({
          position: 'fixed',
          // When flipped: align menu bottom with button top (menu rises upward)
          // Normal: align menu top with button bottom (menu drops downward)
          top: shouldFlip ? `${Math.max(8, rect.top - DROPDOWN_MAX_HEIGHT)}px` : `${rect.bottom + DROPDOWN_GAP}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          maxHeight: `${DROPDOWN_MAX_HEIGHT}px`,
          zIndex: 99999,
        });
      }
    }
    setOpen(!open);
    setSearch('');
  };

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all ${
          dark
            ? 'bg-neutral-800/50 border-neutral-700/50 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {selected?.colorDot && (
          <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: selected.colorDot }} />
        )}
        <span className="flex-1 truncate">{selected?.label || placeholder}</span>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''} ${dark ? 'text-neutral-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && createPortal(
        <div
          id={menuId}
          style={menuStyle}
          className={`rounded-xl border shadow-xl overflow-y-auto ${flipUp ? 'bottom-flip' : ''} ${
            dark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`p-2 border-b sticky top-0 ${dark ? 'border-neutral-700 bg-neutral-900' : 'border-gray-100 bg-white'}`}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                dark ? 'bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none`}
            />
          </div>
          <div>
            {filtered.length === 0 ? (
              <p className={`px-3 py-4 text-xs text-center ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No results</p>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                    o.value === value
                      ? dark ? 'bg-white/10 text-white' : 'bg-brand-50 text-brand-900'
                      : dark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {o.colorDot && (
                    <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: o.colorDot }} />
                  )}
                  <span className="truncate">{o.label}</span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};