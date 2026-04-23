import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const firstName = process.argv[4] || "Admin"
  const lastName = process.argv[5] || "User"

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [firstName] [lastName]")
    process.exit(1)
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters")
    process.exit(1)
  }

  const prisma = new PrismaClient()

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      console.error(`User with email ${email} already exists`)
      process.exit(1)
    }

    const hash = await bcrypt.hash(password, 12)

    const admin = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash: hash,
        role: "ADMIN",
        status: "ACTIVE",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailVerified: new Date(),
      },
    })

    console.log(`✅ Admin created: ${admin.email} (ID: ${admin.id})`)

    // Ensure platform settings exist
    const settings = await prisma.platformSettings.findFirst({
      where: { id: "default" },
    })
    if (!settings) {
      await prisma.platformSettings.create({ data: { id: "default" } })
      console.log("⚙️  Platform settings created with defaults")
    } else {
      console.log("⚙️  Platform settings already exist")
    }
  } catch (err) {
    console.error("Failed:", err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
