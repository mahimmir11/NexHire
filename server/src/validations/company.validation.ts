import { CompanyVerificationStatus, RecruiterAccountStatus } from '@prisma/client';
import { ValidationErrorItem, isValidUrl } from './student.validation.js';

export function validateCompanyProfileUpdate(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (data.name !== undefined) {
    const nameStr = String(data.name).trim();
    if (nameStr.length < 2 || nameStr.length > 150) {
      errors.push({ field: 'name', message: 'Company name must be between 2 and 150 characters.' });
    }
  }

  if (data.industry !== undefined) {
    const indStr = String(data.industry).trim();
    if (indStr.length < 2 || indStr.length > 100) {
      errors.push({ field: 'industry', message: 'Industry specification must be between 2 and 100 characters.' });
    }
  }

  if (data.website !== undefined && data.website !== null && String(data.website).trim() !== '') {
    const webStr = String(data.website).trim();
    if (!isValidUrl(webStr)) {
      errors.push({ field: 'website', message: 'Company website must be a valid HTTP or HTTPS URL.' });
    }
  }

  if (data.description !== undefined) {
    const descStr = String(data.description).trim();
    if (descStr.length < 10) {
      errors.push({ field: 'description', message: 'Company description must be at least 10 characters long.' });
    }
  }

  if (data.headquarters !== undefined) {
    const hqStr = String(data.headquarters).trim();
    if (hqStr.length < 2 || hqStr.length > 150) {
      errors.push({ field: 'headquarters', message: 'Headquarters location must be between 2 and 150 characters.' });
    }
  }

  if (data.contactEmail !== undefined) {
    const emailStr = String(data.contactEmail).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      errors.push({ field: 'contactEmail', message: 'Please provide a valid corporate contact email address.' });
    }
  }

  if (data.contactPhone !== undefined && data.contactPhone !== null && String(data.contactPhone).trim() !== '') {
    const phoneStr = String(data.contactPhone).trim();
    if (!/^[+]?[\d\s-]{7,20}$/.test(phoneStr)) {
      errors.push({ field: 'contactPhone', message: 'Please provide a valid phone number (7-20 digits).' });
    }
  }

  if (data.logoUrl !== undefined && data.logoUrl !== null && String(data.logoUrl).trim() !== '') {
    const logoStr = String(data.logoUrl).trim();
    if (!logoStr.startsWith('/uploads/') && !isValidUrl(logoStr)) {
      errors.push({ field: 'logoUrl', message: 'Logo URL must be a valid HTTP/HTTPS URL or an uploaded path.' });
    }
  }

  return errors;
}

export function validateRecruiterCreation(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (!data.fullName || String(data.fullName).trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Recruiter full name is required (minimum 2 characters).' });
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email).trim())) {
    errors.push({ field: 'email', message: 'A valid professional email address is required.' });
  }

  if (!data.designation || String(data.designation).trim().length < 2) {
    errors.push({ field: 'designation', message: 'Job designation / role is required (minimum 2 characters).' });
  }

  if (data.phone !== undefined && data.phone !== null && String(data.phone).trim() !== '') {
    const phoneStr = String(data.phone).trim();
    if (!/^[+]?[\d\s-]{7,20}$/.test(phoneStr)) {
      errors.push({ field: 'phone', message: 'Please provide a valid phone number format.' });
    }
  }

  if (data.accountStatus && !Object.values(RecruiterAccountStatus).includes(data.accountStatus as RecruiterAccountStatus)) {
    errors.push({ field: 'accountStatus', message: `Invalid account status. Allowed: ${Object.values(RecruiterAccountStatus).join(', ')}` });
  }

  if (data.password !== undefined && data.password !== null && String(data.password).length > 0) {
    if (String(data.password).length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long.' });
    }
  }

  return errors;
}

export function validateRecruiterUpdate(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (data.fullName !== undefined && String(data.fullName).trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Recruiter full name must be at least 2 characters.' });
  }

  if (data.designation !== undefined && String(data.designation).trim().length < 2) {
    errors.push({ field: 'designation', message: 'Designation must be at least 2 characters.' });
  }

  if (data.phone !== undefined && data.phone !== null && String(data.phone).trim() !== '') {
    const phoneStr = String(data.phone).trim();
    if (!/^[+]?[\d\s-]{7,20}$/.test(phoneStr)) {
      errors.push({ field: 'phone', message: 'Please provide a valid phone number format.' });
    }
  }

  if (data.accountStatus !== undefined && !Object.values(RecruiterAccountStatus).includes(data.accountStatus as RecruiterAccountStatus)) {
    errors.push({ field: 'accountStatus', message: `Invalid account status. Allowed: ${Object.values(RecruiterAccountStatus).join(', ')}` });
  }

  return errors;
}

export function validateCompanyVerification(data: Record<string, unknown>): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (!data.status || !Object.values(CompanyVerificationStatus).includes(data.status as CompanyVerificationStatus)) {
    errors.push({
      field: 'status',
      message: `Valid verification status is required: ${Object.values(CompanyVerificationStatus).join(', ')}`,
    });
  }

  return errors;
}
