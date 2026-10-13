-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'PLACEMENT_ADMIN', 'STUDENT', 'RECRUITER') NOT NULL DEFAULT 'STUDENT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_name_key`(`name`),
    UNIQUE INDEX `departments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `profilePhoto` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL DEFAULT 'India',
    `pincode` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `enrollmentNumber` VARCHAR(191) NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `program` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL DEFAULT 1,
    `graduationYear` INTEGER NOT NULL,
    `cgpa` DECIMAL(4, 2) NULL,
    `percentage` DECIMAL(5, 2) NULL,
    `backlogs` INTEGER NOT NULL DEFAULT 0,
    `academicStatus` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'DETAINED') NOT NULL DEFAULT 'ACTIVE',
    `isPlacementEligible` BOOLEAN NOT NULL DEFAULT true,
    `resumeUrl` VARCHAR(191) NULL,
    `portfolioUrl` VARCHAR(191) NULL,
    `githubUrl` VARCHAR(191) NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `careerInterests` TEXT NULL,
    `preferredRoles` TEXT NULL,
    `preferredLocations` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_userId_key`(`userId`),
    UNIQUE INDEX `students_studentId_key`(`studentId`),
    UNIQUE INDEX `students_enrollmentNumber_key`(`enrollmentNumber`),
    INDEX `students_departmentId_idx`(`departmentId`),
    INDEX `students_graduationYear_idx`(`graduationYear`),
    INDEX `students_cgpa_idx`(`cgpa`),
    INDEX `students_academicStatus_idx`(`academicStatus`),
    INDEX `students_isPlacementEligible_idx`(`isPlacementEligible`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_academic_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `level` ENUM('CLASS_10', 'CLASS_12', 'DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE', 'SEMESTER') NOT NULL,
    `semesterNumber` INTEGER NULL,
    `institution` VARCHAR(191) NOT NULL,
    `boardOrUniv` VARCHAR(191) NULL,
    `passingYear` INTEGER NOT NULL,
    `cgpa` DECIMAL(4, 2) NULL,
    `percentage` DECIMAL(5, 2) NULL,
    `marksObtained` DECIMAL(7, 2) NULL,
    `totalMarks` DECIMAL(7, 2) NULL,
    `backlogsCount` INTEGER NOT NULL DEFAULT 0,
    `marksheetUrl` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_academic_records_studentId_idx`(`studentId`),
    INDEX `student_academic_records_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('TECHNICAL', 'SOFT_SKILL', 'DOMAIN', 'TOOL', 'LANGUAGE') NOT NULL DEFAULT 'TECHNICAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `skills_name_key`(`name`),
    INDEX `skills_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_skills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `skillId` INTEGER NOT NULL,
    `proficiency` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') NOT NULL DEFAULT 'BEGINNER',
    `yearsOfExperience` DECIMAL(3, 1) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_skills_skillId_idx`(`skillId`),
    UNIQUE INDEX `student_skills_studentId_skillId_key`(`studentId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `industry` VARCHAR(191) NOT NULL,
    `website` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `headquarters` VARCHAR(191) NOT NULL,
    `locations` TEXT NULL,
    `companySize` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NULL,
    `verificationStatus` ENUM('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_name_key`(`name`),
    INDEX `companies_verificationStatus_idx`(`verificationStatus`),
    INDEX `companies_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recruiters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NOT NULL,
    `accountStatus` ENUM('ACTIVE', 'PENDING_APPROVAL', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recruiters_userId_key`(`userId`),
    UNIQUE INDEX `recruiters_email_key`(`email`),
    INDEX `recruiters_companyId_idx`(`companyId`),
    INDEX `recruiters_accountStatus_idx`(`accountStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyId` INTEGER NOT NULL,
    `recruiterId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `responsibilities` TEXT NOT NULL,
    `requirements` TEXT NOT NULL,
    `requiredSkills` TEXT NOT NULL,
    `employmentType` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TRAINEESHIP') NOT NULL DEFAULT 'FULL_TIME',
    `location` VARCHAR(191) NOT NULL,
    `workMode` ENUM('ON_SITE', 'REMOTE', 'HYBRID') NOT NULL DEFAULT 'ON_SITE',
    `salaryMin` DECIMAL(12, 2) NOT NULL,
    `salaryMax` DECIMAL(12, 2) NOT NULL,
    `salaryCurrency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `salaryBreakup` TEXT NULL,
    `vacancies` INTEGER NOT NULL DEFAULT 1,
    `applicationDeadline` DATETIME(3) NOT NULL,
    `selectionProcess` TEXT NULL,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `jobs_companyId_idx`(`companyId`),
    INDEX `jobs_status_idx`(`status`),
    INDEX `jobs_applicationDeadline_idx`(`applicationDeadline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `internships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyId` INTEGER NOT NULL,
    `recruiterId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `responsibilities` TEXT NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `stipendAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `stipendCurrency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `stipendPeriod` ENUM('PER_MONTH', 'PER_WEEK', 'LUMP_SUM', 'UNPAID') NOT NULL DEFAULT 'PER_MONTH',
    `location` VARCHAR(191) NOT NULL,
    `workMode` ENUM('ON_SITE', 'REMOTE', 'HYBRID') NOT NULL DEFAULT 'ON_SITE',
    `requiredSkills` TEXT NOT NULL,
    `vacancies` INTEGER NOT NULL DEFAULT 1,
    `applicationDeadline` DATETIME(3) NOT NULL,
    `selectionProcess` TEXT NULL,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `isPPOApplicable` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `internships_companyId_idx`(`companyId`),
    INDEX `internships_status_idx`(`status`),
    INDEX `internships_applicationDeadline_idx`(`applicationDeadline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eligibility_criteria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobId` INTEGER NULL,
    `internshipId` INTEGER NULL,
    `minCgpa` DECIMAL(4, 2) NULL,
    `minPercentage` DECIMAL(5, 2) NULL,
    `maxBacklogs` INTEGER NOT NULL DEFAULT 0,
    `allowedCourses` TEXT NULL,
    `allowedPrograms` TEXT NULL,
    `allowedDepartments` TEXT NULL,
    `allowedSemesters` TEXT NULL,
    `graduationYears` TEXT NULL,
    `requiredSkills` TEXT NULL,
    `additionalCriteria` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `eligibility_criteria_jobId_key`(`jobId`),
    UNIQUE INDEX `eligibility_criteria_internshipId_key`(`internshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `opportunityType` ENUM('JOB', 'INTERNSHIP') NOT NULL,
    `jobId` INTEGER NULL,
    `internshipId` INTEGER NULL,
    `status` ENUM('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'WITHDRAWN', 'HIRED_PLACED') NOT NULL DEFAULT 'APPLIED',
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `coverLetter` TEXT NULL,
    `resumeDocumentId` INTEGER NULL,
    `statusRemarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `applications_studentId_idx`(`studentId`),
    INDEX `applications_jobId_idx`(`jobId`),
    INDEX `applications_internshipId_idx`(`internshipId`),
    INDEX `applications_status_idx`(`status`),
    UNIQUE INDEX `applications_studentId_jobId_key`(`studentId`, `jobId`),
    UNIQUE INDEX `applications_studentId_internshipId_key`(`studentId`, `internshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_status_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationId` INTEGER NOT NULL,
    `previousStatus` ENUM('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'WITHDRAWN', 'HIRED_PLACED') NULL,
    `newStatus` ENUM('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'WITHDRAWN', 'HIRED_PLACED') NOT NULL,
    `changedById` INTEGER NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `application_status_histories_applicationId_idx`(`applicationId`),
    INDEX `application_status_histories_changedById_idx`(`changedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interview_rounds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobId` INTEGER NULL,
    `internshipId` INTEGER NULL,
    `roundNumber` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('ONLINE_ASSESSMENT', 'TECHNICAL', 'MANAGERIAL', 'HR', 'GROUP_DISCUSSION', 'OTHER') NOT NULL DEFAULT 'TECHNICAL',
    `description` TEXT NULL,
    `isEliminative` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `interview_rounds_jobId_idx`(`jobId`),
    INDEX `interview_rounds_internshipId_idx`(`internshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationId` INTEGER NOT NULL,
    `roundId` INTEGER NULL,
    `studentId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `jobId` INTEGER NULL,
    `internshipId` INTEGER NULL,
    `recruiterId` INTEGER NULL,
    `roundNumber` INTEGER NOT NULL DEFAULT 1,
    `roundName` VARCHAR(191) NOT NULL,
    `interviewDate` DATETIME(3) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `mode` ENUM('ONLINE', 'IN_PERSON', 'TELEPHONIC') NOT NULL DEFAULT 'ONLINE',
    `location` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `interviewerName` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `feedback` TEXT NULL,
    `result` ENUM('PENDING', 'QUALIFIED', 'NOT_QUALIFIED', 'ON_HOLD', 'ABSENT') NOT NULL DEFAULT 'PENDING',
    `status` ENUM('SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `interviews_applicationId_idx`(`applicationId`),
    INDEX `interviews_studentId_idx`(`studentId`),
    INDEX `interviews_companyId_idx`(`companyId`),
    INDEX `interviews_interviewDate_idx`(`interviewDate`),
    INDEX `interviews_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `jobId` INTEGER NULL,
    `internshipId` INTEGER NULL,
    `offerDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `joiningDate` DATETIME(3) NULL,
    `salary` DECIMAL(12, 2) NULL,
    `stipend` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `location` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NOT NULL,
    `offerLetterDocumentId` INTEGER NULL,
    `status` ENUM('OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'OFFERED',
    `acceptanceDeadline` DATETIME(3) NULL,
    `respondedAt` DATETIME(3) NULL,
    `responseNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `offers_studentId_idx`(`studentId`),
    INDEX `offers_companyId_idx`(`companyId`),
    INDEX `offers_applicationId_idx`(`applicationId`),
    INDEX `offers_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `placements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `applicationId` INTEGER NULL,
    `jobId` INTEGER NULL,
    `offerId` INTEGER NULL,
    `placementDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `packageAmount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `joiningDate` DATETIME(3) NULL,
    `placementType` ENUM('ON_CAMPUS', 'OFF_CAMPUS', 'PPO') NOT NULL DEFAULT 'ON_CAMPUS',
    `designation` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `status` ENUM('CONFIRMED', 'JOINED', 'DEFERRED', 'RESCINDED', 'DECLINED') NOT NULL DEFAULT 'CONFIRMED',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `placements_offerId_key`(`offerId`),
    INDEX `placements_studentId_idx`(`studentId`),
    INDEX `placements_companyId_idx`(`companyId`),
    INDEX `placements_placementDate_idx`(`placementDate`),
    INDEX `placements_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `studentId` INTEGER NULL,
    `type` ENUM('RESUME', 'CERTIFICATE', 'MARKSHEET', 'INTERNSHIP_CERTIFICATE', 'OFFER_LETTER', 'ID_PROOF', 'OTHER') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileKey` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedById` INTEGER NULL,
    `verifiedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `documents_fileKey_key`(`fileKey`),
    INDEX `documents_userId_idx`(`userId`),
    INDEX `documents_studentId_idx`(`studentId`),
    INDEX `documents_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recipientId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('APPLICATION_UPDATE', 'INTERVIEW_SCHEDULED', 'OFFER_RELEASED', 'DEADLINE_ALERT', 'GENERAL', 'SYSTEM') NOT NULL DEFAULT 'GENERAL',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `relatedEntityType` VARCHAR(191) NULL,
    `relatedEntityId` INTEGER NULL,
    `actionUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_recipientId_idx`(`recipientId`),
    INDEX `notifications_isRead_idx`(`isRead`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_opportunities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `opportunityType` ENUM('JOB', 'INTERNSHIP') NOT NULL,
    `jobId` INTEGER NULL,
    `internshipId` INTEGER NULL,
    `savedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `saved_opportunities_studentId_idx`(`studentId`),
    UNIQUE INDEX `saved_opportunities_studentId_jobId_key`(`studentId`, `jobId`),
    UNIQUE INDEX `saved_opportunities_studentId_internshipId_key`(`studentId`, `internshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `oldValues` TEXT NULL,
    `newValues` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_entity_idx`(`entity`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `group` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `description` TEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    INDEX `system_settings_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic_records` ADD CONSTRAINT `student_academic_records_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_skills` ADD CONSTRAINT `student_skills_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_skills` ADD CONSTRAINT `student_skills_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruiters` ADD CONSTRAINT `recruiters_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recruiters` ADD CONSTRAINT `recruiters_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_recruiterId_fkey` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_recruiterId_fkey` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eligibility_criteria` ADD CONSTRAINT `eligibility_criteria_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eligibility_criteria` ADD CONSTRAINT `eligibility_criteria_internshipId_fkey` FOREIGN KEY (`internshipId`) REFERENCES `internships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_internshipId_fkey` FOREIGN KEY (`internshipId`) REFERENCES `internships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_resumeDocumentId_fkey` FOREIGN KEY (`resumeDocumentId`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_status_histories` ADD CONSTRAINT `application_status_histories_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_status_histories` ADD CONSTRAINT `application_status_histories_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interview_rounds` ADD CONSTRAINT `interview_rounds_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interview_rounds` ADD CONSTRAINT `interview_rounds_internshipId_fkey` FOREIGN KEY (`internshipId`) REFERENCES `internships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_roundId_fkey` FOREIGN KEY (`roundId`) REFERENCES `interview_rounds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_internshipId_fkey` FOREIGN KEY (`internshipId`) REFERENCES `internships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_recruiterId_fkey` FOREIGN KEY (`recruiterId`) REFERENCES `recruiters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_internshipId_fkey` FOREIGN KEY (`internshipId`) REFERENCES `internships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_offerLetterDocumentId_fkey` FOREIGN KEY (`offerLetterDocumentId`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `placements` ADD CONSTRAINT `placements_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `placements` ADD CONSTRAINT `placements_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `placements` ADD CONSTRAINT `placements_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `placements` ADD CONSTRAINT `placements_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `placements` ADD CONSTRAINT `placements_offerId_fkey` FOREIGN KEY (`offerId`) REFERENCES `offers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_opportunities` ADD CONSTRAINT `saved_opportunities_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_opportunities` ADD CONSTRAINT `saved_opportunities_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_opportunities` ADD CONSTRAINT `saved_opportunities_internshipId_fkey` FOREIGN KEY (`internshipId`) REFERENCES `internships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
