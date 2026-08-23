import React, { useState } from 'react';
import { Task, Submission, User } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';

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
          statusText: 'ประกาศ/กิจกรรม',
        };
      }

      // If assignment:
      if (isAdmin) {
        // Admin logic: count submissions for this task
        const taskSubs = submissions.filter((s) => s.taskId === task.id);
        const isAllSubmitted = approvedMembersCount > 0 && taskSubs.length >= approvedMembersCount;
        return {
          task,
          color: (isAllSubmitted ? 'green' : 'red') as 'green' | 'red',
          statusText: isAllSubmitted ? `ส่งครบแล้ว (${taskSubs.length}/${approvedMembersCount})` : `ส่งแล้ว ${taskSubs.length}/${approvedMembersCount}`,
        };
      } else {
        // Member logic: check if current user submitted this task
        const mySub = submissions.find(
          (s) => s.taskId === task.id && s.userId === currentUser.id
        );
        const hasSubmitted = !!mySub;
        return {
          task,
          color: (hasSubmitted ? 'green' : 'red') as 'green' | 'red',
          statusText: hasSubmitted ? 'ส่งงานแล้ว' : 'ยังไม่ได้ส่ง',
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
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 card-hover-effect">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>{thaiMonths[month]}</span>
              <span>{year + 543}</span>
            </h3>
            <p className="text-xs text-slate-500">
              ปฏิทินแสดงกำหนดการส่งงานและประกาศวิชาการ (dd/mm/yyyy)
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            วันนี้
          </button>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <button
              onClick={prevMonth}
              className="p-2 text-slate-600 hover:bg-slate-100 hover:text-purple-600 transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 text-slate-600 hover:bg-slate-100 hover:text-purple-600 transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200 inline-block"></span>
          <span className="text-slate-700 font-medium">
            {isAdmin ? 'สีแดง = งานมอบหมาย (ยังส่งไม่ครบ)' : 'สีแดง = มีงานต้องส่ง / ยังไม่ส่ง'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 inline-block"></span>
          <span className="text-slate-700 font-medium">
            {isAdmin ? 'สีเขียว = ส่งครบทุกคนแล้ว' : 'สีเขียว = ส่งงานแล้ว'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200 inline-block"></span>
          <span className="text-slate-700 font-medium">
            สีเหลือง = ประกาศแจ้งเพื่อทราบ
          </span>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {thaiDays.map((d, index) => (
          <div
            key={d}
            className={`py-2 text-xs font-semibold rounded-xl ${
              index === 0 || index === 6
                ? 'text-rose-500 bg-rose-50/50'
                : 'text-slate-600 bg-slate-100/60'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((cell, idx) => (
          <div
            key={idx}
            className={`min-h-[88px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
              cell.isCurrentMonth
                ? cell.isToday
                  ? 'bg-purple-50/40 border-purple-300 shadow-xs ring-1 ring-purple-200'
                  : 'bg-white border-slate-200/70 hover:border-purple-200 hover:bg-slate-50/50'
                : 'bg-slate-50/40 border-transparent text-slate-300 opacity-60'
            }`}
          >
            {/* Date Number Header */}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                  cell.isToday
                    ? 'bg-purple-600 text-white shadow-xs'
                    : cell.isCurrentMonth
                    ? 'text-slate-700'
                    : 'text-slate-300'
                }`}
              >
                {cell.dayNumber}
              </span>
              {cell.items.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400">
                  {cell.items.length} รายการ
                </span>
              )}
            </div>

            {/* Task / Announcement Items on this day */}
            <div className="space-y-1 my-1 overflow-y-auto max-h-[70px]">
              {cell.items.map((item, itemIdx) => {
                const isRed = item.color === 'red';
                const isGreen = item.color === 'green';
                const isYellow = item.color === 'yellow';

                return (
                  <button
                    key={itemIdx}
                    onClick={() => onSelectTask(item.task)}
                    className={`w-full text-left p-1 sm:p-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium leading-tight border transition-transform hover:scale-102 flex flex-col gap-0.5 ${
                      isRed
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : isGreen
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isRed
                            ? 'bg-rose-500'
                            : isGreen
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-semibold truncate w-full">
                        {item.task.title}
                      </span>
                    </div>
                    <span className="text-[9px] opacity-80 pl-2.5 truncate">
                      {item.statusText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom info indicator for empty days */}
            {cell.items.length === 0 && cell.isCurrentMonth && (
              <div className="h-2"></div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <Info className="w-3.5 h-3.5" />
        <span>คลิกที่หัวข้องานหรือประกาศบนปฏิทินเพื่อดูรายละเอียดและส่งงาน</span>
      </div>
    </div>
  );
};
