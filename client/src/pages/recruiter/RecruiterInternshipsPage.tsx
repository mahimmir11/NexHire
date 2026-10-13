import React, { useEffect, useState } from 'react';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { opportunityService } from '../../services/opportunity.service';
import type {
  InternshipCreatePayload,
  WorkMode,
  StipendPeriod,
} from '../../types/opportunity.types';
import {
  GraduationCap,
  Plus,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Send,
  Search,
  Sparkles,
} from 'lucide-react';

export const RecruiterInternshipsPage: React.FC = () => {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<InternshipCreatePayload>({
    title: '',
    description: '',
    responsibilities: '',
    duration: '6 Months',
    startDate: '',
    endDate: '',
    stipendAmount: 35000,
    stipendCurrency: 'INR',
    stipendPeriod: 'PER_MONTH',
    location: '',
    workMode: 'ON_SITE',
    requiredSkills: '',
    vacancies: 2,
    applicationDeadline: '',
    selectionProcess: 'Technical Assessment -> Technical Round -> HR Interview',
    isPPOApplicable: true,
    status: 'DRAFT',
    eligibilityCriteria: {
      minCgpa: 7.0,
      maxBacklogs: 0,
      allowedDepartments: ['MCA', 'CSE'],
      graduationYears: [2026],
      requiredSkills: ['TypeScript', 'React'],
    },
  });

  const fetchInternships = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await opportunityService.getMyCompanyInternships();
      setInternships(data);
    } catch (err: any) {
      console.error('Failed to load company internships:', err);
      setErrorMessage(err.message || 'Unable to retrieve company internships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      responsibilities: '',
      duration: '6 Months',
      startDate: '',
      endDate: '',
      stipendAmount: 35000,
      stipendCurrency: 'INR',
      stipendPeriod: 'PER_MONTH',
      location: '',
      workMode: 'ON_SITE',
      requiredSkills: '',
      vacancies: 2,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      selectionProcess: 'Technical Assessment -> Technical Round -> HR Interview',
      isPPOApplicable: true,
      status: 'DRAFT',
      eligibilityCriteria: {
        minCgpa: 7.0,
        maxBacklogs: 0,
        allowedDepartments: ['MCA', 'CSE'],
        graduationYears: [2026],
        requiredSkills: ['TypeScript', 'React'],
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (internship: any) => {
    setEditingId(internship.id);
    const deadlineStr = internship.applicationDeadline
      ? new Date(internship.applicationDeadline).toISOString().split('T')[0]
      : '';

    let allowedDepts: string[] = ['MCA', 'CSE'];
    let gradYears: number[] = [2026];
    let reqSkills: string[] = ['TypeScript'];

    if (internship.eligibilityCriteria) {
      try {
        if (internship.eligibilityCriteria.allowedDepartments) {
          allowedDepts = JSON.parse(internship.eligibilityCriteria.allowedDepartments);
        }
        if (internship.eligibilityCriteria.graduationYears) {
          gradYears = JSON.parse(internship.eligibilityCriteria.graduationYears);
        }
        if (internship.eligibilityCriteria.requiredSkills) {
          reqSkills = JSON.parse(internship.eligibilityCriteria.requiredSkills);
        }
      } catch {}
    }

    setFormData({
      title: internship.title,
      description: internship.description,
      responsibilities: internship.responsibilities,
      duration: internship.duration,
      startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : '',
      endDate: internship.endDate ? new Date(internship.endDate).toISOString().split('T')[0] : '',
      stipendAmount: Number(internship.stipendAmount),
      stipendCurrency: internship.stipendCurrency,
      stipendPeriod: internship.stipendPeriod,
      location: internship.location,
      workMode: internship.workMode,
      requiredSkills: internship.requiredSkills,
      vacancies: internship.vacancies,
      applicationDeadline: deadlineStr,
      selectionProcess: internship.selectionProcess || '',
      isPPOApplicable: internship.isPPOApplicable,
      status: internship.status,
      eligibilityCriteria: {
        minCgpa: internship.eligibilityCriteria?.minCgpa ? Number(internship.eligibilityCriteria.minCgpa) : 7.0,
        maxBacklogs: internship.eligibilityCriteria?.maxBacklogs ?? 0,
        allowedDepartments: allowedDepts,
        graduationYears: gradYears,
        requiredSkills: reqSkills,
      },
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent, submitForApproval = false) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload: InternshipCreatePayload = {
      ...formData,
      status: submitForApproval ? 'PENDING_APPROVAL' : formData.status || 'DRAFT',
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await opportunityService.updateInternship(editingId, payload);
        setSuccessMessage(`Internship "${payload.title}" updated successfully.`);
      } else {
        await opportunityService.createInternship(payload);
        setSuccessMessage(
          `Internship "${payload.title}" created successfully${
            submitForApproval ? ' and submitted for approval' : ''
          }.`
        );
      }
      setIsModalOpen(false);
      fetchInternships();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Internship submission failed:', err);
      setErrorMessage(err.message || 'Failed to save internship.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (id: number) => {
    try {
      setErrorMessage(null);
      await opportunityService.submitInternshipForApproval(id);
      setSuccessMessage('Internship submitted to Placement Administration for review.');
      fetchInternships();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Approval submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit internship for approval.');
    }
  };

  const handleCloseInternship = async (id: number) => {
    if (!window.confirm('Are you sure you want to close this internship drive?')) return;
    try {
      setErrorMessage(null);
      await opportunityService.closeInternship(id);
      setSuccessMessage('Internship has been closed.');
      fetchInternships();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Closure failed:', err);
      setErrorMessage(err.message || 'Failed to close internship.');
    }
  };

  const filteredInternships = internships.filter((item) => {
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      item.requiredSkills.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <RecruiterLayout
      pageTitle="Internship Opportunities"
      pageSubtitle="Post summer and semester internship drives with pre-placement offer options"
    >
      <div className="space-y-6 pb-12">
        {/* Feedback Banners */}
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

        {/* Top Controls: Status Tabs, Search & "Post Internship" CTA */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0]/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EAF6F0]/80 rounded-2xl border border-[#A7D6C0]/50 w-full md:w-auto">
            {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedStatus === st
                    ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-xs'
                    : 'text-[#315746] hover:bg-white/60'
                }`}
              >
                {st === 'ALL'
                  ? 'All Internships'
                  : st === 'PENDING_APPROVAL'
                  ? 'Pending Approval'
                  : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search internship title, skills..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Post Internship
            </button>
          </div>
        </div>

        {/* Internships Roster */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-[#4d7565]">Loading company internships...</p>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="py-20 text-center bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-[#A7D6C0]/70">
            <GraduationCap className="w-12 h-12 text-[#A7D6C0] mx-auto mb-3" />
            <h4 className="font-bold text-sm text-[#143026]">No internships found</h4>
            <p className="text-xs text-[#4d7565] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No internships match your filter.'
                : 'Click "Post Internship" to launch an internship drive.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInternships.map((internship) => {
              const deadlineDate = new Date(internship.applicationDeadline);
              const isPast = deadlineDate < new Date();

              return (
                <div
                  key={internship.id}
                  className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0]/70 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#143026] line-clamp-1">
                          {internship.title}
                        </h4>
                        <p className="text-[11px] text-[#4d7565] mt-0.5">
                          {internship.duration} &bull; {internship.workMode}
                          {internship.isPPOApplicable && (
                            <span className="ml-1 text-[#2E9D74] font-bold">(PPO Option)</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          internship.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : internship.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800'
                            : internship.status === 'CLOSED'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {internship.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#315746] line-clamp-2">{internship.description}</p>

                    <div className="space-y-1 text-xs text-[#4d7565]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#2E9D74]" />
                        <span>{internship.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-[#143026]">
                        <span>
                          ₹{Number(internship.stipendAmount).toLocaleString()} / {internship.stipendPeriod === 'PER_MONTH' ? 'mo' : 'stipend'}
                        </span>
                        <span>&bull;</span>
                        <span className="text-[#4d7565] font-normal">{internship.vacancies} openings</span>
                      </div>
                    </div>

                    {internship.eligibilityCriteria && (
                      <div className="p-2.5 bg-[#EAF6F0]/60 rounded-xl border border-[#A7D6C0]/40 text-[11px] text-[#315746] space-y-1">
                        <span className="font-bold text-[#2E9D74] block">Criteria Standard:</span>
                        <span>
                          Min CGPA: {internship.eligibilityCriteria.minCgpa ? Number(internship.eligibilityCriteria.minCgpa).toFixed(1) : 'None'} | Max Backlogs: {internship.eligibilityCriteria.maxBacklogs}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-[#A7D6C0]/40 flex items-center justify-between">
                    <span className="text-[10px] text-[#4d7565]">
                      Deadline: {deadlineDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      {isPast && <span className="text-rose-500 font-bold ml-1">(Expired)</span>}
                    </span>

                    <div className="flex items-center gap-2">
                      {internship.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSubmitForApproval(internship.id)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg transition border border-amber-200 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Submit
                        </button>
                      )}

                      {internship.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleCloseInternship(internship.id)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg transition"
                        >
                          Close
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(internship)}
                        className="p-1.5 text-[#2E9D74] hover:bg-[#EAF6F0] rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: POST / EDIT INTERNSHIP */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-[#A7D6C0]/80 space-y-5 animate-scaleUp max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#EAF6F0] flex items-center justify-center text-[#2E9D74]">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#143026]">
                      {editingId ? 'Edit Internship Position' : 'Post New Campus Internship'}
                    </h3>
                    <p className="text-xs text-[#4d7565]">
                      Configure internship duration, stipend, and student academic criteria
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => handleFormSubmit(e, false)} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#143026] mb-1">
                      Internship Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Cloud & AI Engineering Intern"
                      className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Duration <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g. 6 Months"
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Work Mode</label>
                      <select
                        value={formData.workMode}
                        onChange={(e) => setFormData({ ...formData, workMode: e.target.value as WorkMode })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs bg-white focus:outline-none"
                      >
                        <option value="ON_SITE">On-Site</option>
                        <option value="REMOTE">Remote</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Location <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Bengaluru"
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Stipend Amount (₹) <span className="text-rose-500">*</span></label>
                      <input
                        type="number"
                        required
                        value={formData.stipendAmount}
                        onChange={(e) => setFormData({ ...formData, stipendAmount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Stipend Frequency</label>
                      <select
                        value={formData.stipendPeriod}
                        onChange={(e) => setFormData({ ...formData, stipendPeriod: e.target.value as StipendPeriod })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs bg-white focus:outline-none"
                      >
                        <option value="PER_MONTH">Per Month</option>
                        <option value="PER_WEEK">Per Week</option>
                        <option value="LUMP_SUM">Lump Sum</option>
                        <option value="UNPAID">Unpaid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Open Positions <span className="text-rose-500">*</span></label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.vacancies}
                        onChange={(e) => setFormData({ ...formData, vacancies: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Application Deadline <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={formData.applicationDeadline}
                        onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Required Skills <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.requiredSkills}
                        onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                        placeholder="e.g. React, Node.js, Python"
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Description <span className="text-rose-500">*</span></label>
                      <textarea
                        rows={3}
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Responsibilities <span className="text-rose-500">*</span></label>
                      <textarea
                        rows={3}
                        required
                        value={formData.responsibilities}
                        onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Eligibility Builder */}
                <div className="p-4 bg-[#EAF6F0]/70 rounded-2xl border border-[#A7D6C0]/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2E9D74]" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#143026]">
                      Candidate Eligibility Standards
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#315746] mb-1">Minimum CGPA</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.eligibilityCriteria?.minCgpa ?? 7.0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eligibilityCriteria: {
                              ...formData.eligibilityCriteria,
                              maxBacklogs: formData.eligibilityCriteria?.maxBacklogs ?? 0,
                              minCgpa: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#315746] mb-1">Max Active Backlogs</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.eligibilityCriteria?.maxBacklogs ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eligibilityCriteria: {
                              ...formData.eligibilityCriteria,
                              maxBacklogs: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#315746] mb-1">Graduation Batch</label>
                      <input
                        type="number"
                        value={formData.eligibilityCriteria?.graduationYears?.[0] ?? 2026}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            eligibilityCriteria: {
                              ...formData.eligibilityCriteria,
                              maxBacklogs: formData.eligibilityCriteria?.maxBacklogs ?? 0,
                              graduationYears: [Number(e.target.value)],
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#A7D6C0]/40">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 sm:flex-none px-4 py-2 bg-[#EAF6F0] hover:bg-[#A7D6C0]/30 text-[#2E9D74] border border-[#2E9D74]/30 text-xs font-bold rounded-xl transition disabled:opacity-60"
                    >
                      Save as Draft
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={(e) => handleFormSubmit(e, true)}
                      className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit for Approval
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};
