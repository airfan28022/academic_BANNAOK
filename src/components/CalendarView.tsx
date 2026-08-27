import React, { useState } from 'react';
import { Task, Submission, User } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  submissions: Submission[];
  currentUser: User;
  onSelectTask: (task: Task) => void;
  approvedMembersCount: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  submissions,
  currentUser,
  onSelectTask,
  approvedMembersCount,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const isAdmin = currentUser.role === 'admin';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // Thai month names
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Days calculation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === year && today.getMonth() === month;
  const todayDateNum = today.getDate();

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Calendar cells generation
  const calendarDays: Array<{
    dayNumber: number;
    isCurrentMonth: boolean;
    dateStr: string;
    isToday: boolean;
    items: Array<{
      task: Task;
      color: 'red' | 'green' | 'yellow';
      statusText: string;
    }>;
  }> = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dNum = prevMonthTotalDays - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    calendarDays.push({
      dayNumber: dNum,
      isCurrentMonth: false,
      dateStr: formatDateStr(prevYear, prevMonthIdx, dNum),
      isToday: false,
      items: [],
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = formatDateStr(year, month, d);
    const isToday = isCurrentMonthToday && d === todayDateNum;

    // Find tasks for this day
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr);

    const items = dayTasks.map((task) => {
      if (task.type === 'announcement') {
        return {
          task,
          color: 'yellow' as const,
          statusText: 'ประกาศ',
        };
      }

      // If assignment:
      if (isAdmin) {
        const taskSubs = submissions.filter((s) => s.taskId === task.id);
        const isAllSubmitted = approvedMembersCount > 0 && taskSubs.length >= approvedMembersCount;
        return {
          task,
          color: (isAllSubmitted ? 'green' : 'red') as 'green' | 'red',
          statusText: isAllSubmitted ? `ส่งครบ (${taskSubs.length})` : `ส่ง ${taskSubs.length}/${approvedMembersCount}`,
        };
      } else {
        const mySub = submissions.find(
          (s) => s.taskId === task.id && s.userId === currentUser.id
        );
        const hasSubmitted = !!mySub;
        return {
          task,
          color: (hasSubmitted ? 'green' : 'red') as 'green' | 'red',
          statusText: hasSubmitted ? 'ส่งแล้ว' : 'ยังไม่ส่ง',
        };
      }
    });

    calendarDays.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateStr,
      isToday,
      items,
    });
  }

  // Next month padding days to complete grid
  const remainingCells = 42 - calendarDays.length;
  if (remainingCells > 0 && remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      calendarDays.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateStr: formatDateStr(nextYear, nextMonthIdx, i),
        isToday: false,
        items: [],
      });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-3.5 sm:p-5 shadow-xs">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-purple-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-purple-950 flex items-center gap-1.5 leading-tight">
              <span>{thaiMonths[month]}</span>
              <span className="text-purple-600/80 font-semibold">{year + 543}</span>
            </h3>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-100/70 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors"
          >
            วันนี้
          </button>
          <div className="flex items-center border border-purple-200 rounded-lg overflow-hidden bg-white shadow-xs">
            <button
              onClick={prevMonth}
              className="p-1.5 text-purple-800 hover:bg-purple-50 hover:text-purple-900 transition-colors"
              title="เดือนก่อนหน้า"
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-purple-800 hover:bg-purple-50 hover:text-purple-900 transition-colors"
              title="เดือนถัดไป"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Legend - Minimalist & Compact */}
      <div className="flex items-center justify-between gap-2 mb-2.5 px-3 py-1.5 rounded-xl bg-purple-50/50 border border-purple-100 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span className="text-slate-700 font-medium">{isAdmin ? 'ยังไม่ครบ' : 'ยังไม่ส่ง'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
          <span className="text-purple-900 font-bold">{isAdmin ? 'ส่งครบ' : 'ส่งแล้ว'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
          <span className="text-slate-700 font-medium">ประกาศ</span>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {thaiDays.map((d, index) => (
          <div
            key={d}
            className={`py-1 text-[11px] font-bold rounded-lg ${
              index === 0 || index === 6
                ? 'text-purple-900/60 bg-purple-50/70'
                : 'text-purple-950 bg-purple-50/40'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => (
          <div
            key={idx}
            className={`min-h-[64px] sm:min-h-[78px] p-1 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
              cell.isCurrentMonth
                ? cell.isToday
                  ? 'bg-purple-100/50 border-purple-400 shadow-xs ring-1 ring-purple-300'
                  : 'bg-white border-purple-100/70 hover:border-purple-300'
                : 'bg-purple-50/20 border-transparent text-purple-200 opacity-40'
            }`}
          >
            {/* Date Number Header */}
            <div className="flex items-center justify-between leading-none">
              <span
                className={`text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                  cell.isToday
                    ? 'bg-purple-600 text-white shadow-xs'
                    : cell.isCurrentMonth
                    ? 'text-slate-700'
                    : 'text-purple-300'
                }`}
              >
                {cell.dayNumber}
              </span>
            </div>

            {/* Task / Announcement Items on this day */}
            <div className="space-y-0.5 my-0.5 overflow-y-auto max-h-[50px]">
              {cell.items.map((item, itemIdx) => {
                const isRed = item.color === 'red';
                const isGreen = item.color === 'green';

                return (
                  <button
                    key={itemIdx}
                    onClick={() => onSelectTask(item.task)}
                    className={`w-full text-left p-0.5 sm:p-1 rounded text-[9px] sm:text-[10px] font-medium leading-tight border truncate block transition-transform active:scale-95 ${
                      isRed
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : isGreen
                        ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    }`}
                    title={`${item.task.title} (${item.statusText})`}
                  >
                    <span className="truncate block font-semibold">
                      {item.task.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Empty space filler */}
            {cell.items.length === 0 && <div className="h-1" />}
          </div>
        ))}
      </div>
    </div>
  );
};
