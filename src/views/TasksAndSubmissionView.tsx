import React, { useState, useRef, useEffect } from 'react';
import { Task, Submission, User, SubmissionFile, TaskAttachment } from '../types';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showWarningAlert, showToast } from '../utils/alerts';
import { formatThaiDate, formatDateTime, formatFileSize, triggerFileDownload, readFileAsDataURL } from '../utils/storage';
import { DatePickerInput } from '../components/DatePickerInput';
import { findOrCreateDriveFolder, uploadFileToDrive, getDriveFolderUrl, GOOGLE_DRIVE_CONFIG } from '../utils/googleDrive';
import {
  FileUp,
  Send,
  Plus,
  Trash2,
  Calendar,
  Paperclip,
  UploadCloud,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Bell,
  Layers,
  Edit,
  Download,
  Check,
  Megaphone,
} from 'lucide-react';

interface TasksAndSubmissionViewProps {
  currentUser: User;
  tasks: Task[];
  submissions: Submission[];
  onAddTask: (newTask: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSubmitWork: (submission: Submission) => void;
  onUpdateSubmission: (submission: Submission) => void;
  onDeleteSubmission: (submissionId: string) => void;
  preSelectedTask?: Task | null;
}

export const TasksAndSubmissionView: React.FC<TasksAndSubmissionViewProps> = ({
  currentUser,
  tasks,
  submissions,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSubmitWork,
  onUpdateSubmission,
  onDeleteSubmission,
  preSelectedTask,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Modal Controls
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Admin form type: assignment vs announcement
  const [adminTab, setAdminTab] = useState<'assignment' | 'announcement'>('assignment');

  // ADMIN FORM STATES (No category required, date only without hours/minutes)
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [adminAttachments, setAdminAttachments] = useState<TaskAttachment[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // MEMBER FORM STATES
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionDesc, setSubmissionDesc] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([]);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const assignmentTasks = tasks.filter((t) => t.type === 'assignment');
  const announcementTasks = tasks.filter((t) => t.type === 'announcement');
  const mySubmissions = submissions.filter((s) => s.userId === currentUser.id);

  // Handle Pre-selected Task
  useEffect(() => {
    if (preSelectedTask && !isAdmin) {
      handleOpenSubmitModal(preSelectedTask);
    }
  }, [preSelectedTask, isAdmin]);

  // Open Admin Add Modal
  const handleOpenAdminAddModal = (type: 'assignment' | 'announcement' = 'assignment') => {
    setEditingTaskId(null);
    setAdminTab(type);
    setTaskTitle('');
    setTaskDesc('');
    const d = new Date(Date.now() + 7 * 86400000);
    setTaskDueDate(d.toISOString().split('T')[0]);
    setAdminAttachments([]);
    setIsAdminModalOpen(true);
  };

  // Open Admin Edit Modal
  const handleOpenAdminEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setAdminTab(task.type);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskDueDate(task.dueDate || todayStr);
    setAdminAttachments(task.attachments || []);
    setIsAdminModalOpen(true);
  };

  // Open Member Submit Modal
  const handleOpenSubmitModal = (targetTask?: Task) => {
    const taskToSelect = targetTask || assignmentTasks[0];
    if (!taskToSelect) {
      showWarningAlert('ยังไม่มีงานที่มอบหมาย', 'ขณะนี้ยังไม่มีรายการงานวิชาการที่เปิดให้ส่ง');
      return;
    }

    const tId = taskToSelect.id;
    setSelectedTaskId(tId);

    const existingSub = submissions.find(
      (s) => s.taskId === tId && s.userId === currentUser.id
    );

    if (existingSub) {
      setEditingSubmissionId(existingSub.id);
      setSubmissionTitle(existingSub.title);
      setSubmissionDesc(existingSub.description || '');
      setUploadedFiles(existingSub.files || []);
    } else {
      setEditingSubmissionId(null);
      setSubmissionTitle(`ส่งงาน: ${taskToSelect.title}`);
      setSubmissionDesc('');
      setUploadedFiles([]);
    }

    setIsMemberModalOpen(true);
  };

  // Member task selection change inside modal
  const handleMemberTaskSelectChange = (tId: string) => {
    setSelectedTaskId(tId);
    const chosenTask = tasks.find((t) => t.id === tId);
    const existingSub = submissions.find(
      (s) => s.taskId === tId && s.userId === currentUser.id
    );

    if (existingSub) {
      setEditingSubmissionId(existingSub.id);
      setSubmissionTitle(existingSub.title);
      setSubmissionDesc(existingSub.description || '');
      setUploadedFiles(existingSub.files || []);
    } else {
      setEditingSubmissionId(null);
      setSubmissionTitle(chosenTask ? `ส่งงาน: ${chosenTask.title}` : '');
      setSubmissionDesc('');
      setUploadedFiles([]);
    }
  };

  // ADMIN: Multi-File Upload for attachments
  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: TaskAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await readFileAsDataURL(file);
        
        // Upload to Google Drive via GAS or direct API
        const driveResult = await uploadFileToDrive({
          name: file.name,
          type: file.type || 'application/octet-stream',
          base64OrBlob: dataUrl,
          size: file.size,
        }, GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID);

        newAttachments.push({
          id: driveResult.id || `att_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: dataUrl,
          driveFileId: driveResult.id,
          driveViewUrl: driveResult.webViewLink,
          uploadTime: new Date().toISOString(),
        });
      } catch (err) {
        console.error('File read/upload error:', err);
      }
    }

    setAdminAttachments((prev) => [...prev, ...newAttachments]);
    showToast('success', `อัปโหลด ${newAttachments.length} ไฟล์แนบสำเร็จ`);
    if (adminFileInputRef.current) adminFileInputRef.current.value = '';
  };

  // ADMIN: Save Task / Announcement
  const handleAdminSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskTitle.trim() || !taskDueDate) {
      showErrorAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'กรุณาระบุหัวข้อและวันกำหนดส่ง');
      return;
    }

    const nowIso = new Date().toISOString();

    // Find or create Drive Folder for assignment
    let driveFolderId = GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID;
    let driveFolderUrl = getDriveFolderUrl(GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID);

    if (adminTab === 'assignment') {
      try {
        const folder = await findOrCreateDriveFolder(
          `[งานวิชาการ] ${taskTitle.trim()}`,
          GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID
        );
        driveFolderId = folder.id;
        driveFolderUrl = folder.webViewLink;
      } catch (err) {
        console.warn('Google Drive folder setup fallback:', err);
      }
    }

    if (editingTaskId) {
      const existing = tasks.find((t) => t.id === editingTaskId);
      if (existing) {
        const updated: Task = {
          ...existing,
          type: adminTab,
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          category: adminTab === 'assignment' ? 'งานวิชาการ' : 'ประกาศทั่วไป',
          dueDate: taskDueDate,
          dueTime: undefined,
          attachments: adminAttachments,
          driveFolderId: existing.driveFolderId || driveFolderId,
          driveFolderUrl: existing.driveFolderUrl || driveFolderUrl,
          updatedAt: nowIso,
        };
        onUpdateTask(updated);
        showSuccessAlert('บันทึกการแก้ไขสำเร็จ!', `อัปเดต "${taskTitle}" เรียบร้อยแล้ว`);
      }
    } else {
      const newTask: Task = {
        id: `tsk_${Date.now()}`,
        type: adminTab,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        category: adminTab === 'assignment' ? 'งานวิชาการ' : 'ประกาศทั่วไป',
        dueDate: taskDueDate,
        attachments: adminAttachments,
        driveFolderId,
        driveFolderUrl,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      onAddTask(newTask);
      showSuccessAlert(
        adminTab === 'assignment' ? 'มอบหมายงานวิชาการสำเร็จ!' : 'สร้างประกาศสำเร็จ!',
        adminTab === 'assignment'
          ? `ระบบสร้างโฟลเดอร์ Google Drive สำหรับรวบรวมไฟล์งานเรียบร้อยแล้ว`
          : `ประกาศถูกเพิ่มเข้าสู่ระบบเรียบร้อยแล้ว`
      );
    }

    setIsAdminModalOpen(false);
  };

  // ADMIN: Delete Task
  const handleDeleteTaskConfirm = async (task: Task) => {
    const ok = await showConfirmDialog(
      'ยืนยันการลบรายการนี้?',
      `ต้องการลบ "${task.title}" ใช่หรือไม่ ข้อมูลการส่งงานที่เกี่ยวข้องจะถูกลบด้วย`,
      'ลบรายการ',
      'ยกเลิก',
      true
    );
    if (ok) {
      onDeleteTask(task.id);
      showSuccessAlert('ลบรายการสำเร็จ', 'ข้อมูลถูกลบออกจากระบบเรียบร้อยแล้ว');
    }
  };

  // MEMBER: Multi-file Upload
  const handleMemberFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles: SubmissionFile[] = [];

    const currentTask = tasks.find((t) => t.id === selectedTaskId);
    const targetFolderId = currentTask?.driveFolderId || GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await readFileAsDataURL(file);

        // Upload to Google Drive
        const driveResult = await uploadFileToDrive({
          name: file.name,
          type: file.type || 'application/octet-stream',
          base64OrBlob: dataUrl,
          size: file.size,
        }, targetFolderId);

        newFiles.push({
          id: driveResult.id || `subf_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: dataUrl,
          driveFileId: driveResult.id,
          driveViewUrl: driveResult.webViewLink,
          uploadTime: new Date().toISOString(),
        });
      } catch (err) {
        console.error('File read/upload error:', err);
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setIsUploading(false);
    showToast('success', `อัปโหลด ${newFiles.length} ไฟล์เรียบร้อยแล้ว`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // MEMBER: Submit work
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTaskId) {
      showErrorAlert('กรุณาเลือกหัวข้องาน', 'กรุณาเลือกหัวข้องานวิชาการที่ต้องการส่ง');
      return;
    }

    if (!submissionTitle.trim()) {
      showErrorAlert('กรุณาระบุหัวข้อการส่งงาน', 'หัวข้อการส่งงานเป็นข้อมูลที่จำเป็น');
      return;
    }

    if (uploadedFiles.length === 0) {
      showWarningAlert('ยังไม่ได้แนบไฟล์', 'กรุณาอัปโหลดไฟล์งานอย่างน้อย 1 ไฟล์');
      return;
    }

    const currentTask = tasks.find((t) => t.id === selectedTaskId);
    const isLate = currentTask ? currentTask.dueDate < todayStr : false;
    const nowIso = new Date().toISOString();

    if (editingSubmissionId) {
      const existing = submissions.find((s) => s.id === editingSubmissionId);
      if (existing) {
        const updated: Submission = {
          ...existing,
          title: submissionTitle.trim(),
          description: submissionDesc.trim(),
          files: uploadedFiles,
          updatedAt: nowIso,
        };
        onUpdateSubmission(updated);
        showSuccessAlert('อัปเดตการส่งงานสำเร็จ!', `แก้ไขข้อมูลการส่งงาน "${submissionTitle}" เรียบร้อยแล้ว`);
      }
    } else {
      const newSubmission: Submission = {
        id: `sub_${Date.now()}`,
        taskId: selectedTaskId,
        taskTitle: currentTask?.title || '',
        dueDate: currentTask?.dueDate || '',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userDepartment: currentUser.department,
        title: submissionTitle.trim(),
        description: submissionDesc.trim(),
        files: uploadedFiles,
        status: isLate ? 'late' : 'submitted',
        submittedAt: nowIso,
        updatedAt: nowIso,
      };
      onSubmitWork(newSubmission);
      showSuccessAlert(
        'ส่งงานวิชาการสำเร็จ!',
        isLate
          ? 'ส่งงานเรียบร้อยแล้ว (ระบบบันทึกสถานะ: ส่งช้ากว่ากำหนด)'
          : 'ส่งงานตรงตามกำหนดเรียบร้อยแล้ว'
      );
    }

    setIsMemberModalOpen(false);
  };

  // MEMBER: Delete Submission
  const handleDeleteSubmissionConfirm = async (sub: Submission) => {
    const ok = await showConfirmDialog(
      'ยืนยันการลบการส่งงาน?',
      `ต้องการลบการส่งงาน "${sub.title}" ใช่หรือไม่?`,
      'ลบงานที่ส่ง',
      'ยกเลิก',
      true
    );
    if (ok) {
      onDeleteSubmission(sub.id);
      showSuccessAlert('ลบการส่งงานสำเร็จ', 'นำรายการส่งงานออกจากระบบแล้ว');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header with Prominent "+" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileUp className="w-6 h-6 text-purple-600" />
            มอบหมายงาน & ส่งงาน
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'จัดการรายการมอบหมายงานวิชาการ ติดตามสถานะ และเพิ่มงานใหม่'
              : 'ตรวจสอบรายการงานวิชาการที่ได้รับมอบหมาย และส่งไฟล์งานได้อย่างสะดวกรวดเร็ว'}
          </p>
        </div>

        <div>
          {isAdmin ? (
            <button
              id="admin-add-task-btn"
              onClick={() => handleOpenAdminAddModal('assignment')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 btn-glow-purple"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" /> มอบหมายงานใหม่
            </button>
          ) : (
            <button
              id="member-submit-work-btn"
              onClick={() => handleOpenSubmitModal()}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 btn-glow-purple"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" /> ส่งงานวิชาการ
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADMIN VIEW: ASSIGNED TASKS & ANNOUNCEMENTS LIST WITH EDIT / DELETE        */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="space-y-6">
          
          {/* Assigned Tasks Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 card-hover-effect">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-800">
                  รายการงานที่ได้การมอบหมายงาน ({assignmentTasks.length} รายการ)
                </h3>
              </div>
            </div>

            {assignmentTasks.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                <File className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">ยังไม่มีรายการมอบหมายงาน</p>
                <p className="text-xs text-slate-400 mt-1">กดปุ่ม "+ มอบหมายงานใหม่" ด้านบนเพื่อเริ่มมอบหมายงาน</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {assignmentTasks.map((task) => {
                  const taskSubs = submissions.filter((s) => s.taskId === task.id);
                  const isOverdue = task.dueDate < todayStr;

                  return (
                    <div
                      key={task.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-slate-50/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            📋 งานที่มอบหมาย
                          </span>
                          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            กำหนดส่ง (dd/mm/yyyy): <strong className={isOverdue ? 'text-rose-600' : 'text-slate-800'}>{formatThaiDate(task.dueDate)}</strong>
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ส่งแล้ว {taskSubs.length} คน
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Attachments List */}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] font-semibold text-slate-400">ไฟล์แนบ:</span>
                            {task.attachments.map((att) => (
                              <button
                                key={att.id}
                                onClick={() => triggerFileDownload(att.url, att.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-800 border border-slate-200 transition-colors"
                              >
                                <Download className="w-3 h-3 text-purple-600" /> {att.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                        <button
                          onClick={() => handleOpenAdminEditModal(task)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteTaskConfirm(task)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ลบ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Announcements Section (Optional Admin Feature) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 card-hover-effect">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-800">
                  รายการประกาศและแจ้งเพื่อทราบ ({announcementTasks.length} รายการ)
                </h3>
              </div>
              <button
                onClick={() => handleOpenAdminAddModal('announcement')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มประกาศ
              </button>
            </div>

            {announcementTasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">ไม่มีประกาศแจ้งเพื่อทราบ</p>
            ) : (
              <div className="space-y-3">
                {announcementTasks.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-amber-900">{ann.title}</span>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        กำหนด/กิจกรรม (dd/mm/yyyy): {formatThaiDate(ann.dueDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenAdminEditModal(ann)}
                        className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTaskConfirm(ann)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MEMBER VIEW: ASSIGNED TASKS & MY SUBMITTED WORK WITH "+" SUBMIT BUTTON    */}
      {/* ========================================================================= */}
      {!isAdmin && (
        <div className="space-y-8">
          
          {/* Section 1: Assigned Tasks List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 card-hover-effect">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  รายการงานที่ได้รับมอบหมาย ({assignmentTasks.length} หัวข้อ)
                </h3>
                <p className="text-xs text-slate-500">
                  ตรวจสอบกำหนดส่ง และกดปุ่มเพื่อส่งงานพร้อมแนบไฟล์
                </p>
              </div>
            </div>

            {assignmentTasks.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                <File className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">ไม่มีรายการงานที่มอบหมายในขณะนี้</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {assignmentTasks.map((task) => {
                  const mySub = submissions.find(
                    (s) => s.taskId === task.id && s.userId === currentUser.id
                  );
                  const isOverdue = task.dueDate < todayStr && !mySub;
                  const isToday = task.dueDate === todayStr && !mySub;

                  return (
                    <div
                      key={task.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-purple-300 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {mySub ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3 h-3" /> ส่งแล้ว ({formatDateTime(mySub.submittedAt)})
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> เลยกำหนดส่งแล้ว
                            </span>
                          ) : isToday ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              กำหนดส่งวันนี้
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                              รอดำเนินการ
                            </span>
                          )}

                          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            กำหนดส่ง (dd/mm/yyyy): <strong className={isOverdue ? 'text-rose-600' : 'text-slate-800'}>{formatThaiDate(task.dueDate)}</strong>
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Admin Attachments */}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] font-semibold text-slate-400">ไฟล์แนบจากฝ่ายวิชาการ:</span>
                            {task.attachments.map((att) => (
                              <button
                                key={att.id}
                                onClick={() => triggerFileDownload(att.url, att.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-800 border border-slate-200 transition-colors"
                              >
                                <Download className="w-3 h-3 text-purple-600" /> {att.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                        <button
                          onClick={() => handleOpenSubmitModal(task)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                            mySub
                              ? 'bg-slate-100 text-slate-800 hover:bg-purple-50 hover:text-purple-700 border border-slate-200'
                              : 'bg-purple-600 text-white hover:bg-purple-700 btn-glow-purple'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          {mySub ? 'แก้ไขงานที่ส่ง' : 'ส่งงานนี้'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: My Submitted Works */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 card-hover-effect">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">
                  ประวัติการส่งงานของคุณ ({mySubmissions.length} รายการ)
                </h3>
              </div>
            </div>

            {mySubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                คุณยังไม่มีรายการส่งงาน กดปุ่ม "+ ส่งงานวิชาการ" ด้านบนเพื่อเริ่มส่งงาน
              </p>
            ) : (
              <div className="space-y-3.5">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ส่งงานแล้ว
                        </span>
                        <span className="text-xs text-slate-500">
                          วันที่ส่ง: <strong>{formatDateTime(sub.submittedAt)}</strong>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{sub.title}</h4>
                      {sub.description && (
                        <p className="text-xs text-slate-600">{sub.description}</p>
                      )}

                      {/* Download Submitted Files */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {sub.files.map((file) => (
                          <button
                            key={file.id}
                            onClick={() => triggerFileDownload(file.url, file.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50 transition-colors shadow-xs"
                          >
                            <Download className="w-3 h-3 text-emerald-600" />
                            {file.name} ({formatFileSize(file.size)})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                      <button
                        onClick={() => {
                          const associatedTask = tasks.find((t) => t.id === sub.taskId);
                          handleOpenSubmitModal(associatedTask);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteSubmissionConfirm(sub)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIN TASK ASSIGNMENT MODAL (No category, day picker only)                 */}
      {/* ========================================================================= */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                {editingTaskId ? 'แก้ไขข้อมูล' : 'มอบหมายงาน & สร้างประกาศ'}
              </h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminSaveTask} className="space-y-4">
              
              {/* Type Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAdminTab('assignment')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    adminTab === 'assignment'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 มอบหมายงานวิชาการ
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('announcement')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    adminTab === 'announcement'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📢 ประกาศแจ้งเพื่อทราบ
                </button>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หัวข้อสำหรับมอบหมายงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="เช่น ส่งแผนการจัดการเรียนรู้ (Active Learning) ภาคเรียนที่ 1/2569"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รายละเอียดและคำชี้แจง (ถ้ามี)
                </label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="ระบุข้อกำหนด เกณฑ์ หรือคำแนะนำในการส่งงาน..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                />
              </div>

              {/* Due Date: dd/mm/yyyy (Day only, format e.g. 30/8/2026) */}
              <div>
                <DatePickerInput
                  id="task-due-date-picker"
                  label="กำหนดส่งงาน (dd/mm/yyyy)"
                  value={taskDueDate}
                  onChange={(newDate) => setTaskDueDate(newDate)}
                  required
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  แนบไฟล์ตัวอย่าง / แบบฟอร์มสำหรับสมาชิก
                </label>
                <input
                  type="file"
                  ref={adminFileInputRef}
                  onChange={handleAdminFileUpload}
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => adminFileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-600 hover:text-purple-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-purple-600" />
                  คลิกเพื่อเลือกไฟล์แนบ (Word, PDF, Excel ฯลฯ)
                </button>

                {adminAttachments.length > 0 && (
                  <div className="space-y-2 mt-2.5">
                    {adminAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-100 text-xs text-slate-700"
                      >
                        <span className="truncate max-w-[280px] font-medium">{att.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAdminAttachments((prev) => prev.filter((a) => a.id !== att.id))
                          }
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md btn-glow-purple"
                >
                  {editingTaskId ? 'บันทึกการแก้ไข' : 'ยืนยันมอบหมายงาน'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MEMBER SUBMISSION MODAL (Multi-file upload, dd/mm/yyyy)                   */}
      {/* ========================================================================= */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600" />
                {editingSubmissionId ? 'แก้ไขงานที่ส่ง' : 'แบบฟอร์มส่งงานวิชาการ'}
              </h3>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="space-y-4">
              
              {/* Task Selection Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เลือกหัวข้อการมอบหมายงาน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => handleMemberTaskSelectChange(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                >
                  <option value="" disabled>-- เลือกหัวข้องาน --</option>
                  {assignmentTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} (กำหนดส่ง: {formatThaiDate(t.dueDate)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submission Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หัวข้อการส่งงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={submissionTitle}
                  onChange={(e) => setSubmissionTitle(e.target.value)}
                  placeholder="เช่น ส่งแผนการจัดการเรียนรู้วิชาภาษาไทย ม.1"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  บันทึกเพิ่มเติม / คำชี้แจงถึงฝ่ายวิชาการ (ถ้ามี)
                </label>
                <textarea
                  value={submissionDesc}
                  onChange={(e) => setSubmissionDesc(e.target.value)}
                  rows={3}
                  placeholder="ระบุข้อความหรือหมายเหตุเพิ่มเติม..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                />
              </div>

              {/* File Upload (Multi-file) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  อัปโหลดไฟล์งาน <span className="text-rose-500">*</span> (รองรับไฟล์ Word, PDF, Excel, รูปภาพ ฯลฯ)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMemberFileUpload}
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3.5 px-4 border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-2xl bg-purple-50/50 hover:bg-purple-50 text-xs font-bold text-purple-700 flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <UploadCloud className="w-5 h-5 text-purple-600" />
                  {isUploading ? 'กำลังอัปโหลด...' : '+ คลิกเพื่อเลือกไฟล์งาน (เลือกได้หลายไฟล์พร้อมกัน)'}
                </button>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[280px]">
                          <File className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="font-semibold truncate">{file.name}</span>
                          <span className="text-slate-400">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))
                          }
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md btn-glow-purple"
                >
                  {editingSubmissionId ? 'บันทึกการแก้ไข' : 'ส่งงานทันที'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
