import Database from "better-sqlite3"
import bcrypt from "bcryptjs"
import { join } from "path"
import { mkdirSync } from "fs"

// Ensure data directory exists
try {
  mkdirSync(join(process.cwd(), "data"), { recursive: true })
} catch (error) {
  // Directory already exists
}

const dbPath = join(process.cwd(), "data", "fence-platform.db")
const db = new Database(dbPath)

console.log("Seeding database...")

// Create a sample company
const companyResult = db
  .prepare(`
  INSERT INTO companies (name, contact_info)
  VALUES (?, ?)
`)
  .run("Demo Fence Company", "Phone: (555) 123-4567, Email: info@demofence.com")

const companyId = companyResult.lastInsertRowid

// Create admin user
const hashedPassword = bcrypt.hashSync("admin123", 10)
db.prepare(`
  INSERT INTO users (company_id, email, password_hash, role, name)
  VALUES (?, ?, ?, ?, ?)
`).run(companyId, "admin@demofence.com", hashedPassword, "admin", "Admin User")

// Create estimator user
const estimatorPassword = bcrypt.hashSync("estimator123", 10)
db.prepare(`
  INSERT INTO users (company_id, email, password_hash, role, name)
  VALUES (?, ?, ?, ?, ?)
`).run(companyId, "estimator@demofence.com", estimatorPassword, "estimator", "John Estimator")

// Insert default pricing templates
const pricingConfigs = [
  {
    fenceType: "wood",
    config: JSON.stringify({
      materials: {
        posts: { price: 25, spacing: 8 },
        panels: { price: 15, unit: "linear_foot" },
        gates: { price: 150 },
        hardware: { price: 5 },
      },
      labor: {
        baseRate: 12,
        heightMultiplier: { "4ft": 1.0, "6ft": 1.3, "8ft": 1.6 },
        styleMultiplier: { basic: 1.0, decorative: 1.4, premium: 1.8 },
      },
    }),
  },
  {
    fenceType: "chainlink",
    config: JSON.stringify({
      materials: {
        posts: { price: 18, spacing: 10 },
        panels: { price: 8, unit: "linear_foot" },
        gates: { price: 120 },
        hardware: { price: 3 },
      },
      labor: {
        baseRate: 8,
        heightMultiplier: { "4ft": 1.0, "6ft": 1.2, "8ft": 1.4 },
        styleMultiplier: { basic: 1.0, galvanized: 1.2, "vinyl-coated": 1.3 },
      },
    }),
  },
  {
    fenceType: "wroughtiron",
    config: JSON.stringify({
      materials: {
        posts: { price: 45, spacing: 6 },
        panels: { price: 35, unit: "linear_foot" },
        gates: { price: 300 },
        hardware: { price: 12 },
      },
      labor: {
        baseRate: 20,
        heightMultiplier: { "4ft": 1.0, "6ft": 1.4, "8ft": 1.8 },
        styleMultiplier: { basic: 1.0, ornate: 1.6, custom: 2.2 },
      },
    }),
  },
]

pricingConfigs.forEach((config) => {
  db.prepare(`
    INSERT INTO pricing_templates (company_id, fence_type, config)
    VALUES (?, ?, ?)
  `).run(companyId, config.fenceType, config.config)
})

// Create sample customers
const customers = [
  { name: "John Smith", email: "john@example.com", phone: "(555) 111-2222", address: "123 Oak St, Anytown, ST 12345" },
  {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "(555) 333-4444",
    address: "456 Pine Ave, Somewhere, ST 67890",
  },
  {
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "(555) 555-6666",
    address: "789 Elm Dr, Elsewhere, ST 11111",
  },
]

customers.forEach((customer) => {
  db.prepare(`
    INSERT INTO customers (company_id, name, email, phone, address)
    VALUES (?, ?, ?, ?, ?)
  `).run(companyId, customer.name, customer.email, customer.phone, customer.address)
})

console.log("Database seeded successfully!")
console.log("Login credentials:")
console.log("Admin: admin@demofence.com / admin123")
console.log("Estimator: estimator@demofence.com / estimator123")

db.close()
