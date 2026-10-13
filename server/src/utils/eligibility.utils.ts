import { Prisma } from '@prisma/client';

export interface StudentWithAcademicData {
  id: number;
  cgpa?: Prisma.Decimal | number | null;
  percentage?: Prisma.Decimal | number | null;
  backlogs: number;
  course?: string | null;
  program?: string | null;
  semester?: number | null;
  graduationYear?: number | null;
  academicStatus: string;
  isPlacementEligible: boolean;
  department?: {
    id: number;
    name: string;
    code: string;
  } | null;
  skills?: Array<{
    skill: {
      id: number;
      name: string;
    };
  }>;
}

export interface EligibilityCriteriaRecord {
  id: number;
  minCgpa?: Prisma.Decimal | number | null;
  minPercentage?: Prisma.Decimal | number | null;
  maxBacklogs: number;
  allowedCourses?: string | null; // JSON string or comma-separated
  allowedPrograms?: string | null; // JSON string or comma-separated
  allowedDepartments?: string | null; // JSON string: ["MCA", "CSE"]
  allowedSemesters?: string | null; // JSON string: [5, 6]
  graduationYears?: string | null; // JSON string: [2026, 2027]
  requiredSkills?: string | null; // JSON string: ["Node.js", "React"]
  additionalCriteria?: string | null;
}

export interface CriterionResult {
  criterion: string;
  required: string | number | string[];
  actual: string | number | string[] | null | undefined;
  satisfied: boolean;
  message?: string;
}

export interface EligibilityEvaluation {
  isEligible: boolean;
  reasons: string[];
  criteriaSummary: Record<string, CriterionResult>;
  evaluatedAt: string;
}

/**
 * Helper to safely parse JSON arrays or comma-delimited strings
 */
function parseStringList(value?: string | null): string[] {
  if (!value || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fallback: split by comma if not valid JSON
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Helper to safely parse numeric lists
 */
function parseNumberList(value?: string | null): number[] {
  if (!value || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => parseInt(String(item), 10))
        .filter((num) => !isNaN(num));
    }
  } catch {
    return value
      .split(',')
      .map((item) => parseInt(item.trim(), 10))
      .filter((num) => !isNaN(num));
  }
  return [];
}

/**
 * NexHire Core Eligibility Engine
 * Compares student academic profile against opportunity eligibility criteria.
 */
export function evaluateStudentEligibility(
  student: StudentWithAcademicData,
  criteria?: EligibilityCriteriaRecord | null
): EligibilityEvaluation {
  const reasons: string[] = [];
  const criteriaSummary: Record<string, CriterionResult> = {};

  // 1. Overall Student Placement Policy Status
  if (!student.isPlacementEligible) {
    reasons.push('Student placement eligibility flag is inactive or frozen by placement cell.');
    criteriaSummary['placementPolicy'] = {
      criterion: 'Placement Eligibility',
      required: 'Active',
      actual: 'Frozen/Inactive',
      satisfied: false,
    };
  } else {
    criteriaSummary['placementPolicy'] = {
      criterion: 'Placement Eligibility',
      required: 'Active',
      actual: 'Active',
      satisfied: true,
    };
  }

  if (student.academicStatus !== 'ACTIVE') {
    reasons.push(`Student academic enrollment status is ${student.academicStatus} (Must be ACTIVE).`);
    criteriaSummary['academicStatus'] = {
      criterion: 'Academic Status',
      required: 'ACTIVE',
      actual: student.academicStatus,
      satisfied: false,
    };
  }

  // If no specific criteria defined on the opportunity, default based on placement status
  if (!criteria) {
    return {
      isEligible: reasons.length === 0,
      reasons,
      criteriaSummary,
      evaluatedAt: new Date().toISOString(),
    };
  }

  const studentCgpa = student.cgpa !== null && student.cgpa !== undefined ? Number(student.cgpa) : null;
  const studentPercentage = student.percentage !== null && student.percentage !== undefined ? Number(student.percentage) : null;

  // 2. Minimum CGPA Check
  if (criteria.minCgpa !== null && criteria.minCgpa !== undefined) {
    const minCgpa = Number(criteria.minCgpa);
    if (studentCgpa === null || isNaN(studentCgpa)) {
      reasons.push(`CGPA requirement is ${minCgpa.toFixed(2)}, but your CGPA is not recorded.`);
      criteriaSummary['cgpa'] = {
        criterion: 'Minimum CGPA',
        required: minCgpa,
        actual: 'Not recorded',
        satisfied: false,
      };
    } else if (studentCgpa < minCgpa) {
      reasons.push(
        `Your CGPA (${studentCgpa.toFixed(2)}) is below the minimum required (${minCgpa.toFixed(2)}).`
      );
      criteriaSummary['cgpa'] = {
        criterion: 'Minimum CGPA',
        required: minCgpa,
        actual: studentCgpa,
        satisfied: false,
      };
    } else {
      criteriaSummary['cgpa'] = {
        criterion: 'Minimum CGPA',
        required: minCgpa,
        actual: studentCgpa,
        satisfied: true,
      };
    }
  }

  // 3. Minimum Percentage Check
  if (criteria.minPercentage !== null && criteria.minPercentage !== undefined) {
    const minPercentage = Number(criteria.minPercentage);
    if (studentPercentage === null || isNaN(studentPercentage)) {
      reasons.push(`Percentage requirement is ${minPercentage.toFixed(1)}%, but your percentage is not recorded.`);
      criteriaSummary['percentage'] = {
        criterion: 'Minimum Percentage',
        required: `${minPercentage}%`,
        actual: 'Not recorded',
        satisfied: false,
      };
    } else if (studentPercentage < minPercentage) {
      reasons.push(
        `Your percentage (${studentPercentage.toFixed(1)}%) is below the required (${minPercentage.toFixed(1)}%).`
      );
      criteriaSummary['percentage'] = {
        criterion: 'Minimum Percentage',
        required: `${minPercentage}%`,
        actual: `${studentPercentage}%`,
        satisfied: false,
      };
    } else {
      criteriaSummary['percentage'] = {
        criterion: 'Minimum Percentage',
        required: `${minPercentage}%`,
        actual: `${studentPercentage}%`,
        satisfied: true,
      };
    }
  }

  // 4. Maximum Active Backlogs Check
  const maxBacklogs = criteria.maxBacklogs ?? 0;
  if (student.backlogs > maxBacklogs) {
    reasons.push(
      `You have ${student.backlogs} active backlogs; maximum allowed for this opportunity is ${maxBacklogs}.`
    );
    criteriaSummary['backlogs'] = {
      criterion: 'Maximum Backlogs Allowed',
      required: maxBacklogs,
      actual: student.backlogs,
      satisfied: false,
    };
  } else {
    criteriaSummary['backlogs'] = {
      criterion: 'Maximum Backlogs Allowed',
      required: maxBacklogs,
      actual: student.backlogs,
      satisfied: true,
    };
  }

  // 5. Eligible Department Check
  const allowedDepts = parseStringList(criteria.allowedDepartments);
  if (allowedDepts.length > 0) {
    const deptCode = student.department?.code?.toUpperCase() || '';
    const deptName = student.department?.name?.toUpperCase() || '';
    const isDeptMatched = allowedDepts.some(
      (d) => d.toUpperCase() === deptCode || d.toUpperCase() === deptName
    );

    if (!isDeptMatched) {
      reasons.push(
        `Your department (${student.department?.code || 'None'}) is not in the eligible departments list: ${allowedDepts.join(', ')}.`
      );
      criteriaSummary['department'] = {
        criterion: 'Eligible Departments',
        required: allowedDepts,
        actual: student.department?.code || 'Not Set',
        satisfied: false,
      };
    } else {
      criteriaSummary['department'] = {
        criterion: 'Eligible Departments',
        required: allowedDepts,
        actual: student.department?.code,
        satisfied: true,
      };
    }
  }

  // 6. Eligible Courses / Programs
  const allowedCourses = parseStringList(criteria.allowedCourses);
  if (allowedCourses.length > 0) {
    const studentCourse = (student.course || '').trim().toUpperCase();
    const isCourseMatched = allowedCourses.some((c) => c.toUpperCase() === studentCourse);

    if (!isCourseMatched) {
      reasons.push(
        `Your course (${student.course || 'None'}) is not eligible. Allowed: ${allowedCourses.join(', ')}.`
      );
      criteriaSummary['course'] = {
        criterion: 'Eligible Courses',
        required: allowedCourses,
        actual: student.course || 'Not Set',
        satisfied: false,
      };
    } else {
      criteriaSummary['course'] = {
        criterion: 'Eligible Courses',
        required: allowedCourses,
        actual: student.course,
        satisfied: true,
      };
    }
  }

  // 7. Graduation Year Check
  const allowedGradYears = parseNumberList(criteria.graduationYears);
  if (allowedGradYears.length > 0) {
    const studentGradYear = student.graduationYear;
    if (!studentGradYear || !allowedGradYears.includes(studentGradYear)) {
      reasons.push(
        `Graduation batch ${studentGradYear || 'unknown'} does not match required batch (${allowedGradYears.join(', ')}).`
      );
      criteriaSummary['graduationYear'] = {
        criterion: 'Graduation Year Batch',
        required: allowedGradYears.join(', '),
        actual: studentGradYear || 'Not Set',
        satisfied: false,
      };
    } else {
      criteriaSummary['graduationYear'] = {
        criterion: 'Graduation Year Batch',
        required: allowedGradYears.join(', '),
        actual: studentGradYear,
        satisfied: true,
      };
    }
  }

  // 8. Required Skills Check
  const requiredSkills = parseStringList(criteria.requiredSkills);
  if (requiredSkills.length > 0) {
    const studentSkillNames = (student.skills || []).map((s) => s.skill.name.toLowerCase());
    const missingSkills = requiredSkills.filter(
      (req) => !studentSkillNames.includes(req.toLowerCase())
    );

    if (missingSkills.length > 0) {
      reasons.push(`Missing required skill(s): ${missingSkills.join(', ')}.`);
      criteriaSummary['skills'] = {
        criterion: 'Required Skills',
        required: requiredSkills,
        actual: studentSkillNames,
        satisfied: false,
        message: `Missing: ${missingSkills.join(', ')}`,
      };
    } else {
      criteriaSummary['skills'] = {
        criterion: 'Required Skills',
        required: requiredSkills,
        actual: studentSkillNames,
        satisfied: true,
      };
    }
  }

  const isEligible = reasons.length === 0;

  return {
    isEligible,
    reasons,
    criteriaSummary,
    evaluatedAt: new Date().toISOString(),
  };
}
