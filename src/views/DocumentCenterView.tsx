import React, { useState, useRef } from 'react';
import { AcademicDocument, User, DocumentCategory } from '../types';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmDialog, showToast } from '../utils/alerts';
import { formatThaiDate, formatDateTime, formatFileSize, triggerFileDownload, readFileAsDataURL } from '../utils/storage';
import { getDriveFolderUrl, GOOGLE_DRIVE_CONFIG } from '../utils/googleDrive';
import {
  FolderGit2,
  FileText,
  Download,
  Plus,
  Trash2,
  Edit,
  Search,
  UploadCloud,
  FileCheck,
  BookOpen,
  Scroll,
  X,
  Clock,
  Layers,
  ExternalLink,
} from 'lucide-react';

interface DocumentCenterViewProps {
  currentUser: User;
  documents: AcademicDocument[];
  onAddDocument: (doc: AcademicDocument) => void;
  onUpdateDocument: (doc: AcademicDocument) => void;
  onDeleteDocument: (docId: string) => void;
}

export const DocumentCenterView: React.FC<DocumentCenterViewProps> = ({
  currentUser,
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<'all' | DocumentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState<DocumentCategory>('sample');
  const [docTitle, setDocTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [uploadedFile, setUploadedFile] = useState<AcademicDocument['file'] | null>(null);

  // Category map
  const categoryNames: Record<DocumentCategory, string> = {
    sample: 'เอกสารตัวอย่าง',
    order: 'คำสั่ง',
  };

  // Open add modal
  const handleOpenAddModal = () => {
    setEditingDocId(null);
    setDocCategory('sample');
    setDocTitle('');
    setDocNumber('');
    setDocDesc('');
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (doc: AcademicDocument) => {
    setEditingDocId(doc.id);
    setDocCategory(doc.category);
    setDocTitle(doc.title);
    setDocNumber(doc.docNumber || '');
    setDocDesc(doc.description || '');
    setUploadedFile(doc.file);
    setIsModalOpen(true);
  };

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataURL(file);
      setUploadedFile({
        id: `docf_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: dataUrl,
        uploadTime: new Date().toISOString(),
      });
      showToast('success', `อัปโหลดไฟล์ "${file.name}" พร้อมบันทึก`);
    } catch (err) {
      console.error(err);
      showErrorAlert('อัปโหลดไฟล์ไม่สำเร็จ', 'เกิดข้อผิดพลาดในการอ่านไฟล์');
    }
  };

  // Handle Save (Add or Update)
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();

    if (!docTitle.trim()) {
      showErrorAlert('กรุณากรอกชื่อเอกสาร', 'ชื่อเอกสารเป็นข้อมูลที่จำเป็น');
      return;
    }

    if (!uploadedFile) {
      showWarningAlert('ยังไม่ได้แนบไฟล์', 'กรุณาอัปโหลดไฟล์เอกสารสำหรับดาวน์โหลด');
      return;
    }

    const nowIso = new Date().toISOString();

    if (editingDocId) {
      // Update
      const existing = documents.find((d) => d.id === editingDocId);
      if (existing) {
        const updated: AcademicDocument = {
          ...existing,
          category: docCategory,
          categoryName: categoryNames[docCategory],
          title: docTitle.trim(),
          docNumber: docNumber.trim() || undefined,
          description: docDesc.trim() || undefined,
          file: uploadedFile,
          updatedAt: nowIso,
        };
        onUpdateDocument(updated);
        showSuccessAlert('บันทึกการแก้ไขสำเร็จ!', `อัปเดตเอกสาร "${docTitle}" เรียบร้อยแล้ว`);
      }
    } else {
      // Add new
      const newDoc: AcademicDocument = {
        id: `doc_${Date.now()}`,
        category: docCategory,
        categoryName: categoryNames[docCategory],
        title: docTitle.trim(),
        docNumber: docNumber.trim() || undefined,
        description: docDesc.trim() || undefined,
        file: uploadedFile,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.name,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      onAddDocument(newDoc);
      showSuccessAlert('เพิ่มเอกสารสำเร็จ!', `เอกสารพร้อมให้สมาชิกดาวน์โหลดแล้ว`);
    }

    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDeleteDocument = async (doc: AcademicDocument) => {
    const ok = await showConfirmDialog(
      'ยืนยันการลบเอกสาร?',
      `ต้องการลบเอกสาร "${doc.title}" ออกจากศูนย์เอกสารใช่หรือไม่?`,
      'ลบเอกสาร',
      'ยกเลิก',
      true
    );
    if (ok) {
      onDeleteDocument(doc.id);
      showSuccessAlert('ลบเอกสารสำเร็จ', 'นำเอกสารออกจากระบบเรียบร้อยแล้ว');
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchNum = (doc.docNumber || '').toLowerCase().includes(q);
      const matchDesc = (doc.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchNum && !matchDesc) return false;
    }
    return true;
  });

  const sampleCount = documents.filter((d) => d.category === 'sample').length;
  const orderCount = documents.filter((d) => d.category === 'order').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-amber-500" />
            ศูนย์เอกสารทางวิชาการ (Document Center)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'คลังเอกสารตัวอย่าง แบบฟอร์ม และหนังสือคำสั่ง (เพิ่ม-แก้ไข-ลบเอกสาร)'
              : 'แหล่งรวบรวมแบบฟอร์มเอกสารตัวอย่างและหนังสือคำสั่ง สามารถดาวน์โหลดได้ทันที'}
          </p>
        </div>

        {/* Admin Add Document & Drive Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <a
              href={getDriveFolderUrl(GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-bold text-xs border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 group"
              title="เปิด Google Drive คลังเอกสารหลัก"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" fill="currentColor">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z" fill="#ea4335"/>
                <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
                <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2z" fill="#26842a"/>
                <path d="m73.55 25-13.75-23.8c-1.35-.8-2.9-1.2-4.45-1.2h-.1l13.75 23.8 14.7 25.45c.8-1.4 1.2-2.95 1.2-4.5 0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span>เปิด Google Drive</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
            </a>
          )}

          {isAdmin && (
            <button
              id="doc-add-new-btn"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 btn-glow-purple"
            >
              <Plus className="w-4 h-4" /> แขวนเอกสาร / เพิ่มเอกสารใหม่
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY TABS & SEARCH BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5 space-y-4">
        
        {/* Category Filter Pills (1. เอกสารตัวอย่าง, 2. หนังสือคำสั่ง, ทั้งหมด) */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> ทั้งหมด ({documents.length})
          </button>

          <button
            onClick={() => setSelectedCategory('sample')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'sample'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> 1. เอกสารตัวอย่าง / แบบฟอร์ม ({sampleCount})
          </button>

          <button
            onClick={() => setSelectedCategory('order')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'order'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Scroll className="w-3.5 h-3.5 text-amber-500" /> 2. หนังสือคำสั่ง ({orderCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อเอกสาร, เลขที่คำสั่ง, หรือรายละเอียด..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

      </div>

      {/* DOCUMENT CARDS GRID */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center text-slate-400">
          <FolderGit2 className="w-12 h-12 mx-auto mb-2 opacity-50 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">ไม่พบเอกสารในหมวดหมู่นี้</p>
          <p className="text-xs text-slate-400 mt-1">ลองเลือกหมวดหมู่อื่น หรือค้นหาด้วยคำใหม่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => {
            const isSample = doc.category === 'sample';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-md p-5 transition-all flex flex-col justify-between gap-4 card-hover-effect group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        isSample
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {doc.categoryName}
                    </span>

                    {doc.docNumber && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {doc.docNumber}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-purple-600 transition-colors">
                    {doc.title}
                  </h3>

                  {doc.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}
                </div>

                {/* File Details & Download / Admin Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <FileText className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-700">
                        {doc.file.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {formatFileSize(doc.file.size)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[10px] text-slate-400">
                      อัปเดต: {formatDateTime(doc.updatedAt || doc.createdAt)}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Admin Edit & Delete */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(doc)}
                            className="p-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                            title="แก้ไขเอกสาร"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                            title="ลบเอกสาร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* Fast Download Button (Any File Type) */}
                      <button
                        onClick={() => triggerFileDownload(doc.file.url, doc.file.name)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 btn-glow-purple transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> ดาวน์โหลดไฟล์
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADMIN ADD/EDIT DOCUMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-purple-600" />
                {editingDocId ? 'แก้ไขข้อมูลเอกสาร' : 'แขวนเอกสารใหม่ในศูนย์เอกสาร'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="py-4 space-y-4">
              
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หมวดหมู่เอกสาร <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="sample">เอกสารตัวอย่าง</option>
                  <option value="order">คำสั่ง</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อเอกสาร / หัวข้อเรื่อง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="เช่น ตัวอย่างแบบฟอร์มแผนการสอน 2569 หรือ คำสั่งที่ 112/2569"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Document Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เลขที่เอกสาร / เลขที่คำสั่ง (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="เช่น วก.01/2569 หรือ คำสั่งที่ 112/2569"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  คำอธิบายเอกสาร / บันทึกชี้แจง
                </label>
                <textarea
                  rows={2}
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  placeholder="ระบุรายละเอียดของเอกสาร เพื่อให้สมาชิกเข้าใจก่อนดาวน์โหลด..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  อัปโหลดไฟล์เอกสาร <span className="text-rose-500">*</span>
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-purple-50/30 transition-all"
                >
                  <UploadCloud className="w-8 h-8 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    คลิกเพื่อเลือกไฟล์เอกสาร
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    รองรับไฟล์ Word, Excel, PDF, PowerPoint, ZIP ฯลฯ
                  </p>
                </div>

                {uploadedFile && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {uploadedFile.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({formatFileSize(uploadedFile.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 btn-glow-purple"
                >
                  {editingDocId ? 'บันทึกการแก้ไข' : 'ยืนยันการแขวนเอกสาร'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
