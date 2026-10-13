import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { studentService } from '../../services/student.service';
import {
  Compass,
  Globe,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const LinkedinIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const StudentCareerPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    careerInterests: '',
    preferredRoles: '',
    preferredLocations: '',
    resumeUrl: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchCareer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getCareerInfo();
      setFormData({
        portfolioUrl: data.portfolioUrl || '',
        githubUrl: data.githubUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        careerInterests: data.careerInterests || '',
        preferredRoles: data.preferredRoles || '',
        preferredLocations: data.preferredLocations || '',
        resumeUrl: data.resumeUrl || '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load career info.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareer();
  }, []);

  const validateUrls = (): boolean => {
    const errs: Record<string, string> = {};
    const urlPattern = /^https?:\/\//i;

    if (formData.portfolioUrl && !urlPattern.test(formData.portfolioUrl.trim())) {
      errs.portfolioUrl = 'Portfolio URL must start with http:// or https://';
    }
    if (formData.githubUrl && !urlPattern.test(formData.githubUrl.trim())) {
      errs.githubUrl = 'GitHub URL must start with http:// or https://';
    }
    if (formData.linkedinUrl && !urlPattern.test(formData.linkedinUrl.trim())) {
      errs.linkedinUrl = 'LinkedIn URL must start with http:// or https://';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrls()) return;

    try {
      setSaving(true);
      setError(null);

      await studentService.updateCareerInfo({
        portfolioUrl: formData.portfolioUrl.trim() || null,
        githubUrl: formData.githubUrl.trim() || null,
        linkedinUrl: formData.linkedinUrl.trim() || null,
        careerInterests: formData.careerInterests.trim() || null,
        preferredRoles: formData.preferredRoles.trim() || null,
        preferredLocations: formData.preferredLocations.trim() || null,
        resumeUrl: formData.resumeUrl.trim() || null,
      });

      setSuccessMsg('Career preferences and online profiles updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update career information.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout pageTitle="Career Preferences" pageSubtitle="Job roles, target industries, and professional portfolios">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="h-10 w-10 border-4 border-[#2E9D74] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#2a4d3e]">Loading career preferences...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageTitle="Career Preferences &amp; Online Portfolios"
      pageSubtitle="Help recruiters evaluate your interests, target designations, and software projects"
    >
      <div className="space-y-6 max-w-4xl mx-auto">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Online Presence & Profiles Card */}
          <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#A7D6C0]/50">
              <Globe className="w-4 h-4 text-[#2E9D74]" />
              <h3 className="text-sm font-bold text-[#143026]">Professional Online Presence</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* LinkedIn */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#143026] flex items-center gap-1.5">
                    <LinkedinIcon />
                    <span>LinkedIn Profile URL</span>
                  </label>
                  {formData.linkedinUrl && (
                    <a
                      href={formData.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2E9D74] hover:underline flex items-center gap-1 font-bold text-[10px]"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
                {formErrors.linkedinUrl && <p className="text-[10px] text-red-600 mt-1">{formErrors.linkedinUrl}</p>}
              </div>

              {/* GitHub */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#143026] flex items-center gap-1.5">
                    <GithubIcon />
                    <span>GitHub Profile URL</span>
                  </label>
                  {formData.githubUrl && (
                    <a
                      href={formData.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2E9D74] hover:underline flex items-center gap-1 font-bold text-[10px]"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
                {formErrors.githubUrl && <p className="text-[10px] text-red-600 mt-1">{formErrors.githubUrl}</p>}
              </div>

              {/* Portfolio */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#143026] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#2E9D74]" />
                    <span>Personal Portfolio / Project Website URL</span>
                  </label>
                  {formData.portfolioUrl && (
                    <a
                      href={formData.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2E9D74] hover:underline flex items-center gap-1 font-bold text-[10px]"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://yourname.dev"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
                {formErrors.portfolioUrl && <p className="text-[10px] text-red-600 mt-1">{formErrors.portfolioUrl}</p>}
              </div>
            </div>
          </div>

          {/* Job & Placement Preferences */}
          <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#A7D6C0]/50">
              <Compass className="w-4 h-4 text-[#2E9D74]" />
              <h3 className="text-sm font-bold text-[#143026]">Job Roles &amp; Placement Interests</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#143026] mb-1">
                  Preferred Job Roles / Designations
                </label>
                <input
                  type="text"
                  value={formData.preferredRoles}
                  onChange={(e) => setFormData({ ...formData, preferredRoles: e.target.value })}
                  placeholder="e.g. Backend Engineer, Full Stack Developer, DevOps Engineer, Data Analyst"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
                <span className="text-[10px] text-[#5b8071] mt-0.5 block">
                  Comma-separated list of target positions you want to be considered for
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#143026] mb-1">
                  Preferred Work Locations
                </label>
                <input
                  type="text"
                  value={formData.preferredLocations}
                  onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
                  placeholder="e.g. Bengaluru, Hyderabad, Pune, Mumbai, Remote"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#143026] mb-1">
                  Career Interests &amp; Aspirations
                </label>
                <textarea
                  rows={3}
                  value={formData.careerInterests}
                  onChange={(e) => setFormData({ ...formData, careerInterests: e.target.value })}
                  placeholder="e.g. Passionate about building distributed cloud services, high-throughput database systems, and microservices architecture..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 hover:opacity-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Career Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </StudentLayout>
  );
};
