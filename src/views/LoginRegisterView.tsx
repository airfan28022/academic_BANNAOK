import React, { useState } from 'react';
import { User, SchoolConfig } from '../types';
import { showSuccessAlert, showErrorAlert, showInfoAlert } from '../utils/alerts';
import { Eye, EyeOff, LogIn, UserPlus, Lock, User as UserIcon, Shield, CheckCircle2, Clock } from 'lucide-react';

interface LoginRegisterViewProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
  onRegister: (newUser: User) => void;
  schoolConfig: SchoolConfig;
}

export const LoginRegisterView: React.FC<LoginRegisterViewProps> = ({
  onLoginSuccess,
  users,
  onRegister,
  schoolConfig,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUserId, setRegUserId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('กลุ่มสาระฯ ภาษาไทย');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'กลุ่มสาระฯ ภาษาไทย',
    'กลุ่มสาระฯ คณิตศาสตร์',
    'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
    'กลุ่มสาระฯ สังคมศึกษา ศาสนา และวัฒนธรรม',
    'กลุ่มสาระฯ สุขศึกษาและพลศึกษา',
    'กลุ่มสาระฯ ศิลปะ',
    'กลุ่มสาระฯ การงานอาชีพ',
    'กลุ่มสาระฯ ภาษาต่างประเทศ',
    'กลุ่มกิจกรรมพัฒนาผู้เรียน / แนะแนว',
    'ฝ่ายบริหารงานวิชาการ',
  ];

  // Handle Login (Note: Master Admin ID "Admin", password "456789" is supported and verified)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginUserId.trim() || !loginPassword) {
      showErrorAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'กรุณากรอก User ID และ รหัสผ่าน');
      return;
    }

    // Check Master Admin bypass match
    if (loginUserId.trim().toLowerCase() === 'admin' && loginPassword === '456789') {
      const adminUser = users.find((u) => u.userId.toLowerCase() === 'admin') || {
        id: 'usr_admin',
        userId: 'Admin',
        name: 'ดร.สมชาย บริหารดี (หัวหน้าฝ่ายวิชาการ)',
        password: '456789',
        role: 'admin' as const,
        status: 'approved' as const,
        schoolName: schoolConfig.schoolName,
        department: 'ฝ่ายบริหารงานวิชาการ',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      showSuccessAlert('เข้าสู่ระบบสำเร็จ!', `ยินดีต้อนรับ ${adminUser.name} (ผู้ดูแลระบบ)`);
      onLoginSuccess(adminUser);
      return;
    }

    // Check standard registered users
    const matchedUser = users.find(
      (u) => u.userId.toLowerCase() === loginUserId.trim().toLowerCase()
    );

    if (!matchedUser) {
      showErrorAlert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่พบ User ID นี้ในระบบ กรุณาตรวจสอบอีกครั้งหรือสมัครสมาชิก');
      return;
    }

    if (matchedUser.password !== loginPassword) {
      showErrorAlert('รหัสผ่านไม่ถูกต้อง', 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
      return;
    }

    if (matchedUser.status === 'pending') {
      showInfoAlert(
        'บัญชีอยู่ระหว่างรอการอนุมัติ',
        'บัญชีของคุณได้รับการลงทะเบียนแล้ว และกำลังรอให้ผู้ดูแลระบบ (Admin) ตรวจสอบและอนุมัติการใช้งาน'
      );
      return;
    }

    if (matchedUser.status === 'rejected') {
      showErrorAlert(
        'บัญชีไม่ได้รับอนุมัติ',
        'บัญชีของคุณไม่ผ่านการอนุมัติ กรุณาติดต่อฝ่ายบริหารงานวิชาการ'
      );
      return;
    }

    showSuccessAlert('เข้าสู่ระบบสำเร็จ!', `ยินดีต้อนรับ ${matchedUser.name}`);
    onLoginSuccess(matchedUser);
  };

  // Handle Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!regName.trim() || !regUserId.trim() || !regPassword) {
      showErrorAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'กรุณากรอกชื่อ-นามสกุล, User ID และ รหัสผ่าน');
      return;
    }

    if (regPassword.length < 4) {
      showErrorAlert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    // Check existing User ID
    const exists = users.some(
      (u) => u.userId.toLowerCase() === regUserId.trim().toLowerCase()
    );

    if (exists || regUserId.trim().toLowerCase() === 'admin') {
      showErrorAlert('User ID นี้มีในระบบแล้ว', 'กรุณาเลือก User ID อื่นสำหรับบัญชีของคุณ');
      return;
    }

    setIsSubmitting(true);

    const newUser: User = {
      id: `usr_${Date.now()}`,
      userId: regUserId.trim(),
      name: regName.trim(),
      password: regPassword,
      role: 'member',
      status: 'pending', // Waiting for admin approval as requested!
      department: regDepartment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onRegister(newUser);
    setIsSubmitting(false);

    showInfoAlert(
      'สมัครสมาชิกสำเร็จ!',
      'ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว และต้องรอให้ Admin ทำการอนุมัติก่อนจึงจะเข้าสู่ระบบได้'
    );

    // Reset form and switch to login tab
    setRegName('');
    setRegUserId('');
    setRegPassword('');
    setTab('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Brand & System Title Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 shadow-xl flex items-center justify-center mb-4">
          <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center">
            {schoolConfig.schoolLogo ? (
              <img
                src={schoolConfig.schoolLogo}
                alt="Logo"
                className="w-10 h-10 object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Shield className="w-8 h-8 text-purple-600" />
            )}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ระบบบริหารจัดการงานวิชาการ
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          {schoolConfig.schoolName} &bull; มอบหมายงานและส่งงาน
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-xl card-hover-effect">
          
          {/* Tab Switcher */}
          <div className="flex p-1 mb-6 bg-slate-100 rounded-2xl">
            <button
              id="login-tab-btn"
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                tab === 'login'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบ
            </button>
            <button
              id="register-tab-btn"
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                tab === 'register'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              สมัครสมาชิกใหม่
            </button>
          </div>

          {/* LOGIN FORM */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  User ID / ชื่อผู้ใช้
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username-input"
                    type="text"
                    required
                    value={loginUserId}
                    onChange={(e) => setLoginUserId(e.target.value)}
                    placeholder="กรอก User ID ของคุณ"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="login-submit-btn"
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 btn-glow-purple transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/80 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  สมาชิกใหม่ต้องลงทะเบียนและรอการอนุมัติจากผู้ดูแลระบบวิชาการ
                </p>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  id="register-fullname-input"
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="เช่น ครูสมศรี ศรีสว่าง"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  กลุ่มสาระการเรียนรู้ / แผนก
                </label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  User ID (สำหรับล็อกอิน) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="register-username-input"
                  type="text"
                  required
                  value={regUserId}
                  onChange={(e) => setRegUserId(e.target.value)}
                  placeholder="เช่น kru_somsri"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัสผ่าน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="register-password-input"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่าน (อย่างน้อย 4 ตัว)"
                    className="w-full px-3.5 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Notice about admin approval */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>หมายเหตุ:</strong> เมื่อสมัครสมาชิกเรียบร้อยแล้ว บัญชีจะต้องได้รับการอนุมัติจากผู้ดูแลระบบ (Admin) ก่อนจึงจะสามารถล็อกอินเข้าสู่ระบบได้
                </span>
              </div>

              <div className="pt-2">
                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 btn-glow-emerald transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ยืนยันการสมัครสมาชิก
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
