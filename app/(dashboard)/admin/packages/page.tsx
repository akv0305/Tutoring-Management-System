import { prisma } from "@/lib/prisma"
import { PackagesClient } from "./PackagesClient"

export default async function PackagesPage() {
  // Fetch templates
  const templatesRaw = await prisma.packageTemplate.findMany({
    include: {
      subject: { select: { id: true, name: true } },
      _count: { select: { packages: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const templates = templatesRaw.map((t) => ({
    id: t.id,
    name: t.name,
    subject: t.subject.name,
    classesIncluded: t.classesIncluded,
    validityDays: t.validityDays,
    suggestedPrice: `$${Number(t.suggestedPrice)}`,
    isPopular: t.isPopular,
    status: t.status.toLowerCase(),
    timesPurchased: t._count.packages,
  }))

  // Fetch purchased packages
  const purchasedRaw = await prisma.package.findMany({
    include: {
      student: { select: { firstName: true, lastName: true } },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      subject: { select: { name: true } },
      template: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const purchased = purchasedRaw.map((p) => ({
    id: p.id,
    packageName: p.name,
    templateName: p.template?.name ?? "Custom",
    student: `${p.student.firstName} ${p.student.lastName}`,
    teacher: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
    subject: p.subject.name,
    classesIncluded: p.classesIncluded,
    classesUsed: p.classesUsed,
    pricePerClass: `$${Number(p.pricePerClass)}`,
    totalPrice: `$${Number(p.totalPrice)}`,
    validity: `${p.validityDays} days`,
    expiryDate: p.expiryDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    status: p.status.toLowerCase(),
  }))

  const kpis = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter((t) => t.status === "active").length,
    totalPurchased: purchased.length,
    activePurchased: purchased.filter((p) => p.status === "active").length,
    totalRevenue: purchased.reduce((sum, p) => sum + Number(p.totalPrice.replace("$", "")), 0),
  }

  // Fetch subjects for the create modal
  const subjectsRaw = await prisma.subject.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return <PackagesClient templates={templates} purchased={purchased} kpis={kpis} subjects={subjectsRaw} />
}
