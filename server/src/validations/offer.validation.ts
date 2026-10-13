export interface ValidationError {
  field: string;
  message: string;
}

export interface CreateOfferInput {
  applicationId: number;
  designation: string;
  salary?: number | null;
  stipend?: number | null;
  currency?: string;
  location: string;
  offerDate?: string;
  joiningDate?: string | null;
  acceptanceDeadline?: string | null;
  offerLetterDocumentId?: number | null;
}

export function validateCreateOfferInput(data: any): { errors: ValidationError[]; value?: CreateOfferInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  // applicationId
  const appId = Number(data.applicationId);
  if (!data.applicationId || isNaN(appId) || !Number.isInteger(appId) || appId <= 0) {
    errors.push({ field: 'applicationId', message: 'A valid application ID is required.' });
  }

  // designation
  if (!data.designation || typeof data.designation !== 'string' || data.designation.trim().length === 0) {
    errors.push({ field: 'designation', message: 'Job/internship designation is required.' });
  } else if (data.designation.trim().length > 150) {
    errors.push({ field: 'designation', message: 'Designation cannot exceed 150 characters.' });
  }

  // salary and stipend
  let salaryNum: number | null = null;
  const inputSalary = data.salary !== undefined ? data.salary : data.salaryCtc;
  if (inputSalary !== undefined && inputSalary !== null && inputSalary !== '') {
    salaryNum = Number(inputSalary);
    if (isNaN(salaryNum) || salaryNum < 0) {
      errors.push({ field: 'salary', message: 'Salary must be a non-negative number.' });
      salaryNum = null;
    }
  }

  let stipendNum: number | null = null;
  if (data.stipend !== undefined && data.stipend !== null && data.stipend !== '') {
    stipendNum = Number(data.stipend);
    if (isNaN(stipendNum) || stipendNum < 0) {
      errors.push({ field: 'stipend', message: 'Stipend must be a non-negative number.' });
      stipendNum = null;
    }
  }

  if (salaryNum === null && stipendNum === null) {
    errors.push({ field: 'compensation', message: 'Either a valid salary (CTC) or stipend must be specified.' });
  }

  // location
  if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
    errors.push({ field: 'location', message: 'Work location is required.' });
  } else if (data.location.trim().length > 200) {
    errors.push({ field: 'location', message: 'Location cannot exceed 200 characters.' });
  }

  // currency
  const currency = data.currency ? String(data.currency).trim().toUpperCase() : 'INR';

  // offerDate
  const offerDateObj = data.offerDate ? new Date(data.offerDate) : new Date();
  if (isNaN(offerDateObj.getTime())) {
    errors.push({ field: 'offerDate', message: 'Invalid offer date format.' });
  }

  // joiningDate
  let joiningDateIso: string | null = null;
  if (data.joiningDate) {
    const jd = new Date(data.joiningDate);
    if (isNaN(jd.getTime())) {
      errors.push({ field: 'joiningDate', message: 'Invalid joining date format.' });
    } else {
      if (offerDateObj && jd < new Date(offerDateObj.getFullYear(), offerDateObj.getMonth(), offerDateObj.getDate())) {
        errors.push({ field: 'joiningDate', message: 'Joining date cannot be earlier than offer date.' });
      }
      joiningDateIso = jd.toISOString();
    }
  }

  // acceptanceDeadline
  let deadlineIso: string | null = null;
  const inputDeadline = data.acceptanceDeadline || data.offerExpiryDate;
  if (inputDeadline) {
    const ad = new Date(inputDeadline);
    if (isNaN(ad.getTime())) {
      errors.push({ field: 'acceptanceDeadline', message: 'Invalid acceptance deadline format.' });
    } else {
      deadlineIso = ad.toISOString();
    }
  }

  // offerLetterDocumentId
  let docId: number | null = null;
  if (data.offerLetterDocumentId !== undefined && data.offerLetterDocumentId !== null && data.offerLetterDocumentId !== '') {
    const parsedDocId = Number(data.offerLetterDocumentId);
    if (isNaN(parsedDocId) || !Number.isInteger(parsedDocId) || parsedDocId <= 0) {
      errors.push({ field: 'offerLetterDocumentId', message: 'Offer letter document ID must be a positive integer.' });
    } else {
      docId = parsedDocId;
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      applicationId: appId,
      designation: String(data.designation).trim(),
      salary: salaryNum,
      stipend: stipendNum,
      currency,
      location: String(data.location).trim(),
      offerDate: offerDateObj.toISOString(),
      joiningDate: joiningDateIso,
      acceptanceDeadline: deadlineIso,
      offerLetterDocumentId: docId,
    },
  };
}

export interface StudentOfferResponseInput {
  responseNotes?: string | null;
}

export function validateStudentOfferResponseInput(data: any): { errors: ValidationError[]; value?: StudentOfferResponseInput } {
  const errors: ValidationError[] = [];

  const rawNotes = data && typeof data === 'object' ? (data.responseNotes !== undefined ? data.responseNotes : data.notes) : undefined;
  if (rawNotes !== undefined && rawNotes !== null) {
    if (typeof rawNotes !== 'string') {
      errors.push({ field: 'responseNotes', message: 'Response notes must be a string.' });
    } else if (rawNotes.trim().length > 1000) {
      errors.push({ field: 'responseNotes', message: 'Response notes cannot exceed 1000 characters.' });
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      responseNotes: rawNotes ? String(rawNotes).trim() : null,
    },
  };
}

export interface UpdateOfferInput {
  designation?: string;
  salary?: number | null;
  stipend?: number | null;
  currency?: string;
  location?: string;
  joiningDate?: string | null;
  acceptanceDeadline?: string | null;
  offerLetterDocumentId?: number | null;
}

export function validateUpdateOfferInput(data: any): { errors: ValidationError[]; value?: UpdateOfferInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  const value: UpdateOfferInput = {};

  if (data.designation !== undefined) {
    if (typeof data.designation !== 'string' || data.designation.trim().length === 0) {
      errors.push({ field: 'designation', message: 'Designation cannot be empty.' });
    } else if (data.designation.trim().length > 150) {
      errors.push({ field: 'designation', message: 'Designation cannot exceed 150 characters.' });
    } else {
      value.designation = data.designation.trim();
    }
  }

  if (data.salary !== undefined) {
    if (data.salary === null || data.salary === '') {
      value.salary = null;
    } else {
      const s = Number(data.salary);
      if (isNaN(s) || s < 0) {
        errors.push({ field: 'salary', message: 'Salary must be a non-negative number.' });
      } else {
        value.salary = s;
      }
    }
  }

  if (data.stipend !== undefined) {
    if (data.stipend === null || data.stipend === '') {
      value.stipend = null;
    } else {
      const st = Number(data.stipend);
      if (isNaN(st) || st < 0) {
        errors.push({ field: 'stipend', message: 'Stipend must be a non-negative number.' });
      } else {
        value.stipend = st;
      }
    }
  }

  if (data.location !== undefined) {
    if (typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push({ field: 'location', message: 'Location cannot be empty.' });
    } else if (data.location.trim().length > 200) {
      errors.push({ field: 'location', message: 'Location cannot exceed 200 characters.' });
    } else {
      value.location = data.location.trim();
    }
  }

  if (data.currency !== undefined) {
    value.currency = String(data.currency).trim().toUpperCase();
  }

  if (data.joiningDate !== undefined) {
    if (data.joiningDate === null || data.joiningDate === '') {
      value.joiningDate = null;
    } else {
      const jd = new Date(data.joiningDate);
      if (isNaN(jd.getTime())) {
        errors.push({ field: 'joiningDate', message: 'Invalid joining date format.' });
      } else {
        value.joiningDate = jd.toISOString();
      }
    }
  }

  if (data.acceptanceDeadline !== undefined) {
    if (data.acceptanceDeadline === null || data.acceptanceDeadline === '') {
      value.acceptanceDeadline = null;
    } else {
      const ad = new Date(data.acceptanceDeadline);
      if (isNaN(ad.getTime())) {
        errors.push({ field: 'acceptanceDeadline', message: 'Invalid acceptance deadline format.' });
      } else {
        value.acceptanceDeadline = ad.toISOString();
      }
    }
  }

  if (data.offerLetterDocumentId !== undefined) {
    if (data.offerLetterDocumentId === null || data.offerLetterDocumentId === '') {
      value.offerLetterDocumentId = null;
    } else {
      const docId = Number(data.offerLetterDocumentId);
      if (isNaN(docId) || !Number.isInteger(docId) || docId <= 0) {
        errors.push({ field: 'offerLetterDocumentId', message: 'Document ID must be a positive integer.' });
      } else {
        value.offerLetterDocumentId = docId;
      }
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { errors: [], value };
}
