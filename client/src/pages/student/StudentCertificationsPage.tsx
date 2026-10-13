import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { studentService } from '../../services/student.service';
import type { Certification } from '../../types/student.types';
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

export const StudentCertificationsPage: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
  });
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getCertifications();
      setCertifications(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load certifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  const openAddModal = () => {
    setEditingCert(null);
    setModalForm({
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
    });
    setModalErrors({});
    setShowModal(true);
  };

  const openEditModal = (cert: Certification) => {
    setEditingCert(cert);
    setModalForm({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate.split('T')[0],
      expiryDate: cert.expiryDate ? cert.expiryDate.split('T')[0] : '',
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
    });
    setModalErrors({});
    setShowModal(true);
  };

  const validateModal = (): boolean => {
    const errs: Record<string, string> = {};

    if (!modalForm.name.trim()) {
      errs.name = 'Certification name is required.';
    }
    if (!modalForm.issuingOrganization.trim()) {
      errs.issuingOrganization = 'Issuing organization is required.';
    }
    if (!modalForm.issueDate) {
      errs.issueDate = 'Issue date is required.';
    } else {
      const issue = new Date(modalForm.issueDate);
      if (issue > new Date()) {
        errs.issueDate = 'Issue date cannot be in the future.';
      }
    }

    if (modalForm.expiryDate && modalForm.issueDate) {
      const issue = new Date(modalForm.issueDate);
      const expiry = new Date(modalForm.expiryDate);
      if (expiry < issue) {
        errs.expiryDate = 'Expiry date cannot be prior to issue date.';
      }
    }

    if (modalForm.credentialUrl && !/^https?:\/\//i.test(modalForm.credentialUrl.trim())) {
      errs.credentialUrl = 'Credential URL must start with http:// or https://';
    }

    setModalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateModal()) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: modalForm.name.trim(),
        issuingOrganization: modalForm.issuingOrganization.trim(),
        issueDate: modalForm.issueDate,
        expiryDate: modalForm.expiryDate || null,
        credentialId: modalForm.credentialId.trim() || null,
        credentialUrl: modalForm.credentialUrl.trim() || null,
      };

      if (editingCert) {
        await studentService.updateCertification(editingCert.id, payload);
        setSuccessMsg('Certification updated successfully!');
      } else {
        await studentService.createCertification(payload);
        setSuccessMsg('Certification added successfully!');
      }

      setShowModal(false);
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchCertifications();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save certification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCertification = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove certification "${name}"?`)) return;

    try {
      setError(null);
      await studentService.deleteCertification(id);
      setSuccessMsg(`Certification "${name}" removed.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchCertifications();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete certification.');
    }
  };

  if (loading) {
    return (
      <StudentLayout pageTitle="Certifications" pageSubtitle="Verified badges, industry credentials, and licenses">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="h-10 w-10 border-4 border-[#2E9D74] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#2a4d3e]">Loading certifications...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageTitle="Professional Certifications &amp; Licenses"
      pageSubtitle="Document external credentials, cloud provider badges, and online course achievements"
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

        {/* Top Header Card */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#2E9D74]" />
              <h3 className="text-sm font-bold text-[#143026]">Your Industry Certifications</h3>
            </div>
            <p className="text-xs text-[#4d7565] mt-0.5">
              Verified credentials strengthen your profile and fulfill corporate drive requisites
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certification</span>
          </button>
        </div>

        {/* Certifications List */}
        {certifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white/95 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs flex flex-col justify-between hover:border-[#2E9D74] transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] shrink-0 mt-0.5">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#143026] group-hover:text-[#2E9D74] transition">
                          {cert.name}
                        </h4>
                        <p className="text-[11px] text-[#4d7565] font-semibold mt-0.5">
                          {cert.issuingOrganization}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(cert)}
                        className="p-1 rounded-lg text-[#5b8071] hover:text-[#143026] hover:bg-[#EAF6F0] transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCertification(cert.id, cert.name)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-[#5b8071] pt-2 border-t border-[#A7D6C0]/40">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2E9D74]" />
                      <span>Issued: {new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                      {cert.expiryDate && (
                        <span> &bull; Expires: {new Date(cert.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>

                    {cert.credentialId && (
                      <p className="font-mono text-[10px] text-[#143026]">
                        Credential ID: <span className="font-bold">{cert.credentialId}</span>
                      </p>
                    )}
                  </div>
                </div>

                {cert.credentialUrl && (
                  <div className="pt-3 mt-3 border-t border-[#A7D6C0]/40">
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E9D74] hover:underline"
                    >
                      <span>Verify Credential Online</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/90 rounded-2xl border border-dashed border-[#A7D6C0] p-10 text-center space-y-3">
            <Award className="w-10 h-10 text-[#5b8071] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#143026]">No certifications added yet</h3>
            <p className="text-xs text-[#5b8071] max-w-sm mx-auto">
              Showcase your certifications from AWS, Microsoft, Google Cloud, Cisco, Coursera, HackerRank, and other recognized organizations.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#258260] transition cursor-pointer"
            >
              Add Certification
            </button>
          </div>
        )}

        {/* Modal: Add/Edit Certification */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50">
                <h3 className="text-sm font-bold text-[#143026]">
                  {editingCert ? 'Edit Certification' : 'Add Certification'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCertification} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#143026] mb-1">
                    Certification Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    placeholder="e.g. AWS Certified Solutions Architect"
                    className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                    required
                  />
                  {modalErrors.name && <p className="text-[10px] text-red-600 mt-1">{modalErrors.name}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-[#143026] mb-1">
                    Issuing Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalForm.issuingOrganization}
                    onChange={(e) => setModalForm({ ...modalForm, issuingOrganization: e.target.value })}
                    placeholder="e.g. Amazon Web Services, Oracle, Google"
                    className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                    required
                  />
                  {modalErrors.issuingOrganization && (
                    <p className="text-[10px] text-red-600 mt-1">{modalErrors.issuingOrganization}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#143026] mb-1">
                      Issue Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={modalForm.issueDate}
                      onChange={(e) => setModalForm({ ...modalForm, issueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                      required
                    />
                    {modalErrors.issueDate && <p className="text-[10px] text-red-600 mt-1">{modalErrors.issueDate}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-[#143026] mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={modalForm.expiryDate}
                      onChange={(e) => setModalForm({ ...modalForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                    />
                    {modalErrors.expiryDate && (
                      <p className="text-[10px] text-red-600 mt-1">{modalErrors.expiryDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#143026] mb-1">Credential ID (Optional)</label>
                  <input
                    type="text"
                    value={modalForm.credentialId}
                    onChange={(e) => setModalForm({ ...modalForm, credentialId: e.target.value })}
                    placeholder="e.g. ABC-12345678"
                    className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#143026] mb-1">Credential URL (Optional)</label>
                  <input
                    type="url"
                    value={modalForm.credentialUrl}
                    onChange={(e) => setModalForm({ ...modalForm, credentialUrl: e.target.value })}
                    placeholder="https://www.credly.com/badges/..."
                    className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                  />
                  {modalErrors.credentialUrl && (
                    <p className="text-[10px] text-red-600 mt-1">{modalErrors.credentialUrl}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#A7D6C0]/50">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingCert ? 'Update' : 'Add Certification'}
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
