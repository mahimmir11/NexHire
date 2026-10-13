import { PlacementStatus, PlacementType } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
}

export interface CreatePlacementInput {
  applicationId: number;
  offerId?: number | null;
  packageAmount: number;
  currency?: string;
  designation: string;
  location?: string | null;
  placementDate?: string;
  joiningDate?: string | null;
  placementType?: PlacementType;
  status?: PlacementStatus;
  notes?: string | null;
}

export interface UpdatePlacementInput {
  packageAmount?: number;
  currency?: string;
  designation?: string;
  location?: string | null;
  joiningDate?: string | null;
  placementType?: PlacementType;
  notes?: string | null;
}

export interface UpdatePlacementStatusInput {
  status: PlacementStatus;
  notes?: string | null;
}

export function validateCreatePlacementInput(data: any): { errors: ValidationError[]; value?: CreatePlacementInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  // applicationId
  const appId = Number(data.applicationId);
  if (!data.applicationId || isNaN(appId) || !Number.isInteger(appId) || appId <= 0) {
    errors.push({ field: 'applicationId', message: 'A valid application ID is required.' });
  }

  // offerId (optional)
  let offerIdNum: number | null = null;
  if (data.offerId !== undefined && data.offerId !== null && data.offerId !== '') {
    offerIdNum = Number(data.offerId);
    if (isNaN(offerIdNum) || !Number.isInteger(offerIdNum) || offerIdNum <= 0) {
      errors.push({ field: 'offerId', message: 'Offer ID must be a positive integer.' });
      offerIdNum = null;
    }
  }

  // packageAmount
  const pkg = Number(data.packageAmount);
  if (data.packageAmount === undefined || data.packageAmount === null || isNaN(pkg) || pkg <= 0) {
    errors.push({ field: 'packageAmount', message: 'A valid positive package amount (CTC in INR) is required.' });
  }

  // designation / jobTitle
  const rawDesignation = data.designation || data.jobTitle;
  if (!rawDesignation || typeof rawDesignation !== 'string' || rawDesignation.trim().length === 0) {
    errors.push({ field: 'designation', message: 'Job designation/title is required.' });
  } else if (rawDesignation.trim().length > 150) {
    errors.push({ field: 'designation', message: 'Designation cannot exceed 150 characters.' });
  }

  // location (optional)
  let locationStr: string | null = null;
  if (data.location !== undefined && data.location !== null) {
    locationStr = String(data.location).trim();
    if (locationStr.length > 255) {
      errors.push({ field: 'location', message: 'Location cannot exceed 255 characters.' });
    }
  }

  // placementDate
  let placementDateStr: string | undefined = undefined;
  if (data.placementDate) {
    const d = new Date(data.placementDate);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'placementDate', message: 'Invalid placement date format.' });
    } else {
      placementDateStr = d.toISOString();
    }
  }

  // joiningDate
  let joiningDateStr: string | null = null;
  if (data.joiningDate) {
    const jd = new Date(data.joiningDate);
    if (isNaN(jd.getTime())) {
      errors.push({ field: 'joiningDate', message: 'Invalid joining date format.' });
    } else {
      joiningDateStr = jd.toISOString();
    }
  }

  // placementType
  let placementTypeVal: PlacementType = PlacementType.ON_CAMPUS;
  if (data.placementType) {
    if (!Object.values(PlacementType).includes(data.placementType)) {
      errors.push({
        field: 'placementType',
        message: `Invalid placement type. Must be one of: ${Object.values(PlacementType).join(', ')}`,
      });
    } else {
      placementTypeVal = data.placementType;
    }
  }

  // status
  let statusVal: PlacementStatus = PlacementStatus.CONFIRMED;
  if (data.status) {
    if (!Object.values(PlacementStatus).includes(data.status)) {
      errors.push({
        field: 'status',
        message: `Invalid placement status. Must be one of: ${Object.values(PlacementStatus).join(', ')}`,
      });
    } else {
      statusVal = data.status;
    }
  }

  // notes
  let notesStr: string | null = null;
  if (data.notes !== undefined && data.notes !== null) {
    notesStr = String(data.notes).trim();
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      applicationId: appId,
      offerId: offerIdNum,
      packageAmount: pkg,
      currency: data.currency ? String(data.currency).trim().toUpperCase() : 'INR',
      designation: rawDesignation.trim(),
      location: locationStr,
      placementDate: placementDateStr,
      joiningDate: joiningDateStr,
      placementType: placementTypeVal,
      status: statusVal,
      notes: notesStr,
    },
  };
}

export function validateUpdatePlacementInput(data: any): { errors: ValidationError[]; value?: UpdatePlacementInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  const value: UpdatePlacementInput = {};

  if (data.packageAmount !== undefined) {
    const pkg = Number(data.packageAmount);
    if (isNaN(pkg) || pkg <= 0) {
      errors.push({ field: 'packageAmount', message: 'Package amount must be a positive number.' });
    } else {
      value.packageAmount = pkg;
    }
  }

  if (data.currency !== undefined) {
    value.currency = String(data.currency).trim().toUpperCase();
  }

  if (data.designation !== undefined) {
    if (typeof data.designation !== 'string' || data.designation.trim().length === 0) {
      errors.push({ field: 'designation', message: 'Designation cannot be empty.' });
    } else if (data.designation.trim().length > 150) {
      errors.push({ field: 'designation', message: 'Designation cannot exceed 150 characters.' });
    } else {
      value.designation = data.designation.trim();
    }
  }

  if (data.location !== undefined) {
    value.location = data.location ? String(data.location).trim() : null;
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

  if (data.placementType !== undefined) {
    if (!Object.values(PlacementType).includes(data.placementType)) {
      errors.push({
        field: 'placementType',
        message: `Invalid placement type. Must be one of: ${Object.values(PlacementType).join(', ')}`,
      });
    } else {
      value.placementType = data.placementType;
    }
  }

  if (data.notes !== undefined) {
    value.notes = data.notes ? String(data.notes).trim() : null;
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { errors: [], value };
}

export function validateUpdatePlacementStatusInput(data: any): {
  errors: ValidationError[];
  value?: UpdatePlacementStatusInput;
} {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  if (!data.status || !Object.values(PlacementStatus).includes(data.status)) {
    errors.push({
      field: 'status',
      message: `Invalid placement status. Must be one of: ${Object.values(PlacementStatus).join(', ')}`,
    });
  }

  const notesStr = data.notes !== undefined && data.notes !== null ? String(data.notes).trim() : null;

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      status: data.status,
      notes: notesStr,
    },
  };
}
