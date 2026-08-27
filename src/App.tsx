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
import { showConfirmDialog, showToast } from './utils/alerts';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToGrading = (task?: Task) => {
    setPreSelectedTaskForNav(task || null);
    setActiveTab('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const badgeCounts = {
    pendingTasks: pendingTasksCount,
    pendingSubmissions: pendingSubmissionsCount,
    documentsCount: documents.length,
  };

  return (
    <div className="min-h-screen bg-[#faf8fc] text-slate-800 flex flex-col selection:bg-purple-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        schoolConfig={schoolConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        pendingCount={pendingUsersCount}
      />

      {/* Main Responsive Layout: Desktop with Sidebar, Mobile with BottomNav */}
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-row">
        
        {/* Left Sidebar (Visible on Desktop / Tablets md:flex) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setPreSelectedTaskForNav(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentUser={currentUser}
          badgeCounts={badgeCounts}
        />

        {/* Main Content View (Padded bottom on mobile for BottomNav) */}
        <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
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
          </div>
        </main>

      </div>

      {/* Fixed Bottom Navigation (Visible ONLY on Mobile md:hidden, always visible on scroll) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setPreSelectedTaskForNav(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        badgeCounts={badgeCounts}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
        currentUser={currentUser}
        submissions={submissions}
        allUsers={users}
        onGoToSubmit={handleNavigateToSubmit}
        onGoToGrading={handleNavigateToGrading}
      />

      {/* Settings Modal */}
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

    </div>
  );
}
