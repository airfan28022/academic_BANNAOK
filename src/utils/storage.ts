import { User, Task, Submission, AcademicDocument, SchoolConfig } from '../types';

const STORAGE_KEYS = {
  USERS: 'academic_app_users_v2',
  TASKS: 'academic_app_tasks_v2',
  SUBMISSIONS: 'academic_app_submissions_v2',
  DOCUMENTS: 'academic_app_documents_v2',
  CONFIG: 'academic_app_config_v2',
  CURRENT_USER: 'academic_app_current_user_v2',
};

// Initial default school configuration
const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา สพฐ.',
  schoolLogo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80',
  academicYear: '2569',
  term: '1',
  departmentName: 'กลุ่มบริหารงานวิชาการ',
};

// Initial default users
const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin',
    userId: 'Admin',
    name: 'ดร.สมชาย บริหารดี (หัวหน้าฝ่ายวิชาการ)',
    password: '456789',
    role: 'admin',
    status: 'approved',
    schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา สพฐ.',
    department: 'ฝ่ายบริหารงานวิชาการ',
    position: 'รองผู้อำนวยการฝ่ายวิชาการ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'usr_01',
    userId: 'kru_somsri',
    name: 'ครูสมศรี ศรีสว่าง',
    password: '123456',
    role: 'member',
    status: 'approved',
    department: 'กลุ่มสาระฯ ภาษาไทย',
    position: 'ครูชำนาญการ',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'usr_02',
    userId: 'kru_wichai',
    name: 'ครูวิชัย เก่งวิทยาการ',
    password: '123456',
    role: 'member',
    status: 'approved',
    department: 'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
    position: 'ครู ค.ศ. 2',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'usr_03',
    userId: 'kru_napa',
    name: 'ครูนภา รักษ์สิ่งแวดล้อม',
    password: '123456',
    role: 'member',
    status: 'approved',
    department: 'กลุ่มสาระฯ สังคมศึกษาฯ',
    position: 'ครู',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'usr_04',
    userId: 'kru_anurat',
    name: 'ครูอนุรัตน์ มุ่งมั่น',
    password: '123456',
    role: 'member',
    status: 'pending',
    department: 'กลุ่มสาระฯ คณิตศาสตร์',
    position: 'ครูผู้ช่วย (สมัครใหม่)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// Today and upcoming dates helper
const getFormattedDate = (offsetDays: number = 0) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Initial default tasks & announcements
const DEFAULT_TASKS: Task[] = [
  {
    id: 'tsk_01',
    type: 'assignment',
    title: 'ส่งแผนการจัดการเรียนรู้ (Active Learning) ภาคเรียนที่ 1/2569',
    description: 'ขอให้คุณครูทุกท่านจัดทำและส่งแผนการจัดการเรียนรู้รายวิชาที่รับผิดชอบ โดยเน้นการจัดกิจกรรมแบบ Active Learning พร้อมแนบเครื่องมือวัดผลและประเมินผล',
    category: 'แผนการจัดการเรียนรู้',
    dueDate: getFormattedDate(0), // Today!
    dueTime: '16:30',
    attachments: [
      {
        id: 'att_1',
        name: 'คู่มือการเขียนแผน Active Learning 2569.pdf',
        size: 1420500,
        type: 'application/pdf',
        url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr',
        uploadTime: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
    createdBy: 'usr_admin',
    createdByName: 'ดร.สมชาย บริหารดี',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'tsk_02',
    type: 'assignment',
    title: 'ส่งแบบบันทึกคะแนนเก็บและประเมินคุณลักษณะอันพึงประสงค์ กลางภาค',
    description: 'ให้ครูผู้สอนบันทึกคะแนนเก็บ 50% แรก และผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน ส่งผ่านระบบเพื่อสรุปเสนอผู้บริหาร',
    category: 'แบบบันทึกคะแนน/ผลสัมฤทธิ์',
    dueDate: getFormattedDate(4), // 4 days later
    dueTime: '18:00',
    attachments: [],
    createdBy: 'usr_admin',
    createdByName: 'ดร.สมชาย บริหารดี',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'tsk_03',
    type: 'assignment',
    title: 'ส่งรายงานผลการประเมินตนเองของครูรายบุคคล (SAR ประจำปี)',
    description: 'จัดทำเล่มรายงานผลการปฏิบัติงานและการประเมินตนเอง (Self Assessment Report: SAR) ประจำปีการศึกษา พร้อมเอกสารหลักฐานประกอบ',
    category: 'รายงานประเมินตนเอง (SAR)',
    dueDate: getFormattedDate(-2), // 2 days ago (overdue)
    dueTime: '23:59',
    attachments: [],
    createdBy: 'usr_admin',
    createdByName: 'ดร.สมชาย บริหารดี',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'ann_01',
    type: 'announcement',
    title: '📢 ประกาศวันหยุดราชการพิเศษและงดการเรียนการสอน',
    description: 'ขอแจ้งให้คุณครูและบุคลากรทุกท่านทราบ โรงเรียนหยุดทำการเรียนการสอน 1 วัน และขอให้ครูเวรประจำวันปฏิบัติหน้าที่ตามตารางเวร',
    category: 'กิจกรรม/วันหยุด',
    dueDate: getFormattedDate(2), // 2 days later
    createdBy: 'usr_admin',
    createdByName: 'ดร.สมชาย บริหารดี',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'ann_02',
    type: 'announcement',
    title: '🎯 อบรมเชิงปฏิบัติการพัฒนาสื่อนวัตกรรมดิจิทัลด้วย AI เพื่อการสอน',
    description: 'ขอเชิญครูทุกกลุ่มสาระฯ เข้าร่วมอบรม ณ หอประชุมใหญ่ เวลา 09.00 - 16.00 น. มีเกียรติบัตรการเข้าร่วม 6 ชั่วโมง',
    category: 'การอบรม/พัฒนาวิชาการ',
    dueDate: getFormattedDate(7),
    createdBy: 'usr_admin',
    createdByName: 'ดร.สมชาย บริหารดี',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Initial default submissions
const DEFAULT_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_01',
    taskId: 'tsk_01',
    taskTitle: 'ส่งแผนการจัดการเรียนรู้ (Active Learning) ภาคเรียนที่ 1/2569',
    taskCategory: 'แผนการจัดการเรียนรู้',
    dueDate: getFormattedDate(0),
    userId: 'usr_01',
    userName: 'ครูสมศรี ศรีสว่าง',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    userDepartment: 'กลุ่มสาระฯ ภาษาไทย',
    title: 'แผนการจัดการเรียนรู้วิชาภาษาไทย ท21101 ชั้น ม.1 (Active Learning)',
    description: 'แนบไฟล์แผนการสอนจำนวน 12 หน่วย พร้อมใบงานและเกณฑ์การให้คะแนน Rubric เรียบร้อยค่ะ',
    files: [
      {
        id: 'subf_1',
        name: 'แผนการสอน_ภาษาไทย_ม1_สมศรี.docx',
        size: 2450000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAIA',
        uploadTime: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'subf_2',
        name: 'ใบกิจกรรมและแบบวัดผล_ท21101.pdf',
        size: 1120000,
        type: 'application/pdf',
        url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr',
        uploadTime: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
    status: 'reviewed',
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    feedback: 'แผนการจัดการเรียนรู้สมบูรณ์ มีการระบุพฤติกรรมตัวชี้วัดชัดเจนดีมาก อนุมัติการใช้สอนได้ครับ',
    score: 95,
    reviewedBy: 'ดร.สมชาย บริหารดี',
    reviewedAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
  },
  {
    id: 'sub_02',
    taskId: 'tsk_03',
    taskTitle: 'ส่งรายงานผลการประเมินตนเองของครูรายบุคคล (SAR ประจำปี)',
    taskCategory: 'รายงานประเมินตนเอง (SAR)',
    dueDate: getFormattedDate(-2),
    userId: 'usr_02',
    userName: 'ครูวิชัย เก่งวิทยาการ',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    userDepartment: 'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
    title: 'เล่มรายงานผลการประเมินตนเอง (SAR) ครูวิชัย ปีการศึกษา 2568',
    description: 'จัดทำครบถ้วนตามมาตรฐาน 3 ด้าน พร้อมรวบรวมหลักฐานและผลงานนักเรียน',
    files: [
      {
        id: 'subf_3',
        name: 'SAR_2568_ครูวิชัย_วิทยาการคำนวณ.pdf',
        size: 4800000,
        type: 'application/pdf',
        url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr',
        uploadTime: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
    status: 'submitted',
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// Initial default documents for Document Center
const DEFAULT_DOCUMENTS: AcademicDocument[] = [
  {
    id: 'doc_01',
    category: 'sample',
    categoryName: 'เอกสารตัวอย่าง',
    title: 'ตัวอย่างแบบฟอร์มแผนการจัดการเรียนรู้ Active Learning (มาตรฐาน สพฐ.)',
    docNumber: 'วก.01/2569',
    description: 'แบบฟอร์มไฟล์ Word สำหรับครูนำไปเขียนแผนการจัดการเรียนรู้ภาคเรียนปัจจุบัน',
    file: {
      id: 'docf_1',
      name: 'แบบฟอร์มแผนการสอน_ActiveLearning_2569.docx',
      size: 320000,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAIA',
      uploadTime: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    uploadedBy: 'usr_admin',
    uploadedByName: 'ฝ่ายวิชาการ',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'doc_02',
    category: 'sample',
    categoryName: 'เอกสารตัวอย่าง',
    title: 'แบบบันทึกคะแนนและประเมินคุณลักษณะ ปพ.5 (ฉบับไฟล์ Excel คำนวณเกรดอัตโนมัติ)',
    docNumber: 'วก.05/2569',
    description: 'ไฟล์เทมเพลต Excel สำหรับบันทึกคะแนนเก็บ คะแนนสอบ และตัดเกรดอัตโนมัติ',
    file: {
      id: 'docf_2',
      name: 'เทมเพลต_ปพ5_คำนวณเกรดอัตโนมัติ_2569.xlsx',
      size: 1540000,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      url: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAIA',
      uploadTime: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    uploadedBy: 'usr_admin',
    uploadedByName: 'ฝ่ายวิชาการ',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'doc_03',
    category: 'order',
    categoryName: 'คำสั่ง',
    title: 'คำสั่งโรงเรียนที่ 112/2569 เรื่อง แต่งตั้งคณะกรรมการฝ่ายบริหารงานวิชาการ',
    docNumber: 'คำสั่งที่ 112/2569',
    description: 'คำสั่งแต่งตั้งคณะกรรมการนิเทศการสอน คณะกรรมการวัดและประเมินผล ประจำปีการศึกษา 2569',
    file: {
      id: 'docf_3',
      name: 'คำสั่งแต่งตั้งคณะกรรมการวิชาการ_112_2569.pdf',
      size: 2100000,
      type: 'application/pdf',
      url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr',
      uploadTime: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    uploadedBy: 'usr_admin',
    uploadedByName: 'ฝ่ายวิชาการ',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'doc_04',
    category: 'order',
    categoryName: 'คำสั่ง',
    title: 'คำสั่งโรงเรียนที่ 115/2569 เรื่อง ปฏิทินปฏิบัติงานวิชาการและการส่งเอกสารทางการศึกษา',
    docNumber: 'คำสั่งที่ 115/2569',
    description: 'กำหนดการส่งงานวิชาการ การสอบกลางภาค การสอบปลายภาค และการอนุมัติผลการเรียน',
    file: {
      id: 'docf_4',
      name: 'ปฏิทินปฏิบัติงานวิชาการ_2569.pdf',
      size: 1800000,
      type: 'application/pdf',
      url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr',
      uploadTime: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    uploadedBy: 'usr_admin',
    uploadedByName: 'ฝ่ายวิชาการ',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

// Helper functions for Local Storage
export const getStoredUsers = (): User[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_USERS;
  }
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getStoredTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
      return DEFAULT_TASKS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_TASKS;
  }
};

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const getStoredSubmissions = (): Submission[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(DEFAULT_SUBMISSIONS));
      return DEFAULT_SUBMISSIONS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_SUBMISSIONS;
  }
};

export const saveSubmissions = (submissions: Submission[]): void => {
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
};

export const getStoredDocuments = (): AcademicDocument[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(DEFAULT_DOCUMENTS));
      return DEFAULT_DOCUMENTS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_DOCUMENTS;
  }
};

export const saveDocuments = (documents: AcademicDocument[]): void => {
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
};

export const getStoredConfig = (): SchoolConfig => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = (config: SchoolConfig): void => {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
};

export const getStoredCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const saveCurrentUser = (user: User | null): void => {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
};

// Format Date: YYYY-MM-DD -> dd/mm/yyyy (e.g. 30/8/2026) or Full Thai Date
export const formatThaiDate = (dateStr?: string, full: boolean = false): string => {
  if (!dateStr) return '-';
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('T')[0].split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

    if (!full) {
      // dd/mm/yyyy (e.g., 30/8/2026)
      return `${day}/${month}/${year}`;
    }

    const thaiYear = year > 2500 ? year : year + 543;
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    return `${day} ${thaiMonths[month - 1]} พ.ศ. ${thaiYear}`;
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins} น.`;
  } catch {
    return isoString;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Download helper supporting any file URL (data url, blob, external)
export const triggerFileDownload = (fileUrl: string, fileName: string) => {
  if (!fileUrl) return;
  
  // If it's a mock or empty sample data URL, create a temporary text/binary blob so it actually downloads
  let downloadUrl = fileUrl;
  if (fileUrl.startsWith('data:') && fileUrl.length < 100) {
    const dummyBlob = new Blob([`เอกสารทางวิชาการ: ${fileName}\nดาวน์โหลดจากระบบบริหารจัดการงานวิชาการ\nวันที่: ${new Date().toLocaleString('th-TH')}`], { type: 'text/plain;charset=utf-8' });
    downloadUrl = URL.createObjectURL(dummyBlob);
  }

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Convert File object to Base64 Data URL
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
