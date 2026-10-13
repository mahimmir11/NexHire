import { prisma } from '../config/database.js';
import { hashPassword } from '../utils/security.utils.js';
import {
  UserRole,
  AcademicStatus,
  AcademicLevel,
  SkillCategory,
  SkillProficiency,
  CompanyVerificationStatus,
  RecruiterAccountStatus,
  OpportunityType,
  EmploymentType,
  WorkMode,
  OpportunityStatus,
  StipendPeriod,
  ApplicationStatus,
  InterviewRoundType,
  InterviewMode,
  InterviewStatus,
  DocumentType,
  NotificationType,
} from '@prisma/client';

async function main() {
  console.log('🌱 Starting NexHire database seeding...');

  // 1. System Settings
  console.log('  -> Seeding System Settings...');
  const settingsData = [
    {
      key: 'app_name',
      value: 'NexHire',
      group: 'GENERAL',
      description: 'Official application title',
      isPublic: true,
    },
    {
      key: 'app_tagline',
      value: 'Campus Placement & Internship Management System',
      group: 'GENERAL',
      description: 'System tagline and portal headline',
      isPublic: true,
    },
    {
      key: 'allow_student_registration',
      value: 'true',
      group: 'POLICY',
      description: 'Whether new students can register self-service accounts',
      isPublic: false,
    },
    {
      key: 'max_active_offers_per_student',
      value: '2',
      group: 'PLACEMENT',
      description: 'Maximum offers a student can hold before auto-freezing',
      isPublic: false,
    },
  ];

  for (const s of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description, group: s.group, isPublic: s.isPublic },
      create: s,
    });
  }

  // 2. Departments
  console.log('  -> Seeding Departments...');
  const mcaDept = await prisma.department.upsert({
    where: { code: 'MCA' },
    update: {},
    create: {
      name: 'Department of Computer Applications',
      code: 'MCA',
      description: 'Postgraduate department specializing in advanced software development, systems, and enterprise architecture.',
      isActive: true,
    },
  });

  const cseDept = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      name: 'Department of Computer Science & Engineering',
      code: 'CSE',
      description: 'Undergraduate department focusing on computer systems, algorithms, hardware-software integration, and AI.',
      isActive: true,
    },
  });

  // 3. Technical & Domain Skills
  console.log('  -> Seeding Skills catalog...');
  const skillsList = [
    { name: 'TypeScript', category: SkillCategory.TECHNICAL },
    { name: 'Node.js', category: SkillCategory.TECHNICAL },
    { name: 'React', category: SkillCategory.TECHNICAL },
    { name: 'MySQL', category: SkillCategory.TECHNICAL },
    { name: 'Python', category: SkillCategory.TECHNICAL },
    { name: 'Data Structures & Algorithms', category: SkillCategory.TECHNICAL },
    { name: 'System Design', category: SkillCategory.TECHNICAL },
    { name: 'REST APIs', category: SkillCategory.TECHNICAL },
    { name: 'Problem Solving', category: SkillCategory.SOFT_SKILL },
    { name: 'Technical Communication', category: SkillCategory.SOFT_SKILL },
  ];

  const skillRecords = new Map<string, number>();
  for (const sk of skillsList) {
    const record = await prisma.skill.upsert({
      where: { name: sk.name },
      update: {},
      create: sk,
    });
    skillRecords.set(record.name, record.id);
  }

  // 4. Core Role Users
  console.log('  -> Seeding Core Users with real bcrypt password hashes...');
  const demoPlainPassword = process.env.DEMO_USER_PASSWORD || 'NexHire@2026!';
  const demoPasswordHash = await hashPassword(demoPlainPassword);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin.demo@nexhire.local' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'superadmin.demo@nexhire.local',
      passwordHash: demoPasswordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  const placementAdminUser = await prisma.user.upsert({
    where: { email: 'placement.officer.demo@nexhire.local' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'placement.officer.demo@nexhire.local',
      passwordHash: demoPasswordHash,
      role: UserRole.PLACEMENT_ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  const recruiterUser = await prisma.user.upsert({
    where: { email: 'recruiter.demo@nexhire.local' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'recruiter.demo@nexhire.local',
      passwordHash: demoPasswordHash,
      role: UserRole.RECRUITER,
      isActive: true,
      emailVerified: true,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student.demo@nexhire.local' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'student.demo@nexhire.local',
      passwordHash: demoPasswordHash,
      role: UserRole.STUDENT,
      isActive: true,
      emailVerified: true,
    },
  });

  // 5. Company & Recruiter Profile
  console.log('  -> Seeding Company & Recruiter...');
  const company = await prisma.company.upsert({
    where: { name: 'Apex Innovations Technologies' },
    update: {},
    create: {
      name: 'Apex Innovations Technologies',
      logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=128&h=128&fit=crop',
      industry: 'Enterprise Software & Cloud Platforms',
      website: 'https://apextech-demo.nexhire.local',
      description: 'A global technology solutions provider pioneering high-scale cloud platforms, distributed systems, and AI-driven automation.',
      headquarters: 'Bengaluru, Karnataka, India',
      locations: 'Bengaluru, Hyderabad, Pune',
      companySize: '1000-5000',
      contactEmail: 'campus-hiring@apextech-demo.nexhire.local',
      contactPhone: '+91 80 4900 1200',
      verificationStatus: CompanyVerificationStatus.VERIFIED,
      isActive: true,
    },
  });

  const recruiter = await prisma.recruiter.upsert({
    where: { userId: recruiterUser.id },
    update: {},
    create: {
      userId: recruiterUser.id,
      companyId: company.id,
      fullName: 'Vikram Malhotra',
      email: 'recruiter.demo@nexhire.local',
      phone: '+91 98765 43210',
      designation: 'Lead University Talent Acquisition Specialist',
      accountStatus: RecruiterAccountStatus.ACTIVE,
    },
  });

  // 6. Student Profile & Records
  console.log('  -> Seeding Student Profile, Academic Records & Skills...');
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      departmentId: mcaDept.id,
      fullName: 'Aarav Sharma',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop',
      phone: '+91 91234 56789',
      dateOfBirth: new Date('2001-08-15'),
      address: '42 Campus Green Avenue, Tech Zone',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560100',
      studentId: 'MCA2024001',
      enrollmentNumber: 'EN2024MCA0842',
      course: 'MCA',
      program: 'Master of Computer Applications',
      semester: 4,
      graduationYear: 2026,
      cgpa: 8.85,
      percentage: 84.5,
      backlogs: 0,
      academicStatus: AcademicStatus.ACTIVE,
      isPlacementEligible: true,
      resumeUrl: 'https://storage.nexhire.local/demo-resumes/aarav_sharma_mca_resume.pdf',
      portfolioUrl: 'https://aaravsharma-demo.dev',
      githubUrl: 'https://github.com/aarav-sharma-demo',
      linkedinUrl: 'https://linkedin.com/in/aarav-sharma-demo',
      careerInterests: 'Backend Architecture, Cloud Engineering, Distributed Systems',
      preferredRoles: 'Backend Engineer, Full Stack Developer, Software Engineer',
      preferredLocations: 'Bengaluru, Hyderabad, Remote',
    },
  });

  // Academic Records (10th, 12th, UG, MCA Semesters)
  const academicRecordCount = await prisma.studentAcademicRecord.count({ where: { studentId: student.id } });
  if (academicRecordCount === 0) {
    await prisma.studentAcademicRecord.createMany({
      data: [
        {
          studentId: student.id,
          level: AcademicLevel.CLASS_10,
          institution: 'St. Xavier High School',
          boardOrUniv: 'CBSE',
          passingYear: 2017,
          percentage: 91.2,
          isVerified: true,
        },
        {
          studentId: student.id,
          level: AcademicLevel.CLASS_12,
          institution: 'National Junior College',
          boardOrUniv: 'Karnataka State Pre-University Board',
          passingYear: 2019,
          percentage: 88.5,
          isVerified: true,
        },
        {
          studentId: student.id,
          level: AcademicLevel.UNDERGRADUATE,
          institution: 'City College of Science & Commerce',
          boardOrUniv: 'Bangalore University',
          passingYear: 2023,
          cgpa: 8.6,
          percentage: 82.0,
          isVerified: true,
        },
        {
          studentId: student.id,
          level: AcademicLevel.SEMESTER,
          semesterNumber: 1,
          institution: 'School of Computer Applications',
          boardOrUniv: 'State Technological University',
          passingYear: 2024,
          cgpa: 8.9,
          percentage: 85.0,
          isVerified: true,
        },
        {
          studentId: student.id,
          level: AcademicLevel.SEMESTER,
          semesterNumber: 2,
          institution: 'School of Computer Applications',
          boardOrUniv: 'State Technological University',
          passingYear: 2024,
          cgpa: 8.8,
          percentage: 84.0,
          isVerified: true,
        },
      ],
    });
  }

  // Student Skills
  const studentSkillCount = await prisma.studentSkill.count({ where: { studentId: student.id } });
  if (studentSkillCount === 0) {
    const studentSkillsToCreate = [
      { skillName: 'TypeScript', proficiency: SkillProficiency.ADVANCED, exp: 2.0 },
      { skillName: 'Node.js', proficiency: SkillProficiency.ADVANCED, exp: 2.5 },
      { skillName: 'React', proficiency: SkillProficiency.INTERMEDIATE, exp: 1.5 },
      { skillName: 'MySQL', proficiency: SkillProficiency.ADVANCED, exp: 2.0 },
      { skillName: 'Data Structures & Algorithms', proficiency: SkillProficiency.ADVANCED, exp: 3.0 },
    ];

    for (const ss of studentSkillsToCreate) {
      const skillId = skillRecords.get(ss.skillName);
      if (skillId) {
        await prisma.studentSkill.create({
          data: {
            studentId: student.id,
            skillId,
            proficiency: ss.proficiency,
            yearsOfExperience: ss.exp,
          },
        });
      }
    }
  }

  // 7. Job Opportunity
  console.log('  -> Seeding Job Opportunity with Eligibility & Rounds...');
  let job = await prisma.job.findFirst({ where: { companyId: company.id, title: 'Software Development Engineer - Backend (Campus 2026)' } });
  if (!job) {
    job = await prisma.job.create({
      data: {
        companyId: company.id,
        recruiterId: recruiter.id,
        title: 'Software Development Engineer - Backend (Campus 2026)',
        description: 'Apex Innovations is hiring high-potential graduating students for our core platform engineering teams building scalable distributed microservices.',
        responsibilities: 'Design and implement REST and gRPC microservices, write clean maintainable code in TypeScript/Node.js or Java, write automated tests, and collaborate with product teams.',
        requirements: 'Strong understanding of object-oriented and functional programming, data structures, algorithms, SQL/relational databases, and web architecture.',
        requiredSkills: 'TypeScript, Node.js, MySQL, REST APIs, System Design',
        employmentType: EmploymentType.FULL_TIME,
        location: 'Bengaluru / Hybrid',
        workMode: WorkMode.HYBRID,
        salaryMin: 1200000,
        salaryMax: 1600000,
        salaryCurrency: 'INR',
        salaryBreakup: 'Base Salary: 12 LPA, Performance Bonus: 2 LPA, Retention Incentive: 2 LPA',
        vacancies: 5,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
        selectionProcess: 'Round 1: Online Coding Test -> Round 2: Technical Interview 1 -> Round 3: Technical Interview 2 -> Round 4: HR & Fitment Discussion',
        status: OpportunityStatus.PUBLISHED,
        eligibilityCriteria: {
          create: {
            minCgpa: 7.5,
            minPercentage: 70.0,
            maxBacklogs: 0,
            allowedCourses: JSON.stringify(['MCA', 'B.Tech CSE', 'B.Tech IT']),
            allowedDepartments: JSON.stringify(['MCA', 'CSE']),
            graduationYears: JSON.stringify([2026]),
            requiredSkills: JSON.stringify(['TypeScript', 'Node.js', 'MySQL']),
            additionalCriteria: 'Must have at least 75% aggregate in 10th and 12th.',
          },
        },
        interviewRounds: {
          create: [
            {
              roundNumber: 1,
              name: 'Online Coding Assessment',
              type: InterviewRoundType.ONLINE_ASSESSMENT,
              description: '90-minute online assessment covering Data Structures, Algorithms, and SQL queries.',
              isEliminative: true,
            },
            {
              roundNumber: 2,
              name: 'Technical Interview I (Core Engineering)',
              type: InterviewRoundType.TECHNICAL,
              description: 'Live coding problem solving, database schema design, and asynchronous programming in TypeScript/Node.js.',
              isEliminative: true,
            },
            {
              roundNumber: 3,
              name: 'HR & Fitment Interview',
              type: InterviewRoundType.HR,
              description: 'Discussion on team collaboration, culture fit, aspirations, and offer terms.',
              isEliminative: false,
            },
          ],
        },
      },
    });
  }

  // 8. Internship Opportunity
  console.log('  -> Seeding Internship Opportunity with Eligibility...');
  let internship = await prisma.internship.findFirst({ where: { companyId: company.id, title: 'Full Stack Web Engineering Intern (Summer 2026)' } });
  if (!internship) {
    internship = await prisma.internship.create({
      data: {
        companyId: company.id,
        recruiterId: recruiter.id,
        title: 'Full Stack Web Engineering Intern (Summer 2026)',
        description: 'Exciting 6-month pre-placement internship opportunity for passionate developers eager to work on modern cloud applications.',
        responsibilities: 'Build interactive user experiences with React, implement backend APIs in Node.js, and integrate third-party tools.',
        duration: '6 Months',
        startDate: new Date('2026-01-10'),
        endDate: new Date('2026-06-30'),
        stipendAmount: 40000,
        stipendCurrency: 'INR',
        stipendPeriod: StipendPeriod.PER_MONTH,
        location: 'Bengaluru',
        workMode: WorkMode.HYBRID,
        requiredSkills: 'React, TypeScript, Node.js, TailwindCSS',
        vacancies: 3,
        applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        selectionProcess: 'Round 1: Coding Challenge -> Round 2: Tech Project Presentation',
        status: OpportunityStatus.PUBLISHED,
        isPPOApplicable: true,
        eligibilityCriteria: {
          create: {
            minCgpa: 7.0,
            maxBacklogs: 0,
            allowedCourses: JSON.stringify(['MCA', 'B.Tech']),
            graduationYears: JSON.stringify([2026, 2027]),
          },
        },
      },
    });
  }

  // 9. Document (Student Resume metadata)
  console.log('  -> Seeding Student Document...');
  const resumeDoc = await prisma.document.upsert({
    where: { fileKey: 'docs/resumes/aarav_sharma_mca_2026.pdf' },
    update: {},
    create: {
      userId: studentUser.id,
      studentId: student.id,
      type: DocumentType.RESUME,
      title: 'Aarav Sharma - Primary Placement Resume (Updated 2026)',
      fileName: 'aarav_sharma_mca_2026.pdf',
      fileKey: 'docs/resumes/aarav_sharma_mca_2026.pdf',
      fileUrl: 'https://storage.nexhire.local/docs/resumes/aarav_sharma_mca_2026.pdf',
      fileSize: 418294, // ~408 KB
      mimeType: 'application/pdf',
      isVerified: true,
      verifiedById: placementAdminUser.id,
      verifiedAt: new Date(),
    },
  });

  // 10. Application, Timeline & Interview
  console.log('  -> Seeding Student Application, Status Timeline & Interview...');
  let application = await prisma.application.findUnique({
    where: {
      studentId_jobId: {
        studentId: student.id,
        jobId: job.id,
      },
    },
  });

  if (!application) {
    application = await prisma.application.create({
      data: {
        studentId: student.id,
        opportunityType: OpportunityType.JOB,
        jobId: job.id,
        status: ApplicationStatus.INTERVIEW_SCHEDULED,
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        coverLetter: 'I am excited to apply for the Backend Engineer position at Apex Innovations. With hands-on experience building TypeScript microservices and strong fundamentals in algorithms, I look forward to contributing to your team.',
        resumeDocumentId: resumeDoc.id,
        statusRemarks: 'Qualified coding assessment with score 94/100. Shortlisted for Technical Interview I.',
        statusHistory: {
          create: [
            {
              previousStatus: null,
              newStatus: ApplicationStatus.APPLIED,
              changedById: studentUser.id,
              note: 'Application submitted successfully with attached verified resume.',
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
            {
              previousStatus: ApplicationStatus.APPLIED,
              newStatus: ApplicationStatus.UNDER_REVIEW,
              changedById: placementAdminUser.id,
              note: 'Profile verified against eligibility criteria: CGPA: 8.85 (Req: >= 7.50).',
              createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            },
            {
              previousStatus: ApplicationStatus.UNDER_REVIEW,
              newStatus: ApplicationStatus.SHORTLISTED,
              changedById: recruiterUser.id,
              note: 'Passed Online Assessment (94%). Shortlisted for round 1.',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              previousStatus: ApplicationStatus.SHORTLISTED,
              newStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
              changedById: recruiterUser.id,
              note: 'Round 1 Technical Interview scheduled.',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      },
    });

    // Schedule interview
    const round1 = await prisma.interviewRound.findFirst({
      where: { jobId: job.id, roundNumber: 2 },
    });

    const interviewDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    const startTime = new Date(interviewDate);
    startTime.setHours(14, 0, 0, 0); // 2:00 PM
    const endTime = new Date(interviewDate);
    endTime.setHours(15, 0, 0, 0); // 3:00 PM

    await prisma.interview.create({
      data: {
        applicationId: application.id,
        roundId: round1?.id,
        studentId: student.id,
        companyId: company.id,
        jobId: job.id,
        recruiterId: recruiter.id,
        roundNumber: 2,
        roundName: 'Round 1 - Technical Assessment',
        interviewDate,
        startTime,
        endTime,
        mode: InterviewMode.ONLINE,
        meetingLink: 'https://meet.nexhire.local/apex-interview-tech-01',
        interviewerName: 'Vikram Malhotra & Senior Staff Engineer',
        notes: 'Candidate should be prepared with a development environment for live coding.',
        status: InterviewStatus.SCHEDULED,
      },
    });
  }

  // 11. Saved Opportunity (Bookmark)
  console.log('  -> Seeding Saved Opportunity bookmark...');
  await prisma.savedOpportunity.upsert({
    where: {
      studentId_internshipId: {
        studentId: student.id,
        internshipId: internship.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      opportunityType: OpportunityType.INTERNSHIP,
      internshipId: internship.id,
    },
  });

  // 12. Notification
  console.log('  -> Seeding Notifications...');
  const notifCount = await prisma.notification.count({ where: { recipientId: studentUser.id } });
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          recipientId: studentUser.id,
          title: 'Interview Scheduled: Apex Innovations Technologies',
          message: 'Your Technical Interview I for Software Development Engineer - Backend has been scheduled for 2:00 PM.',
          type: NotificationType.INTERVIEW_SCHEDULED,
          relatedEntityType: 'INTERVIEW',
          relatedEntityId: application.id,
          actionUrl: '/dashboard/interviews',
          isRead: false,
        },
        {
          recipientId: studentUser.id,
          title: 'Resume Verified Successfully',
          message: 'Your primary resume has been verified and approved by the Placement Cell.',
          type: NotificationType.SYSTEM,
          relatedEntityType: 'DOCUMENT',
          relatedEntityId: resumeDoc.id,
          actionUrl: '/dashboard/profile',
          isRead: true,
          readAt: new Date(),
        },
      ],
    });
  }

  // 13. Audit Log
  console.log('  -> Seeding Audit Log trail...');
  await prisma.auditLog.create({
    data: {
      userId: recruiterUser.id,
      action: 'PUBLISH_JOB_OPPORTUNITY',
      entity: 'Job',
      entityId: String(job.id),
      newValues: JSON.stringify({
        title: job.title,
        status: OpportunityStatus.PUBLISHED,
        vacancies: job.vacancies,
      }),
      ipAddress: '127.0.0.1',
      userAgent: 'NexHire-Backend-Seed-Agent/1.0',
    },
  });

  console.log('✅ NexHire database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
