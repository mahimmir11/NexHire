import React, { useEffect, useState, useRef } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { studentService } from '../../services/student.service';
import type { StudentDocument, DocumentType } from '../../types/student.types';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Clock,
  X,
} from 'lucide-react';

export const StudentDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'RESUME' as DocumentType,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // File size check: 10MB
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({ file: 'File size exceeds maximum allowed 10MB.' });
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setFormErrors({});

      // Auto-populate title if empty
      if (!uploadForm.title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setUploadForm((prev) => ({ ...prev, title: cleanName }));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!uploadForm.title.trim()) {
      errs.title = 'Document title is required.';
    }
    if (!selectedFile) {
      errs.file = 'Please choose a document file to upload.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', uploadForm.title.trim());
      formData.append('type', uploadForm.type);
      formData.append('file', selectedFile!);

      await studentService.uploadDocument(formData);

      setSuccessMsg('Document successfully uploaded and saved to your placement record!');
      setSelectedFile(null);
      setUploadForm({ title: '', type: 'RESUME' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchDocuments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setError(null);
      await studentService.deleteDocument(id);
      setSuccessMsg(`Document "${title}" removed.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchDocuments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete document.');
    }
  };

  const handleDownload = (id: number) => {
    const downloadUrl = studentService.getDocumentDownloadUrl(id);
    window.open(downloadUrl, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getTypeBadgeClass = (type: DocumentType) => {
    switch (type) {
      case 'RESUME':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CERTIFICATE':
      case 'INTERNSHIP_CERTIFICATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MARKSHEET':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <StudentLayout pageTitle="Resume & Documents" pageSubtitle="Placement records, mark sheets, and credential files">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="h-10 w-10 border-4 border-[#2E9D74] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#2a4d3e]">Loading your documents...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageTitle="Resume &amp; Placement Documents"
      pageSubtitle="Upload and manage verified PDF resumes, grade sheets, and supporting certificates"
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Upload New Document Card */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#A7D6C0]/50">
            <Upload className="w-4 h-4 text-[#2E9D74]" />
            <h3 className="text-sm font-bold text-[#143026]">Upload Placement Document</h3>
          </div>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Document Title */}
              <div>
                <label className="block font-semibold text-[#143026] mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g. Master Resume (MCA 2026)"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  required
                />
                {formErrors.title && <p className="text-[10px] text-red-600 mt-1">{formErrors.title}</p>}
              </div>

              {/* Document Type */}
              <div>
                <label className="block font-semibold text-[#143026] mb-1">Document Category</label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as DocumentType })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                >
                  <option value="RESUME">Placement Resume (PDF)</option>
                  <option value="CERTIFICATE">Course / Achievement Certificate</option>
                  <option value="MARKSHEET">Semester Mark Sheet / Transcript</option>
                  <option value="INTERNSHIP_CERTIFICATE">Internship Completion Letter</option>
                  <option value="OTHER">Other Official Document</option>
                </select>
              </div>

              {/* File Picker */}
              <div>
                <label className="block font-semibold text-[#143026] mb-1">
                  Select File (Max 10MB) <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="w-full px-2 py-1.5 rounded-xl border border-[#A7D6C0] bg-white text-[11px] text-[#143026] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#2E9D74] file:text-white file:cursor-pointer"
                  required
                />
                {formErrors.file && <p className="text-[10px] text-red-600 mt-1">{formErrors.file}</p>}
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 rounded-xl bg-[#EAF6F0]/80 border border-[#A7D6C0]/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2E9D74]" />
                  <span className="font-semibold text-[#143026] truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-[#5b8071] font-mono">({formatFileSize(selectedFile.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#5b8071]">
                Supported formats: <strong>PDF, DOC, DOCX, PNG, JPG</strong> up to 10MB
              </span>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading File...' : 'Upload Document'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Documents List */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#2E9D74]" />
              <h3 className="text-sm font-bold text-[#143026]">Uploaded Documents Repository</h3>
            </div>
            <span className="text-xs text-[#5b8071] font-mono">{documents.length} files</span>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-[#EAF6F0]/40 border border-[#A7D6C0]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#EAF6F0]/80 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-white border border-[#A7D6C0] text-[#2E9D74] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#143026] group-hover:text-[#2E9D74] transition">
                          {doc.title}
                        </h4>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(
                            doc.type
                          )}`}
                        >
                          {doc.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5b8071] font-mono mt-1">
                        {doc.fileName} &bull; {formatFileSize(doc.fileSize)}
                      </p>
                      <p className="text-[10px] text-[#5b8071] mt-0.5">
                        Uploaded on {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    {/* Verification Status */}
                    {doc.isVerified ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Review
                      </span>
                    )}

                    {/* Download */}
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="p-2 rounded-xl bg-white hover:bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0] shadow-2xs transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    {/* Delete (only if unverified) */}
                    {!doc.isVerified && (
                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#EAF6F0]/40 rounded-xl border border-dashed border-[#A7D6C0] space-y-2">
              <FileText className="w-8 h-8 text-[#5b8071] mx-auto opacity-70" />
              <p className="text-xs font-bold text-[#143026]">No documents uploaded yet</p>
              <p className="text-[11px] text-[#5b8071] max-w-sm mx-auto">
                Upload your placement resume, certificates, or semester grade cards so recruiters can review your verified credentials.
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};
