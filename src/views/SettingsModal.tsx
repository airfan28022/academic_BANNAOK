import React, { useState, useRef } from 'react';
import { User, SchoolConfig } from '../types';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, showToast } from '../utils/alerts';
import { compressImage, formatThaiDate } from '../utils/storage';
import {
  Settings,
  User as UserIcon,
  Building,
  Upload,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  X,
  Key,
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
  const [activeTab, setActiveTab] = useState<'profile' | 'members' | 'password'>('profile');

  // Profile Form States
  const [name, setName] = useState(currentUser.name);
  const [schoolName, setSchoolName] = useState(schoolConfig.schoolName);
  const [departmentName, setDepartmentName] = useState(schoolConfig.departmentName || '');
  const [userAvatar, setUserAvatar] = useState(currentUser.avatar || '');
  const [schoolLogo, setSchoolLogo] = useState(schoolConfig.schoolLogo || '');
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // File Input Refs
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Avatar Upload with Compression
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingAvatar(true);
      const compressedDataUrl = await compressImage(file, 256, 256, 0.85);
      setUserAvatar(compressedDataUrl);
      showToast('success', 'เลือกและปรับขนาดรูปโปรไฟล์เรียบร้อย');
    } catch (err) {
      console.error('Error reading avatar:', err);
      showErrorAlert('เกิดข้อผิดพลาด', 'ไม่สามารถอ่านไฟล์รูปภาพได้');
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  // Logo Upload with Compression
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingLogo(true);
      const compressedDataUrl = await compressImage(file, 256, 256, 0.85);
      setSchoolLogo(compressedDataUrl);
      showToast('success', 'เลือกและปรับขนาดโลโก้เรียบร้อย');
    } catch (err) {
      console.error('Error reading logo:', err);
    } finally {
      setIsProcessingLogo(false);
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
        ...schoolConfig,
        schoolName: schoolName.trim(),
        schoolLogo: schoolLogo,
        departmentName: departmentName.trim() || 'กลุ่มบริหารงานวิชาการ',
      };
      onUpdateSchoolConfig(updatedConfig);
    }

    showSuccessAlert('บันทึกข้อมูลสำเร็จ!', 'ข้อมูลส่วนตัวและระบบได้รับการบันทึกเรียบร้อยแล้ว');
    // Close modal and return to webpage immediately
    onClose();
  };

  // Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser.password && currentPassword !== currentUser.password) {
      showErrorAlert('รหัสผ่านเดิมไม่ถูกต้อง', 'กรุณาตรวจสอบรหัสผ่านปัจจุบันอีกครั้ง');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      showErrorAlert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
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
    // Close modal and return to webpage immediately
    onClose();
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

        {/* Tab Navigation (Drive & Cloudflare removed per user request, handled seamlessly behind the scenes) */}
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
                รูปโปรไฟล์ผู้ใช้ (Avatar)
              </label>
              <div className="flex items-center gap-4 p-3 bg-purple-50/50 border border-purple-100 rounded-2xl">
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
                      {name.charAt(0) || 'U'}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
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
                    disabled={isProcessingAvatar}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-purple-100/50 text-purple-700 border border-purple-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingAvatar ? 'กำลังปรับขนาดภาพ...' : 'เลือกไฟล์รูปโปรไฟล์'}</span>
                  </button>
                  <p className="text-[10px] text-slate-400">
                    ระบบจะบีบอัดภาพให้อัตโนมัติ ป้องกันปัญหาระบบค้างและทำงานรวดเร็ว
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
                    โลโก้โรงเรียน
                  </label>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
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

                    <div className="space-y-1.5 flex-1">
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
                        disabled={isProcessingLogo}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isProcessingLogo ? 'กำลังปรับขนาดภาพ...' : 'เลือกไฟล์โลโก้โรงเรียน'}</span>
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

                {/* Department Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อฝ่าย / กลุ่มงาน
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="กลุ่มบริหารงานวิชาการ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
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
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs flex items-center gap-1"
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

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {approvedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-500">
                          ID: {user.userId} &bull; {user.department || '-'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMember(user)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="ลบสมาชิก"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
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
