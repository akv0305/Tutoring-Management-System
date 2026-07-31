import { NextRequest, NextResponse } from "next/server"

// GET /api/wallet/topup/cancel?orderRef=...
export async function GET(req: NextRequest) {
  return NextResponse.redirect(
    new URL("/parent/wallet?topup=cancelled", req.url)
  )
}
