import React, { useEffect, useState } from 'react';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { opportunityService } from '../../services/opportunity.service';
import type {
  JobCreatePayload,
  EmploymentType,
  WorkMode,
} from '../../types/opportunity.types';
import {
  Briefcase,
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

export const RecruiterJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<JobCreatePayload>({
    title: '',
    description: '',
    responsibilities: '',
    requirements: '',
    requiredSkills: '',
    employmentType: 'FULL_TIME',
    location: '',
    workMode: 'ON_SITE',
    salaryMin: 800000,
    salaryMax: 1200000,
    vacancies: 2,
    applicationDeadline: '',
    selectionProcess: 'Online Assessment -> Technical Interview -> HR Discussion',
    status: 'DRAFT',
    eligibilityCriteria: {
      minCgpa: 7.0,
      maxBacklogs: 0,
      allowedDepartments: ['MCA', 'CSE'],
      graduationYears: [2026],
      requiredSkills: ['TypeScript', 'Node.js'],
    },
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await opportunityService.getMyCompanyJobs();
      setJobs(data);
    } catch (err: any) {
      console.error('Failed to load company jobs:', err);
      setErrorMessage(err.message || 'Unable to retrieve company jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openCreateModal = () => {
    setEditingJobId(null);
    setFormData({
      title: '',
      description: '',
      responsibilities: '',
      requirements: '',
      requiredSkills: '',
      employmentType: 'FULL_TIME',
      location: '',
      workMode: 'ON_SITE',
      salaryMin: 800000,
      salaryMax: 1200000,
      vacancies: 2,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      selectionProcess: 'Online Assessment -> Technical Interview -> HR Discussion',
      status: 'DRAFT',
      eligibilityCriteria: {
        minCgpa: 7.0,
        maxBacklogs: 0,
        allowedDepartments: ['MCA', 'CSE'],
        graduationYears: [2026],
        requiredSkills: ['TypeScript', 'Node.js'],
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (job: any) => {
    setEditingJobId(job.id);
    const deadlineStr = job.applicationDeadline
      ? new Date(job.applicationDeadline).toISOString().split('T')[0]
      : '';

    let allowedDepts: string[] = ['MCA', 'CSE'];
    let gradYears: number[] = [2026];
    let reqSkills: string[] = ['TypeScript'];

    if (job.eligibilityCriteria) {
      try {
        if (job.eligibilityCriteria.allowedDepartments) {
          allowedDepts = JSON.parse(job.eligibilityCriteria.allowedDepartments);
        }
        if (job.eligibilityCriteria.graduationYears) {
          gradYears = JSON.parse(job.eligibilityCriteria.graduationYears);
        }
        if (job.eligibilityCriteria.requiredSkills) {
          reqSkills = JSON.parse(job.eligibilityCriteria.requiredSkills);
        }
      } catch {}
    }

    setFormData({
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      requiredSkills: job.requiredSkills,
      employmentType: job.employmentType,
      location: job.location,
      workMode: job.workMode,
      salaryMin: Number(job.salaryMin),
      salaryMax: Number(job.salaryMax),
      vacancies: job.vacancies,
      applicationDeadline: deadlineStr,
      selectionProcess: job.selectionProcess || '',
      status: job.status,
      eligibilityCriteria: {
        minCgpa: job.eligibilityCriteria?.minCgpa ? Number(job.eligibilityCriteria.minCgpa) : 7.0,
        maxBacklogs: job.eligibilityCriteria?.maxBacklogs ?? 0,
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

    const payload: JobCreatePayload = {
      ...formData,
      status: submitForApproval ? 'PENDING_APPROVAL' : formData.status || 'DRAFT',
    };

    try {
      setSubmitting(true);
      if (editingJobId) {
        await opportunityService.updateJob(editingJobId, payload);
        setSuccessMessage(`Job "${payload.title}" updated successfully.`);
      } else {
        await opportunityService.createJob(payload);
        setSuccessMessage(
          `Job "${payload.title}" created successfully${
            submitForApproval ? ' and submitted for approval' : ''
          }.`
        );
      }
      setIsModalOpen(false);
      fetchJobs();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Job submission failed:', err);
      setErrorMessage(err.message || 'Failed to save job posting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (jobId: number) => {
    try {
      setErrorMessage(null);
      await opportunityService.submitJobForApproval(jobId);
      setSuccessMessage('Job submitted to Placement Administration for review.');
      fetchJobs();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Approval submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit job for approval.');
    }
  };

  const handleCloseJob = async (jobId: number) => {
    if (!window.confirm('Are you sure you want to close this job drive?')) return;
    try {
      setErrorMessage(null);
      await opportunityService.closeJob(jobId);
      setSuccessMessage('Job has been closed.');
      fetchJobs();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Job closure failed:', err);
      setErrorMessage(err.message || 'Failed to close job.');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = selectedStatus === 'ALL' || job.status === selectedStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      job.requiredSkills.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <RecruiterLayout
      pageTitle="Job Openings"
      pageSubtitle="Post full-time campus hiring positions and define student eligibility standards"
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

        {/* Top Controls: Status Tabs, Search & "Post Job" CTA */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0]/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
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
                  ? 'All Jobs'
                  : st === 'PENDING_APPROVAL'
                  ? 'Pending Approval'
                  : st}
              </button>
            ))}
          </div>

          {/* Search + Action CTA */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title or skills..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Post New Job
            </button>
          </div>
        </div>

        {/* Jobs Roster */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-[#4d7565]">Loading company jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-20 text-center bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-[#A7D6C0]/70">
            <Briefcase className="w-12 h-12 text-[#A7D6C0] mx-auto mb-3" />
            <h4 className="font-bold text-sm text-[#143026]">No job openings found</h4>
            <p className="text-xs text-[#4d7565] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No positions match your search filter.'
                : 'Click "Post New Job" to create a campus recruitment drive.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => {
              const deadlineDate = new Date(job.applicationDeadline);
              const isPast = deadlineDate < new Date();

              return (
                <div
                  key={job.id}
                  className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0]/70 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#143026] line-clamp-1">{job.title}</h4>
                        <p className="text-[11px] text-[#4d7565] mt-0.5">
                          {job.employmentType} &bull; {job.workMode}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800'
                            : job.status === 'CLOSED'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#315746] line-clamp-2">{job.description}</p>

                    <div className="space-y-1 text-xs text-[#4d7565]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#2E9D74]" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-[#143026]">
                        <span>
                          ₹{(Number(job.salaryMin) / 100000).toFixed(1)}L - ₹
                          {(Number(job.salaryMax) / 100000).toFixed(1)}L CTC
                        </span>
                        <span>&bull;</span>
                        <span className="text-[#4d7565] font-normal">{job.vacancies} openings</span>
                      </div>
                    </div>

                    {/* Eligibility Snapshot */}
                    {job.eligibilityCriteria && (
                      <div className="p-2.5 bg-[#EAF6F0]/60 rounded-xl border border-[#A7D6C0]/40 text-[11px] text-[#315746] space-y-1">
                        <span className="font-bold text-[#2E9D74] block">Criteria Standard:</span>
                        <span>
                          Min CGPA: {job.eligibilityCriteria.minCgpa ? Number(job.eligibilityCriteria.minCgpa).toFixed(1) : 'None'} | Max Backlogs: {job.eligibilityCriteria.maxBacklogs}
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
                      {job.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSubmitForApproval(job.id)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg transition border border-amber-200 flex items-center gap-1"
                          title="Submit to Placement Admin for Review"
                        >
                          <Send className="w-3 h-3" /> Submit
                        </button>
                      )}

                      {job.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleCloseJob(job.id)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg transition"
                          title="Close Job Drive"
                        >
                          Close
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(job)}
                        className="p-1.5 text-[#2E9D74] hover:bg-[#EAF6F0] rounded-lg transition"
                        title="Edit Job"
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

        {/* MODAL: POST / EDIT JOB */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-[#A7D6C0]/80 space-y-5 animate-scaleUp max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#EAF6F0] flex items-center justify-center text-[#2E9D74]">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#143026]">
                      {editingJobId ? 'Edit Job Opening' : 'Post New Campus Job'}
                    </h3>
                    <p className="text-xs text-[#4d7565]">
                      Specify role requirements, compensation, and candidate eligibility
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
                {/* 1. Job Basics */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#143026] mb-1">
                      Job Position Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Associate Software Development Engineer"
                      className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Employment Type
                      </label>
                      <select
                        value={formData.employmentType}
                        onChange={(e) =>
                          setFormData({ ...formData, employmentType: e.target.value as EmploymentType })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs bg-white focus:outline-none focus:border-[#2E9D74]"
                      >
                        <option value="FULL_TIME">Full-Time Employee</option>
                        <option value="PART_TIME">Part-Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="TRAINEESHIP">Traineeship</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">Work Mode</label>
                      <select
                        value={formData.workMode}
                        onChange={(e) =>
                          setFormData({ ...formData, workMode: e.target.value as WorkMode })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs bg-white focus:outline-none focus:border-[#2E9D74]"
                      >
                        <option value="ON_SITE">On-Site</option>
                        <option value="REMOTE">Remote</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Primary Location <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Bengaluru / Pune"
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                      />
                    </div>
                  </div>

                  {/* Compensation & Openings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Salary Minimum (₹ CTC) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.salaryMin}
                        onChange={(e) => setFormData({ ...formData, salaryMin: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Salary Maximum (₹ CTC) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.salaryMax}
                        onChange={(e) => setFormData({ ...formData, salaryMax: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Open Vacancies <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.vacancies}
                        onChange={(e) => setFormData({ ...formData, vacancies: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                      />
                    </div>
                  </div>

                  {/* Deadline & Skills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Application Deadline <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.applicationDeadline}
                        onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Key Required Skills <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.requiredSkills}
                        onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                        placeholder="e.g. Node.js, TypeScript, React, MySQL"
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                      />
                    </div>
                  </div>

                  {/* Description & Responsibilities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Job Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Overview of the position and team mission..."
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#143026] mb-1">
                        Key Responsibilities <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={formData.responsibilities}
                        onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                        placeholder="Core day-to-day deliverables..."
                        className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                      ></textarea>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#143026] mb-1">
                      Requirements &amp; Qualifications <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Educational prerequisites, engineering fundamentals..."
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74]"
                    ></textarea>
                  </div>
                </div>

                {/* 2. ELIGIBILITY BUILDER SECTION */}
                <div className="p-4 bg-[#EAF6F0]/70 rounded-2xl border border-[#A7D6C0]/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2E9D74]" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#143026]">
                      Candidate Eligibility Standards
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#315746] mb-1">
                        Minimum CGPA (0.0 - 10.0)
                      </label>
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
                      <label className="block text-[11px] font-bold text-[#315746] mb-1">
                        Maximum Active Backlogs
                      </label>
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
                      <label className="block text-[11px] font-bold text-[#315746] mb-1">
                        Eligible Graduation Batch
                      </label>
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

                {/* Form Buttons */}
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
