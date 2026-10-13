import React, { useEffect, useState } from 'react';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { companyService } from '../../services/company.service';
import type {
  RecruiterItem,
  RecruiterCreatePayload,
  RecruiterUpdatePayload,
  RecruiterAccountStatus,
} from '../../types/company.types';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Search,
} from 'lucide-react';

export const RecruiterManagementPage: React.FC = () => {
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add Recruiter Form
  const [addForm, setAddForm] = useState<RecruiterCreatePayload>({
    fullName: '',
    email: '',
    password: '',
    designation: '',
    phone: '',
  });

  // Edit Recruiter Form
  const [editingRecruiter, setEditingRecruiter] = useState<RecruiterItem | null>(null);
  const [editForm, setEditForm] = useState<RecruiterUpdatePayload>({
    fullName: '',
    designation: '',
    phone: '',
    accountStatus: 'ACTIVE',
  });

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await companyService.getMyCompanyRecruiters();
      setRecruiters(data);
    } catch (err: any) {
      console.error('Failed to load recruiters:', err);
      setErrorMessage(err.message || 'Unable to load company recruiters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!addForm.fullName.trim() || !addForm.email.trim() || !addForm.designation.trim()) {
      setErrorMessage('Full name, business email, and corporate designation are required.');
      return;
    }

    try {
      setSubmitting(true);
      await companyService.addCompanyRecruiter(addForm);
      setSuccessMessage(`Recruiter account for ${addForm.fullName} has been added.`);
      setIsAddModalOpen(false);
      setAddForm({
        fullName: '',
        email: '',
        password: '',
        designation: '',
        phone: '',
      });
      fetchRecruiters();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to add recruiter:', err);
      setErrorMessage(err.message || 'Failed to add recruiter. Please check input details.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (recruiter: RecruiterItem) => {
    setEditingRecruiter(recruiter);
    setEditForm({
      fullName: recruiter.fullName,
      designation: recruiter.designation,
      phone: recruiter.phone || '',
      accountStatus: recruiter.accountStatus,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecruiter) return;
    setErrorMessage(null);

    try {
      setSubmitting(true);
      await companyService.updateCompanyRecruiter(editingRecruiter.id, editForm);
      setSuccessMessage(`Updated recruiter ${editingRecruiter.fullName} successfully.`);
      setIsEditModalOpen(false);
      setEditingRecruiter(null);
      fetchRecruiters();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to update recruiter:', err);
      setErrorMessage(err.message || 'Failed to update recruiter information.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecruiters = recruiters.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      r.designation.toLowerCase().includes(query)
    );
  });

  return (
    <RecruiterLayout
      pageTitle="Recruiter Team"
      pageSubtitle="Manage team members, roles, and hiring access permissions"
    >
      <div className="space-y-6 pb-12">
        {/* Alerts / Feedback */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-medium shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Control Bar: Search + Add Button */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-[#A7D6C0]/70 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20 transition"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Team Recruiter
          </button>
        </div>

        {/* Recruiters List Table / Grid */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#A7D6C0]/40 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#143026]">Authorized Recruiters</h3>
              <p className="text-xs text-[#4d7565]">
                {recruiters.length} active recruiter accounts linked to your organization
              </p>
            </div>
            <span className="text-xs font-bold text-[#2E9D74] bg-[#EAF6F0] px-3 py-1 rounded-full border border-[#2E9D74]/20">
              Tenant Isolated
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-[#4d7565]">Loading recruiter accounts...</p>
            </div>
          ) : filteredRecruiters.length === 0 ? (
            <div className="py-16 text-center p-6">
              <Users className="w-12 h-12 text-[#A7D6C0] mx-auto mb-3" />
              <h4 className="font-bold text-sm text-[#143026]">No recruiters found</h4>
              <p className="text-xs text-[#4d7565] mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No team members match your search criteria. Try a different search term.'
                  : 'Start expanding your hiring team by adding recruitment partners.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EAF6F0]/60 text-[11px] font-bold uppercase tracking-wider text-[#315746] border-b border-[#A7D6C0]/40">
                    <th className="py-3 px-6">Recruiter</th>
                    <th className="py-3 px-6">Designation</th>
                    <th className="py-3 px-6">Contact Channels</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Added On</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/30 text-xs">
                  {filteredRecruiters.map((recruiter) => (
                    <tr key={recruiter.id} className="hover:bg-[#EAF6F0]/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {recruiter.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#143026]">{recruiter.fullName}</span>
                              {recruiter.isCurrentUser && (
                                <span className="text-[10px] font-bold bg-[#2E9D74]/15 text-[#2E9D74] px-2 py-0.2 rounded-full border border-[#2E9D74]/30">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#4d7565]">{recruiter.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-[#143026] font-semibold">
                        {recruiter.designation}
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1 text-[#4d7565]">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#2E9D74]" />
                            <span>{recruiter.email}</span>
                          </div>
                          {recruiter.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#2E9D74]" />
                              <span>{recruiter.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No phone added</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            recruiter.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : recruiter.accountStatus === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              recruiter.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : recruiter.accountStatus === 'PENDING_APPROVAL'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          {recruiter.accountStatus}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-[#4d7565]">
                        {new Date(recruiter.createdAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openEditModal(recruiter)}
                          className="p-1.5 text-[#2E9D74] hover:bg-[#EAF6F0] rounded-lg transition"
                          title="Edit Recruiter Information"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: ADD RECRUITER */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-[#A7D6C0]/80 space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF6F0] flex items-center justify-center text-[#2E9D74]">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#143026]">Add Recruiter</h3>
                    <p className="text-xs text-[#4d7565]">Create login credentials for a new team member</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">
                    Corporate Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="sarah.jenkins@company.com"
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">
                    Corporate Designation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    placeholder="e.g. Lead Talent Acquisition Specialist"
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">
                    Direct Phone Number
                  </label>
                  <input
                    type="text"
                    value={addForm.phone || ''}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">
                    Initial Access Password
                  </label>
                  <input
                    type="password"
                    value={addForm.password || ''}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Leave blank for secure auto-generated password"
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20"
                  />
                  <p className="text-[11px] text-[#4d7565] mt-1">
                    If left blank, default credentials will be generated for immediate onboarding.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#A7D6C0]/40">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-60"
                  >
                    {submitting ? 'Creating Recruiter...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT RECRUITER */}
        {isEditModalOpen && editingRecruiter && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-[#A7D6C0]/80 space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-3">
                <div>
                  <h3 className="font-bold text-base text-[#143026]">Edit Recruiter</h3>
                  <p className="text-xs text-[#4d7565]">{editingRecruiter.email}</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">Designation</label>
                  <input
                    type="text"
                    value={editForm.designation || ''}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">Account Status</label>
                  <select
                    value={editForm.accountStatus}
                    onChange={(e) =>
                      setEditForm({ ...editForm, accountStatus: e.target.value as RecruiterAccountStatus })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Authorized to hire)</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL (Under internal review)</option>
                    <option value="INACTIVE">INACTIVE (Temporarily paused)</option>
                    <option value="SUSPENDED">SUSPENDED (Access revoked)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#A7D6C0]/40">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-60"
                  >
                    {submitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};
