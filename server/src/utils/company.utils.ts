export interface CompanyProfileCompletion {
  score: number;
  sections: {
    identity: { isComplete: boolean; weight: number; percentage: number; missingFields: string[] };
    presence: { isComplete: boolean; weight: number; percentage: number; missingFields: string[] };
    contact: { isComplete: boolean; weight: number; percentage: number; missingFields: string[] };
  };
  missingFields: string[];
  recommendations: string[];
}

export interface CompanyWithRelations {
  name: string;
  logoUrl?: string | null;
  industry: string;
  website?: string | null;
  description: string;
  headquarters: string;
  locations?: string | null;
  companySize?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
}

export function calculateCompanyProfileCompletion(company: CompanyWithRelations): CompanyProfileCompletion {
  let identityScore = 0;
  const identityMissing: string[] = [];

  if (company.name?.trim()) identityScore += 10;
  else identityMissing.push('Company Legal Name');

  if (company.industry?.trim()) identityScore += 10;
  else identityMissing.push('Industry / Sector');

  if (company.logoUrl?.trim()) identityScore += 15;
  else identityMissing.push('Company Brand Logo');

  if (company.description?.trim() && company.description.length >= 20) identityScore += 15;
  else identityMissing.push('Detailed Company Description');

  const identitySection = {
    isComplete: identityMissing.length === 0,
    weight: 50,
    percentage: Math.round((identityScore / 50) * 100),
    missingFields: identityMissing,
  };

  let presenceScore = 0;
  const presenceMissing: string[] = [];

  if (company.website?.trim()) presenceScore += 10;
  else presenceMissing.push('Corporate Website URL');

  if (company.headquarters?.trim()) presenceScore += 10;
  else presenceMissing.push('Corporate Headquarters');

  if (company.locations?.trim()) presenceScore += 5;
  else presenceMissing.push('Operational Locations / Offices');

  if (company.companySize?.trim()) presenceScore += 5;
  else presenceMissing.push('Company Employee Size Range');

  const presenceSection = {
    isComplete: presenceMissing.length === 0,
    weight: 30,
    percentage: Math.round((presenceScore / 30) * 100),
    missingFields: presenceMissing,
  };

  let contactScore = 0;
  const contactMissing: string[] = [];

  if (company.contactEmail?.trim()) contactScore += 10;
  else contactMissing.push('Campus Hiring Contact Email');

  if (company.contactPhone?.trim()) contactScore += 10;
  else contactMissing.push('Talent Acquisition Phone Number');

  const contactSection = {
    isComplete: contactMissing.length === 0,
    weight: 20,
    percentage: Math.round((contactScore / 20) * 100),
    missingFields: contactMissing,
  };

  const totalScore = identityScore + presenceScore + contactScore;
  const missingFields = [...identityMissing, ...presenceMissing, ...contactMissing];
  const recommendations: string[] = [];

  if (!company.logoUrl) {
    recommendations.push('Upload your company brand logo to increase brand recognition among graduating students.');
  }
  if (!company.website) {
    recommendations.push('Add your official company website so students can research corporate culture.');
  }
  if (!company.description || company.description.length < 20) {
    recommendations.push('Provide a rich company description detailing vision, technology stack, and career growth.');
  }
  if (!company.contactPhone) {
    recommendations.push('Add a direct campus recruitment contact phone number for placement cell coordination.');
  }

  return {
    score: totalScore,
    sections: {
      identity: identitySection,
      presence: presenceSection,
      contact: contactSection,
    },
    missingFields,
    recommendations,
  };
}
