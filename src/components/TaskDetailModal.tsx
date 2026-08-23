import React from 'react';
import { Task, Submission, User } from '../types';
import { X, Calendar, UserCheck, Download, AlertCircle, CheckCircle2, Clock, MessageSquare, Award, ArrowRight } from 'lucide-react';
import { formatThaiDate, formatDateTime, formatFileSize, triggerFileDownload } from '../utils/storage';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  currentUser: User;
  submissions: Submission[];
  allUsers: User[];
  onGoToSubmit: (task: Task) => void;
  onGoToGrading: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  currentUser,
  submissions,
  allUsers,
  onGoToSubmit,
  onGoToGrading,
}) => {
  if (!task) return null;

  const isAdmin = currentUser.role === 'admin';
  const isAnnouncement = task.type === 'announcement';

  // Submissions for this task
  const taskSubmissions = submissions.filter((s) => s.taskId === task.id);
  const mySubmission = submissions.find(
    (s) => s.taskId === task.id && s.userId === currentUser.id
  );

  const approvedMembers = allUsers.filter((u) => u.role === 'member' && u.status === 'approved');

  // Check if overdue
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate < todayStr && !mySubmission && !isAnnouncement;
  const isDueToday = task.dueDate === todayStr;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isAnnouncement
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                {isAnnouncement ? '📢 ประกาศแจ้งเพื่อทราบ' : '📋 งานที่มอบหมาย'}
              </span>
              {isOverdue && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> เลยกำหนดส่งแล้ว
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-5">
          
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">
                  {isAnnouncement ? 'วันที่ประกาศ / วันกิจกรรม' : 'กำหนดส่งงาน (dd/mm/yyyy)'}
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {formatThaiDate(task.dueDate)} {task.dueTime ? `เวลา ${task.dueTime} น.` : ''}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">
                  ผู้มอบหมาย / ประกาศ
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {task.createdByName || 'ฝ่ายบริหารงานวิชาการ'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              รายละเอียด / คำชี้แจง
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {task.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
            </div>
          </div>

          {/* Attachments provided by Admin */}
          {task.attachments && task.attachments.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                เอกสารแนบ / เกณฑ์ประเมิน ({task.attachments.length} ไฟล์)
              </h4>
              <div className="space-y-2">
                {task.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => triggerFileDownload(file.url, file.name)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors flex-shrink-0 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> ดาวน์โหลด
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member Submission Status Section */}
          {!isAdmin && !isAnnouncement && (
            <div className="p-4 rounded-2xl border bg-slate-50/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  สถานะการส่งงานของคุณ
                </span>
                {mySubmission ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ส่งงานแล้ว
                  </span>
                ) : isOverdue ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> ยังไม่ได้ส่ง (เลยกำหนด)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> ยังไม่ได้ส่งงาน
                  </span>
                )}
              </div>

              {mySubmission && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>ส่งเมื่อ:</span>
                    <span className="font-semibold text-slate-800">
                      {formatDateTime(mySubmission.submittedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>ไฟล์ที่แนบส่ง:</span>
                    <span className="font-semibold text-slate-800">
                      {mySubmission.files.length} ไฟล์
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Stats Section */}
          {isAdmin && !isAnnouncement && (
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-purple-900">
                  สถิติการส่งงานของสมาชิก
                </div>
                <div className="text-sm font-semibold text-purple-700">
                  ส่งแล้ว {taskSubmissions.length} จาก {approvedMembers.length} คน
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onGoToGrading(task);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1.5 btn-glow-purple"
              >
                ติดตามงาน <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          {!isAdmin && !isAnnouncement && (
            <button
              onClick={() => {
                onClose();
                onGoToSubmit(task);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 btn-glow-purple transition-all flex items-center gap-2"
            >
              {mySubmission ? 'แก้ไข / ส่งงานใหม่' : 'ส่งงานนี้ทันที'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
