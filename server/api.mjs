import { createHmac, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dbDir = join(projectRoot, 'db');
const dbPath = join(dbDir, 'dev.sqlite');
const port = Number.parseInt(process.env.API_PORT ?? '3000', 10);
const sessionSecret = process.env.SESSION_SECRET ?? 'local-development-secret';

mkdirSync(dbDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

function hashPassword(password, salt = randomUUID()) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(':');
  const suppliedHash = scryptSync(password, salt, 64);
  const savedHash = Buffer.from(storedHash, 'hex');

  return savedHash.length === suppliedHash.length && timingSafeEqual(savedHash, suppliedHash);
}

function sign(payload) {
  return createHmac('sha256', sessionSecret).update(payload).digest('base64url');
}

function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Date.now() + 1000 * 60 * 60 * 8
  })).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

function readToken(request) {
  const header = request.headers.authorization ?? '';

  if (!header.startsWith('Bearer ')) {
    return null;
  }

  const [payload, signature] = header.slice(7).split('.');

  if (!payload || signature !== sign(payload)) {
    return null;
  }

  const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

  if (!session.sub || session.exp < Date.now()) {
    return null;
  }

  return session.sub;
}

function getCurrentUser(request) {
  const userId = readToken(request);

  if (!userId) {
    return null;
  }

  return db.prepare(`
    SELECT users.id, users.name, users.email, users.role, members.id AS memberId, members.business_name AS businessName
    FROM users
    LEFT JOIN members ON members.user_id = users.id
    WHERE users.id = ?
  `).get(userId) ?? null;
}

function requireRole(user, roles) {
  return user && roles.includes(user.role);
}

function isAdmin(user) {
  return requireRole(user, ['superuser', 'admin']);
}

function isTenantUser(user) {
  return requireRole(user, ['tenant', 'member']);
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'space';
}

const publicOfficeFields = `
  offices.id, offices.sku, offices.name,
  COALESCE(members.business_name, offices.name) AS displayName,
  CASE
    WHEN members.business_name IS NOT NULL THEN members.business_name || '-' || offices.sku
    ELSE offices.name || '-' || offices.sku
  END AS slugSource,
  offices.floor, offices.unit_number AS unitNumber, offices.space_type AS spaceType,
  offices.address, offices.capacity,
  CASE WHEN offices.status = 'occupied' THEN 0 ELSE offices.monthly_price END AS monthly_price,
  offices.status, offices.summary,
  offices.size_sq_m AS sizeSqM,
  CASE WHEN offices.status = 'occupied' THEN 0 ELSE offices.rent_fee END AS rentFee,
  offices.optional_terms AS optionalTerms,
  offices.image_data_url AS imageDataUrl, members.business_name AS assignedBusinessName,
  members.contact_email AS tenantEmail, members.phone AS tenantPhone, members.website AS tenantWebsite,
  members.summary AS tenantSummary, members.trading_hours AS tenantTradingHours,
  members.closed_days AS tenantClosedDays, members.cover_image_data_url AS tenantCoverImageDataUrl,
  members.logo_data_url AS tenantLogoDataUrl
`;

const adminOfficeFields = `
  offices.id, offices.sku, offices.name,
  COALESCE(members.business_name, offices.name) AS displayName,
  CASE
    WHEN members.business_name IS NOT NULL THEN members.business_name || '-' || offices.sku
    ELSE offices.name || '-' || offices.sku
  END AS slugSource,
  offices.floor, offices.unit_number AS unitNumber, offices.space_type AS spaceType,
  offices.address, offices.capacity, offices.monthly_price, offices.status, offices.summary,
  offices.size_sq_m AS sizeSqM, offices.rent_fee AS rentFee, offices.optional_terms AS optionalTerms,
  offices.image_data_url AS imageDataUrl, members.business_name AS assignedBusinessName,
  members.contact_email AS tenantEmail, members.phone AS tenantPhone, members.website AS tenantWebsite,
  members.summary AS tenantSummary, members.trading_hours AS tenantTradingHours,
  members.closed_days AS tenantClosedDays, members.cover_image_data_url AS tenantCoverImageDataUrl,
  members.logo_data_url AS tenantLogoDataUrl,
  offices.floor_plan_data_url AS floorPlanDataUrl, offices.assigned_member_id AS assignedMemberId
`;

const officeSort = `
  CASE offices.floor
    WHEN 'Basement' THEN 0
    WHEN 'Ground Floor' THEN 1
    WHEN 'First Floor' THEN 2
    WHEN 'Second Floor' THEN 3
    WHEN 'Third Floor' THEN 4
    WHEN 'Fourth Floor' THEN 5
    WHEN 'Fifth Floor' THEN 6
    ELSE 99
  END,
  offices.unit_number
`;

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_information (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trading_name TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      address_2 TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      post_code TEXT NOT NULL DEFAULT '',
      county TEXT NOT NULL DEFAULT '',
      country_region_code TEXT NOT NULL DEFAULT '',
      phone_no TEXT NOT NULL DEFAULT '',
      mobile_phone_no TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      home_page TEXT NOT NULL DEFAULT '',
      vat_registration_no TEXT NOT NULL DEFAULT '',
      registration_no TEXT NOT NULL DEFAULT '',
      industrial_classification TEXT NOT NULL DEFAULT '',
      tax_area_code TEXT NOT NULL DEFAULT '',
      picture TEXT NOT NULL DEFAULT '',
      report_logo TEXT NOT NULL DEFAULT '',
      language_code TEXT NOT NULL DEFAULT '',
      currency_code TEXT NOT NULL DEFAULT '',
      time_zone TEXT NOT NULL DEFAULT '',
      bank_name TEXT NOT NULL DEFAULT '',
      bank_account_no TEXT NOT NULL DEFAULT '',
      iban TEXT NOT NULL DEFAULT '',
      swift_code TEXT NOT NULL DEFAULT '',
      payment_routing_info TEXT NOT NULL DEFAULT '',
      base_calendar_code TEXT NOT NULL DEFAULT '',
      ic_partner_code TEXT NOT NULL DEFAULT '',
      responsibility_center TEXT NOT NULL DEFAULT '',
      shipment_address TEXT NOT NULL DEFAULT '',
      shipment_address_2 TEXT NOT NULL DEFAULT '',
      shipment_city TEXT NOT NULL DEFAULT '',
      shipment_post_code TEXT NOT NULL DEFAULT '',
      shipment_county TEXT NOT NULL DEFAULT '',
      shipment_country_region_code TEXT NOT NULL DEFAULT '',
      location_code TEXT NOT NULL DEFAULT '',
      shipping_agent_code TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      phone TEXT NOT NULL,
      website TEXT NOT NULL,
      summary TEXT NOT NULL,
      is_profile_public INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS offices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      monthly_price INTEGER NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      hourly_rate INTEGER NOT NULL,
      member_only INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS availability_rules (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      opens_at TEXT NOT NULL,
      closes_at TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hot_desk_bookings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      visibility TEXT NOT NULL,
      starts_at TEXT,
      summary TEXT NOT NULL,
      body TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      apply_email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS property_enquiries (
      id TEXT PRIMARY KEY,
      office_id TEXT NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      preferred_contact_method TEXT NOT NULL,
      gdpr_approved INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      handled_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = db.prepare('PRAGMA table_info(users)').all();
  const hasUsername = columns.some((column) => column.name === 'username');

  if (!hasUsername) {
    db.exec('ALTER TABLE users ADD COLUMN username TEXT;');
  }

  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);');

  const officeColumns = db.prepare('PRAGMA table_info(offices)').all();
  const addOfficeColumn = (name, definition) => {
    if (!officeColumns.some((column) => column.name === name)) {
      db.exec(`ALTER TABLE offices ADD COLUMN ${name} ${definition};`);
    }
  };

  addOfficeColumn('size_sq_m', 'INTEGER NOT NULL DEFAULT 0');
  addOfficeColumn('rent_fee', 'INTEGER NOT NULL DEFAULT 0');
  addOfficeColumn('optional_terms', "TEXT NOT NULL DEFAULT ''");
  addOfficeColumn('image_data_url', "TEXT NOT NULL DEFAULT ''");
  addOfficeColumn('floor_plan_data_url', "TEXT NOT NULL DEFAULT ''");
  addOfficeColumn('assigned_member_id', 'TEXT');
  addOfficeColumn('sku', "TEXT NOT NULL DEFAULT ''");
  addOfficeColumn('floor', "TEXT NOT NULL DEFAULT ''");
  addOfficeColumn('unit_number', "TEXT NOT NULL DEFAULT ''");
  addOfficeColumn('space_type', "TEXT NOT NULL DEFAULT 'office'");
  addOfficeColumn('address', "TEXT NOT NULL DEFAULT 'The Exchange, 42 Market Street, Dublin 2'");

  const memberColumns = db.prepare('PRAGMA table_info(members)').all();
  const addMemberColumn = (name, definition) => {
    if (!memberColumns.some((column) => column.name === name)) {
      db.exec(`ALTER TABLE members ADD COLUMN ${name} ${definition};`);
    }
  };

  addMemberColumn('trading_hours', "TEXT NOT NULL DEFAULT ''");
  addMemberColumn('closed_days', "TEXT NOT NULL DEFAULT ''");
  addMemberColumn('cover_image_data_url', "TEXT NOT NULL DEFAULT ''");
  addMemberColumn('logo_data_url', "TEXT NOT NULL DEFAULT ''");

  const enquiryColumns = db.prepare('PRAGMA table_info(property_enquiries)').all();
  const addEnquiryColumn = (name, definition) => {
    if (!enquiryColumns.some((column) => column.name === name)) {
      db.exec(`ALTER TABLE property_enquiries ADD COLUMN ${name} ${definition};`);
    }
  };

  addEnquiryColumn('read_at', 'TEXT');
  addEnquiryColumn('handled_by_user_id', 'TEXT');

}

function businessInfoRow() {
  return db.prepare(`
    SELECT
      id, name, trading_name AS tradingName, address, address_2 AS address2, city,
      post_code AS postCode, county, country_region_code AS countryRegionCode,
      phone_no AS phoneNo, mobile_phone_no AS mobilePhoneNo, email, home_page AS homePage,
      vat_registration_no AS vatRegistrationNo, registration_no AS registrationNo,
      industrial_classification AS industrialClassification, tax_area_code AS taxAreaCode,
      picture, report_logo AS reportLogo, language_code AS languageCode, currency_code AS currencyCode,
      time_zone AS timeZone, bank_name AS bankName, bank_account_no AS bankAccountNo,
      iban, swift_code AS swiftCode, payment_routing_info AS paymentRoutingInfo,
      base_calendar_code AS baseCalendarCode, ic_partner_code AS icPartnerCode,
      responsibility_center AS responsibilityCenter, shipment_address AS shipmentAddress,
      shipment_address_2 AS shipmentAddress2, shipment_city AS shipmentCity,
      shipment_post_code AS shipmentPostCode, shipment_county AS shipmentCounty,
      shipment_country_region_code AS shipmentCountryRegionCode, location_code AS locationCode,
      shipping_agent_code AS shippingAgentCode, updated_at AS updatedAt
    FROM business_information
    WHERE id = 'primary'
  `).get();
}

function seedBusinessInformation() {
  const existing = db.prepare("SELECT id FROM business_information WHERE id = 'primary'").get();

  if (existing) {
    return;
  }

  db.prepare(`
    INSERT INTO business_information (
      id, name, trading_name, address, address_2, city, post_code, county, country_region_code,
      phone_no, mobile_phone_no, email, home_page, vat_registration_no, registration_no,
      industrial_classification, tax_area_code, language_code, currency_code, time_zone,
      bank_name, bank_account_no, iban, swift_code, payment_routing_info,
      base_calendar_code, ic_partner_code, responsibility_center,
      shipment_address, shipment_address_2, shipment_city, shipment_post_code,
      shipment_county, shipment_country_region_code, location_code, shipping_agent_code
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'primary',
    'The Exchange Commercial Ltd.',
    'The Exchange Commercial',
    'The Exchange Building',
    '42 Market Street',
    'Dublin',
    'D02 EX42',
    'County Dublin',
    'IE',
    '+353 1 600 0050',
    '+353 87 600 0050',
    'hello@theexchange.example',
    'https://theexchange.example',
    'IE1234567X',
    '712345',
    'NACE 6820 - Renting and operating of own or leased real estate',
    'IE-DUB',
    'en-IE',
    'EUR',
    'Europe/Dublin',
    'Allied Irish Bank',
    '12345678',
    'IE29AIBK93115212345678',
    'AIBKIE2D',
    'Quote invoice or booking reference on all payments.',
    'IE-BUSINESS',
    '',
    'DUBLIN-CENTRE',
    'The Exchange Building',
    '42 Market Street',
    'Dublin',
    'D02 EX42',
    'County Dublin',
    'IE',
    'EXCHANGE-DUBLIN',
    'LOCAL-COURIER'
  );
}

function upsertUser({ id = randomUUID(), username, name, email, password, role }) {
  db.prepare(`
    INSERT INTO users (id, username, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      username = excluded.username,
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = excluded.role
  `).run(id, username, name, email, hashPassword(password), role);

  return db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;
}

function seedCoreUsers() {
  upsertUser({
    username: 'bridgemediaireland',
    name: 'Bridge Media Ireland',
    email: 'bridgemediaireland@gmail.com',
    password: 'HelloWorld123!',
    role: 'superuser'
  });

  upsertUser({
    username: 'buildingadmin',
    name: 'Building Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  });

  upsertUser({
    username: 'frontdesk',
    name: 'Front Desk Staff',
    email: 'staff@example.com',
    password: 'password123',
    role: 'staff'
  });
}

function seedOfficeDetails(memberId) {
  db.prepare(`
    UPDATE offices
    SET size_sq_m = ?, rent_fee = ?, optional_terms = ?, assigned_member_id = COALESCE(assigned_member_id, ?)
    WHERE name = ?
  `).run(18, 900, 'Optional parking add-on available.', memberId, 'Office 1.07');

  db.prepare('UPDATE offices SET size_sq_m = ?, rent_fee = ?, optional_terms = ? WHERE name = ?')
    .run(32, 1450, 'Optional furnished setup and mailbox service.', 'Office 2.04');

  db.prepare('UPDATE offices SET size_sq_m = ?, rent_fee = ?, optional_terms = ? WHERE name = ?')
    .run(58, 2600, 'Optional private VLAN and branded door signage.', 'Studio 3.01');
}

function seedManagedDublinOffices() {
  db.prepare(`
    DELETE FROM offices
    WHERE id LIKE 'exchange-managed-%'
      OR sku = ''
      OR name IN ('Office 1.07', 'Office 2.04', 'Studio 3.01')
  `).run();

  const address = 'The Exchange, 42 Market Street, Dublin 2';
  const memberByBusiness = new Map(all('SELECT id, business_name AS businessName FROM members').map((member) => [member.businessName, member.id]));
  const managedOffices = [
    ['exchange-b1-parking', 'EXCH-B1-PARKING', 'Basement Parking', 'Basement', 'B1', 'parking', 220, 0, 'occupied', 'Secure basement parking serving shoppers, patients, hot desk members and office tenants.', 1800, 'Tenant and customer parking', null],
    ['exchange-g01-restaurant', 'EXCH-G-01', 'Restaurant Unit G.01', 'Ground Floor', 'G.01', 'food', 80, 0, 'occupied', 'Street-facing restaurant unit with mall frontage and evening service access.', 185, 'Ember Table', 'Ember Table'],
    ['exchange-g02-cafe', 'EXCH-G-02', 'Cafe Unit G.02', 'Ground Floor', 'G.02', 'food', 38, 0, 'occupied', 'Compact cafe unit positioned between the main entrance and the office lifts.', 82, 'Exchange Coffee', 'Exchange Coffee'],
    ['exchange-g03-supermarket', 'EXCH-G-03', 'Supermarket Unit G.03', 'Ground Floor', 'G.03', 'retail', 55, 0, 'occupied', 'Convenience-led supermarket with daily groceries and workplace essentials.', 420, 'Market Hall Grocer', 'Market Hall Grocer'],
    ['exchange-g04-pharmacy', 'EXCH-G-04', 'Pharmacy Unit G.04', 'Ground Floor', 'G.04', 'health', 18, 0, 'occupied', 'Community pharmacy supporting medical visitors, residents and building occupiers.', 96, 'Exchange Pharmacy', 'Exchange Pharmacy'],
    ['exchange-g05-sports', 'EXCH-G-05', 'Retail Unit G.05', 'Ground Floor', 'G.05', 'retail', 16, 0, 'occupied', 'Sporting goods store with performance footwear, apparel and training equipment.', 125, 'Stride Sporting Goods', 'Stride Sporting Goods'],
    ['exchange-100-medical', 'EXCH-1-00', 'First Floor Medical Practice', 'First Floor', '1.00', 'medical', 42, 0, 'occupied', 'Full-floor medical practice with consultation rooms, patient reception and lift access.', 760, 'Riverside Medical Centre', 'Riverside Medical Centre'],
    ['exchange-200-work-club', 'EXCH-2-00', 'Second Floor Co-working', 'Second Floor', '2.00', 'hot-desk', 120, 0, 'occupied', 'Managed hot desk and co-working floor with booths, meeting rooms and reception support.', 820, 'The Exchange Work Club', null],
    ['exchange-301', 'EXCH-3-01', 'Office Suite 3.01', 'Third Floor', '3.01', 'office', 10, 0, 'occupied', 'Private office suite for web products, client workshops and hybrid product teams.', 94, 'North Star Digital', 'North Star Digital'],
    ['exchange-302', 'EXCH-3-02', 'Office Suite 3.02', 'Third Floor', '3.02', 'office', 8, 0, 'occupied', 'Campaign, content and brand experience studio with a compact project room.', 76, 'Bricolage Works', 'Bricolage'],
    ['exchange-303', 'EXCH-3-03', 'Office Suite 3.03', 'Third Floor', '3.03', 'office', 8, 0, 'occupied', 'Research-led software office for analytics, data tooling and client demos.', 78, 'Quantum Labs', 'Quantum'],
    ['exchange-304', 'EXCH-3-04', 'Office Suite 3.04', 'Third Floor', '3.04', 'office', 6, 0, 'occupied', 'Strategic communications office for public affairs, digital storytelling and campaigns.', 64, 'Scribble & Stone', 'Scribble & Stone'],
    ['exchange-305', 'EXCH-3-05', 'Office Suite 3.05', 'Third Floor', '3.05', 'office', 6, 0, 'occupied', 'Event planning studio for guest experience, production logistics and launches.', 62, 'Bee Events', 'Bee'],
    ['exchange-306', 'EXCH-3-06', 'Office Suite 3.06', 'Third Floor', '3.06', 'office', 7, 0, 'occupied', 'Consultancy suite supporting SMEs with systems, process and operational change.', 70, 'Odin Consultants', 'Odin Consultants'],
    ['exchange-401', 'EXCH-4-01', 'Office Suite 4.01', 'Fourth Floor', '4.01', 'office', 6, 0, 'occupied', 'Design partner for startups, cultural organisations and community platforms.', 66, 'Akara Studio', 'Akara'],
    ['exchange-402', 'EXCH-4-02', 'Office Suite 4.02', 'Fourth Floor', '4.02', 'office', 5, 0, 'occupied', 'Programming and audience development office for Irish venues and festivals.', 58, 'Field Arts', 'Field Arts'],
    ['exchange-403', 'EXCH-4-03', 'Office Suite 4.03', 'Fourth Floor', '4.03', 'office', 9, 0, 'occupied', 'Clinical innovation and device research suite with quiet focus rooms.', 88, 'Neuromod Devices', 'Neuromod Devices'],
    ['exchange-404', 'EXCH-4-04', 'Office Suite 4.04', 'Fourth Floor', '4.04', 'office', 8, 0, 'occupied', 'Architecture, interiors and workplace strategy team focused on adaptive reuse.', 82, 'Context Studio', 'Context Studio'],
    ['exchange-405', 'EXCH-4-05', 'Office Suite 4.05', 'Fourth Floor', '4.05', 'office', 7, 0, 'occupied', 'Energy planning office helping organisations plan practical building improvements.', 72, 'Codema Energy', 'Codema'],
    ['exchange-406', 'EXCH-4-06', 'Office Suite 4.06', 'Fourth Floor', '4.06', 'office', 6, 0, 'occupied', 'Digital operations team building workflow tools for distributed companies.', 64, 'Alga Operations', 'Alga'],
    ['exchange-501', 'EXCH-5-01', 'Office Suite 5.01', 'Fifth Floor', '5.01', 'office', 8, 0, 'occupied', 'Media production suite for storyboarding and production teams.', 86, 'Kavaleer Media', 'Kavaleer'],
    ['exchange-502', 'EXCH-5-02', 'Office Suite 5.02', 'Fifth Floor', '5.02', 'office', 5, 1950, 'available', 'Private office suite available for professional services teams.', 54, 'Available Office 5.02', null],
    ['exchange-503', 'EXCH-5-03', 'Office Suite 5.03', 'Fifth Floor', '5.03', 'office', 6, 2450, 'available', 'Bright upper-floor office available with shared amenities and lift access.', 68, 'Available Office 5.03', null],
    ['exchange-504', 'EXCH-5-04', 'Office Suite 5.04', 'Fifth Floor', '5.04', 'office', 7, 2800, 'available', 'Flexible fifth-floor suite suitable for advisory, recruitment or project teams.', 74, 'Available Office 5.04', null],
    ['exchange-505', 'EXCH-5-05', 'Office Suite 5.05', 'Fifth Floor', '5.05', 'office', 5, 2100, 'available', 'Quiet office suite with access to shared meeting rooms and basement parking.', 58, 'Available Office 5.05', null],
    ['exchange-506', 'EXCH-5-06', 'Office Suite 5.06', 'Fifth Floor', '5.06', 'office', 8, 3150, 'available', 'Corner office suite available for teams wanting a managed address at The Exchange.', 88, 'Available Office 5.06', null]
  ];

  const insertOffice = db.prepare(`
    INSERT INTO offices (
      id, sku, name, floor, unit_number, space_type, address, capacity, monthly_price, status,
      summary, size_sq_m, rent_fee, optional_terms, assigned_member_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sku = excluded.sku,
      name = excluded.name,
      floor = excluded.floor,
      unit_number = excluded.unit_number,
      space_type = excluded.space_type,
      address = excluded.address,
      capacity = excluded.capacity,
      monthly_price = excluded.monthly_price,
      status = excluded.status,
      summary = excluded.summary,
      size_sq_m = excluded.size_sq_m,
      rent_fee = excluded.rent_fee,
      optional_terms = excluded.optional_terms,
      assigned_member_id = COALESCE(offices.assigned_member_id, excluded.assigned_member_id)
  `);

  for (const [id, sku, name, floor, unitNumber, spaceType, capacity, rent, status, summary, sizeSqM, displayName, businessName] of managedOffices) {
    insertOffice.run(
      id,
      sku,
      name,
      floor,
      unitNumber,
      spaceType,
      address,
      capacity,
      rent,
      status,
      summary,
      sizeSqM,
      rent,
      status === 'available'
        ? 'Available to rent at The Exchange. Tenant fit-out, signage and parking options can be discussed.'
        : `${displayName} occupies this space at The Exchange.`,
      businessName ? memberByBusiness.get(businessName) ?? null : null
    );
  }
}

function seedTenantInteriorImages() {
  const memberImages = [
    ['Ember Table', '/tenants/ember-table-interior.png'],
    ['Exchange Coffee', '/tenants/exchange-coffee-interior.png'],
    ['Market Hall Grocer', '/tenants/market-hall-grocer-interior.png'],
    ['Exchange Pharmacy', '/tenants/exchange-pharmacy-interior.png'],
    ['Stride Sporting Goods', '/tenants/stride-sporting-goods-interior.png'],
    ['Riverside Medical Centre', '/riverside-medical-centre.png'],
    ['North Star Digital', '/tenants/north-star-digital-interior.png'],
    ['Bricolage', '/tenants/bricolage-works-interior.png'],
    ['Quantum', '/tenants/quantum-labs-interior.png'],
    ['Scribble & Stone', '/tenants/scribble-stone-interior.png'],
    ['Bee', '/tenants/bee-events-interior.png'],
    ['Odin Consultants', '/tenants/odin-consultants-interior.png'],
    ['Akara', '/tenants/akara-studio-interior.png'],
    ['Field Arts', '/tenants/field-arts-interior.png'],
    ['Neuromod Devices', '/tenants/neuromod-devices-interior.png'],
    ['Context Studio', '/tenants/context-studio-interior.png'],
    ['Codema', '/tenants/codema-energy-interior.png'],
    ['Alga', '/tenants/alga-operations-interior.png'],
    ['Kavaleer', '/tenants/kavaleer-media-interior.png']
  ];
  const officeImages = [
    ['EXCH-B1-PARKING', '/tenants/basement-parking-interior.png'],
    ['EXCH-2-00', '/workspace-open-plan.png'],
    ['EXCH-5-02', '/tenants/harbour-legal-interior.png'],
    ['EXCH-5-03', '/tenants/copperline-finance-interior.png'],
    ['EXCH-5-04', '/tenants/atlas-recruitment-interior.png'],
    ['EXCH-5-05', '/tenants/mosaic-hr-interior.png'],
    ['EXCH-5-06', '/tenants/bluebridge-advisory-interior.png']
  ];
  const updateMember = db.prepare('UPDATE members SET cover_image_data_url = ? WHERE business_name = ?');
  const updateOffice = db.prepare('UPDATE offices SET image_data_url = ? WHERE sku = ?');

  for (const [businessName, imagePath] of memberImages) {
    updateMember.run(imagePath, businessName);
  }

  for (const [sku, imagePath] of officeImages) {
    updateOffice.run(imagePath, sku);
  }
}

function upsertMemberProfile({ username, name, email, businessName, contactEmail, phone, website, summary, tradingHours = '', closedDays = '', coverImageDataUrl = '', logoDataUrl = '' }) {
  const userId = upsertUser({
    username,
    name,
    email,
    password: 'password123',
    role: 'tenant'
  });
  const existingMember = db.prepare('SELECT id FROM members WHERE user_id = ?').get(userId);

  if (existingMember) {
    db.prepare(`
      UPDATE members
      SET business_name = ?, contact_email = ?, phone = ?, website = ?, summary = ?,
        trading_hours = ?, closed_days = ?, cover_image_data_url = ?, logo_data_url = ?, is_profile_public = 1
      WHERE id = ?
    `).run(businessName, contactEmail, phone, website, summary, tradingHours, closedDays, coverImageDataUrl, logoDataUrl, existingMember.id);
    return existingMember.id;
  }

  const memberId = randomUUID();
  db.prepare(`
    INSERT INTO members (
      id, user_id, business_name, contact_email, phone, website, summary,
      trading_hours, closed_days, cover_image_data_url, logo_data_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(memberId, userId, businessName, contactEmail, phone, website, summary, tradingHours, closedDays, coverImageDataUrl, logoDataUrl);

  return memberId;
}

function seedDirectoryProfiles() {
  const profiles = [
    ['embertable', 'Ember Table', 'ember@example.com', 'Ember Table', 'Restaurant serving lunch, dinner and private bookings from the ground floor of The Exchange.'],
    ['exchangecoffee', 'Exchange Coffee', 'coffee@example.com', 'Exchange Coffee', 'Cafe for commuters, shoppers, medical visitors and the office community.'],
    ['markethallgrocer', 'Market Hall Grocer', 'grocer@example.com', 'Market Hall Grocer', 'Convenience supermarket with fresh groceries, prepared food and daily essentials.'],
    ['exchangepharmacy', 'Exchange Pharmacy', 'pharmacy@example.com', 'Exchange Pharmacy', 'Community pharmacy serving The Exchange and the surrounding neighbourhood.'],
    ['stridesportinggoods', 'Stride Sporting Goods', 'stride@example.com', 'Stride Sporting Goods', 'Sporting goods store for footwear, apparel and training equipment.'],
    ['vervemedical', 'Riverside Medical Centre', 'verve@example.com', 'Riverside Medical Centre', 'Full-floor medical practice with consultation rooms, diagnostics, pharmacy access and patient reception.'],
    ['bricolageworks', 'Bricolage Works', 'bricolage@example.com', 'Bricolage', 'Creative production studio for campaigns, content and brand experiences.'],
    ['quantumlabs', 'Quantum Labs', 'quantum@example.com', 'Quantum', 'Research-led software team building analytics tools for growing organisations.'],
    ['scribbleandstone', 'Scribble & Stone', 'scribble@example.com', 'Scribble & Stone', 'Strategic communications and digital storytelling for public and private clients.'],
    ['beeevents', 'Bee Events', 'bee@example.com', 'Bee', 'Event design, guest experience and production support for ambitious teams.'],
    ['odinconsultants', 'Odin Consultants', 'odin@example.com', 'Odin Consultants', 'Operations and technology consultancy for SMEs scaling their internal systems.'],
    ['akara', 'Akara Studio', 'akara@example.com', 'Akara', 'Product design partner for startups, cultural organisations and community projects.'],
    ['fieldarts', 'Field Arts', 'field@example.com', 'Field Arts', 'Arts management, programming and audience development for Irish venues.'],
    ['neuromod', 'Neuromod Devices', 'neuromod@example.com', 'Neuromod Devices', 'Health technology company focused on clinical innovation and device research.'],
    ['contextstudio', 'Context Studio', 'context@example.com', 'Context Studio', 'Architecture, interiors and workplace strategy for adaptive reuse projects.'],
    ['codema', 'Codema Energy', 'codema@example.com', 'Codema', 'Sustainability advisors helping organisations plan practical energy improvements.'],
    ['alga', 'Alga', 'alga@example.com', 'Alga', 'Digital operations team building workflow tools for distributed companies.'],
    ['kavaleer', 'Kavaleer', 'kavaleer@example.com', 'Kavaleer', 'Animation and media production studio creating character-led stories.']
  ];

  for (const [username, name, email, businessName, summary] of profiles) {
    upsertMemberProfile({
      username,
      name,
      email,
      businessName,
      contactEmail: `hello@${username}.example`,
      phone: '+353 1 000 0000',
      website: `https://${username}.example`,
      summary,
      tradingHours: 'Monday-Friday 09:00-18:00; Saturday 10:00-17:00; Sunday 11:00-16:00',
      closedDays: 'Public holidays'
    });
  }
}

function seed() {
  seedBusinessInformation();
  seedCoreUsers();
  const userId = upsertUser({
    username: 'alextenant',
    name: 'Alex Tenant',
    email: 'member@example.com',
    password: 'password123',
    role: 'tenant'
  });
  const existingMember = db.prepare('SELECT id FROM members WHERE user_id = ?').get(userId);

  if (existingMember) {
    seedDirectoryProfiles();
    seedOfficeDetails(existingMember.id);
    seedManagedDublinOffices();
    seedTenantInteriorImages();
    return;
  }

  const memberId = randomUUID();

  db.prepare(`
    INSERT INTO members (
      id, user_id, business_name, contact_email, phone, website, summary,
      trading_hours, closed_days
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    memberId,
    userId,
    'North Star Digital',
    'hello@northstar.example',
    '+353 1 000 0000',
    'https://northstar.example',
    'A member studio building practical web products for local organisations.',
    'Monday-Friday 09:00-18:00',
    'Public holidays'
  );
  seedDirectoryProfiles();

  const insertOffice = db.prepare(`
    INSERT INTO offices (id, name, capacity, monthly_price, status, summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertOffice.run(randomUUID(), 'Office 2.04', 4, 1450, 'available', 'Bright private office with lockable storage and shared kitchen access.');
  insertOffice.run(randomUUID(), 'Studio 3.01', 8, 2600, 'available', 'Large corner suite suitable for a small team or project room.');
  insertOffice.run(randomUUID(), 'Office 1.07', 2, 900, 'occupied', 'Compact office currently let to an existing tenant.');

  seedOfficeDetails(memberId);
  seedManagedDublinOffices();
  seedTenantInteriorImages();

  const roomIds = [
    { id: randomUUID(), name: 'Boardroom', type: 'meeting', capacity: 12, rate: 35 },
    { id: randomUUID(), name: 'Conference Hall', type: 'event', capacity: 80, rate: 120 },
    { id: randomUUID(), name: 'Seminar Suite', type: 'seminar', capacity: 32, rate: 75 }
  ];

  const insertSpace = db.prepare(`
    INSERT INTO spaces (id, name, type, capacity, hourly_rate)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const room of roomIds) {
    insertSpace.run(room.id, room.name, room.type, room.capacity, room.rate);
  }

  const insertRule = db.prepare(`
    INSERT INTO availability_rules (id, space_id, day_of_week, opens_at, closes_at, available)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const room of roomIds) {
    for (let day = 1; day <= 5; day += 1) {
      insertRule.run(randomUUID(), room.id, day, '09:00', '17:30', 1);
    }
  }

  db.prepare(`
    INSERT INTO bookings (id, member_id, space_id, title, starts_at, ends_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), memberId, roomIds[0].id, 'Product planning', '2026-05-04T10:00:00', '2026-05-04T11:30:00');

  const insertContent = db.prepare(`
    INSERT INTO content_items (id, title, type, visibility, starts_at, summary, body)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertContent.run(randomUUID(), 'Summer networking breakfast', 'event', 'public', '2026-05-21T09:00:00', 'Open breakfast for local founders, freelancers and employers.', 'Join us in the shared workspace for coffee and introductions.');
  insertContent.run(randomUUID(), 'Member procurement clinic', 'event', 'members', '2026-05-28T13:00:00', 'Private session for members tendering for public sector work.', 'Bring live questions and upcoming procurement deadlines.');
  insertContent.run(randomUUID(), 'Two new offices available', 'news', 'public', null, 'We have two furnished offices ready for growing teams.', 'Enquiries are open now for Office 2.04 and Studio 3.01.');
  insertContent.run(randomUUID(), 'Members get extended room credits', 'news', 'members', null, 'Additional meeting room credits are available this quarter.', 'Check your member dashboard for the updated allowance.');

  const insertJob = db.prepare(`
    INSERT INTO jobs (id, member_id, title, company, location, type, summary, apply_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJob.run(randomUUID(), memberId, 'Frontend Developer', 'North Star Digital', 'Hybrid', 'Full time', 'Build accessible Angular and React interfaces for local service providers.', 'jobs@northstar.example');
  insertJob.run(randomUUID(), null, 'Facilities Coordinator', 'The Building Team', 'On site', 'Part time', 'Support tenants, room setup, events and visitor services.', 'careers@building.example');
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function withOfficeSlugs(rows) {
  return rows.map((office) => ({
    ...office,
    slug: slugify(office.slugSource),
    slugSource: undefined
  }));
}

function officeRows(sql, params = []) {
  return withOfficeSlugs(all(sql, params));
}

function officeRow(sql, params = []) {
  const office = db.prepare(sql).get(...params);
  return office ? withOfficeSlugs([office])[0] : null;
}

function json(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': 'http://localhost:4200',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function publicHome() {
  return {
    businessInfo: businessInfoRow(),
    building: {
      name: 'The Exchange Building',
      summary: 'Private offices, member meeting rooms, conference space, hot desks, public events and an Irish business community under one roof.'
    },
    offices: officeRows(`
      SELECT ${publicOfficeFields}
      FROM offices
      LEFT JOIN members ON members.id = offices.assigned_member_id
      ORDER BY ${officeSort}
    `),
    publicContent: all(`
      SELECT * FROM content_items
      WHERE visibility = 'public'
      ORDER BY COALESCE(starts_at, '9999-12-31'), title
    `),
    profiles: all(`
      SELECT business_name AS businessName, contact_email AS contactEmail, phone, website, summary,
        trading_hours AS tradingHours, closed_days AS closedDays,
        cover_image_data_url AS coverImageDataUrl, logo_data_url AS logoDataUrl
      FROM members
      WHERE is_profile_public = 1
      ORDER BY business_name
    `)
  };
}

migrate();
seed();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const path = url.pathname;

  try {
    if (request.method === 'OPTIONS') {
      json(response, 204, {});
      return;
    }

    if (request.method === 'GET' && path === '/api/health') {
      json(response, 200, { ok: true, database: 'connected', path: dbPath });
      return;
    }

    if (request.method === 'GET' && path === '/api/home') {
      json(response, 200, publicHome());
      return;
    }

    if (request.method === 'GET' && path === '/api/business-info') {
      json(response, 200, { businessInfo: businessInfoRow() });
      return;
    }

    if (request.method === 'GET' && path === '/api/offices') {
      json(response, 200, {
        offices: officeRows(`
          SELECT ${publicOfficeFields}
          FROM offices
          LEFT JOIN members ON members.id = offices.assigned_member_id
          ORDER BY ${officeSort}
        `)
      });
      return;
    }

    if (request.method === 'GET' && path.match(/^\/api\/offices\/[^/]+$/)) {
      const identifier = decodeURIComponent(path.split('/')[3]);
      const office = officeRow(`
        SELECT ${publicOfficeFields}
        FROM offices
        LEFT JOIN members ON members.id = offices.assigned_member_id
        WHERE offices.id = ? OR offices.sku = ?
      `, [identifier, identifier]) ?? officeRows(`
        SELECT ${publicOfficeFields}
        FROM offices
        LEFT JOIN members ON members.id = offices.assigned_member_id
      `).find((candidate) => candidate.slug === identifier);

      json(response, office ? 200 : 404, office ? { office } : { error: 'Office not found' });
      return;
    }

    if (request.method === 'GET' && path === '/api/content') {
      const user = getCurrentUser(request);
      const visibility = user ? ['public', 'members'] : ['public'];
      const placeholders = visibility.map(() => '?').join(', ');
      json(response, 200, {
        items: all(`
          SELECT * FROM content_items
          WHERE visibility IN (${placeholders})
          ORDER BY COALESCE(starts_at, '9999-12-31'), title
        `, visibility)
      });
      return;
    }

    if (request.method === 'GET' && path === '/api/profiles') {
      json(response, 200, {
        profiles: all(`
          SELECT business_name AS businessName, contact_email AS contactEmail, phone, website, summary,
            trading_hours AS tradingHours, closed_days AS closedDays,
            cover_image_data_url AS coverImageDataUrl, logo_data_url AS logoDataUrl
          FROM members
          WHERE is_profile_public = 1
          ORDER BY business_name
        `)
      });
      return;
    }

    if (request.method === 'GET' && path === '/api/jobs') {
      json(response, 200, { jobs: all('SELECT * FROM jobs ORDER BY created_at DESC') });
      return;
    }

    if (request.method === 'POST' && path === '/api/auth/login') {
      const body = await readJson(request);
      const user = db.prepare(`
        SELECT users.id, users.name, users.email, users.role, users.password_hash, members.id AS memberId, members.business_name AS businessName
        FROM users
        LEFT JOIN members ON members.user_id = users.id
        WHERE users.email = ? OR users.username = ?
      `).get(body.email, body.email);

      if (!user || !verifyPassword(body.password ?? '', user.password_hash)) {
        json(response, 401, { error: 'Invalid email or password' });
        return;
      }

      const token = createToken(user.id);
      delete user.password_hash;
      json(response, 200, { token, user });
      return;
    }

    if (request.method === 'GET' && path === '/api/auth/me') {
      const user = getCurrentUser(request);
      json(response, user ? 200 : 401, user ? { user } : { error: 'Not authenticated' });
      return;
    }

    if (request.method === 'POST' && path === '/api/hot-desks/book') {
      const body = await readJson(request);
      db.prepare(`
        INSERT INTO hot_desk_bookings (id, name, email, booking_date, quantity)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), body.name, body.email, body.bookingDate, Number(body.quantity ?? 1));
      json(response, 201, { ok: true });
      return;
    }

    if (request.method === 'POST' && path.match(/^\/api\/offices\/[^/]+\/enquiries$/)) {
      const officeId = decodeURIComponent(path.split('/')[3]);
      const office = db.prepare('SELECT id FROM offices WHERE id = ?').get(officeId);

      if (!office) {
        json(response, 404, { error: 'Office not found' });
        return;
      }

      const body = await readJson(request);
      const preferredContactMethod = body.preferredContactMethod ?? '';

      if (!body.name || !body.email || !body.phone || !body.message || !['phone', 'email', 'both'].includes(preferredContactMethod) || !body.gdprApproved) {
        json(response, 400, { error: 'Missing required enquiry fields' });
        return;
      }

      db.prepare(`
        INSERT INTO property_enquiries (
          id, office_id, name, email, phone, message, preferred_contact_method, gdpr_approved
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        officeId,
        body.name,
        body.email,
        body.phone,
        body.message,
        preferredContactMethod,
        body.gdprApproved ? 1 : 0
      );
      json(response, 201, { ok: true });
      return;
    }

    if (request.method === 'POST' && path.match(/^\/api\/jobs\/[^/]+\/apply$/)) {
      const jobId = path.split('/')[3];
      const body = await readJson(request);
      db.prepare(`
        INSERT INTO job_applications (id, job_id, name, email, note)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), jobId, body.name, body.email, body.note ?? '');
      json(response, 201, { ok: true });
      return;
    }

    const user = getCurrentUser(request);

    if (!user && (path.startsWith('/api/member') || path.startsWith('/api/admin') || path.startsWith('/api/staff'))) {
      json(response, 401, { error: 'Login required' });
      return;
    }

    if (request.method === 'GET' && path === '/api/dashboard') {
      if (requireRole(user, ['superuser', 'admin'])) {
        json(response, 200, {
          role: user.role,
          counts: {
            users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
            members: db.prepare('SELECT COUNT(*) AS count FROM members').get().count,
            offices: db.prepare('SELECT COUNT(*) AS count FROM offices').get().count,
            bookings: db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count,
            hotDeskBookings: db.prepare('SELECT COUNT(*) AS count FROM hot_desk_bookings').get().count,
            propertyEnquiries: db.prepare('SELECT COUNT(*) AS count FROM property_enquiries').get().count,
            jobApplications: db.prepare('SELECT COUNT(*) AS count FROM job_applications').get().count
          },
          businessInfo: businessInfoRow(),
          users: all(`
            SELECT users.id, users.username, users.name, users.email, users.role, users.created_at AS createdAt,
              members.business_name AS businessName
            FROM users
            LEFT JOIN members ON members.user_id = users.id
            ORDER BY users.role, users.name
          `),
          offices: officeRows(`
            SELECT ${adminOfficeFields}
            FROM offices
            LEFT JOIN members ON members.id = offices.assigned_member_id
            ORDER BY ${officeSort}
          `),
          tenants: all(`
            SELECT members.id, members.business_name AS businessName, users.name, users.email, users.role
            FROM members
            JOIN users ON users.id = members.user_id
            ORDER BY members.business_name
          `),
          spaces: all('SELECT * FROM spaces ORDER BY type, name'),
          queries: all('SELECT * FROM hot_desk_bookings ORDER BY created_at DESC'),
          propertyEnquiries: all(`
            SELECT property_enquiries.*, offices.name AS officeName, offices.status AS officeStatus,
              users.name AS handledByName, users.email AS handledByEmail
            FROM property_enquiries
            JOIN offices ON offices.id = property_enquiries.office_id
            LEFT JOIN users ON users.id = property_enquiries.handled_by_user_id
            ORDER BY property_enquiries.read_at IS NOT NULL, property_enquiries.created_at DESC
          `)
        });
        return;
      }

      if (requireRole(user, ['staff'])) {
        json(response, 200, {
          role: user.role,
          counts: {
            members: db.prepare('SELECT COUNT(*) AS count FROM members').get().count,
            bookings: db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count,
            hotDeskBookings: db.prepare('SELECT COUNT(*) AS count FROM hot_desk_bookings').get().count,
            jobApplications: db.prepare('SELECT COUNT(*) AS count FROM job_applications').get().count
          },
          members: all(`
            SELECT members.id, members.business_name AS businessName, members.contact_email AS contactEmail,
              members.phone, users.name, users.email
            FROM members
            JOIN users ON users.id = members.user_id
            ORDER BY members.business_name
          `),
          bookings: all(`
            SELECT bookings.*, spaces.name AS spaceName, members.business_name AS businessName
            FROM bookings
            JOIN spaces ON spaces.id = bookings.space_id
            JOIN members ON members.id = bookings.member_id
            ORDER BY starts_at
          `),
          queries: all('SELECT * FROM hot_desk_bookings ORDER BY created_at DESC')
        });
        return;
      }

      json(response, 200, {
        role: user.role,
        redirectTo: '/member'
      });
      return;
    }

    if (request.method === 'PUT' && path.match(/^\/api\/admin\/property-enquiries\/[^/]+\/read$/)) {
      if (!requireRole(user, ['superuser', 'admin', 'staff'])) {
        json(response, 403, { error: 'Staff access required' });
        return;
      }

      const enquiryId = decodeURIComponent(path.split('/')[4]);
      const enquiry = db.prepare(`
        SELECT property_enquiries.*, users.name AS handledByName
        FROM property_enquiries
        LEFT JOIN users ON users.id = property_enquiries.handled_by_user_id
        WHERE property_enquiries.id = ?
      `).get(enquiryId);

      if (!enquiry) {
        json(response, 404, { error: 'Enquiry not found' });
        return;
      }

      if (enquiry.handled_by_user_id && enquiry.handled_by_user_id !== user.id) {
        json(response, 409, { error: `Already assigned to ${enquiry.handledByName ?? 'another staff member'}` });
        return;
      }

      db.prepare(`
        UPDATE property_enquiries
        SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP), handled_by_user_id = COALESCE(handled_by_user_id, ?)
        WHERE id = ?
      `).run(user.id, enquiryId);

      json(response, 200, { ok: true });
      return;
    }

    if (request.method === 'PUT' && path === '/api/admin/business-info') {
      if (!isAdmin(user)) {
        json(response, 403, { error: 'Admin access required' });
        return;
      }

      const body = await readJson(request);
      db.prepare(`
        UPDATE business_information
        SET name = ?, trading_name = ?, address = ?, address_2 = ?, city = ?, post_code = ?,
          county = ?, country_region_code = ?, phone_no = ?, mobile_phone_no = ?, email = ?,
          home_page = ?, vat_registration_no = ?, registration_no = ?, industrial_classification = ?,
          tax_area_code = ?, picture = ?, report_logo = ?, language_code = ?, currency_code = ?,
          time_zone = ?, bank_name = ?, bank_account_no = ?, iban = ?, swift_code = ?,
          payment_routing_info = ?, base_calendar_code = ?, ic_partner_code = ?,
          responsibility_center = ?, shipment_address = ?, shipment_address_2 = ?,
          shipment_city = ?, shipment_post_code = ?, shipment_county = ?,
          shipment_country_region_code = ?, location_code = ?, shipping_agent_code = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 'primary'
      `).run(
        body.name ?? '',
        body.tradingName ?? '',
        body.address ?? '',
        body.address2 ?? '',
        body.city ?? '',
        body.postCode ?? '',
        body.county ?? '',
        body.countryRegionCode ?? '',
        body.phoneNo ?? '',
        body.mobilePhoneNo ?? '',
        body.email ?? '',
        body.homePage ?? '',
        body.vatRegistrationNo ?? '',
        body.registrationNo ?? '',
        body.industrialClassification ?? '',
        body.taxAreaCode ?? '',
        body.picture ?? '',
        body.reportLogo ?? '',
        body.languageCode ?? '',
        body.currencyCode ?? '',
        body.timeZone ?? '',
        body.bankName ?? '',
        body.bankAccountNo ?? '',
        body.iban ?? '',
        body.swiftCode ?? '',
        body.paymentRoutingInfo ?? '',
        body.baseCalendarCode ?? '',
        body.icPartnerCode ?? '',
        body.responsibilityCenter ?? '',
        body.shipmentAddress ?? '',
        body.shipmentAddress2 ?? '',
        body.shipmentCity ?? '',
        body.shipmentPostCode ?? '',
        body.shipmentCounty ?? '',
        body.shipmentCountryRegionCode ?? '',
        body.locationCode ?? '',
        body.shippingAgentCode ?? ''
      );
      json(response, 200, { ok: true, businessInfo: businessInfoRow() });
      return;
    }

    if (path.startsWith('/api/admin/offices')) {
      if (!isAdmin(user)) {
        json(response, 403, { error: 'Admin access required' });
        return;
      }

      const officeId = path.split('/')[4];

      if (request.method === 'GET' && path === '/api/admin/offices') {
        json(response, 200, {
          offices: officeRows(`
            SELECT ${adminOfficeFields}
            FROM offices
            LEFT JOIN members ON members.id = offices.assigned_member_id
            ORDER BY ${officeSort}
          `)
        });
        return;
      }

      if (request.method === 'POST' && path === '/api/admin/offices') {
        const body = await readJson(request);
        db.prepare(`
          INSERT INTO offices (
            id, sku, name, floor, unit_number, space_type, address,
            capacity, monthly_price, status, summary, size_sq_m, rent_fee, optional_terms,
            image_data_url, floor_plan_data_url, assigned_member_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          randomUUID(),
          body.sku,
          body.name,
          body.floor ?? '',
          body.unitNumber ?? '',
          body.spaceType ?? 'office',
          body.address ?? 'The Exchange, 42 Market Street, Dublin 2',
          Number(body.capacity ?? 1),
          Number(body.rentFee ?? body.monthly_price ?? 0),
          body.status ?? 'available',
          body.summary ?? '',
          Number(body.sizeSqM ?? 0),
          Number(body.rentFee ?? 0),
          body.optionalTerms ?? '',
          body.imageDataUrl ?? '',
          body.floorPlanDataUrl ?? '',
          body.assignedMemberId || null
        );
        json(response, 201, { ok: true });
        return;
      }

      if (request.method === 'PUT' && officeId) {
        const body = await readJson(request);
        db.prepare(`
          UPDATE offices
          SET sku = ?, name = ?, floor = ?, unit_number = ?, space_type = ?, address = ?,
            capacity = ?, monthly_price = ?, status = ?, summary = ?, size_sq_m = ?,
            rent_fee = ?, optional_terms = ?, image_data_url = ?, floor_plan_data_url = ?, assigned_member_id = ?
          WHERE id = ?
        `).run(
          body.sku,
          body.name,
          body.floor ?? '',
          body.unitNumber ?? '',
          body.spaceType ?? 'office',
          body.address ?? 'The Exchange, 42 Market Street, Dublin 2',
          Number(body.capacity ?? 1),
          Number(body.rentFee ?? body.monthly_price ?? 0),
          body.status ?? 'available',
          body.summary ?? '',
          Number(body.sizeSqM ?? 0),
          Number(body.rentFee ?? 0),
          body.optionalTerms ?? '',
          body.imageDataUrl ?? '',
          body.floorPlanDataUrl ?? '',
          body.assignedMemberId || null,
          officeId
        );
        json(response, 200, { ok: true });
        return;
      }

      if (request.method === 'DELETE' && officeId) {
        db.prepare('DELETE FROM offices WHERE id = ?').run(officeId);
        json(response, 200, { ok: true });
        return;
      }
    }

    if (request.method === 'GET' && path === '/api/member/dashboard') {
      if (!isTenantUser(user) || !user.memberId) {
        json(response, 403, { error: 'Tenant or member account required' });
        return;
      }

      json(response, 200, {
        user,
        rooms: all('SELECT * FROM spaces ORDER BY type, name'),
        availability: all(`
          SELECT availability_rules.*, spaces.name AS spaceName
          FROM availability_rules
          JOIN spaces ON spaces.id = availability_rules.space_id
          ORDER BY availability_rules.day_of_week, availability_rules.opens_at
        `),
        bookings: all(`
          SELECT bookings.*, spaces.name AS spaceName, spaces.type
          FROM bookings
          JOIN spaces ON spaces.id = bookings.space_id
          WHERE bookings.member_id = ?
          ORDER BY starts_at
        `, [user.memberId]),
        profile: db.prepare(`
          SELECT business_name AS businessName, contact_email AS contactEmail, phone, website, summary,
            trading_hours AS tradingHours, closed_days AS closedDays,
            cover_image_data_url AS coverImageDataUrl, logo_data_url AS logoDataUrl,
            is_profile_public AS isProfilePublic
          FROM members
          WHERE id = ?
        `).get(user.memberId),
        assignedOffice: officeRow(`
          SELECT ${adminOfficeFields}
          FROM offices
          LEFT JOIN members ON members.id = offices.assigned_member_id
          WHERE offices.assigned_member_id = ?
          LIMIT 1
        `, [user.memberId])
      });
      return;
    }

    if (request.method === 'POST' && path === '/api/member/bookings') {
      const body = await readJson(request);
      db.prepare(`
        INSERT INTO bookings (id, member_id, space_id, title, starts_at, ends_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), user.memberId, body.spaceId, body.title, body.startsAt, body.endsAt);
      json(response, 201, { ok: true });
      return;
    }

    if (request.method === 'PUT' && path === '/api/member/profile') {
      const body = await readJson(request);
      db.prepare(`
        UPDATE members
        SET business_name = ?, contact_email = ?, phone = ?, website = ?, summary = ?,
          trading_hours = ?, closed_days = ?, cover_image_data_url = ?, logo_data_url = ?, is_profile_public = ?
        WHERE id = ?
      `).run(
        body.businessName,
        body.contactEmail,
        body.phone,
        body.website,
        body.summary,
        body.tradingHours ?? '',
        body.closedDays ?? '',
        body.coverImageDataUrl ?? '',
        body.logoDataUrl ?? '',
        body.isProfilePublic ? 1 : 0,
        user.memberId
      );
      json(response, 200, { ok: true });
      return;
    }

    if (request.method === 'POST' && path === '/api/member/jobs') {
      const body = await readJson(request);
      db.prepare(`
        INSERT INTO jobs (id, member_id, title, company, location, type, summary, apply_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), user.memberId, body.title, user.businessName, body.location, body.type, body.summary, body.applyEmail);
      json(response, 201, { ok: true });
      return;
    }

    json(response, 404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    json(response, 500, { error: 'Unexpected server error' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`SQLite API listening at http://127.0.0.1:${port}`);
  console.log(`Database file: ${dbPath}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
