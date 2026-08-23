export type UserRole = 'admin' | 'member';
export type UserStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  userId: string;
  name: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  schoolName?: string;
  schoolLogo?: string;
  avatar?: string;
  department?: string;
  position?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  driveFileId?: string;
  driveViewUrl?: string;
  uploadTime: string;
}

export type TaskType = 'assignment' | 'announcement';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  category: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  targetRoles?: string[];
  attachments?: TaskAttachment[];
  driveFolderId?: string;
  driveFolderUrl?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  driveFileId?: string;
  driveViewUrl?: string;
  uploadTime: string;
}

export type SubmissionStatus = 'submitted' | 'late' | 'reviewed' | 'returned';

export interface Submission {
  id: string;
  taskId: string;
  taskTitle?: string;
  taskCategory?: string;
  dueDate?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userDepartment?: string;
  title: string;
  description?: string;
  files: SubmissionFile[];
  status: SubmissionStatus;
  submittedAt: string;
  updatedAt: string;
  feedback?: string;
  score?: number;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type DocumentCategory = 'sample' | 'order';

export interface AcademicDocument {
  id: string;
  category: DocumentCategory;
  categoryName: string;
  title: string;
  docNumber?: string;
  description?: string;
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    driveFileId?: string;
    driveViewUrl?: string;
    uploadTime: string;
  };
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolConfig {
  schoolName: string;
  schoolLogo: string;
  academicYear: string;
  term: string;
  departmentName: string;
}
