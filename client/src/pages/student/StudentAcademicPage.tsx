import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { studentService } from '../../services/student.service';
import type { AcademicDetails, AcademicLevel } from '../../types/student.types';
import {
  Award,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  BookOpen,
  X,
} from 'lucide-react';

export const StudentAcademicPage: React.FC = () => {
  const [academic, setAcademic] = useState<AcademicDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Performance Metrics Form State
  const [metricsForm, setMetricsForm] = useState({
    course: '',
    program: '',
    semester: 1,
    graduationYear: 2026,
    cgpa: '',
    percentage: '',
    backlogs: 0,
  });
  const [metricsErrors, setMetricsErrors] = useState<Record<string, string>>({});

  // Add Milestone Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);
  const [modalForm, setModalForm] = useState({
    level: 'SEMESTER' as AcademicLevel,
    semesterNumber: 1,
    institution: '',
    boardOrUniv: '',
    passingYear: 2024,
    cgpa: '',
    percentage: '',
    backlogsCount: 0,
  });
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

  const fetchAcademic = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getAcademicInfo();
      setAcademic(data);
      setMetricsForm({
        course: data.course || '',
        program: data.program || '',
        semester: data.semester || 1,
        graduationYear: data.graduationYear || 2026,
        cgpa: data.cgpa ? String(data.cgpa) : '',
        percentage: data.percentage ? String(data.percentage) : '',
        backlogs: data.backlogs || 0,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load academic records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademic();
  }, []);

  const validateMetrics = (): boolean => {
    const errs: Record<string, string> = {};

    if (metricsForm.cgpa) {
      const cg = Number(metricsForm.cgpa);
      if (isNaN(cg) || cg < 0 || cg > 10.0) {
        errs.cgpa = 'CGPA must be between 0.00 and 10.00.';
      }
    }

    if (metricsForm.percentage) {
      const pct = Number(metricsForm.percentage);
      if (isNaN(pct) || pct < 0 || pct > 100.0) {
        errs.percentage = 'Percentage must be between 0.00 and 100.00.';
      }
    }

    if (metricsForm.backlogs < 0) {
      errs.backlogs = 'Backlogs count cannot be negative.';
    }

    if (metricsForm.semester < 1 || metricsForm.semester > 12) {
      errs.semester = 'Semester must be between 1 and 12.';
    }

    if (metricsForm.graduationYear < 2000 || metricsForm.graduationYear > 2100) {
      errs.graduationYear = 'Graduation year must be a realistic year.';
    }

    setMetricsErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdateMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMetrics()) return;

    try {
      setSavingMetrics(true);
      setError(null);
      setSuccessMsg(null);

      await studentService.updateAcademicInfo({
        course: metricsForm.course,
        program: metricsForm.program,
        semester: Number(metricsForm.semester),
        graduationYear: Number(metricsForm.graduationYear),
        cgpa: metricsForm.cgpa ? Number(metricsForm.cgpa) : null,
        percentage: metricsForm.percentage ? Number(metricsForm.percentage) : null,
        backlogs: Number(metricsForm.backlogs),
      });

      setSuccessMsg('Academic metrics updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchAcademic();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update academic info.');
    } finally {
      setSavingMetrics(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!modalForm.institution.trim()) {
      errs.institution = 'Institution / School / College name is required.';
    }
    if (!modalForm.passingYear) {
      errs.passingYear = 'Passing year is required.';
    }

    if (Object.keys(errs).length > 0) {
      setModalErrors(errs);
      return;
    }

    try {
      setAddingRecord(true);
      setError(null);

      await studentService.createAcademicRecord({
        level: modalForm.level,
        semesterNumber: modalForm.level === 'SEMESTER' ? Number(modalForm.semesterNumber) : null,
        institution: modalForm.institution,
        boardOrUniv: modalForm.boardOrUniv,
        passingYear: Number(modalForm.passingYear),
        cgpa: modalForm.cgpa ? Number(modalForm.cgpa) : null,
        percentage: modalForm.percentage ? Number(modalForm.percentage) : null,
        backlogsCount: Number(modalForm.backlogsCount || 0),
      });

      setShowAddModal(false);
      setModalForm({
        level: 'SEMESTER',
        semesterNumber: 1,
        institution: '',
        boardOrUniv: '',
        passingYear: 2024,
        cgpa: '',
        percentage: '',
        backlogsCount: 0,
      });
      setSuccessMsg('Academic milestone added successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchAcademic();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add academic record.');
    } finally {
      setAddingRecord(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this academic milestone?')) return;

    try {
      setError(null);
      await studentService.deleteAcademicRecord(id);
      setSuccessMsg('Academic record removed.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchAcademic();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete record.');
    }
  };

  if (loading) {
    return (
      <StudentLayout pageTitle="Academic Information" pageSubtitle="Curriculum, scores, and past educational history">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="h-10 w-10 border-4 border-[#2E9D74] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#2a4d3e]">Loading academic information...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageTitle="Academic Performance &amp; Credentials"
      pageSubtitle="Official enrollment status, ongoing semester metrics, and past educational milestones"
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Toast Alerts */}
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

        {/* System Protected Academic Identity Banner */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A7D6C0]/50 mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E9D74] bg-[#2E9D74]/10 px-2.5 py-1 rounded">
                Official Campus Record
              </span>
              <h2 className="text-base font-bold text-[#143026] mt-2">
                {academic?.department.name} ({academic?.department.code})
              </h2>
              <p className="text-xs text-[#4d7565]">
                {academic?.program} ({academic?.course})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {academic?.academicStatus}
              </span>
              <span
                className={`text-xs px-3 py-1.5 rounded-full font-bold border ${
                  academic?.isPlacementEligible
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {academic?.isPlacementEligible ? 'Eligible for Placement' : 'Ineligible'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/60">
              <span className="text-[11px] text-[#5b8071] block">Roll Number / ID</span>
              <span className="font-bold font-mono text-[#143026]">{academic?.studentId}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/60">
              <span className="text-[11px] text-[#5b8071] block">Enrollment No.</span>
              <span className="font-bold font-mono text-[#143026]">{academic?.enrollmentNumber}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/60">
              <span className="text-[11px] text-[#5b8071] block">Current Semester</span>
              <span className="font-bold text-[#143026]">Semester {academic?.semester}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/60">
              <span className="text-[11px] text-[#5b8071] block">Graduation Batch</span>
              <span className="font-bold text-[#143026]">Class of {academic?.graduationYear}</span>
            </div>
          </div>
        </div>

        {/* Current Performance & Scores Form */}
        <form onSubmit={handleUpdateMetrics} className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#2E9D74]" />
              <h3 className="text-sm font-bold text-[#143026]">Current Academic Performance</h3>
            </div>
            <span className="text-[11px] text-[#5b8071]">Used by company eligibility criteria filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">
                Cumulative CGPA (0.00 - 10.00)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={metricsForm.cgpa}
                onChange={(e) => setMetricsForm({ ...metricsForm, cgpa: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="8.85"
              />
              {metricsErrors.cgpa && <p className="text-[10px] text-red-600 mt-1">{metricsErrors.cgpa}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">
                Aggregate Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={metricsForm.percentage}
                onChange={(e) => setMetricsForm({ ...metricsForm, percentage: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="84.5"
              />
              {metricsErrors.percentage && <p className="text-[10px] text-red-600 mt-1">{metricsErrors.percentage}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">Active Backlogs Count</label>
              <input
                type="number"
                min="0"
                value={metricsForm.backlogs}
                onChange={(e) => setMetricsForm({ ...metricsForm, backlogs: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
              />
              {metricsErrors.backlogs && <p className="text-[10px] text-red-600 mt-1">{metricsErrors.backlogs}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={savingMetrics}
              className="px-4 py-2 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingMetrics ? 'Saving Scores...' : 'Update Academic Performance'}</span>
            </button>
          </div>
        </form>

        {/* Academic Milestones Table (10th, 12th, UG, Semester Records) */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#A7D6C0]/50">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2E9D74]" />
                <h3 className="text-sm font-bold text-[#143026]">Academic Milestones &amp; Transcripts</h3>
              </div>
              <p className="text-xs text-[#4d7565] mt-0.5">
                Past educational background (10th, 12th, Bachelor's, semester mark sheets)
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 hover:opacity-95 transition cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone Record</span>
            </button>
          </div>

          {academic?.academicRecords && academic.academicRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#A7D6C0]/60 text-[#5b8071] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Level / Milestone</th>
                    <th className="py-2.5 px-3">Institution / Board</th>
                    <th className="py-2.5 px-3">Passing Year</th>
                    <th className="py-2.5 px-3">Score / CGPA</th>
                    <th className="py-2.5 px-3">Verification</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/40">
                  {academic.academicRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#EAF6F0]/40 transition">
                      <td className="py-3 px-3 font-bold text-[#143026]">
                        {rec.level === 'SEMESTER' ? `Semester ${rec.semesterNumber || 1}` : rec.level.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#143026] block">{rec.institution}</span>
                        {rec.boardOrUniv && <span className="text-[11px] text-[#5b8071]">{rec.boardOrUniv}</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#143026]">{rec.passingYear}</td>
                      <td className="py-3 px-3">
                        {rec.cgpa && <span className="font-bold text-[#2E9D74]">CGPA: {Number(rec.cgpa).toFixed(2)}</span>}
                        {rec.percentage && (
                          <span className="font-medium text-[#4d7565] block">{Number(rec.percentage).toFixed(1)}%</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {rec.isVerified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Pending Verification
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!rec.isVerified && (
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-1 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#EAF6F0]/40 rounded-xl border border-dashed border-[#A7D6C0] space-y-2">
              <BookOpen className="w-8 h-8 text-[#5b8071] mx-auto opacity-70" />
              <p className="text-xs font-bold text-[#143026]">No academic records added yet</p>
              <p className="text-[11px] text-[#5b8071] max-w-sm mx-auto">
                Add your 10th standard, 12th standard / Diploma, or previous undergraduate scorecards to pass automated placement criteria checks.
              </p>
            </div>
          )}
        </div>

        {/* Modal: Add Academic Milestone */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50">
                <h3 className="text-sm font-bold text-[#143026]">Add Academic Milestone Record</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRecord} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#143026] mb-1">Education Level</label>
                    <select
                      value={modalForm.level}
                      onChange={(e) => setModalForm({ ...modalForm, level: e.target.value as AcademicLevel })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs"
                    >
                      <option value="CLASS_10">Class 10 (Secondary)</option>
                      <option value="CLASS_12">Class 12 (Higher Secondary)</option>
                      <option value="DIPLOMA">Diploma</option>
                      <option value="UNDERGRADUATE">Undergraduate Degree</option>
                      <option value="SEMESTER">Semester Scorecard</option>
                      <option value="POSTGRADUATE">Postgraduate</option>
                    </select>
                  </div>

                  {modalForm.level === 'SEMESTER' && (
                    <div>
                      <label className="block font-semibold text-[#143026] mb-1">Semester Number</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={modalForm.semesterNumber}
                        onChange={(e) => setModalForm({ ...modalForm, semesterNumber: parseInt(e.target.value, 10) || 1 })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#143026] mb-1">
                      Institution / School / College <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalForm.institution}
                      onChange={(e) => setModalForm({ ...modalForm, institution: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs"
                      placeholder="e.g. National College of Technology"
                      required
                    />
                    {modalErrors.institution && <p className="text-[10px] text-red-600 mt-1">{modalErrors.institution}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-[#143026] mb-1">Board / University</label>
                    <input
                      type="text"
                      value={modalForm.boardOrUniv}
                      onChange={(e) => setModalForm({ ...modalForm, boardOrUniv: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs"
                      placeholder="e.g. CBSE / State Board"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#143026] mb-1">
                      Passing Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1990"
                      max="2100"
                      value={modalForm.passingYear}
                      onChange={(e) => setModalForm({ ...modalForm, passingYear: parseInt(e.target.value, 10) || 2024 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#143026] mb-1">CGPA (0 - 10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={modalForm.cgpa}
                      onChange={(e) => setModalForm({ ...modalForm, cgpa: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs"
                      placeholder="8.5"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#143026] mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={modalForm.percentage}
                      onChange={(e) => setModalForm({ ...modalForm, percentage: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs"
                      placeholder="82.0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#A7D6C0]/50">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingRecord}
                    className="px-4 py-2 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {addingRecord ? 'Saving...' : 'Save Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};
