import Database from "better-sqlite3"
import bcrypt from "bcryptjs"
import { join } from "path"
import { mkdirSync, existsSync } from "fs"

// Ensure data directory exists
const dataDir = join(process.cwd(), "data")
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, "fence-platform.db")
const db = new Database(dbPath)

console.log("Seeding database...")

// Initialize tables first
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo_url TEXT,
    contact_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'estimator',
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    fence_data TEXT NOT NULL,
    pricing_data TEXT NOT NULL,
    total_cost REAL NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  CREATE TABLE IF NOT EXISTS pricing_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    fence_type TEXT NOT NULL,
    config TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );
`)

// Check if data already exists
const existingCompany = db.prepare("SELECT COUNT(*) as count FROM companies").get()
if (existingCompany.count > 0) {
  console.log("Database already seeded!")
  db.close()
  process.exit(0)
}

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
