import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST /api/package-templates — create
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

// PATCH /api/package-templates — edit fields or toggle status or duplicate
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { id, action, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 })
    }

    const existing = await prisma.packageTemplate.findUnique({
      where: { id },
      include: { subject: { select: { name: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // --- TOGGLE ---
    if (action === "toggle") {
      const newStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      const updated = await prisma.packageTemplate.update({
        where: { id },
        data: { status: newStatus },
      })
      return NextResponse.json({
        message: `Template ${newStatus === "ACTIVE" ? "enabled" : "disabled"} successfully`,
        template: { id: updated.id, status: updated.status },
      })
    }

    // --- DUPLICATE ---
    if (action === "duplicate") {
      const duplicate = await prisma.packageTemplate.create({
        data: {
          name: `${existing.name} (Copy)`,
          subjectId: existing.subjectId,
          classesIncluded: existing.classesIncluded,
          validityDays: existing.validityDays,
          suggestedPrice: existing.suggestedPrice,
          description: existing.description,
          isPopular: false,
          status: "ACTIVE",
        },
        include: { subject: { select: { name: true } } },
      })
      return NextResponse.json({
        message: "Template duplicated successfully",
        template: {
          id: duplicate.id,
          name: duplicate.name,
          subject: duplicate.subject.name,
        },
      }, { status: 201 })
    }

    // --- EDIT ---
    const updateData: any = {}
    if (fields.name !== undefined) updateData.name = fields.name.trim()
    if (fields.subjectId !== undefined) updateData.subjectId = fields.subjectId
    if (fields.classesIncluded !== undefined) updateData.classesIncluded = parseInt(fields.classesIncluded)
    if (fields.validityDays !== undefined) updateData.validityDays = parseInt(fields.validityDays)
    if (fields.suggestedPrice !== undefined) updateData.suggestedPrice = parseFloat(fields.suggestedPrice)
    if (fields.description !== undefined) updateData.description = fields.description?.trim() || null
    if (fields.isPopular !== undefined) updateData.isPopular = fields.isPopular

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updated = await prisma.packageTemplate.update({
      where: { id },
      data: updateData,
      include: { subject: { select: { name: true } } },
    })

    return NextResponse.json({
      message: "Template updated successfully",
      template: {
        id: updated.id,
        name: updated.name,
        subject: updated.subject.name,
        classesIncluded: updated.classesIncluded,
        suggestedPrice: Number(updated.suggestedPrice),
        status: updated.status,
      },
    })
  } catch (error) {
    console.error("PATCH /api/package-templates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
