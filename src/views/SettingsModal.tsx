import React, { useState, useRef } from 'react';
import { User, SchoolConfig } from '../types';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showToast } from '../utils/alerts';
import { readFileAsDataURL, formatThaiDate } from '../utils/storage';
import { getDriveFolderUrl, GOOGLE_DRIVE_CONFIG } from '../utils/googleDrive';
import {
  Settings,
  User as UserIcon,
  Building,
  Upload,
  Lock,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  X,
  Shield,
  Key,
  Cloud,
  ExternalLink,
  HardDrive,
  Globe,
  Database,
  Copy,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateCurrentUser: (user: User) => void;
  schoolConfig: SchoolConfig;
  onUpdateSchoolConfig: (config: SchoolConfig) => void;
  allUsers: User[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateCurrentUser,
  schoolConfig,
  onUpdateSchoolConfig,
  allUsers,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
}) => {
  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<'profile' | 'members' | 'cloud' | 'password'>('profile');
  const [copiedDriveId, setCopiedDriveId] = useState(false);

  const handleCopyDriveId = () => {
    navigator.clipboard.writeText(GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID);
    setCopiedDriveId(true);
    showToast('success', 'คัดลอก Folder ID สำเร็จ');
    setTimeout(() => setCopiedDriveId(false), 2000);
  };

  // Profile Form States
  const [name, setName] = useState(currentUser.name);
  const [schoolName, setSchoolName] = useState(schoolConfig.schoolName);
  const [departmentName, setDepartmentName] = useState(schoolConfig.departmentName || '');
  const [academicYear, setAcademicYear] = useState(schoolConfig.academicYear || '2569');
  const [term, setTerm] = useState(schoolConfig.term || '1');
  const [userAvatar, setUserAvatar] = useState(currentUser.avatar || '');
  const [schoolLogo, setSchoolLogo] = useState(schoolConfig.schoolLogo || '');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // File Refs
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setUserAvatar(dataUrl);
      showToast('success', 'เลือกรูปโปรไฟล์เรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
    }
  };

  // Logo Upload (Admin)
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setSchoolLogo(dataUrl);
      showToast('success', 'เลือกโลโก้โรงเรียนเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
    }
  };

  // Save Profile & School Config
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showErrorAlert('กรุณากรอกชื่อ-นามสกุล', 'ชื่อ-นามสกุลเป็นข้อมูลที่จำเป็น');
      return;
    }

    const nowIso = new Date().toISOString();

    // Update User
    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      avatar: userAvatar || undefined,
      updatedAt: nowIso,
    };
    onUpdateCurrentUser(updatedUser);

    // If admin, update school config
    if (isAdmin) {
      const updatedConfig: SchoolConfig = {
        schoolName: schoolName.trim(),
        schoolLogo: schoolLogo,
        academicYear: academicYear.trim(),
        term: term.trim(),
        departmentName: departmentName.trim() || 'กลุ่มบริหารงานวิชาการ',
      };
      onUpdateSchoolConfig(updatedConfig);
    }

    showSuccessAlert('บันทึกข้อมูลส่วนตัวสำเร็จ!', 'ข้อมูลได้รับการอัปเดตเรียบร้อยแล้ว');
  };

  // Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser.password && currentPassword !== currentUser.password) {
      showErrorAlert('รหัสผ่านเดิมไม่ถูกต้อง', 'กรุณาตรวจสอบรหัสผ่านปัจจุบันอีกครั้ง');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      showErrorAlert('รหัสผ่านใหม่สั้นเกินไป', 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorAlert('รหัสผ่านไม่ตรงกัน', 'กรุณายืนยันรหัสผ่านใหม่อีกครั้งให้ตรงกัน');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPassword,
      updatedAt: new Date().toISOString(),
    };

    onUpdateCurrentUser(updatedUser);
    showSuccessAlert('เปลี่ยนรหัสผ่านสำเร็จ!', 'กรุณาใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Member Management actions for Admin
  const handleApprove = (user: User) => {
    onApproveUser(user.id);
    showSuccessAlert('อนุมัติสมาชิกสำเร็จ', `อนุมัติให้ "${user.name}" ใช้งานระบบได้แล้ว`);
  };

  const handleReject = (user: User) => {
    onRejectUser(user.id);
    showToast('warning', `ปฏิเสธการอนุมัติ ${user.name}`);
  };

  const handleDeleteMember = async (user: User) => {
    const ok = await showConfirmDialog(
      'ยืนยันการลบสมาชิก?',
      `ต้องการลบบัญชีของ "${user.name}" (${user.userId}) ใช่หรือไม่?`,
      'ลบสมาชิก',
      'ยกเลิก',
      true
    );
    if (ok) {
      onDeleteUser(user.id);
      showSuccessAlert('ลบสมาชิกสำเร็จ', `ลบบัญชี "${user.name}" ออกจากระบบแล้ว`);
    }
  };

  const pendingUsers = allUsers.filter((u) => u.status === 'pending');
  const approvedUsers = allUsers.filter((u) => u.role === 'member' && u.status === 'approved');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                การตั้งค่าระบบ & บัญชีผู้ใช้
              </h2>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'ตั้งค่าข้อมูลโรงเรียน จัดการสมาชิก และเปลี่ยนรหัสผ่าน' : 'ตั้งค่าข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 my-4 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" /> ข้อมูลส่วนตัว {isAdmin && '& โรงเรียน'}
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                activeTab === 'members'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> จัดการสมาชิก
              {pendingUsers.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'cloud'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" /> Drive & Cloudflare
            </button>
          )}

          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'password'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> เปลี่ยนรหัสผ่าน
          </button>
        </div>

        {/* TAB 1: PROFILE & SCHOOL INFO */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
            
            {/* User Avatar Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                รูปโปรไฟล์ผู้ใช้ (Choose file)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xl font-black text-purple-700">
                      {name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarFileRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> เลือกไฟล์รูปโปรไฟล์ (Choose file)
                  </button>
                  <p className="text-[10px] text-slate-400">
                    รองรับไฟล์ภาพ JPG, PNG, WEBP
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* ADMIN ONLY: School Configuration */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> ข้อมูลโรงเรียนและหน่วยงาน (เฉพาะ Admin)
                </h4>

                {/* School Logo Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    โลโก้โรงเรียน (Choose file)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-600 p-0.5 shadow-xs overflow-hidden flex items-center justify-center flex-shrink-0">
                      {schoolLogo ? (
                        <img
                          src={schoolLogo}
                          alt="School Logo"
                          className="w-full h-full object-cover rounded-[14px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Building className="w-6 h-6 text-white" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        ref={logoFileRef}
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" /> เลือกไฟล์โลโก้โรงเรียน (Choose file)
                      </button>
                      <p className="text-[10px] text-slate-400">
                        ตราสัญลักษณ์โรงเรียน / สถานศึกษา
                      </p>
                    </div>
                  </div>
                </div>

                {/* School Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อโรงเรียน / สถานศึกษา
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Academic Year & Term */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ปีการศึกษา
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="เช่น 2569"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ภาคเรียนที่
                    </label>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="เช่น 1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 btn-glow-purple"
              >
                บันทึกข้อมูล
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: ADMIN MEMBER MANAGEMENT */}
        {activeTab === 'members' && isAdmin && (
          <div className="space-y-5 py-2">
            
            {/* Pending Members Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  สมาชิกรอการอนุมัติ ({pendingUsers.length} ท่าน)
                </h4>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                  ไม่มีสมาชิกรอการอนุมัติในขณะนี้
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-600">
                          ID: <strong>{user.userId}</strong> &bull; {user.department}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          สมัครเมื่อ: {formatThaiDate(user.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(user)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติ
                        </button>
                        <button
                          onClick={() => handleReject(user)}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-xs flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Members Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                สมาชิกที่อนุมัติแล้ว ({approvedUsers.length} ท่าน)
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {approvedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs hover:bg-purple-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-[10px] text-slate-500">
                          ID: {user.userId} &bull; {user.department || '-'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMember(user)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      title="ลบสมาชิกออกจากระบบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CLOUD & GOOGLE DRIVE INTEGRATION GUIDE */}
        {activeTab === 'cloud' && (
          <div className="space-y-5 py-2">
            
            {/* Google Drive Status Box */}
            <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white text-amber-500 shadow-xs flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 87.3 78" fill="currentColor">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5z" fill="#00ac47"/>
                      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z" fill="#ea4335"/>
                      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
                      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2z" fill="#26842a"/>
                      <path d="m73.55 25-13.75-23.8c-1.35-.8-2.9-1.2-4.45-1.2h-.1l13.75 23.8 14.7 25.45c.8-1.4 1.2-2.95 1.2-4.5 0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Google Drive Folder ID ที่เชื่อมต่อ</h3>
                    <p className="text-[11px] text-slate-500">โฟลเดอร์หลักสำหรับจัดเก็บไฟล์ที่ส่งและเอกสารทั้งหมด</p>
                  </div>
                </div>

                <a
                  href={getDriveFolderUrl(GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 transition-all flex-shrink-0"
                >
                  <span>เปิดโฟลเดอร์</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="mt-3 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/80">
                <code className="text-xs text-purple-700 font-mono flex-1 select-all break-all">
                  {GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID}
                </code>
                <button
                  onClick={handleCopyDriveId}
                  className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                  title="คัดลอก ID"
                >
                  {copiedDriveId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Cloudflare Hosting & Database Guide */}
            <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-600" />
                <h3 className="text-xs font-bold text-slate-900">แนวทางการเชื่อมต่อและโฮสต์บน Cloudflare เพื่อใช้งานจริง</h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="bg-white p-3 rounded-xl border border-orange-100 space-y-1">
                  <div className="font-bold text-orange-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    Cloudflare Pages (เว็บแอปพลิเคชัน & โดเมน)
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5">
                    นำซอร์สโค้ดโปรเจกต์นี้ขึ้น GitHub แล้วเชื่อมต่อกับ <strong>Cloudflare Pages</strong> เลือก Build Command เป็น <code>npm run build</code> และ Output directory เป็น <code>dist</code> คุณจะได้โดเมน <code>.pages.dev</code> พร้อมใช้งานทั่วโลกฟรี
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-orange-100 space-y-1">
                  <div className="font-bold text-orange-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    Cloudflare D1 (ฐานข้อมูล SQL ไร้เซิร์ฟเวอร์)
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5">
                    สร้างฐานข้อมูล SQL บน Cloudflare D1 เพื่อบันทึกข้อมูลสมาชิก งานที่มอบหมาย และสถานะการส่งงานถาวรผ่าน Cloudflare Worker API
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-orange-100 space-y-1">
                  <div className="font-bold text-orange-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    ระบบไฟล์และโฟลเดอร์อัตโนมัติ Google Drive
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5">
                    เมื่อ Admin สั่งมอบหมายงาน ระบบจะสร้าง Sub-folder ภายใต้ Root Drive ID ให้อัตโนมัติ สมาชิกส่งงาน ไฟล์จะถูกรวบรวมเข้าโฟลเดอร์งานนั้นทันที
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 btn-glow-purple"
              >
                เข้าใจแล้ว / ปิดหน้าต่าง
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-4 py-2">
            
            {currentUser.password && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสผ่านปัจจุบัน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสผ่านใหม่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 4 ตัว)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ยืนยันรหัสผ่านใหม่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 btn-glow-purple"
              >
                บันทึกรหัสผ่านใหม่
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
