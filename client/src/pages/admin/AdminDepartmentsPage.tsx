import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/admin.service';
import type { Department } from '../../types/admin.types';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  GraduationCap,
  X,
} from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', isActive: true });
  const [saving, setSaving] = useState<boolean>(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      console.error('Failed to load departments:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load departments.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      isActive: dept.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setFeedback({ type: 'error', message: 'Department name and code are required.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      if (editingDept) {
        await adminService.updateDepartment(editingDept.id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
        });
        setFeedback({ type: 'success', message: 'Department updated successfully.' });
      } else {
        await adminService.createDepartment({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || undefined,
        });
        setFeedback({ type: 'success', message: 'Department created successfully.' });
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      console.error('Error saving department:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save department.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    const studentCount = dept._count?.students || 0;
    const confirmMessage =
      studentCount > 0
        ? `This department has ${studentCount} registered student(s). It will be safely DEACTIVATED rather than permanently deleted. Proceed?`
        : `Are you sure you want to delete department '${dept.name}'?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await adminService.deleteDepartment(dept.id);
      setFeedback({ type: 'success', message: res.message });
      fetchDepartments();
    } catch (err: any) {
      console.error('Failed to remove department:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to remove department.' });
    }
  };

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout
      pageTitle="Academic Department Management"
      pageSubtitle="Configure institution faculties, branch codes, and enrollment associations"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-6 h-6 text-[#2E9D74]" />
              <h1 className="text-xl font-black text-[#143026]">Academic Department Management</h1>
            </div>
            <p className="text-xs text-[#4d7565] mt-1">
              Configure institution faculties, branch codes, and enrollment associations
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
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
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="font-bold underline text-xs cursor-pointer ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* Search */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0] shadow-sm max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search departments by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#EAF6F0]/40 border border-[#A7D6C0] text-xs text-[#143026] placeholder-[#4d7565] focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
            />
          </div>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div className="p-16 text-center text-xs font-semibold text-[#4d7565]">
            Loading institutional departments...
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-white/90 rounded-3xl p-16 text-center border border-[#A7D6C0] space-y-2">
            <Building className="w-10 h-10 text-[#A7D6C0] mx-auto opacity-70" />
            <p className="font-bold text-sm text-[#143026]">No departments found</p>
            <p className="text-xs text-[#4d7565]">Click 'Add Department' to create the first faculty branch.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDepartments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0] shadow-sm flex flex-col justify-between hover:border-[#2E9D74] transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-[#2E9D74]/15 text-[#2E9D74] rounded-lg border border-[#2E9D74]/30">
                      {dept.code}
                    </span>
                    {dept.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" /> Inactive
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-[#143026] mt-3">{dept.name}</h3>
                  <p className="text-xs text-[#4d7565] mt-1 line-clamp-2">
                    {dept.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#A7D6C0]/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#2a4d3e] font-semibold">
                    <GraduationCap className="w-4 h-4 text-[#2E9D74]" />
                    <span>{dept._count?.students || 0} Students Enrolled</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(dept)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#2E9D74] hover:bg-[#EAF6F0] transition cursor-pointer"
                      title="Edit department"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title={dept._count?.students ? 'Deactivate department' : 'Delete department'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#A7D6C0] shadow-2xl animate-in zoom-in-95 duration-150 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#2E9D74]" />
                  <h2 className="text-base font-black text-[#143026]">
                    {editingDept ? 'Edit Department' : 'Create New Department'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master of Computer Applications"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] text-xs text-[#143026] focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCA, CSE, ECE"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] text-xs font-mono font-bold text-[#143026] focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of curriculum or specialization..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#A7D6C0] text-xs text-[#143026] focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
                  />
                </div>

                {editingDept && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-[#A7D6C0] text-[#2E9D74] focus:ring-[#2E9D74]"
                    />
                    <label htmlFor="isActive" className="text-xs font-semibold text-[#143026] cursor-pointer">
                      Department is Active
                    </label>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
