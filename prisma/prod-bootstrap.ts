// prisma/prod-bootstrap.ts
// Usage: NODE_ENV=production npx tsx prisma/prod-bootstrap.ts <admin-email> <admin-password>

import { PrismaClient, SubjectCategory } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.argv[2]
  const adminPassword = process.argv[3]

  if (!adminEmail || !adminPassword) {
    console.error("Usage: npx tsx prisma/prod-bootstrap.ts <admin-email> <admin-password>")
    process.exit(1)
  }

  if (adminPassword.length < 12) {
    console.error("Production admin password must be at least 12 characters")
    process.exit(1)
  }

  console.log("🚀 Expert Guru — Production Bootstrap")
  console.log("=====================================\n")

  // ─── 1. PLATFORM SETTINGS ───
  const existingSettings = await prisma.platformSettings.findFirst({ where: { id: "default" } })
  if (!existingSettings) {
    await prisma.platformSettings.create({
      data: {
        id: "default",
        platformName: "Expert Guru",
        supportEmail: "support@expertguru.net",
        supportPhone: "+1 (555) 100-2000",   // ← Replace with real number
        defaultTimezone: "America/New_York",
        currency: "USD",
        // ─ Student Cancellation Policy ─
        studentFreeWindow: 24,
        lateCancelPenalty: 50,
        noShowPenalty: 100,
        // ─ Teacher Policy ─
        teacherMaxCancellations: 3,
        teacherNoShowRatingHit: 0.5,
        // ─ Reschedule Policy ─
        rescheduleWindowHours: 24,
        rescheduleLateFeePercent: 50,
        rescheduleHardCutoffHours: 2,
        maxReschedulesPerClass: 2,
        // ─ Cancel Policy ─
        cancelFreeWindowHours: 24,
        cancelLateFeePercent: 50,
        cancelHardCutoffHours: 2,
        cancelHardCutoffFeePercent: 100,
        // ─ Trial Classes ─
        trialClassEnabled: true,
        // ─ Alerts ─
        lowBalanceThreshold: 2,
        // ─ Security ─
        minPasswordLength: 8,
        passwordResetExpiry: 24,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        // ─ Coordinator Permissions ─
        coordinatorCanConfirmPayments: false,
        // ─ Referral Program ─
        referralEnabled: true,
        referralRewardAmount: 25,
        // ─ Welcome Offer ─
        welcomeOfferEnabled: true,
        welcomeOfferAmount: 10,
      },
    })
    console.log("✅ Platform settings created with production defaults")
  } else {
    console.log("⏭️  Platform settings already exist — skipping")
  }

  // ─── 2. ADMIN USER ───
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase().trim() },
  })
  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 12)
    const admin = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase().trim(),
        passwordHash: hash,
        role: "ADMIN",
        status: "ACTIVE",
        firstName: "Admin",
        lastName: "User",
        emailVerified: new Date(),
      },
    })
    console.log(`✅ Admin user created: ${admin.email}`)
  } else {
    console.log(`⏭️  Admin user already exists: ${adminEmail}`)
  }

  // ─── 3. SUBJECT CATALOG ───
  // These are your real tutoring subjects. Add/remove as needed.
  const subjectCatalog = [
    { name: "Mathematics",        category: SubjectCategory.MATH,             basePriceHour: 55 },
    { name: "Physics",            category: SubjectCategory.SCIENCE,          basePriceHour: 55 },
    { name: "Chemistry",          category: SubjectCategory.SCIENCE,          basePriceHour: 55 },
    { name: "Biology",            category: SubjectCategory.SCIENCE,          basePriceHour: 50 },
    { name: "English",            category: SubjectCategory.ENGLISH,          basePriceHour: 45 },
    { name: "SAT Prep",           category: SubjectCategory.TEST_PREP,        basePriceHour: 65 },
    { name: "ACT Prep",           category: SubjectCategory.TEST_PREP,        basePriceHour: 65 },
    { name: "AP Calculus",        category: SubjectCategory.MATH,             basePriceHour: 60 },
    { name: "AP Physics",         category: SubjectCategory.SCIENCE,          basePriceHour: 60 },
    { name: "Computer Science",   category: SubjectCategory.COMPUTER_SCIENCE, basePriceHour: 55 },
    { name: "Spanish",            category: SubjectCategory.LANGUAGES,        basePriceHour: 45 },
    { name: "French",             category: SubjectCategory.LANGUAGES,        basePriceHour: 45 },
  ]

  let created = 0, skipped = 0
  for (const s of subjectCatalog) {
    const existing = await prisma.subject.findUnique({ where: { name: s.name } })
    if (!existing) {
      await prisma.subject.create({ data: s })
      created++
    } else {
      skipped++
    }
  }
  console.log(`✅ Subjects: ${created} created, ${skipped} already existed`)

  // ─── 4. PACKAGE TEMPLATES (optional — admin can create more via UI) ───
  const templateCount = await prisma.packageTemplate.count()
  if (templateCount === 0) {
    const mathSubject = await prisma.subject.findUnique({ where: { name: "Mathematics" } })
    const physicsSubject = await prisma.subject.findUnique({ where: { name: "Physics" } })
    const satSubject = await prisma.subject.findUnique({ where: { name: "SAT Prep" } })

    const templates = [
      { name: "4-Class Starter",   subjectId: mathSubject?.id,    classesIncluded: 4,  validityDays: 30, suggestedPrice: 200, isPopular: false },
      { name: "8-Class Standard",  subjectId: mathSubject?.id,    classesIncluded: 8,  validityDays: 60, suggestedPrice: 380, isPopular: true },
      { name: "12-Class Premium",  subjectId: mathSubject?.id,    classesIncluded: 12, validityDays: 90, suggestedPrice: 540, isPopular: false },
      { name: "4-Class Starter",   subjectId: physicsSubject?.id, classesIncluded: 4,  validityDays: 30, suggestedPrice: 200, isPopular: false },
      { name: "8-Class Standard",  subjectId: physicsSubject?.id, classesIncluded: 8,  validityDays: 60, suggestedPrice: 380, isPopular: true },
      { name: "SAT Prep Intensive", subjectId: satSubject?.id,    classesIncluded: 16, validityDays: 90, suggestedPrice: 960, isPopular: true },
    ].filter(t => t.subjectId) // skip if subject not found

    for (const t of templates) {
      await prisma.packageTemplate.create({
        data: {
          name: t.name,
          subjectId: t.subjectId!,
          classesIncluded: t.classesIncluded,
          validityDays: t.validityDays,
          suggestedPrice: t.suggestedPrice,
          isPopular: t.isPopular,
        },
      })
    }
    console.log(`✅ ${templates.length} package templates created`)
  } else {
    console.log(`⏭️  Package templates already exist (${templateCount}) — skipping`)
  }

  // ─── SUMMARY ───
  console.log("\n=====================================")
  console.log("📊 Production Database Summary:")
  console.log(`   Platform Settings: ${await prisma.platformSettings.count()}`)
  console.log(`   Admin Users:       ${await prisma.user.count({ where: { role: "ADMIN" } })}`)
  console.log(`   Subjects:          ${await prisma.subject.count()}`)
  console.log(`   Package Templates: ${await prisma.packageTemplate.count()}`)
  console.log("=====================================")
  console.log("\n🎯 Next steps:")
  console.log("   1. Log in as admin and create Coordinator accounts")
  console.log("   2. Create Teacher accounts via Admin > Teachers")
  console.log("   3. Configure platform settings via Admin > Settings")
  console.log("   4. Parents self-register at /register")
  console.log("   5. Verify email delivery (check Resend dashboard)")
}

main()
  .catch((e) => {
    console.error("❌ Bootstrap failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
