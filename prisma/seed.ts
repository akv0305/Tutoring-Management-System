import { PrismaClient, UserRole, SubjectCategory, DayOfWeek } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting seed...")

  // Clean existing data (in reverse dependency order)
  await prisma.referral.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.teacherBlockedDate.deleteMany()
  await prisma.teacherAvailability.deleteMany()
  await prisma.refundRequest.deleteMany()
  await prisma.payout.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.class.deleteMany()
  await prisma.package.deleteMany()
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

  // ─── Password hash (shared for all seed users) ───
  const hash = await bcrypt.hash("Password123!", 12)

  // ─── PLATFORM SETTINGS ───
  await prisma.platformSettings.create({
    data: { id: "default" },
  })
  console.log("⚙️  Platform settings created")

  // ─── ADMIN USER ───
  const admin = await prisma.user.create({
    data: {
      email: "admin@expertguru.net",
      passwordHash: hash,
      role: UserRole.ADMIN,
      firstName: "Rajesh",
      lastName: "Kumar",
      phone: "+1-555-100-0001",
    },
  })
  console.log("👤 Admin created:", admin.email)

  // ─── SUBJECTS ───
  const subjectsData = [
    { name: "Mathematics", category: SubjectCategory.MATH, basePriceHour: 55 },
    { name: "Physics", category: SubjectCategory.SCIENCE, basePriceHour: 55 },
    { name: "Chemistry", category: SubjectCategory.SCIENCE, basePriceHour: 55 },
    { name: "Biology", category: SubjectCategory.SCIENCE, basePriceHour: 50 },
    { name: "English", category: SubjectCategory.ENGLISH, basePriceHour: 45 },
    { name: "SAT Prep", category: SubjectCategory.TEST_PREP, basePriceHour: 65 },
    { name: "ACT Prep", category: SubjectCategory.TEST_PREP, basePriceHour: 65 },
    { name: "AP Calculus", category: SubjectCategory.MATH, basePriceHour: 60 },
    { name: "AP Physics", category: SubjectCategory.SCIENCE, basePriceHour: 60 },
    { name: "Computer Science", category: SubjectCategory.COMPUTER_SCIENCE, basePriceHour: 55 },
    { name: "Spanish", category: SubjectCategory.LANGUAGES, basePriceHour: 45 },
    { name: "French", category: SubjectCategory.LANGUAGES, basePriceHour: 45 },
  ]

  const subjects: Record<string, string> = {}
  for (const s of subjectsData) {
    const created = await prisma.subject.create({
      data: {
        name: s.name,
        category: s.category,
        basePriceHour: s.basePriceHour,
      },
    })
    subjects[s.name] = created.id
  }
  console.log("📚 12 subjects created")

  // ─── COORDINATORS (2) ───
  const coord1User = await prisma.user.create({
    data: {
      email: "sarah.coord@expertguru.net",
      passwordHash: hash,
      role: UserRole.COORDINATOR,
      firstName: "Sarah",
      lastName: "Wilson",
      phone: "+1-555-200-0001",
    },
  })
  const coord1 = await prisma.coordinatorProfile.create({
    data: { userId: coord1User.id, bucketSize: 50 },
  })

  const coord2User = await prisma.user.create({
    data: {
      email: "mike.coord@expertguru.net",
      passwordHash: hash,
      role: UserRole.COORDINATOR,
      firstName: "Mike",
      lastName: "Chen",
      phone: "+1-555-200-0002",
    },
  })
  const coord2 = await prisma.coordinatorProfile.create({
    data: { userId: coord2User.id, bucketSize: 40 },
  })
  console.log("🎯 2 coordinators created")

  // ─── TEACHERS (4) ───
  const teachersData = [
    {
      email: "ananya.teacher@expertguru.net",
      firstName: "Ananya",
      lastName: "Sharma",
      qualification: "Ph.D. Mathematics, IIT Delhi",
      bio: "15 years of teaching experience specializing in advanced mathematics and calculus.",
      experience: 15,
      compensationRate: 25,
      studentFacingRate: 55,
      rating: 4.9,
      totalReviews: 156,
      subjectNames: ["Mathematics", "AP Calculus", "SAT Prep"],
    },
    {
      email: "vikram.teacher@expertguru.net",
      firstName: "Vikram",
      lastName: "Rao",
      qualification: "M.Sc. Physics, IISc Bangalore",
      bio: "Former professor with deep expertise in mechanics, electromagnetism, and test prep strategies.",
      experience: 12,
      compensationRate: 25,
      studentFacingRate: 55,
      rating: 4.8,
      totalReviews: 134,
      subjectNames: ["Physics", "AP Physics", "SAT Prep"],
    },
    {
      email: "deepika.teacher@expertguru.net",
      firstName: "Deepika",
      lastName: "Nair",
      qualification: "M.A. English Literature, JNU",
      bio: "Published author and English language specialist with a passion for creative writing.",
      experience: 8,
      compensationRate: 20,
      studentFacingRate: 45,
      rating: 4.7,
      totalReviews: 98,
      subjectNames: ["English", "SAT Prep"],
    },
    {
      email: "suresh.teacher@expertguru.net",
      firstName: "Suresh",
      lastName: "Iyer",
      qualification: "M.Tech Computer Science, NIT",
      bio: "Software engineer turned educator. Makes complex CS concepts simple and fun.",
      experience: 6,
      compensationRate: 22,
      studentFacingRate: 55,
      rating: 4.6,
      totalReviews: 72,
      subjectNames: ["Computer Science", "Mathematics"],
    },
  ]

  const teacherProfiles: Record<string, string> = {}

  for (const t of teachersData) {
    const user = await prisma.user.create({
      data: {
        email: t.email,
        passwordHash: hash,
        role: UserRole.TEACHER,
        firstName: t.firstName,
        lastName: t.lastName,
        phone: "+1-555-300-000" + Math.floor(Math.random() * 9 + 1),
      },
    })

    const profile = await prisma.teacherProfile.create({
      data: {
        userId: user.id,
        qualification: t.qualification,
        bio: t.bio,
        experience: t.experience,
        compensationRate: t.compensationRate,
        studentFacingRate: t.studentFacingRate,
        rating: t.rating,
        totalReviews: t.totalReviews,
      },
    })

    // Link subjects
    for (const subName of t.subjectNames) {
      await prisma.teacherSubject.create({
        data: { teacherId: profile.id, subjectId: subjects[subName] },
      })
    }

    // Create availability (Mon-Fri, 9am-5pm)
    const weekdays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
    for (const day of weekdays) {
      await prisma.teacherAvailability.create({
        data: {
          teacherId: profile.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          isEnabled: true,
        },
      })
    }

    teacherProfiles[t.firstName] = profile.id
  }
  console.log("👩‍🏫 4 teachers created with subjects & availability")

  // ─── PARENTS + STUDENTS (3 families) ───
  const familiesData = [
    {
      parent: { email: "jane.smith@email.com", firstName: "Jane", lastName: "Smith" },
      students: [
        { firstName: "Alex", lastName: "Smith", grade: "8", school: "Lincoln Middle School" },
      ],
    },
    {
      parent: { email: "maya.johnson@email.com", firstName: "Maya", lastName: "Johnson" },
      students: [
        { firstName: "Ryan", lastName: "Johnson", grade: "10", school: "Washington High" },
        { firstName: "Emma", lastName: "Johnson", grade: "6", school: "Lincoln Middle School" },
      ],
    },
    {
      parent: { email: "priya.patel@email.com", firstName: "Priya", lastName: "Patel" },
      students: [
        { firstName: "Arjun", lastName: "Patel", grade: "11", school: "Jefferson High" },
      ],
    },
  ]

  const studentIds: string[] = []

  for (const fam of familiesData) {
    const parentUser = await prisma.user.create({
      data: {
        email: fam.parent.email,
        passwordHash: hash,
        role: UserRole.PARENT,
        firstName: fam.parent.firstName,
        lastName: fam.parent.lastName,
        phone: "+1-555-400-000" + Math.floor(Math.random() * 9 + 1),
      },
    })

    const parentProfile = await prisma.parentProfile.create({
      data: { userId: parentUser.id },
    })

    for (const s of fam.students) {
      const student = await prisma.student.create({
        data: {
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          school: s.school,
          parentId: parentProfile.id,
          coordinatorId: studentIds.length % 2 === 0 ? coord1.id : coord2.id,
          status: "ACTIVE",
          onboardingStage: "CONVERTED",
        },
      })

      // Assign subjects
      await prisma.studentSubject.create({
        data: { studentId: student.id, subjectId: subjects["Mathematics"], trialTaken: true },
      })
      await prisma.studentSubject.create({
        data: { studentId: student.id, subjectId: subjects["Physics"], trialTaken: true },
      })

      studentIds.push(student.id)
    }
  }
  console.log("👨‍👩‍👧 3 families created (4 students)")

  // ─── PACKAGES (2 for first student) ───
  const firstStudent = studentIds[0]

  const pkg1 = await prisma.package.create({
    data: {
      name: "8-Class Mathematics Pack",
      studentId: firstStudent,
      teacherId: teacherProfiles["Ananya"],
      subjectId: subjects["Mathematics"],
      classesIncluded: 8,
      classesUsed: 5,
      pricePerClass: 55,
      totalPrice: 440,
      validityDays: 60,
      startDate: new Date("2026-02-01"),
      expiryDate: new Date("2026-04-01"),
    },
  })

  const pkg2 = await prisma.package.create({
    data: {
      name: "4-Class Physics Pack",
      studentId: firstStudent,
      teacherId: teacherProfiles["Vikram"],
      subjectId: subjects["Physics"],
      classesIncluded: 4,
      classesUsed: 2,
      pricePerClass: 55,
      totalPrice: 220,
      validityDays: 30,
      startDate: new Date("2026-02-15"),
      expiryDate: new Date("2026-03-17"),
    },
  })
  console.log("📦 2 packages created")

  // ─── CLASSES (6 sample sessions) ───
  const classesData = [
    { studentId: firstStudent, teacherId: teacherProfiles["Ananya"], subjectId: subjects["Mathematics"], packageId: pkg1.id, scheduledAt: new Date("2026-03-11T14:00:00Z"), status: "CONFIRMED" as const, topicCovered: "Polynomials Ch.5" },
    { studentId: firstStudent, teacherId: teacherProfiles["Ananya"], subjectId: subjects["Mathematics"], packageId: pkg1.id, scheduledAt: new Date("2026-03-08T14:00:00Z"), status: "COMPLETED" as const, topicCovered: "Quadratic Equations", parentRating: 5 },
    { studentId: firstStudent, teacherId: teacherProfiles["Vikram"], subjectId: subjects["Physics"], packageId: pkg2.id, scheduledAt: new Date("2026-03-13T16:00:00Z"), status: "SCHEDULED" as const, topicCovered: "Forces & Motion" },
    { studentId: firstStudent, teacherId: teacherProfiles["Vikram"], subjectId: subjects["Physics"], packageId: pkg2.id, scheduledAt: new Date("2026-03-07T16:00:00Z"), status: "COMPLETED" as const, topicCovered: "Newton's Laws", parentRating: 4 },
    { studentId: firstStudent, teacherId: teacherProfiles["Ananya"], subjectId: subjects["Mathematics"], packageId: pkg1.id, scheduledAt: new Date("2026-03-06T14:00:00Z"), status: "COMPLETED" as const, topicCovered: "Linear Equations", parentRating: 5 },
    { studentId: firstStudent, teacherId: teacherProfiles["Ananya"], subjectId: subjects["Mathematics"], packageId: pkg1.id, scheduledAt: new Date("2026-03-04T14:00:00Z"), status: "CANCELLED_STUDENT" as const, cancelReason: "Parent requested cancellation" },
  ]

  for (const c of classesData) {
    await prisma.class.create({
      data: {
        ...c,
        duration: 60,
        completedAt: c.status === "COMPLETED" ? c.scheduledAt : undefined,
        cancelledAt: c.status === "CANCELLED_STUDENT" ? c.scheduledAt : undefined,
      },
    })
  }
  console.log("📅 6 classes created")

  // ─── PAYMENTS (3) ───
  await prisma.payment.create({
    data: {
      studentId: firstStudent,
      packageId: pkg1.id,
      amount: 440,
      method: "BANK_TRANSFER",
      status: "CONFIRMED",
      confirmedById: admin.id,
      confirmedAt: new Date("2026-02-01"),
    },
  })
  await prisma.payment.create({
    data: {
      studentId: firstStudent,
      packageId: pkg2.id,
      amount: 220,
      method: "CREDIT_CARD",
      status: "CONFIRMED",
      confirmedById: admin.id,
      confirmedAt: new Date("2026-02-15"),
    },
  })
  await prisma.payment.create({
    data: {
      studentId: studentIds[1],
      amount: 240,
      method: "BANK_TRANSFER",
      status: "PENDING",
    },
  })
  console.log("💰 3 payments created")

  // ─── PAYOUTS (1) ───
  await prisma.payout.create({
    data: {
      teacherId: teacherProfiles["Ananya"],
      periodMonth: 2,
      periodYear: 2026,
      periodStartDate: new Date("2026-02-01"),
      periodEndDate: new Date("2026-02-28"),
      classesCompleted: 12,
      compensationRate: 25,
      grossAmount: 300,
      deductions: 0,
      bonus: 0,
      netAmount: 300,
      status: "PAID",
      paidAt: new Date("2026-03-01"),
    },
  })
  console.log("🏦 1 payout created")

  // ─── NOTIFICATIONS (4) ───
  const parentUser = await prisma.user.findUnique({ where: { email: "jane.smith@email.com" } })
  if (parentUser) {
    const notifs = [
      { type: "CLASS" as const, title: "Class Tomorrow at 9 AM", message: "Mathematics with Dr. Ananya Sharma on Mar 11, 9am EST" },
      { type: "PAYMENT" as const, title: "Payment Confirmed", message: "Your payment of $440 for 8-Class Math Pack has been received" },
      { type: "CLASS" as const, title: "Class Completed", message: "Physics session with Prof. Vikram Rao is marked complete. Leave a rating!" },
      { type: "SYSTEM" as const, title: "Welcome to Expert Guru", message: "Your account has been set up. Explore your dashboard!" },
    ]
    for (let i = 0; i < notifs.length; i++) {
      await prisma.notification.create({
        data: {
          userId: parentUser.id,
          type: notifs[i].type,
          title: notifs[i].title,
          message: notifs[i].message,
          isRead: i >= 2,
        },
      })
    }
  }
  console.log("🔔 4 notifications created")

  // ─── SUMMARY ───
  console.log("\n✅ Seed completed successfully!")
  console.log("─────────────────────────────────")
  console.log("📊 Summary:")
  console.log(`   Users:         ${await prisma.user.count()}`)
  console.log(`   Subjects:      ${await prisma.subject.count()}`)
  console.log(`   Coordinators:  ${await prisma.coordinatorProfile.count()}`)
  console.log(`   Teachers:      ${await prisma.teacherProfile.count()}`)
  console.log(`   Parents:       ${await prisma.parentProfile.count()}`)
  console.log(`   Students:      ${await prisma.student.count()}`)
  console.log(`   Packages:      ${await prisma.package.count()}`)
  console.log(`   Classes:       ${await prisma.class.count()}`)
  console.log(`   Payments:      ${await prisma.payment.count()}`)
  console.log(`   Payouts:       ${await prisma.payout.count()}`)
  console.log(`   Notifications: ${await prisma.notification.count()}`)
  console.log(`   Settings:      ${await prisma.platformSettings.count()}`)
  console.log("─────────────────────────────────")
  console.log("\n🔑 All users password: Password123!")
  console.log("   Admin:       admin@expertguru.net")
  console.log("   Coordinator: sarah.coord@expertguru.net")
  console.log("   Coordinator: mike.coord@expertguru.net")
  console.log("   Teacher:     ananya.teacher@expertguru.net")
  console.log("   Teacher:     vikram.teacher@expertguru.net")
  console.log("   Teacher:     deepika.teacher@expertguru.net")
  console.log("   Teacher:     suresh.teacher@expertguru.net")
  console.log("   Parent:      jane.smith@email.com")
  console.log("   Parent:      maya.johnson@email.com")
  console.log("   Parent:      priya.patel@email.com")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
