import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  dark?: boolean;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  dark = false,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value ? parse(value, 'yyyy-MM-dd', new Date()) : new Date()
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;

  // Get all days to display in calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get previous month's days to fill grid
  const startDate = monthStart;
  const firstDayOfWeek = startDate.getDay(); // 0-6, 0 = Sunday
  const prevMonthDays = Array.from({ length: firstDayOfWeek }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - (firstDayOfWeek - i));
    return d;
  });

  const allDays = [...prevMonthDays, ...monthDays];
  const calendarGrid = Array.from({ length: Math.ceil(allDays.length / 7) }).map((_, weekIdx) =>
    allDays.slice(weekIdx * 7, (weekIdx + 1) * 7)
  );

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelectDate = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center justify-between',
          dark
            ? 'bg-neutral-800/50 border-neutral-700/50 text-white hover:border-neutral-600/50'
            : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={selectedDate ? '' : 'opacity-60'}>
          {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : placeholder}
        </span>
        {value && (
          <X
            className="w-4 h-4 flex-shrink-0 opacity-60 hover:opacity-100"
            onMouseDown={handleClear}
          />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          className={cn(
            'absolute top-full left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-lg z-50 p-4',
            dark
              ? 'bg-neutral-900 border-neutral-700/50'
              : 'bg-white border-gray-200'
          )}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                dark
                  ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={cn(
              'font-semibold text-sm',
              dark ? 'text-white' : 'text-gray-900'
            )}>
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                dark
                  ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className={cn(
                  'text-center text-xs font-medium py-1',
                  dark ? 'text-neutral-500' : 'text-gray-500'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {calendarGrid.map((week, weekIdx) =>
              week.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={`${weekIdx}-${dayIdx}`}
                    onClick={() => handleSelectDate(day)}
                    className={cn(
                      'aspect-square rounded-lg text-sm font-medium transition-all',
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg'
                        : isCurrentMonth
                        ? dark
                          ? 'text-white hover:bg-neutral-800'
                          : 'text-gray-900 hover:bg-gray-100'
                        : dark
                        ? 'text-neutral-600 hover:bg-neutral-800/50'
                        : 'text-gray-400 hover:bg-gray-50',
                      isToday && !isSelected && (
                        dark ? 'border border-neutral-600' : 'border border-gray-300'
                      )
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })
            )}
          </div>

          {/* Today Button */}
          <button
            onClick={() => {
              const today = new Date();
              handleSelectDate(today);
            }}
            className={cn(
              'w-full py-2 rounded-xl text-sm font-medium transition-all',
              dark
                ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            )}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
};
