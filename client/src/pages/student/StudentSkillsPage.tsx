import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { studentService } from '../../services/student.service';
import type { StudentSkill, CatalogSkill, SkillCategory, SkillProficiency } from '../../types/student.types';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Code2,
  Wrench,
  MessageSquare,
  Layers,
  X,
} from 'lucide-react';

export const StudentSkillsPage: React.FC = () => {
  const [skills, setSkills] = useState<StudentSkill[]>([]);
  const [catalog, setCatalog] = useState<CatalogSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Skill Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    skillId: '',
    name: '',
    category: 'TECHNICAL' as SkillCategory,
    proficiency: 'INTERMEDIATE' as SkillProficiency,
    yearsOfExperience: 1,
  });

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentService.getSkills();
      setSkills(res.skills);
      setCatalog(res.catalog);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load skills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.skillId && !formData.name.trim()) {
      setError('Please select an existing skill or enter a new skill name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await studentService.addSkill({
        skillId: formData.skillId ? Number(formData.skillId) : undefined,
        name: formData.name ? formData.name.trim() : undefined,
        category: formData.category,
        proficiency: formData.proficiency,
        yearsOfExperience: Number(formData.yearsOfExperience),
      });

      setShowAddModal(false);
      setFormData({
        skillId: '',
        name: '',
        category: 'TECHNICAL',
        proficiency: 'INTERMEDIATE',
        yearsOfExperience: 1,
      });
      setSuccessMsg('Skill successfully added to your profile!');
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchSkills();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add skill.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSkill = async (skillId: number, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from your skills?`)) return;

    try {
      setError(null);
      await studentService.removeSkill(skillId);
      setSuccessMsg(`"${name}" removed from skills.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchSkills();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove skill.');
    }
  };

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  const getCategoryIcon = (cat: SkillCategory) => {
    switch (cat) {
      case 'TECHNICAL':
      case 'LANGUAGE':
        return <Code2 className="w-3.5 h-3.5 text-[#2E9D74]" />;
      case 'TOOL':
        return <Wrench className="w-3.5 h-3.5 text-blue-600" />;
      case 'SOFT_SKILL':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-[#2E9D74]" />;
    }
  };

  const getProficiencyBadge = (prof: SkillProficiency) => {
    switch (prof) {
      case 'EXPERT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ADVANCED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'INTERMEDIATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  if (loading) {
    return (
      <StudentLayout pageTitle="Skills & Expertise" pageSubtitle="Technical competencies, tools, and proficiencies">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="h-10 w-10 border-4 border-[#2E9D74] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#2a4d3e]">Loading your skills profile...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageTitle="Skills &amp; Technical Competencies"
      pageSubtitle="Match with recruiter requirements by maintaining your technical, tool, and soft skills"
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

        {/* Top Control Bar */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'TECHNICAL', 'TOOL', 'LANGUAGE', 'SOFT_SKILL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#2E9D74] text-white shadow-xs'
                    : 'bg-[#EAF6F0]/70 text-[#2a4d3e] hover:bg-[#EAF6F0] border border-[#A7D6C0]/70'
                }`}
              >
                {cat === 'ALL' ? 'All Skills' : cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 hover:opacity-95 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>

        {/* Skills Cards Grid */}
        {filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSkills.map((sk) => (
              <div
                key={sk.id}
                className="bg-white/95 rounded-2xl border border-[#A7D6C0] p-4 shadow-xs hover:border-[#2E9D74] transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#EAF6F0] border border-[#A7D6C0]/60">
                        {getCategoryIcon(sk.category)}
                      </span>
                      <h4 className="text-xs font-bold text-[#143026] group-hover:text-[#2E9D74] transition">
                        {sk.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(sk.skillId, sk.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                      title="Remove Skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-[#5b8071] uppercase tracking-wider font-semibold">
                    {sk.category.replace(/_/g, ' ')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#A7D6C0]/40 text-[11px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold border ${getProficiencyBadge(sk.proficiency)}`}>
                    {sk.proficiency}
                  </span>
                  {sk.yearsOfExperience !== null && sk.yearsOfExperience !== undefined && (
                    <span className="text-[#5b8071] font-mono text-[10px]">
                      {sk.yearsOfExperience} {sk.yearsOfExperience === 1 ? 'year' : 'years'} exp
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/90 rounded-2xl border border-dashed border-[#A7D6C0] p-10 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-[#5b8071] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#143026]">No skills added yet</h3>
            <p className="text-xs text-[#5b8071] max-w-sm mx-auto">
              Add programming languages, frameworks, developer tools, and domain proficiencies to match eligibility filters in job postings.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#258260] transition cursor-pointer"
            >
              Add First Skill
            </button>
          </div>
        )}

        {/* Modal: Add Skill */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50">
                <h3 className="text-sm font-bold text-[#143026]">Add Skill to Profile</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSkill} className="space-y-4">
                {/* Catalog Selection or Custom */}
                <div>
                  <label className="block text-xs font-semibold text-[#143026] mb-1">
                    Select from Catalog or Type New Skill
                  </label>
                  <select
                    value={formData.skillId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const found = catalog.find((c) => c.id === Number(val));
                        setFormData({
                          ...formData,
                          skillId: val,
                          name: found ? found.name : '',
                          category: found ? found.category : formData.category,
                        });
                      } else {
                        setFormData({ ...formData, skillId: '', name: '' });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                  >
                    <option value="">-- Custom Skill / Type Below --</option>
                    {catalog.map((catSkill) => (
                      <option key={catSkill.id} value={catSkill.id}>
                        {catSkill.name} ({catSkill.category})
                      </option>
                    ))}
                  </select>
                </div>

                {!formData.skillId && (
                  <div>
                    <label className="block text-xs font-semibold text-[#143026] mb-1">
                      Custom Skill Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Next.js, FastAPI, Kubernetes"
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                      required={!formData.skillId}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#143026] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as SkillCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                  >
                    <option value="TECHNICAL">Technical Skills</option>
                    <option value="LANGUAGE">Programming Language</option>
                    <option value="TOOL">Tools &amp; Platforms</option>
                    <option value="DOMAIN">Domain Knowledge</option>
                    <option value="SOFT_SKILL">Soft Skill</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#143026] mb-1">Proficiency Level</label>
                    <select
                      value={formData.proficiency}
                      onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as SkillProficiency })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#143026] mb-1">Years of Experience</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026]"
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
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Skill'}
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
