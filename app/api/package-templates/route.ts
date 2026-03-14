import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST /api/package-templates — admin creates a package template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { name, subjectId, classesIncluded, validityDays, suggestedPrice, description, isPopular } = body

    if (!name || !subjectId || !classesIncluded || !validityDays || !suggestedPrice) {
      return NextResponse.json(
        { error: "name, subjectId, classesIncluded, validityDays, and suggestedPrice are required." },
        { status: 400 }
      )
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    const template = await prisma.packageTemplate.create({
      data: {
        name: name.trim(),
        subjectId,
        classesIncluded: parseInt(classesIncluded),
        validityDays: parseInt(validityDays),
        suggestedPrice: parseFloat(suggestedPrice),
        description: description?.trim() || null,
        isPopular: isPopular ?? false,
        status: "ACTIVE",
      },
      include: { subject: { select: { name: true } } },
    })

    return NextResponse.json(
      {
        message: "Package template created successfully",
        template: {
          id: template.id,
          name: template.name,
          subject: template.subject.name,
          classesIncluded: template.classesIncluded,
          suggestedPrice: Number(template.suggestedPrice),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/package-templates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
