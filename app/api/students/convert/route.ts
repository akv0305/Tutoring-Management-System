import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!["ADMIN", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { studentId, teacherId, subjectId, templateId, classesIncluded, pricePerClass, validityDays, packageName } = body

    if (!studentId || !teacherId || !subjectId) {
      return NextResponse.json({ error: "studentId, teacherId, and subjectId are required" }, { status: 400 })
    }

    // Verify student exists and is in trial_completed stage
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    if (student.onboardingStage !== "TRIAL_COMPLETED" && student.onboardingStage !== "NEW_LEAD" && student.onboardingStage !== "TRIAL_SCHEDULED") {
      return NextResponse.json({ error: `Student is already ${student.onboardingStage.toLowerCase()}. Cannot convert.` }, { status: 400 })
    }

    // If templateId provided, fetch template defaults
    let finalClasses = classesIncluded
    let finalPrice = pricePerClass
    let finalValidity = validityDays
    let finalName = packageName

    if (templateId) {
      const template = await prisma.packageTemplate.findUnique({ where: { id: templateId } })
      if (template) {
        finalClasses = finalClasses || template.classesIncluded
        finalPrice = finalPrice || Number(template.suggestedPrice) / template.classesIncluded
        finalValidity = finalValidity || template.validityDays
        finalName = finalName || template.name
      }
    }

    if (!finalClasses || !finalPrice || !finalValidity) {
      return NextResponse.json({ error: "classesIncluded, pricePerClass, and validityDays are required" }, { status: 400 })
    }

    const totalPrice = finalClasses * finalPrice
    const startDate = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + finalValidity)

    // Run conversion in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the package
      const pkg = await tx.package.create({
        data: {
          name: finalName || `${finalClasses}-Class Package`,
          studentId,
          teacherId,
          subjectId,
          classesIncluded: finalClasses,
          classesUsed: 0,
          pricePerClass: finalPrice,
          totalPrice,
          validityDays: finalValidity,
          startDate,
          expiryDate,
          status: "ACTIVE",
          templateId: templateId || null,
        },
      })

      // 2. Update student status
      await tx.student.update({
        where: { id: studentId },
        data: {
          status: "ACTIVE",
          onboardingStage: "CONVERTED",
        },
      })

      // 3. Mark trial as taken for this subject
      await tx.studentSubject.updateMany({
        where: { studentId, subjectId },
        data: { trialTaken: true },
      })

      // 4. Create a PENDING payment record
      const payment = await tx.payment.create({
        data: {
          studentId,
          packageId: pkg.id,
          amount: totalPrice,
          method: "BANK_TRANSFER",
          status: "PENDING",
        },
      })

      return { package: pkg, payment }
    })

    return NextResponse.json({
      message: "Student converted successfully",
      package: { id: result.package.id, name: result.package.name, totalPrice: Number(result.package.totalPrice) },
      payment: { id: result.payment.id, amount: Number(result.payment.amount), status: result.payment.status },
    }, { status: 201 })
  } catch (error) {
    console.error("POST /api/students/convert error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
