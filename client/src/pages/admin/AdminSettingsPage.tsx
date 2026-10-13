import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import type { SystemSetting } from '../../types/admin.types';
import {
  Settings,
  Building,
  ShieldCheck,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface SettingField {
  key: string;
  label: string;
  value: string;
  group: string;
  description: string;
  type?: 'text' | 'number' | 'boolean' | 'email';
}

const DEFAULT_SETTINGS: SettingField[] = [
  // Institutional Details
  {
    key: 'INSTITUTION_NAME',
    label: 'Institution Name',
    value: 'NexHire Institute of Technology',
    group: 'INSTITUTION',
    description: 'Official name displayed across candidate resumes and placement certificates',
    type: 'text',
  },
  {
    key: 'PLACEMENT_CELL_EMAIL',
    label: 'Placement Cell Email',
    value: 'placement@nexhire.edu',
    group: 'INSTITUTION',
    description: 'Primary contact email for recruitment inquiries and corporate communication',
    type: 'email',
  },
  {
    key: 'CAMPUS_LOCATION',
    label: 'Campus Location / City',
    value: 'Bengaluru, Karnataka',
    group: 'INSTITUTION',
    description: 'Default venue location for on-campus interview drives',
    type: 'text',
  },

  // Placement Policy Rules
  {
    key: 'CURRENT_ACADEMIC_YEAR',
    label: 'Current Academic Year',
    value: '2026-2027',
    group: 'PLACEMENT_RULES',
    description: 'Active placement cycle academic year session',
    type: 'text',
  },
  {
    key: 'MAX_OFFERS_PER_STUDENT',
    label: 'Max Active Offers per Candidate',
    value: '2',
    group: 'PLACEMENT_RULES',
    description: 'Maximum job offers a candidate can hold before mandatory acceptance/opt-out',
    type: 'number',
  },
  {
    key: 'MIN_ELIGIBILITY_CGPA',
    label: 'Default Minimum CGPA Threshold',
    value: '6.5',
    group: 'PLACEMENT_RULES',
    description: 'Standard baseline cut-off when not explicitly specified by an employer drive',
    type: 'number',
  },

  // Notification Preferences
  {
    key: 'ENABLE_IN_APP_NOTIFICATIONS',
    label: 'In-App Notification Dispatch',
    value: 'true',
    group: 'NOTIFICATIONS',
    description: 'Deliver instant notification badges and popovers across student/recruiter headers',
    type: 'boolean',
  },
  {
    key: 'DEADLINE_ALERT_DAYS',
    label: 'Drive Deadline Reminder (Days Prior)',
    value: '3',
    group: 'NOTIFICATIONS',
    description: 'Advance notice sent to eligible students before application window closes',
    type: 'number',
  },
];

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [settingsList, setSettingsList] = useState<SettingField[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await adminService.getSystemSettings();
        if (data && data.length > 0) {
          const map = new Map<string, SystemSetting>();
          data.forEach((s) => map.set(s.key, s));

          setSettingsList((prev) =>
            prev.map((field) => {
              const remote = map.get(field.key);
              return remote ? { ...field, value: remote.value } : field;
            })
          );
        }
      } catch (err: any) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettingsList((prev) =>
      prev.map((item) => (item.key === key ? { ...item, value: val } : item))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setFeedback({
        type: 'error',
        message: 'Permission denied: Only Super Administrators can alter global system configurations.',
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await adminService.updateSystemSettings(
        settingsList.map((s) => ({
          key: s.key,
          value: s.value,
          group: s.group,
          description: s.description,
        }))
      );
      setFeedback({
        type: 'success',
        message: 'System settings and institutional placement rules updated successfully.',
      });
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update system settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderGroup = (
    groupName: string,
    title: string,
    description: string,
    Icon: React.ElementType
  ) => {
    const fields = settingsList.filter((s) => s.group === groupName);

    return (
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#A7D6C0] shadow-sm space-y-6">
        <div className="flex items-start gap-3 pb-4 border-b border-[#A7D6C0]/40">
          <div className="w-10 h-10 rounded-2xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#143026]">{title}</h2>
            <p className="text-xs text-[#4d7565] mt-0.5">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="block text-xs font-bold text-[#143026]">{f.label}</label>
              {f.type === 'boolean' ? (
                <select
                  disabled={!isSuperAdmin}
                  value={f.value}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#2E9D74]"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  disabled={!isSuperAdmin}
                  value={f.value}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#2E9D74]"
                />
              )}
              <p className="text-[11px] text-[#4d7565]">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout
      pageTitle="Platform & System Configuration"
      pageSubtitle="Institutional identity, recruitment lifecycle policies, and notification rules"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#2E9D74]" />
              <h1 className="text-xl font-black text-[#143026]">Platform &amp; System Configuration</h1>
            </div>
            <p className="text-xs text-[#4d7565] mt-1">
              Institutional identity, recruitment lifecycle policies, and notification rules
            </p>
          </div>

          {!isSuperAdmin && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Lock className="w-3.5 h-3.5" />
              <span>Read-only Mode (Super Admin Required to Edit)</span>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="font-bold underline text-xs cursor-pointer ml-3">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-xs font-semibold text-[#4d7565]">
            Loading system configuration...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {renderGroup(
              'INSTITUTION',
              'Institutional Information',
              'College branding and official placement office details',
              Building
            )}

            {renderGroup(
              'PLACEMENT_RULES',
              'Campus Recruitment Policies',
              'Offer caps, academic criteria cut-offs, and cycle years',
              ShieldCheck
            )}

            {renderGroup(
              'NOTIFICATIONS',
              'System Notification Preferences',
              'Alert frequency and notification delivery protocols',
              Bell
            )}

            {isSuperAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving System Changes...' : 'Save System Settings'}</span>
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </AdminLayout>
  );
};
