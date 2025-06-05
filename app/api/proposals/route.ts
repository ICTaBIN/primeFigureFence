import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { customer, fenceData, calculation, title } = await request.json()
    const companyId = (session.user as any).companyId

    // Insert or get customer
    let customerId
    const existingCustomer = db
      .prepare("SELECT id FROM customers WHERE email = ? AND company_id = ?")
      .get(customer.email, companyId) as any

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const customerResult = db
        .prepare(`
        INSERT INTO customers (company_id, name, email, phone, address)
        VALUES (?, ?, ?, ?, ?)
      `)
        .run(companyId, customer.name, customer.email, customer.phone, customer.address)
      customerId = customerResult.lastInsertRowid
    }

    // Insert proposal
    const proposalResult = db
      .prepare(`
      INSERT INTO proposals (company_id, customer_id, title, fence_data, pricing_data, total_cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .run(companyId, customerId, title, JSON.stringify(fenceData), JSON.stringify(calculation), calculation.total)

    return NextResponse.json({
      success: true,
      proposalId: proposalResult.lastInsertRowid,
    })
  } catch (error) {
    console.error("Error saving proposal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = (session.user as any).companyId
    const proposals = db
      .prepare(`
      SELECT p.*, c.name as customer_name, c.email as customer_email
      FROM proposals p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.company_id = ?
      ORDER BY p.created_at DESC
    `)
      .all(companyId)

    return NextResponse.json(proposals)
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
