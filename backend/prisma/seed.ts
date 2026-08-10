import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const hash = (password: string) => bcrypt.hash(password, 10);

async function main() {
  console.log('🌱 Starting seed...\n');

  // ── Users ──────────────────────────────────────────────────────────────────

  const usersData = [
    { name: 'Super Admin',    email: 'admin@erp.com',       password: 'Admin@123',     role: 'ADMIN'     },
    { name: 'Rahul Sharma',   email: 'sales1@erp.com',      password: 'Sales@123',     role: 'SALES'     },
    { name: 'Pooja Nair',     email: 'sales2@erp.com',      password: 'Sales@123',     role: 'SALES'     },
    { name: 'Vikram Singh',   email: 'sales3@erp.com',      password: 'Sales@123',     role: 'SALES'     },
    { name: 'Amit Verma',     email: 'warehouse1@erp.com',  password: 'Warehouse@123', role: 'WAREHOUSE' },
    { name: 'Sneha Patil',    email: 'warehouse2@erp.com',  password: 'Warehouse@123', role: 'WAREHOUSE' },
    { name: 'Priya Mehta',    email: 'accounts1@erp.com',   password: 'Accounts@123',  role: 'ACCOUNTS'  },
    { name: 'Deepak Joshi',   email: 'accounts2@erp.com',   password: 'Accounts@123',  role: 'ACCOUNTS'  },
    { name: 'Anita Desai',    email: 'sales4@erp.com',      password: 'Sales@123',     role: 'SALES'     },
  ] as const;

  const createdUsers: Record<string, string> = {};

  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      createdUsers[u.email] = existing.id;
      console.log(`⏭️  User exists: ${u.email}`);
      continue;
    }
    const user = await prisma.user.create({
      data: { name: u.name, email: u.email, passwordHash: await hash(u.password), role: u.role },
    });
    createdUsers[u.email] = user.id;
    console.log(`✅ User created: ${u.email} (${u.role})`);
  }

  // ── Products ───────────────────────────────────────────────────────────────

  const productsData = [
    // Electronics
    { name: 'Samsung 65W USB-C Charger',       sku: 'ELEC-CHG-001', category: 'Electronics',  unitPrice: '1299.00', currentStock: 150, minimumStock: 20,  warehouseLocation: 'Rack A1 - Shelf 2' },
    { name: 'HP Ink Cartridge Black 680',       sku: 'ELEC-INK-001', category: 'Electronics',  unitPrice: '899.00',  currentStock: 8,   minimumStock: 15,  warehouseLocation: 'Rack A2 - Shelf 4' },
    { name: 'Logitech Wireless Mouse M235',     sku: 'ELEC-MOU-001', category: 'Electronics',  unitPrice: '1499.00', currentStock: 75,  minimumStock: 10,  warehouseLocation: 'Rack A1 - Shelf 3' },
    { name: 'TP-Link 8 Port Network Switch',    sku: 'ELEC-NET-001', category: 'Electronics',  unitPrice: '2199.00', currentStock: 30,  minimumStock: 5,   warehouseLocation: 'Rack A3 - Shelf 1' },
    { name: 'Zebronics USB Keyboard',           sku: 'ELEC-KEY-001', category: 'Electronics',  unitPrice: '699.00',  currentStock: 60,  minimumStock: 10,  warehouseLocation: 'Rack A1 - Shelf 4' },
    // Stationery
    { name: 'A4 Copier Paper 500 Sheets',       sku: 'STAT-PAP-001', category: 'Stationery',   unitPrice: '349.00',  currentStock: 500, minimumStock: 50,  warehouseLocation: 'Rack B3 - Shelf 1' },
    { name: 'Classmate Notebook 200 Pages',     sku: 'STAT-NB-001',  category: 'Stationery',   unitPrice: '89.00',   currentStock: 300, minimumStock: 50,  warehouseLocation: 'Rack B3 - Shelf 2' },
    { name: 'Pilot Ball Pen Blue Box of 10',    sku: 'STAT-PEN-001', category: 'Stationery',   unitPrice: '120.00',  currentStock: 200, minimumStock: 30,  warehouseLocation: 'Rack B2 - Shelf 1' },
    { name: 'Scotch Tape 24mm x 66m',           sku: 'STAT-TAP-001', category: 'Stationery',   unitPrice: '55.00',   currentStock: 12,  minimumStock: 20,  warehouseLocation: 'Rack B1 - Shelf 3' },
    // Packaging
    { name: 'Bubble Wrap Roll 50m',             sku: 'PACK-BW-001',  category: 'Packaging',    unitPrice: '450.00',  currentStock: 40,  minimumStock: 10,  warehouseLocation: 'Rack C1 - Shelf 1' },
    { name: 'Corrugated Box 12x10x8 inch',      sku: 'PACK-BOX-001', category: 'Packaging',    unitPrice: '35.00',   currentStock: 600, minimumStock: 100, warehouseLocation: 'Rack C2 - Shelf 1' },
    { name: 'Stretch Film Roll 400m',           sku: 'PACK-SF-001',  category: 'Packaging',    unitPrice: '380.00',  currentStock: 25,  minimumStock: 8,   warehouseLocation: 'Rack C1 - Shelf 2' },
    // Cleaning
    { name: 'Phenyl Floor Cleaner 5L',          sku: 'CLEN-PH-001',  category: 'Cleaning',     unitPrice: '299.00',  currentStock: 50,  minimumStock: 10,  warehouseLocation: 'Rack D1 - Shelf 1' },
    { name: 'Hand Sanitizer 500ml',             sku: 'CLEN-HS-001',  category: 'Cleaning',     unitPrice: '199.00',  currentStock: 6,   minimumStock: 15,  warehouseLocation: 'Rack D1 - Shelf 2' },
    // Safety
    { name: 'Safety Helmet ISI Marked',         sku: 'SAFE-HLM-001', category: 'Safety',       unitPrice: '550.00',  currentStock: 35,  minimumStock: 5,   warehouseLocation: 'Rack E1 - Shelf 1' },
  ];

  const createdProducts: Record<string, string> = {};

  for (const p of productsData) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) {
      createdProducts[p.sku] = existing.id;
      console.log(`⏭️  Product exists: ${p.sku}`);
      continue;
    }
    const product = await prisma.product.create({
      data: { ...p, unitPrice: p.unitPrice },
    });
    createdProducts[p.sku] = product.id;
    console.log(`✅ Product created: ${p.name} (${p.sku})`);
  }

  // ── Customers ──────────────────────────────────────────────────────────────

  const customersData = [
    { name: 'Rajesh Kumar',   mobile: '9876543210', email: 'rajesh@abctrades.com',    businessName: 'ABC Traders Pvt Ltd',      gstNumber: '27AAPFU0939F1ZV', customerType: 'WHOLESALE'   as const, address: '123 MG Road, Pune, Maharashtra 411001',          status: 'ACTIVE'   as const, notes: 'Bulk electronics buyer. Prefers monthly invoicing.' },
    { name: 'Sunita Patel',   mobile: '9123456780', email: 'sunita@retailzone.com',   businessName: 'Retail Zone',              gstNumber: null,               customerType: 'RETAIL'      as const, address: '45 Nehru Street, Ahmedabad, Gujarat 380001',      status: 'ACTIVE'   as const, notes: 'Regular stationery orders.' },
    { name: 'Manoj Gupta',    mobile: '9988776655', email: 'manoj@guptadist.com',     businessName: 'Gupta Distributors',       gstNumber: '07AAACG1234F1Z5', customerType: 'DISTRIBUTOR' as const, address: '78 Connaught Place, New Delhi 110001',            status: 'ACTIVE'   as const, notes: 'Distributor for North India region.' },
    { name: 'Kavita Reddy',   mobile: '9871234560', email: 'kavita@southmart.com',    businessName: 'South Mart Enterprises',   gstNumber: '36AABCS5432M1ZP', customerType: 'WHOLESALE'   as const, address: '12 Banjara Hills, Hyderabad, Telangana 500034',   status: 'LEAD'     as const, notes: 'Interested in packaging materials.' },
    { name: 'Farhan Sheikh',  mobile: '9765432100', email: 'farhan@fstrading.com',    businessName: 'FS Trading Co',            gstNumber: null,               customerType: 'RETAIL'      as const, address: '56 Linking Road, Mumbai, Maharashtra 400050',    status: 'LEAD'     as const, notes: 'New lead from trade fair.' },
    { name: 'Deepa Iyer',     mobile: '9654321098', email: 'deepa@iverlogistics.com', businessName: 'Iyer Logistics Pvt Ltd',   gstNumber: '33AABCI7654K1ZQ', customerType: 'DISTRIBUTOR' as const, address: '34 Anna Salai, Chennai, Tamil Nadu 600002',      status: 'ACTIVE'   as const, notes: 'Handles South India distribution.' },
    { name: 'Suresh Yadav',   mobile: '9543210987', email: 'suresh@yadavwholesale.com', businessName: 'Yadav Wholesale Mart',   gstNumber: '09AAACY4321J1ZR', customerType: 'WHOLESALE'   as const, address: '90 Hazratganj, Lucknow, Uttar Pradesh 226001',   status: 'INACTIVE' as const, notes: 'Account on hold due to pending payment.' },
  ];

  const createdCustomers: Record<string, string> = {};

  for (const c of customersData) {
    const existing = await prisma.customer.findUnique({ where: { mobile: c.mobile } });
    if (existing) {
      createdCustomers[c.mobile] = existing.id;
      console.log(`⏭️  Customer exists: ${c.name}`);
      continue;
    }
    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        mobile: c.mobile,
        email: c.email,
        businessName: c.businessName,
        customerType: c.customerType,
        address: c.address,
        status: c.status,
        notes: c.notes,
        ...(c.gstNumber ? { gstNumber: c.gstNumber } : {}),
      },
    });
    createdCustomers[c.mobile] = customer.id;
    console.log(`✅ Customer created: ${c.name}`);
  }

  // ── Stock Movements (IN) ───────────────────────────────────────────────────

  const warehouseUserId = createdUsers['warehouse1@erp.com']!;

  const stockMovements = [
    { sku: 'ELEC-CHG-001', quantity: 200, reason: 'Initial stock from supplier - Invoice #SUP-2025-001' },
    { sku: 'ELEC-INK-001', quantity: 30,  reason: 'Initial stock from supplier - Invoice #SUP-2025-002' },
    { sku: 'ELEC-MOU-001', quantity: 100, reason: 'Initial stock from supplier - Invoice #SUP-2025-003' },
    { sku: 'STAT-PAP-001', quantity: 600, reason: 'Monthly restock - Invoice #SUP-2025-004' },
    { sku: 'PACK-BOX-001', quantity: 800, reason: 'Initial stock from supplier - Invoice #SUP-2025-005' },
  ];

  for (const m of stockMovements) {
    const productId = createdProducts[m.sku];
    if (!productId) continue;
    const exists = await prisma.stockMovement.findFirst({ where: { productId, reason: m.reason } });
    if (exists) {
      console.log(`⏭️  Stock movement exists: ${m.sku}`);
      continue;
    }
    await prisma.stockMovement.create({
      data: { productId, quantity: m.quantity, type: 'IN', reason: m.reason, createdBy: warehouseUserId },
    });
    console.log(`✅ Stock IN: ${m.sku} +${m.quantity}`);
  }

  // ── Follow-up Notes ────────────────────────────────────────────────────────

  const salesUserId = createdUsers['sales1@erp.com']!;
  const rajeshId    = createdCustomers['9876543210'];
  const manojId    = createdCustomers['9988776655'];

  if (rajeshId) {
    const existingNote = await prisma.followUpNote.findFirst({ where: { customerId: rajeshId } });
    if (!existingNote) {
      await prisma.followUpNote.createMany({
        data: [
          { customerId: rajeshId, content: 'Called customer. Interested in 200 units of Samsung charger. Will confirm by Friday.', createdBy: salesUserId },
          { customerId: rajeshId, content: 'Sent product catalogue via email. Awaiting response on bulk pricing.', createdBy: salesUserId },
        ],
      });
      console.log('✅ Follow-up notes created for Rajesh Kumar');
    }
  }

  if (manojId) {
    const existingNote = await prisma.followUpNote.findFirst({ where: { customerId: manojId } });
    if (!existingNote) {
      await prisma.followUpNote.create({
        data: { customerId: manojId, content: 'Discussed Q3 distribution plan. Needs 500 boxes monthly.', createdBy: salesUserId },
      });
      console.log('✅ Follow-up note created for Manoj Gupta');
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed complete!\n');
  console.log('👤 Test Credentials:');
  console.log('   ADMIN     → admin@erp.com       / Admin@123');
  console.log('   SALES     → sales1@erp.com      / Sales@123');
  console.log('   SALES     → sales2@erp.com      / Sales@123');
  console.log('   SALES     → sales3@erp.com      / Sales@123');
  console.log('   SALES     → sales4@erp.com      / Sales@123');
  console.log('   WAREHOUSE → warehouse1@erp.com  / Warehouse@123');
  console.log('   WAREHOUSE → warehouse2@erp.com  / Warehouse@123');
  console.log('   ACCOUNTS  → accounts1@erp.com   / Accounts@123');
  console.log('   ACCOUNTS  → accounts2@erp.com   / Accounts@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
