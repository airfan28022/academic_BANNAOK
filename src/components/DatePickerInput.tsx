import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface DatePickerInputProps {
  id?: string;
  value: string; // YYYY-MM-DD format e.g. "2026-08-30"
  onChange: (dateStr: string) => void;
  label?: string;
  required?: boolean;
  minDate?: string;
  className?: string;
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  id = 'date-picker-input',
  value,
  onChange,
  label,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value into year, month, day
  const parseDate = (dStr: string) => {
    if (!dStr) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      };
    }
    const [y, m, d] = dStr.split('T')[0].split('-').map((v) => parseInt(v, 10));
    return {
      year: isNaN(y) ? new Date().getFullYear() : y,
      month: isNaN(m) ? new Date().getMonth() + 1 : m,
      day: isNaN(d) ? new Date().getDate() : d,
    };
  };

  const parsed = parseDate(value);

  // Calendar view navigation state (current displayed month & year in popover)
  const [viewYear, setViewYear] = useState<number>(parsed.year);
  const [viewMonth, setViewMonth] = useState<number>(parsed.month); // 1-12

  // Update view month/year when value changes
  useEffect(() => {
    const p = parseDate(value);
    setViewYear(p.year);
    setViewMonth(p.month);
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format date display: strictly "30/8/2026" (d/m/yyyy)
  const displayFormatted = value ? `${parsed.day}/${parsed.month}/${parsed.year}` : '';

  // Calculate days in viewMonth of viewYear
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Get weekday of first day in month (0 = Sunday, 1 = Monday, ...)
  const getFirstDayOfWeek = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formattedIso = `${viewYear}-${mm}-${dd}`;
    onChange(formattedIso);
    setIsOpen(false);
  };

  // Quick preset helper
  const handleQuickPreset = (offsetDays: number) => {
    const target = new Date(Date.now() + offsetDays * 86400000);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  // Build grid of days
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Generate Year options (from -2 years to +5 years)
  const currentActualYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentActualYear - 2; y <= currentActualYear + 6; y++) {
    yearOptions.push(y);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          <span className="text-[11px] text-purple-700 font-semibold">
            {displayFormatted ? `(แสดง: ${displayFormatted})` : '(dd/mm/yyyy)'}
          </span>
        </label>
      )}

      {/* Clickable Date Display Input */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-400 hover:bg-white text-slate-900 text-sm font-medium flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-purple-200 group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover:bg-purple-200 text-purple-700 flex items-center justify-center flex-shrink-0 transition-colors">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-wide">
            {displayFormatted || 'เลือกวันที่ (เช่น 30/8/2026)'}
          </span>
        </div>

        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex-shrink-0">
          {displayFormatted ? `${parsed.day} ${THAI_MONTHS_SHORT[parsed.month - 1]} ${parsed.year + 543}` : 'กดเลือกวัน'}
        </span>
      </button>

      {/* Popover Calendar Grid & Controls */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          
          {/* Top Bar: Month & Year Selectors with Navigation */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {THAI_MONTHS_SHORT.map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {idx + 1} ({mName})
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y} (พ.ศ. {y + 543})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-2.5 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 mr-1">ลัด:</span>
            <button
              type="button"
              onClick={() => handleQuickPreset(0)}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 transition-colors"
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(7)}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 transition-colors"
            >
              อีก 7 วัน
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(14)}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 transition-colors"
            >
              อีก 14 วัน
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(30)}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 transition-colors"
            >
              อีก 30 วัน
            </button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {THAI_DAYS_SHORT.map((dayName, idx) => (
              <div
                key={dayName}
                className={`text-[11px] font-bold py-1 ${
                  idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-purple-600' : 'text-slate-500'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((dayNum, cellIdx) => {
              if (dayNum === null) {
                return <div key={`empty_${cellIdx}`} className="h-8" />;
              }

              const isSelected =
                parsed.day === dayNum &&
                parsed.month === viewMonth &&
                parsed.year === viewYear;

              const today = new Date();
              const isToday =
                today.getDate() === dayNum &&
                today.getMonth() + 1 === viewMonth &&
                today.getFullYear() === viewYear;

              return (
                <button
                  key={`day_${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center relative ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md'
                      : isToday
                      ? 'bg-purple-50 text-purple-700 border border-purple-300 font-extrabold hover:bg-purple-100'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {dayNum}
                  {isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Summary at bottom of picker */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              วันที่เลือก:{' '}
              <strong className="text-purple-700 font-bold">
                {displayFormatted || '-'}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" /> ตกลง
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
