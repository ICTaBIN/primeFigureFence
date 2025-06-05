import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import getDatabase from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = (session.user as any).companyId
    const db = getDatabase()

    const customers = db
      .prepare(`
      SELECT * FROM customers 
      WHERE company_id = ?
      ORDER BY created_at DESC
    `)
      .all(companyId)

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, phone, address } = await request.json()
    const companyId = (session.user as any).companyId
    const db = getDatabase()

    const result = db
      .prepare(`
      INSERT INTO customers (company_id, name, email, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `)
      .run(companyId, name, email, phone, address)

    return NextResponse.json({
      success: true,
      customerId: result.lastInsertRowid,
    })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
