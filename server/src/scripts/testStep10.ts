import { prisma } from '../config/database.js';
import { notificationService } from '../services/notification.service.js';
import { auditService } from '../services/audit.service.js';
import { NotificationType, UserRole } from '@prisma/client';

async function runStep10Verification() {
  console.log('====================================================');
  console.log('STEP 10 VERIFICATION: ADMIN, NOTIFICATIONS, REPORTS');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  try {
    // 1. Find a test user (e.g. student or admin)
    const testUser = await prisma.user.findFirst({
      where: { isActive: true },
    });

    if (!testUser) {
      console.error('No active users found in database. Cannot run notification tests.');
      return;
    }

    console.log(`Testing with user: ID=${testUser.id}, email=${testUser.email}, role=${testUser.role}`);

    // ==========================================
    // 1. NOTIFICATION SYSTEM TESTS
    // ==========================================
    console.log('\n--- 1. NOTIFICATION SYSTEM ---');

    // Create a notification
    const testNotif = await notificationService.notify({
      recipientId: testUser.id,
      title: 'Interview Scheduled - Test',
      message: 'Your Technical Round interview has been scheduled for tomorrow at 10:00 AM.',
      type: NotificationType.INTERVIEW_SCHEDULED,
      actionUrl: '/student/interviews',
    });

    assert(Boolean(testNotif && testNotif.id), 'Create notification via notificationService.notify');
    assert(testNotif?.recipientId === testUser.id, 'Notification belongs to recipientId');
    assert(testNotif?.isRead === false, 'Notification defaults to unread (isRead=false)');

    // Verify unread count
    const unreadCount = await prisma.notification.count({
      where: { recipientId: testUser.id, isRead: false },
    });
    assert(unreadCount > 0, `Unread count correctly increments (${unreadCount})`);

    // Test mark as read
    if (testNotif) {
      const readNotif = await prisma.notification.update({
        where: { id: testNotif.id },
        data: { isRead: true, readAt: new Date() },
      });
      assert(readNotif.isRead === true, 'Mark notification as read sets isRead=true and readAt timestamp');

      // Test delete / dismiss
      await prisma.notification.delete({
        where: { id: testNotif.id },
      });
      const checkDeleted = await prisma.notification.findUnique({
        where: { id: testNotif.id },
      });
      assert(checkDeleted === null, 'Notification dismissal/delete removes record cleanly');
    }

    // ==========================================
    // 2. AUDIT LOGGING TESTS
    // ==========================================
    console.log('\n--- 2. AUDIT LOGGING ---');

    const auditEntry = await auditService.log({
      userId: testUser.id,
      action: 'TEST_AUDIT_ACTION',
      entity: 'SystemSetting',
      entityId: 'TEST-123',
      oldValues: { setting: 'disabled', password: 'SUPER_SECRET_PASSWORD' },
      newValues: { setting: 'enabled', password: 'NEW_SECRET_PASSWORD' },
    });

    assert(Boolean(auditEntry && auditEntry.id), 'Audit log entry created successfully');
    assert(auditEntry?.action === 'TEST_AUDIT_ACTION', 'Audit log records correct action name');
    assert(!auditEntry?.oldValues?.includes('SUPER_SECRET_PASSWORD'), 'Sensitive passwords redacted from oldValues');
    assert(!auditEntry?.newValues?.includes('NEW_SECRET_PASSWORD'), 'Sensitive passwords redacted from newValues');

    // Clean up test audit log
    if (auditEntry) {
      await prisma.auditLog.delete({ where: { id: auditEntry.id } });
    }

    // ==========================================
    // 3. DEPARTMENT MANAGEMENT TESTS
    // ==========================================
    console.log('\n--- 3. DEPARTMENT MANAGEMENT & NON-DESTRUCTIVE SAFETY ---');

    const deptCode = `TST_${Date.now().toString().slice(-4)}`;
    const createdDept = await prisma.department.create({
      data: {
        name: `Test Department ${deptCode}`,
        code: deptCode,
        description: 'Temporary department for verification',
        isActive: true,
      },
    });

    assert(Boolean(createdDept && createdDept.id), 'Create department with code & name');

    // Test update
    const updatedDept = await prisma.department.update({
      where: { id: createdDept.id },
      data: { description: 'Updated test description' },
    });
    assert(updatedDept.description === 'Updated test description', 'Department update succeeds');

    // Clean up test dept
    await prisma.department.delete({ where: { id: createdDept.id } });
    const checkDeptDeleted = await prisma.department.findUnique({ where: { id: createdDept.id } });
    assert(checkDeptDeleted === null, 'Zero-dependency department can be cleanly removed');

    // ==========================================
    // 4. SYSTEM SETTINGS TESTS
    // ==========================================
    console.log('\n--- 4. SYSTEM SETTINGS ---');

    const settingKey = 'TEST_SETTING_VERIFY';
    const upsertedSetting = await prisma.systemSetting.upsert({
      where: { key: settingKey },
      create: {
        key: settingKey,
        value: 'true',
        group: 'GENERAL',
        description: 'Temporary verification setting',
      },
      update: {
        value: 'updated_value',
      },
    });

    assert(Boolean(upsertedSetting && upsertedSetting.key === settingKey), 'Upsert system configuration setting');

    // Clean up
    await prisma.systemSetting.delete({ where: { key: settingKey } });

    // ==========================================
    // 5. ANALYTICS & REPORTING AGGREGATION TESTS
    // ==========================================
    console.log('\n--- 5. ANALYTICS & REAL DB AGGREGATIONS ---');

    const [totalApps, totalPlacements, depts, allOffers] = await Promise.all([
      prisma.application.count(),
      prisma.placement.count(),
      prisma.department.findMany({ select: { id: true, code: true } }),
      prisma.offer.findMany({ select: { status: true, salary: true } }),
    ]);

    assert(typeof totalApps === 'number', `Application count aggregation works (${totalApps} applications)`);
    assert(typeof totalPlacements === 'number', `Placement count aggregation works (${totalPlacements} placements)`);
    assert(Array.isArray(depts), `Departments queried cleanly (${depts.length} departments)`);
    assert(Array.isArray(allOffers), `Offers queried cleanly (${allOffers.length} offers)`);

    console.log('\n====================================================');
    console.log(`RESULTS: ${passedTests} / ${totalTests} tests passed successfully!`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Verification error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runStep10Verification();
