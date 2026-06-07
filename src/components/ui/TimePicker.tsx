import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string; // "HH:mm" 24h format
  onChange: (value: string) => void;
  dark?: boolean;
  className?: string;
  label?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  dark = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hours, minutes] = (value || '09:00').split(':').map(Number);
  const isPM = hours >= 12;
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  const formatDisplay = () => {
    const h = displayHour.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m} ${isPM ? 'PM' : 'AM'}`;
  };

  const update = (h24: number, m: number) => {
    const hh = Math.max(0, Math.min(23, h24));
    const mm = Math.max(0, Math.min(59, m));
    onChange(`${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`);
  };

  const incHour = () => update((hours + 1) % 24, minutes);
  const decHour = () => update((hours - 1 + 24) % 24, minutes);
  const incMin = () => {
    const newMin = (minutes + 5) % 60;
    const carry = minutes + 5 >= 60 ? 1 : 0;
    update((hours + carry) % 24, newMin);
  };
  const decMin = () => {
    const newMin = (minutes - 5 + 60) % 60;
    const borrow = minutes - 5 < 0 ? 1 : 0;
    update((hours - borrow + 24) % 24, newMin);
  };
  const togglePeriod = () => {
    update(isPM ? hours - 12 : hours + 12, minutes);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const btnClass = `p-1 rounded-lg transition-all ${
    dark
      ? 'hover:bg-neutral-700/50 text-neutral-400 hover:text-white active:bg-neutral-700'
      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700 active:bg-gray-200'
  }`;

  const numClass = `text-2xl font-bold tabular-nums w-12 text-center ${
    dark ? 'text-white' : 'text-gray-900'
  }`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
          isOpen
            ? dark
              ? 'border-neutral-500 ring-2 ring-neutral-500/20 bg-neutral-800/50'
              : 'border-gray-400 ring-2 ring-gray-400/20 bg-white'
            : dark
              ? 'border-neutral-700/50 bg-neutral-800/50 hover:border-neutral-600'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <span className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
          {formatDisplay()}
        </span>
        <Clock className={`w-4 h-4 ${dark ? 'text-neutral-400' : 'text-gray-400'}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 mt-2 left-0 right-0 sm:left-auto sm:right-auto sm:w-64 rounded-2xl border p-4 shadow-xl ${
          dark
            ? 'bg-neutral-900 border-neutral-700/50'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {/* Hours */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={incHour} className={btnClass}>
                <ChevronUp className="w-5 h-5" />
              </button>
              <span className={numClass}>{displayHour.toString().padStart(2, '0')}</span>
              <button type="button" onClick={decHour} className={btnClass}>
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <span className={`text-2xl font-bold ${dark ? 'text-neutral-500' : 'text-gray-300'}`}>:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={incMin} className={btnClass}>
                <ChevronUp className="w-5 h-5" />
              </button>
              <span className={numClass}>{minutes.toString().padStart(2, '0')}</span>
              <button type="button" onClick={decMin} className={btnClass}>
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* AM/PM */}
            <div className="ml-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => { if (isPM) togglePeriod(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isPM
                    ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                    : dark ? 'bg-neutral-800 text-neutral-500 hover:text-neutral-300' : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => { if (!isPM) togglePeriod(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isPM
                    ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                    : dark ? 'bg-neutral-800 text-neutral-500 hover:text-neutral-300' : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className={`mt-3 pt-3 border-t flex flex-wrap gap-1.5 ${dark ? 'border-neutral-800' : 'border-gray-100'}`}>
            {['08:00', '09:00', '10:00', '12:00', '17:00', '18:00', '20:00', '21:00'].map(t => {
              const [th] = t.split(':').map(Number);
              const tPM = th >= 12;
              const tDisp = th === 0 ? 12 : th > 12 ? th - 12 : th;
              const label = `${tDisp}${tPM ? 'PM' : 'AM'}`;
              const isActive = value === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { onChange(t); setIsOpen(false); }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    isActive
                      ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                      : dark ? 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
