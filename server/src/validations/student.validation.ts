import { Gender, AcademicLevel, SkillCategory, SkillProficiency, DocumentType } from '@prisma/client';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export function isValidUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validatePersonalProfile(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    const phoneStr = String(data.phone).trim();
    if (!/^[+]?[\d\s-]{7,20}$/.test(phoneStr)) {
      errors.push({ field: 'phone', message: 'Invalid phone number format. Please provide a valid phone number.' });
    }
  }

  if (data.dateOfBirth !== undefined && data.dateOfBirth !== null && data.dateOfBirth !== '') {
    const dob = new Date(String(data.dateOfBirth));
    if (isNaN(dob.getTime())) {
      errors.push({ field: 'dateOfBirth', message: 'Invalid date format for Date of Birth.' });
    } else {
      const now = new Date();
      if (dob >= now) {
        errors.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future.' });
      }
      const ageInYears = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageInYears < 14 || ageInYears > 80) {
        errors.push({ field: 'dateOfBirth', message: 'Please enter a valid realistic date of birth.' });
      }
    }
  }

  if (data.gender !== undefined && data.gender !== null && data.gender !== '') {
    const validGenders = Object.values(Gender);
    if (!validGenders.includes(data.gender as Gender)) {
      errors.push({ field: 'gender', message: `Invalid gender option. Allowed: ${validGenders.join(', ')}` });
    }
  }

  if (data.pincode !== undefined && data.pincode !== null && data.pincode !== '') {
    const pincodeStr = String(data.pincode).trim();
    if (!/^[a-zA-Z0-9\s-]{3,12}$/.test(pincodeStr)) {
      errors.push({ field: 'pincode', message: 'Invalid postal / PIN code format.' });
    }
  }

  return errors;
}

export function validateAcademicInfo(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (data.semester !== undefined && data.semester !== null) {
    const sem = Number(data.semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 12) {
      errors.push({ field: 'semester', message: 'Semester must be an integer between 1 and 12.' });
    }
  }

  if (data.graduationYear !== undefined && data.graduationYear !== null) {
    const grad = Number(data.graduationYear);
    if (!Number.isInteger(grad) || grad < 2000 || grad > 2100) {
      errors.push({ field: 'graduationYear', message: 'Graduation year must be between 2000 and 2100.' });
    }
  }

  if (data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '') {
    const cgpaNum = Number(data.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10.0) {
      errors.push({ field: 'cgpa', message: 'CGPA must be a valid number between 0.00 and 10.00.' });
    }
  }

  if (data.percentage !== undefined && data.percentage !== null && data.percentage !== '') {
    const pctNum = Number(data.percentage);
    if (isNaN(pctNum) || pctNum < 0 || pctNum > 100.0) {
      errors.push({ field: 'percentage', message: 'Percentage must be a valid number between 0.00 and 100.00.' });
    }
  }

  if (data.backlogs !== undefined && data.backlogs !== null) {
    const bl = Number(data.backlogs);
    if (!Number.isInteger(bl) || bl < 0 || bl > 50) {
      errors.push({ field: 'backlogs', message: 'Backlogs count cannot be negative.' });
    }
  }

  return errors;
}

export function validateAcademicRecord(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (!data.level || !Object.values(AcademicLevel).includes(data.level as AcademicLevel)) {
    errors.push({ field: 'level', message: 'Valid academic level is required (e.g. CLASS_10, CLASS_12, UNDERGRADUATE, SEMESTER).' });
  }

  if (!data.institution || String(data.institution).trim().length < 2) {
    errors.push({ field: 'institution', message: 'Institution name is required (minimum 2 characters).' });
  }

  if (!data.passingYear) {
    errors.push({ field: 'passingYear', message: 'Passing year is required.' });
  } else {
    const year = Number(data.passingYear);
    if (isNaN(year) || year < 1990 || year > 2100) {
      errors.push({ field: 'passingYear', message: 'Passing year must be between 1990 and 2100.' });
    }
  }

  if (data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '') {
    const val = Number(data.cgpa);
    if (isNaN(val) || val < 0 || val > 10.0) {
      errors.push({ field: 'cgpa', message: 'CGPA must be between 0.00 and 10.00.' });
    }
  }

  if (data.percentage !== undefined && data.percentage !== null && data.percentage !== '') {
    const val = Number(data.percentage);
    if (isNaN(val) || val < 0 || val > 100.0) {
      errors.push({ field: 'percentage', message: 'Percentage must be between 0.00 and 100.00.' });
    }
  }

  if (data.backlogsCount !== undefined && data.backlogsCount !== null) {
    const bl = Number(data.backlogsCount);
    if (isNaN(bl) || bl < 0) {
      errors.push({ field: 'backlogsCount', message: 'Backlogs count cannot be negative.' });
    }
  }

  return errors;
}

export function validateSkillInput(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (!data.skillId && (!data.name || String(data.name).trim().length < 1)) {
    errors.push({ field: 'name', message: 'Skill name or existing skill ID is required.' });
  }

  if (data.category && !Object.values(SkillCategory).includes(data.category as SkillCategory)) {
    errors.push({ field: 'category', message: `Invalid skill category. Allowed: ${Object.values(SkillCategory).join(', ')}` });
  }

  if (data.proficiency && !Object.values(SkillProficiency).includes(data.proficiency as SkillProficiency)) {
    errors.push({ field: 'proficiency', message: `Invalid skill proficiency. Allowed: ${Object.values(SkillProficiency).join(', ')}` });
  }

  if (data.yearsOfExperience !== undefined && data.yearsOfExperience !== null && data.yearsOfExperience !== '') {
    const exp = Number(data.yearsOfExperience);
    if (isNaN(exp) || exp < 0 || exp > 50) {
      errors.push({ field: 'yearsOfExperience', message: 'Years of experience must be between 0 and 50.' });
    }
  }

  return errors;
}

export function validateCertification(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (!data.name || String(data.name).trim().length < 2) {
    errors.push({ field: 'name', message: 'Certification title is required (minimum 2 characters).' });
  }

  if (!data.issuingOrganization || String(data.issuingOrganization).trim().length < 2) {
    errors.push({ field: 'issuingOrganization', message: 'Issuing organization is required (minimum 2 characters).' });
  }

  if (!data.issueDate) {
    errors.push({ field: 'issueDate', message: 'Issue date is required.' });
  } else {
    const issueDt = new Date(String(data.issueDate));
    if (isNaN(issueDt.getTime())) {
      errors.push({ field: 'issueDate', message: 'Invalid issue date format.' });
    } else if (issueDt > new Date()) {
      errors.push({ field: 'issueDate', message: 'Issue date cannot be in the future.' });
    }
  }

  if (data.expiryDate) {
    const expiryDt = new Date(String(data.expiryDate));
    if (isNaN(expiryDt.getTime())) {
      errors.push({ field: 'expiryDate', message: 'Invalid expiry date format.' });
    } else if (data.issueDate) {
      const issueDt = new Date(String(data.issueDate));
      if (!isNaN(issueDt.getTime()) && expiryDt < issueDt) {
        errors.push({ field: 'expiryDate', message: 'Expiry date cannot be earlier than the issue date.' });
      }
    }
  }

  if (data.credentialUrl && String(data.credentialUrl).trim().length > 0) {
    if (!isValidUrl(String(data.credentialUrl).trim())) {
      errors.push({ field: 'credentialUrl', message: 'Credential URL must be a valid HTTP or HTTPS URL.' });
    }
  }

  return errors;
}

export function validateCareerInfo(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (data.portfolioUrl && String(data.portfolioUrl).trim().length > 0) {
    if (!isValidUrl(String(data.portfolioUrl).trim())) {
      errors.push({ field: 'portfolioUrl', message: 'Portfolio URL must be a valid HTTP or HTTPS URL.' });
    }
  }

  if (data.githubUrl && String(data.githubUrl).trim().length > 0) {
    if (!isValidUrl(String(data.githubUrl).trim())) {
      errors.push({ field: 'githubUrl', message: 'GitHub URL must be a valid HTTP or HTTPS URL.' });
    }
  }

  if (data.linkedinUrl && String(data.linkedinUrl).trim().length > 0) {
    if (!isValidUrl(String(data.linkedinUrl).trim())) {
      errors.push({ field: 'linkedinUrl', message: 'LinkedIn URL must be a valid HTTP or HTTPS URL.' });
    }
  }

  return errors;
}

export function validateDocumentMetadata(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (!data.type || !Object.values(DocumentType).includes(data.type as DocumentType)) {
    errors.push({ field: 'type', message: `Valid document type is required: ${Object.values(DocumentType).join(', ')}` });
  }

  if (!data.title || String(data.title).trim().length < 2) {
    errors.push({ field: 'title', message: 'Document title is required (minimum 2 characters).' });
  }

  return errors;
}
