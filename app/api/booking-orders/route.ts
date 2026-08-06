import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/booking-orders
// Admin: all orders. Coordinator: orders for their students. Parent: their own orders.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    const where: any = {}

    // ── Scope by role ──
    if (role === "PARENT") {
      const parent = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!parent) {
        return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
      }
      where.studentId = { in: parent.students.map((s) => s.id) }
    } else if (role === "COORDINATOR") {
      const coord = await prisma.coordinatorProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!coord) {
        return NextResponse.json({ error: "Coordinator profile not found" }, { status: 404 })
      }
      where.studentId = { in: coord.students.map((s) => s.id) }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const orders = await prisma.bookingOrder.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            parent: {
              select: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        teacher: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        subject: { select: { name: true } },
        package: { select: { name: true } },
        payment: { select: { status: true, method: true } },
        classes: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            completedAt: true,
            cancelledAt: true,
            cancelReason: true,
            isTrial: true,
          },
          orderBy: { scheduledAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const mapped = orders.map((o) => {
        const cancelledStudent = o.classes.filter((c) => c.status === "CANCELLED_STUDENT").length
        const cancelledTeacher = o.classes.filter((c) => c.status === "CANCELLED_TEACHER").length
        const noShowStudent = o.classes.filter((c) => c.status === "NO_SHOW_STUDENT").length
        const noShowTeacher = o.classes.filter((c) => c.status === "NO_SHOW_TEACHER").length
        
        const classBreakdown = {
          total: o.classes.length,
          completed: o.classes.filter((c) => c.status === "COMPLETED").length,
          scheduled: o.classes.filter((c) =>
            ["SCHEDULED", "CONFIRMED", "PENDING_PAYMENT"].includes(c.status)
          ).length,
          cancelledStudent,
          cancelledTeacher,
          noShowStudent,
          noShowTeacher,
          cancelledTotal: cancelledStudent + cancelledTeacher + noShowStudent + noShowTeacher,
        }        

      // "Delivered" = completed + scheduled (still to come)
      // "Lost" = cancelled + no-shows
      // "Owed" = totalClasses (paid for) - completed - scheduled
      //        = classes that were cancelled/no-show and not rescheduled
      const delivered = classBreakdown.completed + classBreakdown.scheduled
      const owed = o.totalClasses - delivered

      // Determine order health
      let health: "on_track" | "attention" | "credit_owed" | "fulfilled" = "on_track"
      if (delivered >= o.totalClasses) {
        health = "fulfilled"
      } else if (owed > 0 && classBreakdown.scheduled === 0) {
        health = "credit_owed"
      } else if (classBreakdown.cancelledTotal > 0) {
        health = "attention"
      }

      return {
        id: o.id,
        orderRef: o.orderRef,
        studentName: `${o.student.firstName} ${o.student.lastName}`,
        parentName: `${o.student.parent.user.firstName} ${o.student.parent.user.lastName}`,
        teacherName: `${o.teacher.user.firstName} ${o.teacher.user.lastName}`,
        subject: o.subject.name,
        packageName: o.package?.name || "—",
        totalClasses: o.totalClasses,
        totalAmount: Number(o.totalAmount),
        walletDeduction: Number(o.walletDeduction),
        couponDiscount: Number(o.couponDiscount),
        paidViaGateway: Number(o.totalAmount) - Number(o.walletDeduction) - Number(o.couponDiscount),
        paymentStatus: o.payment?.status || (Number(o.totalAmount) === 0 ? "WALLET" : o.status),
        paymentMethod: o.payment?.method || (Number(o.walletDeduction) > 0 ? "WALLET" : "—"),
        orderStatus: o.status,
        createdAt: o.createdAt.toISOString(),
        classBreakdown,
        delivered,
        owed,
        health,
        classes: o.classes.map((c) => ({
          id: c.id,
          status: c.status,
          scheduledAt: c.scheduledAt.toISOString(),
          completedAt: c.completedAt?.toISOString() || null,
          cancelledAt: c.cancelledAt?.toISOString() || null,
          cancelReason: c.cancelReason,
          isTrial: c.isTrial,
        })),
      }
    })

    // KPIs
    const kpis = {
      totalOrders: mapped.length,
      totalRevenue: mapped.reduce((s, o) => s + o.totalAmount, 0),
      totalClassesPurchased: mapped.reduce((s, o) => s + o.totalClasses, 0),
      totalClassesDelivered: mapped.reduce((s, o) => s + o.classBreakdown.completed, 0),
      totalOwed: mapped.reduce((s, o) => s + o.owed, 0),
      ordersNeedingAttention: mapped.filter((o) =>
        ["attention", "credit_owed"].includes(o.health)
      ).length,
    }

    return NextResponse.json({ orders: mapped, kpis })
  } catch (error) {
    console.error("GET /api/booking-orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
