import React, { useState, useEffect } from 'react';
import { User, Task, Submission, AcademicDocument, SchoolConfig } from './types';
import {
  getStoredUsers,
  saveUsers,
  getStoredTasks,
  saveTasks,
  getStoredSubmissions,
  saveSubmissions,
  getStoredDocuments,
  saveDocuments,
  getStoredConfig,
  saveConfig,
  getStoredCurrentUser,
  saveCurrentUser,
} from './utils/storage';
import { showSuccessAlert, showConfirmDialog, showToast } from './utils/alerts';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TaskDetailModal } from './components/TaskDetailModal';
import { LoginRegisterView } from './views/LoginRegisterView';
import { DashboardView } from './views/DashboardView';
import { TasksAndSubmissionView } from './views/TasksAndSubmissionView';
import { TrackingAndGradingView } from './views/TrackingAndGradingView';
import { DocumentCenterView } from './views/DocumentCenterView';
import { SettingsModal } from './views/SettingsModal';

export default function App() {
  // Global Data States
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredCurrentUser());
  const [users, setUsers] = useState<User[]>(() => getStoredUsers());
  const [tasks, setTasks] = useState<Task[]>(() => getStoredTasks());
  const [submissions, setSubmissions] = useState<Submission[]>(() => getStoredSubmissions());
  const [documents, setDocuments] = useState<AcademicDocument[]>(() => getStoredDocuments());
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(() => getStoredConfig());

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [preSelectedTaskForNav, setPreSelectedTaskForNav] = useState<Task | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveSubmissions(submissions);
  }, [submissions]);

  useEffect(() => {
    saveDocuments(documents);
  }, [documents]);

  useEffect(() => {
    saveConfig(schoolConfig);
  }, [schoolConfig]);

  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  // Handle Login
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleLogout = async () => {
    const ok = await showConfirmDialog(
      'ต้องการออกจากระบบ?',
      'คุณต้องการลงชื่อออกจากระบบงานวิชาการใช่หรือไม่?',
      'ออกจากระบบ',
      'ยกเลิก'
    );
    if (ok) {
      setCurrentUser(null);
      showToast('info', 'ออกจากระบบเรียบร้อยแล้ว');
    }
  };

  // Handle Register (New member created with 'pending' status)
  const handleRegisterUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  // Task Handlers (Admin)
  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    // Also remove associated submissions
    setSubmissions((prev) => prev.filter((s) => s.taskId !== taskId));
  };

  // Submission Handlers (Member & Admin)
  const handleSubmitWork = (newSubmission: Submission) => {
    setSubmissions((prev) => [newSubmission, ...prev]);
  };

  const handleUpdateSubmission = (updatedSubmission: Submission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updatedSubmission.id ? updatedSubmission : s))
    );
  };

  const handleDeleteSubmission = (submissionId: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
  };

  // Document Handlers (Admin)
  const handleAddDocument = (newDoc: AcademicDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleUpdateDocument = (updatedDoc: AcademicDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // User & Settings Handlers
  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const handleApproveUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: 'approved', updatedAt: new Date().toISOString() }
          : u
      )
    );
  };

  const handleRejectUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: 'rejected', updatedAt: new Date().toISOString() }
          : u
      )
    );
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Navigation Shortcut from Dashboard or Modals
  const handleNavigateToSubmit = (task?: Task) => {
    setPreSelectedTaskForNav(task || null);
    setActiveTab('tasks');
  };

  const handleNavigateToGrading = (task?: Task) => {
    setPreSelectedTaskForNav(task || null);
    setActiveTab('tracking');
  };

  // If not authenticated, render Login & Register View
  if (!currentUser) {
    return (
      <LoginRegisterView
        onLoginSuccess={handleLoginSuccess}
        users={users}
        onRegister={handleRegisterUser}
        schoolConfig={schoolConfig}
      />
    );
  }

  // Calculate Badge Counts
  const assignmentTasks = tasks.filter((t) => t.type === 'assignment');
  const mySubmissions = submissions.filter((s) => s.userId === currentUser.id);
  const mySubmittedTaskIds = new Set(mySubmissions.map((s) => s.taskId));
  const pendingTasksCount = assignmentTasks.filter((t) => !mySubmittedTaskIds.has(t.id)).length;
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'submitted').length;
  const pendingUsersCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-purple-500 selection:text-white">
      
      {/* Top Navigation Bar with Small Settings & Logout at Top-Right */}
      <Navbar
        currentUser={currentUser}
        schoolConfig={schoolConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        pendingCount={pendingUsersCount}
      />

      {/* Main Layout: Left Sidebar + Content Canvas */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col lg:flex-row gap-6 py-6">
        
        {/* Left Sidebar (Big prominent buttons on single lines) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setPreSelectedTaskForNav(null);
          }}
          currentUser={currentUser}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          badgeCounts={{
            pendingTasks: pendingTasksCount,
            pendingSubmissions: pendingSubmissionsCount,
            documentsCount: documents.length,
          }}
        />

        {/* Dynamic Content View Canvas */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              tasks={tasks}
              submissions={submissions}
              allUsers={users}
              schoolConfig={schoolConfig}
              onSelectTask={(task) => setSelectedTaskForModal(task)}
              onNavigateToSubmit={handleNavigateToSubmit}
              onNavigateToGrading={handleNavigateToGrading}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksAndSubmissionView
              currentUser={currentUser}
              tasks={tasks}
              submissions={submissions}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onSubmitWork={handleSubmitWork}
              onUpdateSubmission={handleUpdateSubmission}
              onDeleteSubmission={handleDeleteSubmission}
              preSelectedTask={preSelectedTaskForNav}
            />
          )}

          {activeTab === 'tracking' && (
            <TrackingAndGradingView
              currentUser={currentUser}
              tasks={tasks}
              submissions={submissions}
              allUsers={users}
              onUpdateSubmission={handleUpdateSubmission}
              onDeleteSubmission={handleDeleteSubmission}
              preSelectedTask={preSelectedTaskForNav}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentCenterView
              currentUser={currentUser}
              documents={documents}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}
        </main>

      </div>

      {/* Task Detail Modal (Opened from Calendar or Dashboard) */}
      <TaskDetailModal
        task={selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
        currentUser={currentUser}
        submissions={submissions}
        allUsers={users}
        onGoToSubmit={handleNavigateToSubmit}
        onGoToGrading={handleNavigateToGrading}
      />

      {/* Settings Modal (Top-right small button action) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateCurrentUser={handleUpdateCurrentUser}
        schoolConfig={schoolConfig}
        onUpdateSchoolConfig={setSchoolConfig}
        allUsers={users}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Modern Clean Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/70 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            &copy; {new Date().getFullYear()} {schoolConfig.schoolName} &bull; ระบบบริหารจัดการงานวิชาการ
          </span>
          <span className="text-[11px] text-slate-400">
            Performance Optimized &bull; รองรับการใช้งานมือถือ แท็บเล็ต และคอมพิวเตอร์
          </span>
        </div>
      </footer>

    </div>
  );
}
