import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { studentService } from '../../services/student.service';
import type { StudentProfile, Gender } from '../../types/student.types';
import {
  User,
  ShieldCheck,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'PREFER_NOT_TO_SAY' as Gender,
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    profilePhoto: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        gender: (data.gender as Gender) || 'PREFER_NOT_TO_SAY',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'India',
        pincode: data.pincode || '',
        profilePhoto: data.profilePhoto || '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }

    if (formData.phone && !/^[+]?[\d\s-]{7,20}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number (7-20 digits).';
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const now = new Date();
      if (dob >= now) {
        errors.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    if (formData.pincode && !/^[a-zA-Z0-9\s-]{3,12}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Please enter a valid postal code.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const updated = await studentService.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
        profilePhoto: formData.profilePhoto,
      });

      setProfile(updated);
      setSuccessMsg('Personal profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout pageTitle="Personal Profile" pageSubtitle="Manage contact & personal identification">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="h-10 w-10 border-4 border-[#2E9D74] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#2a4d3e]">Loading profile information...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageTitle="Personal Profile &amp; Contact Details"
      pageSubtitle="Keep your communication information up to date for campus recruiters"
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

        {/* Identity & Enrollment Card (System Controlled / Protected) */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A7D6C0]/50">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] text-white flex items-center justify-center font-bold text-2xl shadow-sm ring-4 ring-white overflow-hidden shrink-0">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt={formData.fullName} className="h-full w-full object-cover" />
                ) : (
                  formData.fullName.charAt(0) || 'S'
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#143026]">{profile?.fullName}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {profile?.academicStatus}
                  </span>
                </div>
                <p className="text-xs text-[#4d7565] mt-0.5">
                  {profile?.department?.name} ({profile?.department?.code})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0] font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Identity Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/60 text-xs">
              <span className="text-[11px] text-[#5b8071] block font-medium">Student Roll Number</span>
              <span className="font-bold font-mono text-[#143026] text-sm">{profile?.studentId}</span>
              <span className="text-[9px] text-[#5b8071] block mt-0.5">System-controlled</span>
            </div>

            <div className="p-3 rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/60 text-xs">
              <span className="text-[11px] text-[#5b8071] block font-medium">University Enrollment No.</span>
              <span className="font-bold font-mono text-[#143026] text-sm">{profile?.enrollmentNumber}</span>
              <span className="text-[9px] text-[#5b8071] block mt-0.5">Official University ID</span>
            </div>

            <div className="p-3 rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/60 text-xs">
              <span className="text-[11px] text-[#5b8071] block font-medium">Registered Institutional Email</span>
              <span className="font-bold text-[#143026] text-sm truncate block">{profile?.email}</span>
              <span className="text-[9px] text-[#5b8071] block mt-0.5">Authentication Primary</span>
            </div>
          </div>
        </div>

        {/* Editable Personal Information Form */}
        <form onSubmit={handleSubmit} className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#A7D6C0]/50">
            <User className="w-4 h-4 text-[#2E9D74]" />
            <h3 className="text-sm font-bold text-[#143026]">Personal &amp; Contact Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="First Middle Last"
                required
              />
              {formErrors.fullName && <p className="text-[10px] text-red-600 mt-1">{formErrors.fullName}</p>}
            </div>

            {/* Profile Photo URL */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">Profile Photo URL</label>
              <input
                type="url"
                value={formData.profilePhoto}
                onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">Mobile / WhatsApp Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="+91 98765 43210"
              />
              {formErrors.phone && <p className="text-[10px] text-red-600 mt-1">{formErrors.phone}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
              />
              {formErrors.dateOfBirth && <p className="text-[10px] text-red-600 mt-1">{formErrors.dateOfBirth}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none cursor-pointer"
              >
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="India"
              />
            </div>

            {/* Street Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#143026] mb-1">Residential / Campus Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="House / Hostel, Street, Landmark"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="Bengaluru"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="Karnataka"
              />
            </div>

            {/* Postal / PIN code */}
            <div>
              <label className="block text-xs font-semibold text-[#143026] mb-1">PIN / Postal Code</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                placeholder="560100"
              />
              {formErrors.pincode && <p className="text-[10px] text-red-600 mt-1">{formErrors.pincode}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-[#A7D6C0]/50">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/25 hover:opacity-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </StudentLayout>
  );
};
