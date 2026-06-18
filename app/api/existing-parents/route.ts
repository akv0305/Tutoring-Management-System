import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/existing-parents
// Returns all existing parents, with optional search
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")?.trim().toLowerCase()

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ]
    }

    const records = await prisma.existingParent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ records, total: records.length })
  } catch (error) {
    console.error("GET /api/existing-parents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/existing-parents
// Add single record or bulk import via CSV
// Body: { name?, email?, phone? } for single
// Body: { bulk: [{ name?, email?, phone? }, ...] } for CSV import
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()

    // Bulk import
    if (body.bulk && Array.isArray(body.bulk)) {
      const rows = body.bulk
      const valid: { name?: string; email?: string; phone?: string }[] = []
      const errors: string[] = []

      rows.forEach((row: any, idx: number) => {
        const email = row.email?.toString().trim().toLowerCase() || null
        const phone = row.phone?.toString().trim() || null
        const name = row.name?.toString().trim() || null

        if (!email && !phone) {
          errors.push(`Row ${idx + 1}: At least email or phone is required`)
          return
        }

        valid.push({
          ...(name && { name }),
          ...(email && { email }),
          ...(phone && { phone }),
        })
      })

      if (valid.length === 0) {
        return NextResponse.json(
          { error: "No valid rows to import", errors },
          { status: 400 }
        )
      }

      // Skip duplicates — check existing emails and phones
      const existingEmails = new Set(
        (await prisma.existingParent.findMany({
          where: { email: { in: valid.filter((v) => v.email).map((v) => v.email!) } },
          select: { email: true },
        })).map((r) => r.email?.toLowerCase())
      )

      const existingPhones = new Set(
        (await prisma.existingParent.findMany({
          where: { phone: { in: valid.filter((v) => v.phone).map((v) => v.phone!) } },
          select: { phone: true },
        })).map((r) => r.phone)
      )

      const toInsert = valid.filter((v) => {
        if (v.email && existingEmails.has(v.email.toLowerCase())) return false
        if (v.phone && !v.email && existingPhones.has(v.phone)) return false
        return true
      })

      const skipped = valid.length - toInsert.length

      if (toInsert.length > 0) {
        await prisma.existingParent.createMany({ data: toInsert as any[] })
      }

      return NextResponse.json({
        message: `Imported ${toInsert.length} records${skipped > 0 ? `, ${skipped} duplicates skipped` : ""}`,
        imported: toInsert.length,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    // Single add
    const email = body.email?.toString().trim().toLowerCase() || null
    const phone = body.phone?.toString().trim() || null
    const name = body.name?.toString().trim() || null

    if (!email && !phone) {
      return NextResponse.json(
        { error: "At least email or phone number is required." },
        { status: 400 }
      )
    }

    // Check duplicate
    if (email) {
      const existing = await prisma.existingParent.findFirst({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { error: "This email already exists in the list." },
          { status: 409 }
        )
      }
    }

    const record = await prisma.existingParent.create({
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
      },
    })

    return NextResponse.json({ message: "Added successfully", record }, { status: 201 })
  } catch (error) {
    console.error("POST /api/existing-parents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/existing-parents?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await prisma.existingParent.delete({ where: { id } })

    return NextResponse.json({ message: "Deleted successfully" })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    console.error("DELETE /api/existing-parents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
