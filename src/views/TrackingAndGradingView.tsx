import React, { useState, useEffect } from 'react';
import { Task, Submission, User } from '../types';
import { showSuccessAlert, showConfirmDialog } from '../utils/alerts';
import { formatThaiDate, formatDateTime, formatFileSize, triggerFileDownload } from '../utils/storage';
import { getDriveFolderUrl, GOOGLE_DRIVE_CONFIG } from '../utils/googleDrive';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Users,
  Calendar,
  File,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  ExternalLink,
  FolderSync,
} from 'lucide-react';

interface TrackingAndGradingViewProps {
  currentUser: User;
  tasks: Task[];
  submissions: Submission[];
  allUsers: User[];
  onUpdateSubmission?: (submission: Submission) => void;
  onDeleteSubmission: (submissionId: string) => void;
  preSelectedTask?: Task | null;
}

export const TrackingAndGradingView: React.FC<TrackingAndGradingViewProps> = ({
  currentUser,
  tasks,
  submissions,
  allUsers,
  onDeleteSubmission,
  preSelectedTask,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const approvedMembers = allUsers.filter((u) => u.role === 'member' && u.status === 'approved');
  const assignmentTasks = tasks.filter((t) => t.type === 'assignment');

  const todayStr = new Date().toISOString().split('T')[0];

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>(() => {
    // By default expand all tasks or preSelectedTask
    const initial: Record<string, boolean> = {};
    assignmentTasks.forEach((t) => {
      initial[t.id] = true;
    });
    return initial;
  });

  // Expand specific preSelectedTask if provided
  useEffect(() => {
    if (preSelectedTask) {
      setExpandedTaskIds((prev) => ({
        ...prev,
        [preSelectedTask.id]: true,
      }));
    }
  }, [preSelectedTask]);

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    assignmentTasks.forEach((t) => {
      all[t.id] = true;
    });
    setExpandedTaskIds(all);
  };

  const handleCollapseAll = () => {
    setExpandedTaskIds({});
  };

  // Delete submission
  const handleDeleteSubmission = async (sub: Submission) => {
    const ok = await showConfirmDialog(
      'ยืนยันการลบรายการส่งงาน?',
      `ต้องการลบงาน "${sub.title}" ของ ${sub.userName} ใช่หรือไม่?`,
      'ลบรายการ',
      'ยกเลิก',
      true
    );
    if (ok) {
      onDeleteSubmission(sub.id);
      showSuccessAlert('ลบสำเร็จ', 'ข้อมูลการส่งงานถูกลบเรียบร้อยแล้ว');
    }
  };

  // Filter tasks if search is active
  const filteredTasks = assignmentTasks.filter((task) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTaskTitle = task.title.toLowerCase().includes(q);

    // Also check if any submission or member under this task matches search
    const taskSubs = submissions.filter((s) => s.taskId === task.id);
    const matchMember = taskSubs.some(
      (s) =>
        s.userName.toLowerCase().includes(q) ||
        (s.userDepartment && s.userDepartment.toLowerCase().includes(q)) ||
        s.title.toLowerCase().includes(q)
    );

    return matchTaskTitle || matchMember;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
            ติดตามงานวิชาการ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'ระบบจัดกลุ่มการส่งงานตามหัวข้องานที่มอบหมายโดยอัตโนมัติ ตรวจสอบผู้ส่งและดาวน์โหลดไฟล์'
              : 'ตรวจสอบสถานะการส่งงานของเพื่อนร่วมงานและดาวน์โหลดเอกสารประกอบ'}
          </p>
        </div>

        {/* Global Expand / Collapse & Drive controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <a
              href={getDriveFolderUrl(GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:text-purple-700 hover:bg-purple-50 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all group"
              title="เปิด Google Drive โฟลเดอร์หลักของระบบ"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" fill="currentColor">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z" fill="#ea4335"/>
                <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
                <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2z" fill="#26842a"/>
                <path d="m73.55 25-13.75-23.8c-1.35-.8-2.9-1.2-4.45-1.2h-.1l13.75 23.8 14.7 25.45c.8-1.4 1.2-2.95 1.2-4.5 0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span>เปิด Google Drive หลัก</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
            </a>
          )}
          {/* Grouped Expand & Collapse Buttons */}
          <div className="inline-flex items-center rounded-xl bg-slate-100/90 p-0.5 border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-700 hover:bg-white hover:shadow-xs transition-all flex items-center gap-1.5"
              title="ขยายแสดงรายละเอียดทุกหัวข้องาน"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>ขยายทั้งหมด</span>
            </button>
            <div className="w-px h-4 bg-slate-300 mx-0.5" />
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:shadow-xs transition-all flex items-center gap-1.5"
              title="ย่อซ่อนรายละเอียดทุกหัวข้องาน"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>ย่อทั้งหมด</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามหัวข้องานที่มอบหมาย, ชื่อครูผู้ส่ง, หรือกลุ่มสาระการเรียนรู้..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>
      </div>

      {/* AUTOMATIC GROUPING BY ADMIN ASSIGNED TASKS */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center text-slate-400">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">ไม่พบหัวข้องานวิชาการ</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือสร้างรายการมอบหมายงานใหม่</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredTasks.map((task) => {
            const isExpanded = !!expandedTaskIds[task.id];
            const taskSubs = submissions.filter((s) => s.taskId === task.id);
            const submittedUserIds = new Set(taskSubs.map((s) => s.userId));

            const isOverdue = task.dueDate < todayStr;
            const submittedCount = taskSubs.length;
            const totalMembers = approvedMembers.length;
            const progressPercent = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0;

            const pendingMembers = approvedMembers.filter((m) => !submittedUserIds.has(m.id));

            return (
              <div
                key={task.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all card-hover-effect"
              >
                
                {/* TASK GROUP HEADER (Click to Expand / Collapse) */}
                <div
                  onClick={() => toggleTaskExpand(task.id)}
                  className="p-5 sm:p-6 bg-gradient-to-r from-slate-50/80 via-white to-purple-50/30 border-b border-slate-100 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        📋 งานที่มอบหมาย
                      </span>
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        กำหนดส่ง (dd/mm/yyyy): <strong className={isOverdue ? 'text-rose-600' : 'text-slate-800'}>{formatThaiDate(task.dueDate)}</strong>
                      </span>
                      {isOverdue && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          เลยกำหนด
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Google Drive Link for Admin - Minimal Aesthetic Button */}
                    {isAdmin && (
                      <div className="pt-2 flex items-center gap-2">
                        <a
                          href={task.driveFolderUrl || getDriveFolderUrl(task.driveFolderId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:text-purple-700 hover:bg-purple-50/80 border border-slate-200/90 shadow-xs hover:border-purple-200 transition-all group"
                          title="เปิดโฟลเดอร์รวบรวมไฟล์งานใน Google Drive"
                        >
                          <svg className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" viewBox="0 0 87.3 78" fill="currentColor">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5z" fill="#00ac47"/>
                            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z" fill="#ea4335"/>
                            <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
                            <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2z" fill="#26842a"/>
                            <path d="m73.55 25-13.75-23.8c-1.35-.8-2.9-1.2-4.45-1.2h-.1l13.75 23.8 14.7 25.45c.8-1.4 1.2-2.95 1.2-4.5 0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                          </svg>
                          <span>Google Drive โฟลเดอร์งาน</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right: Progress & Toggle Icon */}
                  <div className="flex items-center justify-between md:justify-end gap-5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-bold text-slate-700">
                        ส่งแล้ว <span className="text-purple-700 font-extrabold">{submittedCount}/{totalMembers}</span> ท่าน ({progressPercent}%)
                      </div>
                      <div className="w-36 sm:w-44 h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-purple-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* TASK GROUP EXPANDED CONTENT: SUBMISSIONS LIST */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6">
                    
                    {/* Submissions Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          รายการที่ส่งแล้ว ({taskSubs.length} ท่าน)
                        </h4>
                      </div>

                      {taskSubs.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          ยังไม่มีสมาชิกส่งงานในหัวข้อนี้
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                                <th className="py-2.5 px-3 rounded-l-xl">ผู้ส่งงาน / สังกัด</th>
                                <th className="py-2.5 px-3">หัวข้อที่ส่ง</th>
                                <th className="py-2.5 px-3">วัน-เวลาที่ส่งงาน</th>
                                <th className="py-2.5 px-3">ไฟล์แนบ (ดาวน์โหลด)</th>
                                <th className="py-2.5 px-3">สถานะ</th>
                                {isAdmin && (
                                  <th className="py-2.5 px-3 text-center rounded-r-xl">จัดการ</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {taskSubs.map((sub) => {
                                const isLate = sub.status === 'late';
                                return (
                                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                          {sub.userName.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="font-bold text-slate-900">{sub.userName}</div>
                                          <div className="text-[10px] text-slate-400">{sub.userDepartment || '-'}</div>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-3 px-3 max-w-xs">
                                      <div className="font-bold text-slate-800 truncate">{sub.title}</div>
                                      {sub.description && (
                                        <div className="text-[10px] text-slate-400 truncate">{sub.description}</div>
                                      )}
                                    </td>

                                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                      {formatDateTime(sub.submittedAt)}
                                    </td>

                                    <td className="py-3 px-3">
                                      <div className="flex flex-wrap gap-1.5">
                                        {sub.files.map((f) => (
                                          <button
                                            key={f.id}
                                            onClick={() => triggerFileDownload(f.url, f.name)}
                                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-[11px] flex items-center gap-1 transition-colors border border-purple-200 shadow-xs truncate max-w-[200px]"
                                            title={`ดาวน์โหลด ${f.name} (${formatFileSize(f.size)})`}
                                          >
                                            <Download className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                            <span className="truncate">{f.name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </td>

                                    <td className="py-3 px-3 whitespace-nowrap">
                                      {isLate ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> ส่งช้ากว่ากำหนด
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                          <Check className="w-3 h-3" /> ส่งตรงเวลา
                                        </span>
                                      )}
                                    </td>

                                    {isAdmin && (
                                      <td className="py-3 px-3 text-center">
                                        <button
                                          onClick={() => handleDeleteSubmission(sub)}
                                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                          title="ลบรายการส่งงานนี้"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Pending Members Section (Who hasn't submitted yet) */}
                    {pendingMembers.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            ยังไม่ส่งงาน ({pendingMembers.length} ท่าน)
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {pendingMembers.map((member) => (
                            <div
                              key={member.id}
                              className="p-2.5 rounded-xl border border-rose-200/80 bg-rose-50/40 flex items-center gap-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 text-xs truncate">
                                  {member.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {member.department || '-'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
