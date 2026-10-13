import React, { useEffect, useState, useRef } from 'react';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { companyService } from '../../services/company.service';
import type {
  CompanyProfile,
  CompanyProfileUpdatePayload,
} from '../../types/company.types';
import {
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
} from 'lucide-react';

export const CompanyProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [formData, setFormData] = useState<CompanyProfileUpdatePayload>({
    name: '',
    industry: '',
    website: '',
    description: '',
    headquarters: '',
    locations: '',
    companySize: '',
    contactEmail: '',
    contactPhone: '',
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await companyService.getMyCompanyProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        industry: data.industry || '',
        website: data.website || '',
        description: data.description || '',
        headquarters: data.headquarters || '',
        locations: data.locations || '',
        companySize: data.companySize || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
      });
    } catch (err: any) {
      console.error('Failed to load company profile:', err);
      setErrorMessage(err.message || 'Unable to load company profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Company legal name is required.';
    }

    if (!formData.industry?.trim()) {
      errors.industry = 'Industry/domain is required.';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Company description is required.';
    } else if (formData.description.trim().length < 20) {
      errors.description = 'Description should be at least 20 characters for student clarity.';
    }

    if (!formData.headquarters?.trim()) {
      errors.headquarters = 'Corporate headquarters location is required.';
    }

    if (!formData.contactEmail?.trim()) {
      errors.contactEmail = 'Contact email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
      errors.contactEmail = 'Please provide a valid email format (e.g. hr@company.com).';
    }

    if (formData.website && formData.website.trim()) {
      if (!/^https?:\/\//i.test(formData.website.trim())) {
        errors.website = 'Website must start with http:// or https://';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const updated = await companyService.updateMyCompanyProfile(formData);
      setProfile(updated);
      setSuccessMessage('Company profile information updated successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to update company profile:', err);
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Company logo image must be less than 5MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      setErrorMessage(null);
      const result = await companyService.uploadCompanyLogo(file);
      if (profile) {
        setProfile({ ...profile, logoUrl: result.logoUrl });
      }
      setSuccessMessage('Company brand logo updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to upload logo:', err);
      setErrorMessage(err.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <RecruiterLayout pageTitle="Company Profile" pageSubtitle="Loading profile details...">
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-12 h-12 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#315746]">Fetching company record...</p>
        </div>
      </RecruiterLayout>
    );
  }

  if (!profile) {
    return (
      <RecruiterLayout pageTitle="Company Profile" pageSubtitle="Error">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-rose-200 text-center max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Unable to Load Company</h2>
          <p className="text-sm text-gray-600 mt-1 mb-5">{errorMessage || 'Company profile not found.'}</p>
          <button
            onClick={fetchProfile}
            className="px-5 py-2.5 bg-[#2E9D74] text-white text-sm font-semibold rounded-xl hover:bg-[#258260] transition"
          >
            Retry
          </button>
        </div>
      </RecruiterLayout>
    );
  }

  const completion = profile.completion;

  return (
    <RecruiterLayout
      pageTitle="Company Profile"
      pageSubtitle="Maintain accurate corporate identity, locations, and hiring contact channels"
      verificationStatus={profile.verificationStatus}
      companyName={profile.name}
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

        {/* Top Header Card: Brand Logo + Verification Status + Score */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5">
            {/* Logo with Upload Overlay */}
            <div className="relative group">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-[#A7D6C0]/80 shadow-md bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white text-3xl font-black shadow-md">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload trigger button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
                title="Change Company Logo"
              >
                {uploadingLogo ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Change Logo</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl md:text-2xl font-black text-[#143026]">{profile.name}</h2>
                {profile.verificationStatus === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Institutional Partner
                  </span>
                )}
                {profile.verificationStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                  </span>
                )}
                {profile.verificationStatus === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Clarification Required
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-[#2E9D74] mt-1">{profile.industry}</p>
              <p className="text-[11px] text-[#4d7565] mt-1">
                Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Quick Profile Score & Upload logo trigger */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {completion && (
              <div className="text-right sm:border-r border-[#A7D6C0]/50 sm:pr-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block">
                  Completeness
                </span>
                <span className="text-2xl font-black text-[#2E9D74]">{completion.score}%</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="px-4 py-2.5 bg-[#EAF6F0] hover:bg-[#A7D6C0]/30 text-[#2E9D74] text-xs font-bold rounded-xl transition border border-[#2E9D74]/20 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploadingLogo ? 'Uploading...' : 'Upload Brand Logo'}
            </button>
          </div>
        </div>

        {/* PROFILE EDIT FORM */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* SECTION 1: Legal & Core Identity */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm space-y-5">
            <div className="border-b border-[#A7D6C0]/40 pb-3">
              <h3 className="text-base font-bold text-[#143026]">1. Corporate Identity</h3>
              <p className="text-xs text-[#4d7565]">Official company name and industry domain</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Company Legal Name */}
              <div>
                <label className="block text-xs font-bold text-[#143026] mb-1.5">
                  Company Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Apex Innovations Technologies Pvt Ltd"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                    fieldErrors.name
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#A7D6C0] focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* Industry / Sector */}
              <div>
                <label className="block text-xs font-bold text-[#143026] mb-1.5">
                  Industry / Sector <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Enterprise Software & Cloud Infrastructure"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                    fieldErrors.industry
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#A7D6C0] focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20'
                  }`}
                />
                {fieldErrors.industry && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.industry}</p>
                )}
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-xs font-bold text-[#143026] mb-1.5">
                  Company Size
                </label>
                <select
                  name="companySize"
                  value={formData.companySize || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20 bg-white transition"
                >
                  <option value="">Select organizational scale</option>
                  <option value="1-50">1-50 Employees (Seed / Early Stage)</option>
                  <option value="51-200">51-200 Employees (Growing Mid-Market)</option>
                  <option value="201-500">201-500 Employees (Mid-Market Enterprise)</option>
                  <option value="501-1000">501-1000 Employees (Large Scale Enterprise)</option>
                  <option value="1000-5000">1,000 - 5,000 Employees (Major Multi-National)</option>
                  <option value="5000+">5,000+ Employees (Global Enterprise Conglomerate)</option>
                </select>
              </div>

              {/* Corporate Website */}
              <div>
                <label className="block text-xs font-bold text-[#143026] mb-1.5">
                  Corporate Website URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-3" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleInputChange}
                    placeholder="https://company.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                      fieldErrors.website
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-[#A7D6C0] focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20'
                    }`}
                  />
                </div>
                {fieldErrors.website && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.website}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#143026] mb-1.5">
                Company Overview &amp; Culture <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Describe your company vision, product suite, tech stack, and workplace culture to prospective student recruits..."
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition ${
                  fieldErrors.description
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-[#A7D6C0] focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20'
                }`}
              ></textarea>
              {fieldErrors.description ? (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.description}</p>
              ) : (
                <p className="text-[11px] text-[#4d7565] mt-1">
                  A comprehensive description helps students learn about your team before applying.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 2: Locations & Physical Presence */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm space-y-5">
            <div className="border-b border-[#A7D6C0]/40 pb-3">
              <h3 className="text-base font-bold text-[#143026]">2. Headquarters &amp; Work Locations</h3>
              <p className="text-xs text-[#4d7565]">Where student hires will be posted or work remotely</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Headquarters */}
              <div>
                <label className="block text-xs font-bold text-[#143026] mb-1.5">
                  Corporate Headquarters <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="headquarters"
                    value={formData.headquarters || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. Bengaluru, Karnataka, India"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                      fieldErrors.headquarters
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-[#A7D6C0] focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20'
                    }`}
                  />
                </div>
                {fieldErrors.headquarters && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.headquarters}</p>
                )}
              </div>

              {/* Other Locations / Hubs */}
              <div>
                <label className="block text-xs font-bold text-[#143026] mb-1.5">
                  Other Operating Locations / Remote Options
                </label>
                <input
                  type="text"
                  name="locations"
                  value={formData.locations || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Hyderabad, Pune, Mumbai, Remote (Hybrid)"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20 transition"
                />
                <p className="text-[11px] text-[#4d7565] mt-1">Comma-separated list of office hubs or hiring regions</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Official Communication & Point of Contact */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm space-y-5">
            <div className="border-b border-[#A7D6C0]/40 pb-3">
              <h3 className="text-base font-bold text-[#143026]">3. Contact &amp; University Relations Channels</h3>
              <p className="text-xs text-[#4d7565]">Official channels for placement coordinators and student queries</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Contact Email */}
              <div>
                <label className="block text-xs font-bold text-[#143026] mb-1.5">
                  Official Placement / HR Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail || ''}
                    onChange={handleInputChange}
                    placeholder="campus-hiring@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition ${
                      fieldErrors.contactEmail
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-[#A7D6C0] focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20'
                    }`}
                  />
                </div>
                {fieldErrors.contactEmail && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.contactEmail}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-[#143026] mb-1.5">
                  Corporate Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone || ''}
                    onChange={handleInputChange}
                    placeholder="+91 80 4123 4567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={fetchProfile}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#315746] bg-white border border-[#A7D6C0] rounded-xl hover:bg-[#EAF6F0] transition"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </RecruiterLayout>
  );
};
