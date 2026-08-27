import React, { useState } from 'react';
import { Task, Submission, User, SchoolConfig } from '../types';
import { CalendarView } from '../components/CalendarView';
import { formatThaiDate } from '../utils/storage';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Eye,
  Send,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  tasks: Task[];
  submissions: Submission[];
  allUsers: User[];
  schoolConfig: SchoolConfig;
  onSelectTask: (task: Task) => void;
  onNavigateToSubmit: (task?: Task) => void;
  onNavigateToGrading: (task?: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  tasks,
  submissions,
  allUsers,
  schoolConfig,
  onSelectTask,
  onNavigateToSubmit,
  onNavigateToGrading,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // 7 days from now for upcoming announcement filter
  const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);
  const year7 = sevenDaysLater.getFullYear();
  const month7 = String(sevenDaysLater.getMonth() + 1).padStart(2, '0');
  const day7 = String(sevenDaysLater.getDate()).padStart(2, '0');
  const sevenDaysLaterStr = `${year7}-${month7}-${day7}`;

  const approvedMembers = allUsers.filter((u) => u.role === 'member' && u.status === 'approved');
  const assignmentTasks = tasks.filter((t) => t.type === 'assignment');

  // Filter announcements: upcoming in next 7 days (or active without past due date)
  const upcomingAnnouncements = tasks
    .filter((t) => {
      if (t.type !== 'announcement') return false;
      if (!t.dueDate) return true;
      return t.dueDate >= todayStr && t.dueDate <= sevenDaysLaterStr;
    })
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  // Announcement Carousel Index
  const [annIndex, setAnnIndex] = useState(0);
  const activeAnnIndex =
    upcomingAnnouncements.length > 0
      ? Math.min(annIndex, upcomingAnnouncements.length - 1)
      : 0;
  const currentAnnouncement = upcomingAnnouncements[activeAnnIndex];

  const handlePrevAnnouncement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnnIndex((prev) => (prev > 0 ? prev - 1 : upcomingAnnouncements.length - 1));
  };

  const handleNextAnnouncement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnnIndex((prev) => (prev < upcomingAnnouncements.length - 1 ? prev + 1 : 0));
  };

  // Member-specific calculations
  const mySubmissions = submissions.filter((s) => s.userId === currentUser.id);
  const mySubmittedTaskIds = new Set(mySubmissions.map((s) => s.taskId));
  const myPendingTasks = assignmentTasks.filter((t) => !mySubmittedTaskIds.has(t.id));

  // Admin-specific calculation: members who have overdue assignments
  const adminPendingTracker = approvedMembers
    .map((member) => {
      const memberSubs = submissions.filter((s) => s.userId === member.id);
      const memberSubTaskIds = new Set(memberSubs.map((s) => s.taskId));
      const memberPending = assignmentTasks.filter((t) => !memberSubTaskIds.has(t.id));
      const memberOverdue = memberPending.filter((t) => t.dueDate < todayStr);

      return {
        member,
        overdueTasks: memberOverdue,
        pendingTasks: memberPending,
      };
    })
    .filter((item) => item.pendingTasks.length > 0);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      
      {/* 1. UPCOMING ANNOUNCEMENTS (เน้นประกาศที่ใกล้จะมาถึง - Minimalist Purple Theme) */}
      {upcomingAnnouncements.length > 0 && currentAnnouncement && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white shadow-md shadow-purple-900/10 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            
            {/* Announcement Clickable Content */}
            <div
              onClick={() => onSelectTask(currentAnnouncement)}
              className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Megaphone className="w-4 h-4 text-purple-200" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-purple-200 bg-white/15 px-1.5 py-0.5 rounded border border-white/10">
                    ประกาศเร็วๆ นี้
                  </span>
                  {currentAnnouncement.dueDate && (
                    <span className="text-[11px] font-medium text-purple-200">
                      {formatThaiDate(currentAnnouncement.dueDate)}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-200 transition-colors">
                  {currentAnnouncement.title}
                </h4>
                {currentAnnouncement.description && (
                  <p className="text-xs text-purple-100/80 line-clamp-1 mt-0.5 font-normal">
                    {currentAnnouncement.description}
                  </p>
                )}
              </div>
            </div>

            {/* Slider Controls with icons & counter */}
            {upcomingAnnouncements.length > 1 && (
              <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                <span className="text-[10px] font-bold text-purple-200 bg-black/20 px-1.5 py-0.5 rounded-md border border-white/10">
                  {activeAnnIndex + 1}/{upcomingAnnouncements.length}
                </span>
                <button
                  id="announcement-prev-btn"
                  onClick={handlePrevAnnouncement}
                  className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/10 shadow-xs"
                  title="ก่อนหน้า"
                  aria-label="ประกาศก่อนหน้า"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  id="announcement-next-btn"
                  onClick={handleNextAnnouncement}
                  className="p-1.5 rounded-lg bg-white text-purple-900 hover:bg-purple-50 shadow-xs"
                  title="ถัดไป"
                  aria-label="ประกาศถัดไป"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 2. CALENDAR VIEW (เน้นปฏิทินงานวิชาการ & วันส่งงาน) */}
      <section id="calendar-section">
        <CalendarView
          tasks={tasks}
          submissions={submissions}
          currentUser={currentUser}
          onSelectTask={onSelectTask}
          approvedMembersCount={approvedMembers.length}
        />
      </section>

      {/* 3. MINIMALIST TASK OVERVIEW (แบบกระชับ เน้นไอคอน / ข้อความสั้น) */}
      {!isAdmin ? (
        /* Member: My Tasks List */
        <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-50">
            <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
              <span>งานวิชาการที่มอบหมาย</span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                {assignmentTasks.length}
              </span>
            </h3>
            {myPendingTasks.length > 0 && (
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-600" /> ค้าง {myPendingTasks.length} งาน
              </span>
            )}
          </div>

          {assignmentTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">ยังไม่มีการมอบหมายงานในขณะนี้</p>
          ) : (
            <div className="space-y-2">
              {assignmentTasks.map((task) => {
                const mySub = submissions.find(
                  (s) => s.taskId === task.id && s.userId === currentUser.id
                );
                const isOverdue = task.dueDate < todayStr && !mySub;

                return (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl border border-purple-100/80 hover:border-purple-300 bg-purple-50/20 hover:bg-white transition-all flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <div className="flex items-center gap-1.5">
                        {mySub ? (
                          <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> ส่งแล้ว
                          </span>
                        ) : isOverdue ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" /> เลยกำหนด
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded">
                            รอส่ง
                          </span>
                        )}
                        <span className="text-[10px] text-purple-900/60 font-medium">
                          {formatThaiDate(task.dueDate)}
                        </span>
                      </div>
                      <h4
                        onClick={() => onSelectTask(task)}
                        className="text-xs font-bold text-slate-900 truncate mt-0.5 cursor-pointer hover:text-purple-700"
                      >
                        {task.title}
                      </h4>
                    </div>

                    {/* Short Icon-based Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onSelectTask(task)}
                        className="p-1.5 rounded-lg text-purple-700 bg-white border border-purple-200 hover:bg-purple-50"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onNavigateToSubmit(task)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                          mySub
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs'
                        }`}
                        title={mySub ? 'แก้ไขการส่งงาน' : 'ส่งงาน'}
                      >
                        <Send className="w-3 h-3" />
                        <span>{mySub ? 'แก้ไข' : 'ส่งงาน'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Admin: Compact Pending Tracker */
        adminPendingTracker.length > 0 && (
          <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-50">
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
                <span>สมาชิกที่ยังมีงานค้างส่ง</span>
              </h3>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                {adminPendingTracker.length} ท่าน
              </span>
            </div>

            <div className="space-y-2">
              {adminPendingTracker.slice(0, 5).map(({ member, pendingTasks }) => (
                <div
                  key={member.id}
                  className="p-2.5 rounded-xl border border-purple-100/70 bg-purple-50/30 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{member.name}</div>
                    <div className="text-[11px] text-purple-800/70">
                      ค้าง {pendingTasks.length} รายการ
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateToGrading()}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex-shrink-0"
                  >
                    ตรวจงาน
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      )}

    </div>
  );
};
