import React, { useState } from 'react';
import { Task, Submission, User, SchoolConfig } from '../types';
import { CalendarView } from '../components/CalendarView';
import { formatThaiDate, formatDateTime } from '../utils/storage';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Bell,
  ArrowRight,
  Send,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Megaphone,
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

  // 7 days from now
  const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);
  const year7 = sevenDaysLater.getFullYear();
  const month7 = String(sevenDaysLater.getMonth() + 1).padStart(2, '0');
  const day7 = String(sevenDaysLater.getDate()).padStart(2, '0');
  const sevenDaysLaterStr = `${year7}-${month7}-${day7}`;

  const approvedMembers = allUsers.filter((u) => u.role === 'member' && u.status === 'approved');
  const assignmentTasks = tasks.filter((t) => t.type === 'assignment');

  // Filter announcements: only show upcoming in 7 days (today <= dueDate <= today+7 days). Passed ones disappear automatically!
  const upcomingAnnouncements = tasks.filter((t) => {
    if (t.type !== 'announcement') return false;
    if (!t.dueDate) return true;
    return t.dueDate >= todayStr && t.dueDate <= sevenDaysLaterStr;
  }).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  // Announcement Carousel Index
  const [annIndex, setAnnIndex] = useState(0);
  const activeAnnIndex = upcomingAnnouncements.length > 0
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

  // Stats calculation
  const totalAssignments = assignmentTasks.length;
  const totalSubmissions = submissions.length;
  const pendingApprovalUsers = allUsers.filter((u) => u.status === 'pending');

  // Member-specific calculations
  const mySubmissions = submissions.filter((s) => s.userId === currentUser.id);
  const mySubmittedTaskIds = new Set(mySubmissions.map((s) => s.taskId));

  const myPendingTasks = assignmentTasks.filter((t) => !mySubmittedTaskIds.has(t.id));
  const myOverdueTasks = myPendingTasks.filter((t) => t.dueDate < todayStr);
  const myDueTodayTasks = myPendingTasks.filter((t) => t.dueDate === todayStr);

  // Admin-specific calculation: members who have overdue/pending assignments
  const adminPendingTracker: Array<{
    member: User;
    overdueTasks: Task[];
    pendingTasks: Task[];
  }> = approvedMembers.map((member) => {
    const memberSubs = submissions.filter((s) => s.userId === member.id);
    const memberSubTaskIds = new Set(memberSubs.map((s) => s.taskId));

    const memberPending = assignmentTasks.filter((t) => !memberSubTaskIds.has(t.id));
    const memberOverdue = memberPending.filter((t) => t.dueDate < todayStr);

    return {
      member,
      overdueTasks: memberOverdue,
      pendingTasks: memberPending,
    };
  }).filter((item) => item.pendingTasks.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Announcements Carousel (1 Announcement with Right-side controls - Filtered for next 7 days only) */}
      {upcomingAnnouncements.length > 0 && currentAnnouncement && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-200/90 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left: Announcement Content (Clickable) */}
            <div
              onClick={() => onSelectTask(currentAnnouncement)}
              className="flex items-start gap-3.5 min-w-0 flex-1 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md border border-amber-300">
                    📢 ประกาศ (7 วันข้างหน้า)
                  </span>
                  <span className="text-xs font-semibold text-amber-800">
                    กำหนด/กิจกรรม: {formatThaiDate(currentAnnouncement.dueDate)}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
                  {currentAnnouncement.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-1 sm:line-clamp-2 mt-0.5">
                  {currentAnnouncement.description}
                </p>
              </div>
            </div>

            {/* Right: Slide Controls to cycle through other announcements */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/60 flex-shrink-0">
              <span className="text-xs font-bold text-amber-900 bg-white/90 px-2.5 py-1 rounded-xl border border-amber-200 shadow-xs">
                {activeAnnIndex + 1} / {upcomingAnnouncements.length}
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  id="announcement-prev-btn"
                  onClick={handlePrevAnnouncement}
                  disabled={upcomingAnnouncements.length <= 1}
                  className="p-2 rounded-xl bg-white text-slate-700 hover:text-amber-700 hover:bg-amber-100/60 border border-amber-200 shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="ประกาศก่อนหน้า"
                  aria-label="ประกาศก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="announcement-next-btn"
                  onClick={handleNextAnnouncement}
                  disabled={upcomingAnnouncements.length <= 1}
                  className="p-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold text-xs"
                  title="เลื่อนดูประกาศถัดไป"
                  aria-label="เลื่อนดูประกาศถัดไป"
                >
                  <span>ถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      {isAdmin ? (
        /* Admin Stats */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-effect">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">งานที่มอบหมายทั้งหมด</span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalAssignments}</div>
            <p className="text-[11px] text-slate-400 mt-1">หัวข้องานวิชาการ</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-effect">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">จำนวนการส่งงาน</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{totalSubmissions}</div>
            <p className="text-[11px] text-slate-400 mt-1">รายการจากครูผู้สอน</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-effect">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">ครูที่ผ่านการอนุมัติ</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{approvedMembers.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">สมาชิกในสังกัด</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-effect">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">สมาชิกรอการอนุมัติ</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">{pendingApprovalUsers.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">รอการตรวจสอบสิทธิ์</p>
          </div>
        </div>
      ) : (
        /* Member Stats */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-effect">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">งานที่ต้องทำทั้งหมด</span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{assignmentTasks.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">ภาระงานประจำเทอม</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-effect">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">ส่งงานเรียบร้อยแล้ว</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{mySubmissions.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">รายการที่ส่งแล้ว</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-effect">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">งานค้างที่ยังไม่ส่ง</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600">{myPendingTasks.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">ต้องรีบดำเนินการ</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-effect">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">กำหนดส่งวันนี้</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">{myDueTodayTasks.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">ส่งภายในวันนี้</p>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW (dd/mm/yyyy) */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>ปฏิทินงานวิชาการ & กำหนดการส่งงาน</span>
          </h3>
        </div>
        <CalendarView
          tasks={tasks}
          submissions={submissions}
          currentUser={currentUser}
          onSelectTask={onSelectTask}
          approvedMembersCount={approvedMembers.length}
        />
      </div>

      {/* MEMBER VIEW: ASSIGNED TASKS LIST & DEADLINES */}
      {!isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 card-hover-effect">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                รายการงานวิชาการที่ได้รับมอบหมาย
              </h3>
              <p className="text-xs text-slate-500">
                คลิกรายการเพื่อดูรายละเอียด เกณฑ์ และส่งไฟล์
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              {assignmentTasks.length} หัวข้อ
            </span>
          </div>

          <div className="space-y-3">
            {assignmentTasks.map((task) => {
              const mySub = submissions.find(
                (s) => s.taskId === task.id && s.userId === currentUser.id
              );
              const isOverdue = task.dueDate < todayStr && !mySub;
              const isToday = task.dueDate === todayStr && !mySub;

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {mySub ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> ส่งแล้ว ({formatDateTime(mySub.submittedAt)})
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> เลยกำหนดส่งแล้ว (สามารถกดส่งล่าช้าได้)
                        </span>
                      ) : isToday ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> กำหนดส่งวันนี้
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                          รอดำเนินการ
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => onSelectTask(task)}
                      className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      {task.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>กำหนดส่ง (dd/mm/yyyy): <strong className="text-slate-700">{formatThaiDate(task.dueDate)}</strong></span>
                      <span>&bull;</span>
                      <span>ผู้มอบหมาย: {task.createdByName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => onSelectTask(task)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      ดูรายละเอียด
                    </button>
                    <button
                      onClick={() => onNavigateToSubmit(task)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        mySub
                          ? 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                          : 'bg-purple-600 text-white hover:bg-purple-700 btn-glow-purple'
                      }`}
                    >
                      {mySub ? 'แก้ไขงาน' : 'ส่งงาน'} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTTOM SECTION: OVERDUE / UNCOMPLETED TRACKER */}
      {isAdmin ? (
        /* ADMIN OVERDUE TRACKER: Shows Member names & their missing tasks */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 card-hover-effect">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                สรุปรายชื่อสมาชิกที่ค้างส่งงานวิชาการ
              </h3>
              <p className="text-xs text-slate-500">
                รายชื่อสมาชิกพร้อมหัวข้องานที่ยังไม่ได้ส่ง (ติดตามงานได้ทันที)
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              {adminPendingTracker.length} ท่านที่ยังมีงานค้าง
            </span>
          </div>

          {adminPendingTracker.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">
                ยอดเยี่ยม! สมาชิกทุกคนส่งงานวิชาการครบถ้วนแล้ว
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-3 px-4 rounded-l-xl">ชื่อ-นามสกุล / สมาชิก</th>
                    <th className="py-3 px-4">กลุ่มสาระการเรียนรู้</th>
                    <th className="py-3 px-4">หัวข้องานที่ค้างส่ง</th>
                    <th className="py-3 px-4 text-center rounded-r-xl">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminPendingTracker.map(({ member, overdueTasks, pendingTasks }) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{member.name}</div>
                            <div className="text-[10px] text-slate-400">{member.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {member.department || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {pendingTasks.map((t) => {
                            const isOver = t.dueDate < todayStr;
                            return (
                              <div
                                key={t.id}
                                className="flex items-center gap-1.5"
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isOver ? 'bg-rose-500' : 'bg-amber-400'
                                  }`}
                                />
                                <span className="font-medium text-slate-800">
                                  {t.title}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                    isOver
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  กำหนด: {formatThaiDate(t.dueDate)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onNavigateToGrading()}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors whitespace-nowrap"
                        >
                          ติดตามงาน
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* MEMBER OVERDUE SECTION */
        myPendingTasks.length > 0 && (
          <div className="bg-rose-50/60 rounded-3xl border border-rose-200 p-5 sm:p-6 card-hover-effect">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                งานค้างที่คุณยังไม่ได้ส่ง ({myPendingTasks.length} รายการ)
              </h3>
            </div>
            <p className="text-xs text-rose-700 mb-4">
              หากส่งช้ากว่ากำหนดระบบจะแจ้งเตือน แต่คุณยังสามารถกดส่งงานได้ตามปกติ
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myPendingTasks.map((t) => {
                const isOver = t.dueDate < todayStr;
                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-xs font-bold ${
                            isOver ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {isOver ? 'เลยกำหนดส่ง' : 'ยังไม่ส่ง'} ({formatThaiDate(t.dueDate)})
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                        {t.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => onNavigateToSubmit(t)}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> ส่งงานนี้ตอนนี้
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

    </div>
  );
};
