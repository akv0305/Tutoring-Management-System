import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting TEST seed (4 users, minimal data)...")

  // Clean everything
  await prisma.referral.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.teacherBlockedDate.deleteMany()
  await prisma.teacherAvailability.deleteMany()
  await prisma.refundRequest.deleteMany()
  await prisma.payout.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.class.deleteMany()
  await prisma.package.deleteMany()
  await prisma.packageTemplate.deleteMany()
  await prisma.studentSubject.deleteMany()
  await prisma.teacherSubject.deleteMany()
  await prisma.student.deleteMany()
  await prisma.coordinatorProfile.deleteMany()
  await prisma.teacherProfile.deleteMany()
  await prisma.parentProfile.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.user.deleteMany()
  await prisma.platformSettings.deleteMany()

  console.log("🧹 Cleaned existing data")

  const hash = await bcrypt.hash("Test@1234", 12)

  // ─── Platform Settings ───
  await prisma.platformSettings.create({ data: { id: "default" } })

  // ─── Subjects (3 basic) ───
  const math = await prisma.subject.create({
    data: { name: "Mathematics", category: "MATH", basePriceHour: 55 },
  })
  const physics = await prisma.subject.create({
    data: { name: "Physics", category: "SCIENCE", basePriceHour: 55 },
  })
  const english = await prisma.subject.create({
    data: { name: "English", category: "ENGLISH", basePriceHour: 45 },
  })
  console.log("📚 3 subjects created")

  // ─── 1. ADMIN ───
  await prisma.user.create({
    data: {
      email: "admin@test.com",
      passwordHash: hash,
      role: UserRole.ADMIN,
      firstName: "Test",
      lastName: "Admin",
      phone: "+1-555-000-0001",
    },
  })
  console.log("👤 Admin created")

  // ─── 2. COORDINATOR ───
  const coordUser = await prisma.user.create({
    data: {
      email: "coordinator@test.com",
      passwordHash: hash,
      role: UserRole.COORDINATOR,
      firstName: "Test",
      lastName: "Coordinator",
      phone: "+1-555-000-0002",
    },
  })
  const coordProfile = await prisma.coordinatorProfile.create({
    data: { userId: coordUser.id, bucketSize: 50 },
  })
  console.log("🎯 Coordinator created")

  // ─── 3. TEACHER ───
  const teacherUser = await prisma.user.create({
    data: {
      email: "teacher@test.com",
      passwordHash: hash,
      role: UserRole.TEACHER,
      firstName: "Test",
      lastName: "Teacher",
      phone: "+1-555-000-0003",
    },
  })
  const teacherProfile = await prisma.teacherProfile.create({
    data: {
      userId: teacherUser.id,
      qualification: "M.Sc. Mathematics",
      bio: "Experienced tutor for testing",
      experience: 5,
      compensationRate: 25,
      studentFacingRate: 55,
      rating: 4.5,
      totalReviews: 10,
    },
  })

  // Link teacher to subjects
  await prisma.teacherSubject.createMany({
    data: [
      { teacherId: teacherProfile.id, subjectId: math.id },
      { teacherId: teacherProfile.id, subjectId: physics.id },
    ],
  })

  // Teacher availability (Mon-Fri, 9am-5pm)
  const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const
  for (const day of weekdays) {
    await prisma.teacherAvailability.create({
      data: {
        teacherId: teacherProfile.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isEnabled: true,
      },
    })
  }
  console.log("👩‍🏫 Teacher created with subjects & availability")

  // ─── 4. PARENT + 1 STUDENT ───
  const parentUser = await prisma.user.create({
    data: {
      email: "parent@test.com",
      passwordHash: hash,
      role: UserRole.PARENT,
      firstName: "Test",
      lastName: "Parent",
      phone: "+1-555-000-0004",
    },
  })
  const parentProfile = await prisma.parentProfile.create({
    data: { userId: parentUser.id },
  })

  const student = await prisma.student.create({
    data: {
      firstName: "Test",
      lastName: "Student",
      grade: "8",
      school: "Test School",
      parentId: parentProfile.id,
      coordinatorId: coordProfile.id,
      status: "ACTIVE",
      onboardingStage: "CONVERTED",
    },
  })

  // Assign student to subjects
  await prisma.studentSubject.createMany({
    data: [
      { studentId: student.id, subjectId: math.id, trialTaken: true },
      { studentId: student.id, subjectId: physics.id, trialTaken: true },
    ],
  })
  console.log("👨‍👩‍👧 Parent + 1 student created")

  // ─── 1 Package Template ───
  const template = await prisma.packageTemplate.create({
    data: {
      name: "8-Class Math Pack",
      subjectId: math.id,
      classesIncluded: 8,
      validityDays: 60,
      suggestedPrice: 440,
      description: "Standard 8-class mathematics package",
      isPopular: true,
    },
  })

  // ─── 1 Package ───
  const pkg = await prisma.package.create({
    data: {
      name: "8-Class Mathematics Pack",
      studentId: student.id,
      teacherId: teacherProfile.id,
      subjectId: math.id,
      templateId: template.id,
      classesIncluded: 8,
      classesUsed: 2,
      pricePerClass: 55,
      totalPrice: 440,
      validityDays: 60,
      startDate: new Date("2026-03-01"),
      expiryDate: new Date("2026-04-30"),
    },
  })
  console.log("📦 1 template + 1 package created")

  // ─── 2 Classes ───
  await prisma.class.create({
    data: {
      studentId: student.id,
      teacherId: teacherProfile.id,
      subjectId: math.id,
      packageId: pkg.id,
      scheduledAt: new Date("2026-04-02T14:00:00Z"),
      duration: 60,
      status: "SCHEDULED",
      topicCovered: "Algebra Basics",
    },
  })
  await prisma.class.create({
    data: {
      studentId: student.id,
      teacherId: teacherProfile.id,
      subjectId: math.id,
      packageId: pkg.id,
      scheduledAt: new Date("2026-03-28T14:00:00Z"),
      duration: 60,
      status: "COMPLETED",
      topicCovered: "Linear Equations",
      completedAt: new Date("2026-03-28T15:00:00Z"),
      parentRating: 5,
    },
  })
  console.log("📅 2 classes created")

  // ─── 1 Payment ───
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  await prisma.payment.create({
    data: {
      studentId: student.id,
      packageId: pkg.id,
      amount: 440,
      method: "BANK_TRANSFER",
      status: "CONFIRMED",
      confirmedById: adminUser!.id,
      confirmedAt: new Date("2026-03-01"),
    },
  })
  console.log("💰 1 payment created")

  // ─── Summary ───
  console.log("\n✅ TEST seed completed!")
  console.log("─────────────────────────────────")
  console.log("🔑 All users password: Test@1234")
  console.log("   Admin:       admin@test.com")
  console.log("   Coordinator: coordinator@test.com")
  console.log("   Teacher:     teacher@test.com")
  console.log("   Parent:      parent@test.com")
  console.log("─────────────────────────────────")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
