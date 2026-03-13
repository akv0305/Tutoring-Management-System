import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const classes = await prisma.class.findMany({
    where: { teacher: { user: { email: "ananya.teacher@expertguru.net" } } },
    select: {
      id: true,
      scheduledAt: true,
      completedAt: true,
      status: true,
      isTrial: true,
      student: { select: { firstName: true, lastName: true } },
      subject: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })

  console.log(`Total classes for Ananya: ${classes.length}\n`)
  classes.forEach((c) => {
    console.log(
      `${c.id.slice(-8)} | ${c.scheduledAt.toISOString()} | ${c.status.padEnd(12)} | ${c.student.firstName} ${c.student.lastName} | ${c.subject.name} | trial=${c.isTrial}`
    )
  })

  console.log("\n--- Current server time ---")
  console.log("now.toISOString():", new Date().toISOString())
  console.log("now.toString():", new Date().toString())
}

main().then(() => prisma.$disconnect())