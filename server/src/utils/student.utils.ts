import { Student, StudentAcademicRecord, StudentSkill, Document, Certification } from '@prisma/client';

export type StudentWithRelations = Student & {
  academicRecords?: StudentAcademicRecord[];
  skills?: (StudentSkill & { skill?: { name: string; category: string } })[];
  documents?: Document[];
  certifications?: Certification[];
};

export interface SectionCompletion {
  percentage: number;
  weight: number;
  isComplete: boolean;
  missingFields: string[];
}

export interface ProfileCompletionDetails {
  score: number;
  sections: {
    personal: SectionCompletion;
    academic: SectionCompletion;
    skills: SectionCompletion;
    career: SectionCompletion;
    documents: SectionCompletion;
  };
  missingItems: string[];
  recommendations: string[];
}

export function calculateProfileCompletion(student: StudentWithRelations): ProfileCompletionDetails {
  const missingItems: string[] = [];
  const recommendations: string[] = [];

  // 1. Personal Information (Weight: 25%)
  const personalMissing: string[] = [];
  let personalScore = 0;

  if (student.fullName?.trim()) personalScore += 5;
  else personalMissing.push('Full Name');

  if (student.phone?.trim()) personalScore += 5;
  else personalMissing.push('Phone Number');

  if (student.dateOfBirth) personalScore += 5;
  else personalMissing.push('Date of Birth');

  if (student.gender) personalScore += 3;
  else personalMissing.push('Gender');

  if (student.address?.trim() && student.city?.trim() && student.state?.trim()) personalScore += 5;
  else personalMissing.push('Complete Address (Address, City, State)');

  if (student.profilePhoto?.trim()) personalScore += 2;
  else personalMissing.push('Profile Photo');

  const personalSection: SectionCompletion = {
    percentage: Math.round((personalScore / 25) * 100),
    weight: 25,
    isComplete: personalMissing.length === 0,
    missingFields: personalMissing,
  };

  // 2. Academic Information (Weight: 25%)
  const academicMissing: string[] = [];
  let academicScore = 0;

  if (student.course?.trim() && student.program?.trim()) academicScore += 5;
  else academicMissing.push('Course & Program');

  if (student.departmentId) academicScore += 5;
  else academicMissing.push('Department');

  if (student.semester && student.graduationYear) academicScore += 5;
  else academicMissing.push('Semester & Graduation Year');

  if (student.cgpa !== null || student.percentage !== null) academicScore += 5;
  else academicMissing.push('CGPA or Percentage');

  const academicRecordsCount = student.academicRecords?.length || 0;
  if (academicRecordsCount > 0) academicScore += 5;
  else academicMissing.push('At least one academic milestone record (10th/12th/UG)');

  const academicSection: SectionCompletion = {
    percentage: Math.round((academicScore / 25) * 100),
    weight: 25,
    isComplete: academicMissing.length === 0,
    missingFields: academicMissing,
  };

  // 3. Skills (Weight: 20%)
  const skillsMissing: string[] = [];
  const skillCount = student.skills?.length || 0;
  let skillsScore = 0;

  if (skillCount >= 3) {
    skillsScore = 20;
  } else if (skillCount === 2) {
    skillsScore = 14;
    skillsMissing.push('Add at least 3 skills to achieve full skills completion');
  } else if (skillCount === 1) {
    skillsScore = 8;
    skillsMissing.push('Add at least 2 more skills');
  } else {
    skillsMissing.push('No skills added yet');
  }

  const skillsSection: SectionCompletion = {
    percentage: Math.round((skillsScore / 20) * 100),
    weight: 20,
    isComplete: skillCount >= 3,
    missingFields: skillsMissing,
  };

  // 4. Career Information (Weight: 15%)
  const careerMissing: string[] = [];
  let careerScore = 0;

  if (student.careerInterests?.trim()) careerScore += 4;
  else careerMissing.push('Career Interests');

  if (student.preferredRoles?.trim()) careerScore += 4;
  else careerMissing.push('Preferred Job Roles');

  if (student.preferredLocations?.trim()) careerScore += 3;
  else careerMissing.push('Preferred Locations');

  const hasOnlineProfile = Boolean(student.linkedinUrl?.trim() || student.githubUrl?.trim() || student.portfolioUrl?.trim());
  if (hasOnlineProfile) careerScore += 4;
  else careerMissing.push('Professional Link (LinkedIn, GitHub, or Portfolio)');

  const careerSection: SectionCompletion = {
    percentage: Math.round((careerScore / 15) * 100),
    weight: 15,
    isComplete: careerMissing.length === 0,
    missingFields: careerMissing,
  };

  // 5. Resume & Documents (Weight: 15%)
  const documentsMissing: string[] = [];
  let documentsScore = 0;

  const hasResume = Boolean(
    student.resumeUrl?.trim() ||
    student.documents?.some((doc) => doc.type === 'RESUME')
  );

  if (hasResume) {
    documentsScore += 10;
  } else {
    documentsMissing.push('Upload Primary Resume');
  }

  const hasCertOrAdditional = (student.certifications?.length || 0) > 0 || (student.documents?.length || 0) > 1;
  if (hasCertOrAdditional) {
    documentsScore += 5;
  } else {
    documentsMissing.push('Add Certifications or Supporting Documents');
  }

  const documentsSection: SectionCompletion = {
    percentage: Math.round((documentsScore / 15) * 100),
    weight: 15,
    isComplete: documentsMissing.length === 0,
    missingFields: documentsMissing,
  };

  // Total Score
  const totalScore = Math.min(100, Math.max(0, personalScore + academicScore + skillsScore + careerScore + documentsScore));

  // Build actionable recommendations
  if (!hasResume) {
    recommendations.push('Upload your placement resume to apply for open campus drives.');
  }
  if (skillCount < 3) {
    recommendations.push('Add your key programming languages, tools, and technical skills.');
  }
  if (!student.phone || !student.address) {
    recommendations.push('Complete your contact and address details for communication.');
  }
  if (!hasOnlineProfile) {
    recommendations.push('Add your LinkedIn or GitHub profile link to stand out to recruiters.');
  }
  if (academicRecordsCount === 0) {
    recommendations.push('Add your 10th, 12th, or undergraduate percentage records for eligibility verification.');
  }

  // Aggregate missing items
  if (personalMissing.length > 0) missingItems.push(...personalMissing.map(m => `Personal: ${m}`));
  if (academicMissing.length > 0) missingItems.push(...academicMissing.map(m => `Academic: ${m}`));
  if (skillsMissing.length > 0) missingItems.push(...skillsMissing.map(m => `Skills: ${m}`));
  if (careerMissing.length > 0) missingItems.push(...careerMissing.map(m => `Career: ${m}`));
  if (documentsMissing.length > 0) missingItems.push(...documentsMissing.map(m => `Documents: ${m}`));

  return {
    score: totalScore,
    sections: {
      personal: personalSection,
      academic: academicSection,
      skills: skillsSection,
      career: careerSection,
      documents: documentsSection,
    },
    missingItems,
    recommendations,
  };
}
