import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database.js';
import { calculateProfileCompletion } from '../utils/student.utils.js';
import { storageService } from '../services/storage.service.js';
import {
  validatePersonalProfile,
  validateAcademicInfo,
  validateAcademicRecord,
  validateSkillInput,
  validateCertification,
  validateCareerInfo,
  validateDocumentMetadata,
} from '../validations/student.validation.js';
import { SkillCategory, SkillProficiency, DocumentType, AcademicLevel, Gender, AcademicStatus } from '@prisma/client';

/**
 * Helper: Retrieve the authenticated student record based on req.user.id.
 * Enforces strict multi-tenant isolation.
 */
async function getAuthenticatedStudent(userId: number) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      department: {
        select: { id: true, name: true, code: true },
      },
    },
  });
}

// ==========================================
// 1. PROFILE MANAGEMENT (PERSONAL INFO)
// ==========================================

export async function getStudentProfile(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    // Load relations for completion calculation
    const studentWithRelations = await prisma.student.findUnique({
      where: { id: student.id },
      include: {
        academicRecords: true,
        skills: { include: { skill: true } },
        documents: true,
        certifications: true,
      },
    });

    const completion = studentWithRelations ? calculateProfileCompletion(studentWithRelations) : null;

    res.json({
      success: true,
      data: {
        id: student.id,
        userId: student.userId,
        email: student.user.email,
        fullName: student.fullName,
        profilePhoto: student.profilePhoto,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        address: student.address,
        city: student.city,
        state: student.state,
        country: student.country,
        pincode: student.pincode,
        studentId: student.studentId,
        enrollmentNumber: student.enrollmentNumber,
        department: student.department,
        academicStatus: student.academicStatus,
        isPlacementEligible: student.isPlacementEligible,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        completion,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student profile.' });
  }
}

export async function updateStudentProfile(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const errors = validatePersonalProfile(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const {
      fullName,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      country,
      pincode,
      profilePhoto,
    } = req.body;

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(fullName ? { fullName: String(fullName).trim() } : {}),
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender ? (gender as Gender) : undefined,
        address: address !== undefined ? (address ? String(address).trim() : null) : undefined,
        city: city !== undefined ? (city ? String(city).trim() : null) : undefined,
        state: state !== undefined ? (state ? String(state).trim() : null) : undefined,
        country: country !== undefined ? (country ? String(country).trim() : 'India') : undefined,
        pincode: pincode !== undefined ? (pincode ? String(pincode).trim() : null) : undefined,
        profilePhoto: profilePhoto !== undefined ? (profilePhoto ? String(profilePhoto).trim() : null) : undefined,
      },
      include: {
        department: true,
      },
    });

    res.json({
      success: true,
      message: 'Personal profile updated successfully.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update student profile.' });
  }
}

// ==========================================
// 2. ACADEMIC INFORMATION
// ==========================================

export async function getAcademicInfo(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const records = await prisma.studentAcademicRecord.findMany({
      where: { studentId: student.id },
      orderBy: [{ level: 'asc' }, { passingYear: 'desc' }],
    });

    res.json({
      success: true,
      data: {
        studentId: student.studentId,
        enrollmentNumber: student.enrollmentNumber,
        course: student.course,
        program: student.program,
        department: student.department,
        semester: student.semester,
        graduationYear: student.graduationYear,
        cgpa: student.cgpa ? Number(student.cgpa) : null,
        percentage: student.percentage ? Number(student.percentage) : null,
        backlogs: student.backlogs,
        academicStatus: student.academicStatus,
        isPlacementEligible: student.isPlacementEligible,
        academicRecords: records,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching academic info:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve academic information.' });
  }
}

export async function updateAcademicInfo(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const errors = validateAcademicInfo(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const { course, program, semester, graduationYear, cgpa, percentage, backlogs } = req.body;

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(course ? { course: String(course).trim() } : {}),
        ...(program ? { program: String(program).trim() } : {}),
        ...(semester !== undefined ? { semester: Number(semester) } : {}),
        ...(graduationYear !== undefined ? { graduationYear: Number(graduationYear) } : {}),
        ...(cgpa !== undefined ? { cgpa: cgpa !== null && cgpa !== '' ? Number(cgpa) : null } : {}),
        ...(percentage !== undefined ? { percentage: percentage !== null && percentage !== '' ? Number(percentage) : null } : {}),
        ...(backlogs !== undefined ? { backlogs: Number(backlogs) } : {}),
      },
      include: {
        department: true,
      },
    });

    res.json({
      success: true,
      message: 'Academic details updated successfully.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating academic info:', error);
    res.status(500).json({ success: false, message: 'Failed to update academic information.' });
  }
}

export async function createAcademicRecord(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const errors = validateAcademicRecord(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const {
      level,
      semesterNumber,
      institution,
      boardOrUniv,
      passingYear,
      cgpa,
      percentage,
      marksObtained,
      totalMarks,
      backlogsCount,
      marksheetUrl,
    } = req.body;

    const record = await prisma.studentAcademicRecord.create({
      data: {
        studentId: student.id,
        level: level as AcademicLevel,
        semesterNumber: semesterNumber ? Number(semesterNumber) : null,
        institution: String(institution).trim(),
        boardOrUniv: boardOrUniv ? String(boardOrUniv).trim() : null,
        passingYear: Number(passingYear),
        cgpa: cgpa !== undefined && cgpa !== null && cgpa !== '' ? Number(cgpa) : null,
        percentage: percentage !== undefined && percentage !== null && percentage !== '' ? Number(percentage) : null,
        marksObtained: marksObtained !== undefined && marksObtained !== null && marksObtained !== '' ? Number(marksObtained) : null,
        totalMarks: totalMarks !== undefined && totalMarks !== null && totalMarks !== '' ? Number(totalMarks) : null,
        backlogsCount: backlogsCount !== undefined ? Number(backlogsCount) : 0,
        marksheetUrl: marksheetUrl ? String(marksheetUrl).trim() : null,
        isVerified: false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Academic milestone record added successfully.',
      data: record,
    });
  } catch (error: unknown) {
    console.error('Error creating academic record:', error);
    res.status(500).json({ success: false, message: 'Failed to create academic record.' });
  }
}

export async function deleteAcademicRecord(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const recordId = parseInt(String(req.params.id), 10);
    if (isNaN(recordId)) {
      res.status(400).json({ success: false, message: 'Invalid academic record ID.' });
      return;
    }

    // Verify ownership
    const record = await prisma.studentAcademicRecord.findFirst({
      where: { id: recordId, studentId: student.id },
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Academic record not found or access denied.' });
      return;
    }

    if (record.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Cannot delete an academic record that has already been verified by the placement administration.',
      });
      return;
    }

    await prisma.studentAcademicRecord.delete({ where: { id: recordId } });

    res.json({ success: true, message: 'Academic record deleted successfully.' });
  } catch (error: unknown) {
    console.error('Error deleting academic record:', error);
    res.status(500).json({ success: false, message: 'Failed to delete academic record.' });
  }
}

// ==========================================
// 3. SKILLS MANAGEMENT
// ==========================================

export async function getStudentSkills(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const [studentSkills, catalogSkills] = await Promise.all([
      prisma.studentSkill.findMany({
        where: { studentId: student.id },
        include: { skill: true },
        orderBy: { skill: { name: 'asc' } },
      }),
      prisma.skill.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        skills: studentSkills.map((ss) => ({
          id: ss.id,
          skillId: ss.skillId,
          name: ss.skill.name,
          category: ss.skill.category,
          proficiency: ss.proficiency,
          yearsOfExperience: ss.yearsOfExperience ? Number(ss.yearsOfExperience) : null,
          createdAt: ss.createdAt,
        })),
        catalog: catalogSkills,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching student skills:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve skills.' });
  }
}

export async function addStudentSkill(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const errors = validateSkillInput(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const { skillId, name, category, proficiency, yearsOfExperience } = req.body;

    let targetSkillId: number;

    if (skillId) {
      const existing = await prisma.skill.findUnique({ where: { id: Number(skillId) } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Selected catalog skill does not exist.' });
        return;
      }
      targetSkillId = existing.id;
    } else {
      // Find or create skill in catalog
      const cleanName = String(name).trim();
      const existingSkill = await prisma.skill.findUnique({ where: { name: cleanName } });

      if (existingSkill) {
        targetSkillId = existingSkill.id;
      } else {
        const newSkill = await prisma.skill.create({
          data: {
            name: cleanName,
            category: (category as SkillCategory) || SkillCategory.TECHNICAL,
          },
        });
        targetSkillId = newSkill.id;
      }
    }

    // Upsert student skill relation
    const studentSkill = await prisma.studentSkill.upsert({
      where: {
        studentId_skillId: {
          studentId: student.id,
          skillId: targetSkillId,
        },
      },
      update: {
        proficiency: (proficiency as SkillProficiency) || SkillProficiency.BEGINNER,
        yearsOfExperience: yearsOfExperience !== undefined && yearsOfExperience !== '' ? Number(yearsOfExperience) : null,
      },
      create: {
        studentId: student.id,
        skillId: targetSkillId,
        proficiency: (proficiency as SkillProficiency) || SkillProficiency.BEGINNER,
        yearsOfExperience: yearsOfExperience !== undefined && yearsOfExperience !== '' ? Number(yearsOfExperience) : null,
      },
      include: {
        skill: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Skill added/updated successfully.',
      data: {
        id: studentSkill.id,
        skillId: studentSkill.skillId,
        name: studentSkill.skill.name,
        category: studentSkill.skill.category,
        proficiency: studentSkill.proficiency,
        yearsOfExperience: studentSkill.yearsOfExperience ? Number(studentSkill.yearsOfExperience) : null,
      },
    });
  } catch (error: unknown) {
    console.error('Error adding skill:', error);
    res.status(500).json({ success: false, message: 'Failed to add student skill.' });
  }
}

export async function removeStudentSkill(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const skillId = parseInt(String(req.params.skillId), 10);
    if (isNaN(skillId)) {
      res.status(400).json({ success: false, message: 'Invalid skill ID.' });
      return;
    }

    const existing = await prisma.studentSkill.findFirst({
      where: { studentId: student.id, skillId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Skill association not found for this student.' });
      return;
    }

    await prisma.studentSkill.delete({
      where: {
        studentId_skillId: {
          studentId: student.id,
          skillId,
        },
      },
    });

    res.json({ success: true, message: 'Skill removed successfully from your profile.' });
  } catch (error: unknown) {
    console.error('Error removing student skill:', error);
    res.status(500).json({ success: false, message: 'Failed to remove skill.' });
  }
}

// ==========================================
// 4. CERTIFICATIONS MANAGEMENT
// ==========================================

export async function getCertifications(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const certifications = await prisma.certification.findMany({
      where: { studentId: student.id },
      orderBy: { issueDate: 'desc' },
    });

    res.json({
      success: true,
      data: certifications,
    });
  } catch (error: unknown) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve certifications.' });
  }
}

export async function createCertification(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const errors = validateCertification(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const { name, issuingOrganization, issueDate, expiryDate, credentialId, credentialUrl } = req.body;

    const cert = await prisma.certification.create({
      data: {
        studentId: student.id,
        name: String(name).trim(),
        issuingOrganization: String(issuingOrganization).trim(),
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialId: credentialId ? String(credentialId).trim() : null,
        credentialUrl: credentialUrl ? String(credentialUrl).trim() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Certification added successfully.',
      data: cert,
    });
  } catch (error: unknown) {
    console.error('Error creating certification:', error);
    res.status(500).json({ success: false, message: 'Failed to create certification.' });
  }
}

export async function updateCertification(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const certId = parseInt(String(req.params.id), 10);
    if (isNaN(certId)) {
      res.status(400).json({ success: false, message: 'Invalid certification ID.' });
      return;
    }

    // Verify ownership
    const existing = await prisma.certification.findFirst({
      where: { id: certId, studentId: student.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Certification not found or access denied.' });
      return;
    }

    const errors = validateCertification(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const { name, issuingOrganization, issueDate, expiryDate, credentialId, credentialUrl } = req.body;

    const updated = await prisma.certification.update({
      where: { id: certId },
      data: {
        name: String(name).trim(),
        issuingOrganization: String(issuingOrganization).trim(),
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialId: credentialId !== undefined ? (credentialId ? String(credentialId).trim() : null) : undefined,
        credentialUrl: credentialUrl !== undefined ? (credentialUrl ? String(credentialUrl).trim() : null) : undefined,
      },
    });

    res.json({
      success: true,
      message: 'Certification updated successfully.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating certification:', error);
    res.status(500).json({ success: false, message: 'Failed to update certification.' });
  }
}

export async function deleteCertification(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const certId = parseInt(String(req.params.id), 10);
    if (isNaN(certId)) {
      res.status(400).json({ success: false, message: 'Invalid certification ID.' });
      return;
    }

    // Verify ownership
    const existing = await prisma.certification.findFirst({
      where: { id: certId, studentId: student.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Certification not found or access denied.' });
      return;
    }

    await prisma.certification.delete({ where: { id: certId } });

    res.json({ success: true, message: 'Certification removed successfully.' });
  } catch (error: unknown) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete certification.' });
  }
}

// ==========================================
// 5. CAREER INFORMATION
// ==========================================

export async function getCareerInfo(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        resumeUrl: student.resumeUrl,
        portfolioUrl: student.portfolioUrl,
        githubUrl: student.githubUrl,
        linkedinUrl: student.linkedinUrl,
        careerInterests: student.careerInterests,
        preferredRoles: student.preferredRoles,
        preferredLocations: student.preferredLocations,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching career info:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve career information.' });
  }
}

export async function updateCareerInfo(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const errors = validateCareerInfo(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const {
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      careerInterests,
      preferredRoles,
      preferredLocations,
      resumeUrl,
    } = req.body;

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        portfolioUrl: portfolioUrl !== undefined ? (portfolioUrl ? String(portfolioUrl).trim() : null) : undefined,
        githubUrl: githubUrl !== undefined ? (githubUrl ? String(githubUrl).trim() : null) : undefined,
        linkedinUrl: linkedinUrl !== undefined ? (linkedinUrl ? String(linkedinUrl).trim() : null) : undefined,
        careerInterests: careerInterests !== undefined ? (careerInterests ? String(careerInterests).trim() : null) : undefined,
        preferredRoles: preferredRoles !== undefined ? (preferredRoles ? String(preferredRoles).trim() : null) : undefined,
        preferredLocations: preferredLocations !== undefined ? (preferredLocations ? String(preferredLocations).trim() : null) : undefined,
        resumeUrl: resumeUrl !== undefined ? (resumeUrl ? String(resumeUrl).trim() : null) : undefined,
      },
    });

    res.json({
      success: true,
      message: 'Career information updated successfully.',
      data: {
        resumeUrl: updated.resumeUrl,
        portfolioUrl: updated.portfolioUrl,
        githubUrl: updated.githubUrl,
        linkedinUrl: updated.linkedinUrl,
        careerInterests: updated.careerInterests,
        preferredRoles: updated.preferredRoles,
        preferredLocations: updated.preferredLocations,
      },
    });
  } catch (error: unknown) {
    console.error('Error updating career info:', error);
    res.status(500).json({ success: false, message: 'Failed to update career information.' });
  }
}

// ==========================================
// 6. DOCUMENTS & RESUME MANAGEMENT
// ==========================================

export async function getStudentDocuments(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { studentId: student.id },
          { userId: student.userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        isVerified: true,
        verifiedAt: true,
        rejectionReason: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error: unknown) {
    console.error('Error fetching student documents:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
}

export async function uploadStudentDocument(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded. Please select a document to upload.' });
      return;
    }

    const errors = validateDocumentMetadata(req.body);
    if (errors.length > 0) {
      // Remove uploaded file if validation failed
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const { type, title } = req.body;
    const file = req.file;

    const savedFile = await storageService.saveFile(file, 'documents');

    // Create database document record
    const document = await prisma.document.create({
      data: {
        userId: student.userId,
        studentId: student.id,
        type: type as DocumentType,
        title: String(title).trim(),
        fileName: file.originalname,
        fileKey: savedFile.fileKey,
        fileUrl: savedFile.fileUrl,
        fileSize: savedFile.fileSize,
        mimeType: savedFile.mimeType,
        isVerified: false,
      },
    });

    // If document is RESUME, update student.resumeUrl
    if (type === DocumentType.RESUME) {
      await prisma.student.update({
        where: { id: student.id },
        data: { resumeUrl: savedFile.fileUrl },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: {
        id: document.id,
        type: document.type,
        title: document.title,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        isVerified: document.isVerified,
        createdAt: document.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
}

export async function downloadStudentDocument(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const documentId = parseInt(String(req.params.id), 10);
    if (isNaN(documentId)) {
      res.status(400).json({ success: false, message: 'Invalid document ID.' });
      return;
    }

    // Strictly enforce multi-tenant authorization
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [{ studentId: student.id }, { userId: student.userId }],
      },
    });

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found or access denied.' });
      return;
    }

    const filePath = storageService.getFilePath(document.fileKey);
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Document file not found on server storage.' });
      return;
    }

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.fileName)}"`);
    res.setHeader('Content-Length', document.fileSize);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error: unknown) {
    console.error('Error downloading document:', error);
    res.status(500).json({ success: false, message: 'Failed to download document.' });
  }
}

export async function deleteStudentDocument(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const documentId = parseInt(String(req.params.id), 10);
    if (isNaN(documentId)) {
      res.status(400).json({ success: false, message: 'Invalid document ID.' });
      return;
    }

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [{ studentId: student.id }, { userId: student.userId }],
      },
    });

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found or access denied.' });
      return;
    }

    if (document.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Cannot delete an official document that has already been verified by the placement administration.',
      });
      return;
    }

    // Delete file from disk
    await storageService.deleteFile(document.fileKey);

    // Delete record from DB
    await prisma.document.delete({ where: { id: documentId } });

    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error: unknown) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
}

// ==========================================
// 7. DASHBOARD SUMMARY
// ==========================================

export async function getStudentDashboardSummary(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    // Fetch real student data and linked relations in parallel
    const [
      studentFull,
      applications,
      interviews,
      offers,
      placements,
      notifications,
      publishedOpportunitiesCount,
    ] = await Promise.all([
      prisma.student.findUnique({
        where: { id: student.id },
        include: {
          academicRecords: true,
          skills: { include: { skill: true } },
          documents: true,
          certifications: true,
        },
      }),
      prisma.application.findMany({
        where: { studentId: student.id },
        include: {
          job: {
            include: {
              company: { select: { name: true, logoUrl: true, headquarters: true } },
            },
          },
          internship: {
            include: {
              company: { select: { name: true, logoUrl: true, headquarters: true } },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.interview.findMany({
        where: {
          studentId: student.id,
          interviewDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // from yesterday forward
        },
        include: {
          company: { select: { name: true, logoUrl: true } },
          job: { select: { title: true } },
          internship: { select: { title: true } },
        },
        orderBy: { interviewDate: 'asc' },
        take: 5,
      }),
      prisma.offer.findMany({
        where: { studentId: student.id },
        include: {
          company: { select: { name: true, logoUrl: true } },
        },
        orderBy: { offerDate: 'desc' },
      }),
      prisma.placement.findMany({
        where: { studentId: student.id },
        include: {
          company: { select: { name: true, logoUrl: true } },
        },
      }),
      prisma.notification.findMany({
        where: { recipientId: student.userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.job.count({
        where: { status: 'PUBLISHED' },
      }),
    ]);

    // Calculate real profile completion
    const completion = studentFull ? calculateProfileCompletion(studentFull) : null;

    // Upcoming deadlines from active applications and open opportunities
    const deadlines: { id: string; title: string; type: string; deadline: Date; organization: string }[] = [];

    // Add interview deadlines
    for (const iv of interviews) {
      deadlines.push({
        id: `iv-${iv.id}`,
        title: `${iv.roundName} with ${iv.company.name}`,
        type: 'INTERVIEW',
        deadline: iv.startTime,
        organization: iv.company.name,
      });
    }

    // Add deadlines from applications with open jobs
    for (const app of applications) {
      if (app.job?.applicationDeadline && new Date(app.job.applicationDeadline) > new Date()) {
        deadlines.push({
          id: `app-job-${app.id}`,
          title: `Drive Deadline: ${app.job.title}`,
          type: 'APPLICATION_DEADLINE',
          deadline: app.job.applicationDeadline,
          organization: app.job.company.name,
        });
      }
    }

    // Sort deadlines ascending
    deadlines.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    res.json({
      success: true,
      data: {
        profile: {
          id: student.id,
          fullName: student.fullName,
          studentId: student.studentId,
          enrollmentNumber: student.enrollmentNumber,
          department: student.department.name,
          course: student.course,
          semester: student.semester,
          graduationYear: student.graduationYear,
          cgpa: student.cgpa ? Number(student.cgpa) : null,
          academicStatus: student.academicStatus,
          isPlacementEligible: student.isPlacementEligible,
          profilePhoto: student.profilePhoto,
        },
        completion,
        stats: {
          eligibleOpportunitiesCount: student.isPlacementEligible ? publishedOpportunitiesCount : 0,
          newOpportunitiesCount: publishedOpportunitiesCount,
          appliedCount: applications.length,
          interviewsCount: interviews.length,
          offersCount: offers.length,
          placementsCount: placements.length,
        },
        applications: applications.map((app) => ({
          id: app.id,
          opportunityType: app.opportunityType,
          title: app.job?.title || app.internship?.title || 'Opportunity',
          companyName: app.job?.company.name || app.internship?.company.name || 'Company',
          companyLogo: app.job?.company.logoUrl || app.internship?.company.logoUrl || null,
          status: app.status,
          appliedAt: app.appliedAt,
          statusRemarks: app.statusRemarks,
          recentHistory: app.statusHistory,
        })),
        upcomingInterviews: interviews.map((iv) => ({
          id: iv.id,
          roundName: iv.roundName,
          roundNumber: iv.roundNumber,
          companyName: iv.company.name,
          companyLogo: iv.company.logoUrl,
          opportunityTitle: iv.job?.title || iv.internship?.title || 'Role',
          interviewDate: iv.interviewDate,
          startTime: iv.startTime,
          endTime: iv.endTime,
          mode: iv.mode,
          meetingLink: iv.meetingLink,
          location: iv.location,
          interviewerName: iv.interviewerName,
          status: iv.status,
        })),
        offers: offers.map((off) => ({
          id: off.id,
          designation: off.designation,
          companyName: off.company.name,
          salary: off.salary ? Number(off.salary) : null,
          stipend: off.stipend ? Number(off.stipend) : null,
          currency: off.currency,
          status: off.status,
          offerDate: off.offerDate,
          acceptanceDeadline: off.acceptanceDeadline,
        })),
        placement: placements.length > 0 ? {
          id: placements[0].id,
          companyName: placements[0].company.name,
          designation: placements[0].designation,
          packageAmount: Number(placements[0].packageAmount),
          currency: placements[0].currency,
          placementDate: placements[0].placementDate,
          placementType: placements[0].placementType,
          status: placements[0].status,
        } : null,
        notifications: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt,
          actionUrl: n.actionUrl,
        })),
        deadlines: deadlines.slice(0, 5),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard summary.' });
  }
}
