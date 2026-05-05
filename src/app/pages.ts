import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './auth.service';
import { BusinessInfo, BusinessInfoService, defaultBusinessInfo } from './business-info.service';

type Office = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  displayName: string;
  floor: string;
  unitNumber: string;
  spaceType: string;
  address: string;
  capacity: number;
  monthly_price: number;
  status: string;
  summary: string;
  sizeSqM: number;
  rentFee: number;
  optionalTerms: string;
  imageDataUrl: string;
  floorPlanDataUrl?: string;
  assignedMemberId?: string | null;
  assignedBusinessName?: string | null;
  tenantPhone?: string | null;
  tenantEmail?: string | null;
  tenantWebsite?: string | null;
  tenantSummary?: string | null;
  tenantTradingHours?: string | null;
  tenantClosedDays?: string | null;
  tenantCoverImageDataUrl?: string | null;
  tenantLogoDataUrl?: string | null;
};

type ContentItem = {
  id: string;
  title: string;
  type: string;
  visibility: string;
  starts_at: string | null;
  summary: string;
  body: string;
};

type NewsPublication = {
  title: string;
  summary: string;
  image: string;
  path: string;
  meta: string;
};

type Profile = {
  businessName: string;
  contactEmail: string;
  phone: string;
  website: string;
  summary: string;
  tradingHours?: string;
  closedDays?: string;
  coverImageDataUrl?: string;
  logoDataUrl?: string;
};

type HomeData = {
  businessInfo: BusinessInfo;
  building: { name: string; summary: string };
  offices: Office[];
  publicContent: ContentItem[];
  profiles: Profile[];
};

type ExchangeSpace = {
  id: string;
  name: string;
  floor: string;
  category: 'Parking' | 'Retail' | 'Food & Drink' | 'Health' | 'Hot Desks' | 'Office';
  tenant: string;
  summary: string;
  unit: string;
  accent: string;
  image: string;
  path: string;
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  summary: string;
  apply_email: string;
};

type Room = {
  id: string;
  name: string;
  type: string;
  capacity: number;
  hourly_rate: number;
};

type Booking = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  spaceName: string;
  status: string;
};

type AvailabilityRule = {
  id: string;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  available: number;
  spaceName: string;
};

type BusinessProfileForm = Profile & {
  isProfilePublic: boolean;
};

type AdminUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  businessName: string | null;
};

type AdminDashboard = {
  role: string;
  redirectTo?: string;
  counts: Record<string, number>;
  businessInfo?: BusinessInfo;
  users?: AdminUser[];
  offices?: Office[];
  tenants?: Array<{ id: string; businessName: string; name: string; email: string; role: string }>;
  spaces?: Room[];
  members?: Array<Profile & { id: string; name: string; email: string }>;
  bookings?: Array<Booking & { businessName: string }>;
  queries?: Array<{ id: string; name: string; email: string; booking_date: string; quantity: number; created_at: string }>;
  propertyEnquiries?: Array<{
    id: string;
    office_id: string;
    officeName: string;
    officeStatus: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    preferred_contact_method: string;
    gdpr_approved: number;
    read_at: string | null;
    handled_by_user_id: string | null;
    handledByName: string | null;
    handledByEmail: string | null;
    created_at: string;
  }>;
};

type AdminTab = 'business' | 'users' | 'members' | 'offices' | 'rooms' | 'requests' | 'applications';

type OfficeForm = {
  id: string | null;
  sku: string;
  name: string;
  floor: string;
  unitNumber: string;
  spaceType: string;
  capacity: number;
  status: string;
  summary: string;
  sizeSqM: number;
  rentFee: number;
  optionalTerms: string;
  imageDataUrl: string;
  floorPlanDataUrl: string;
  assignedMemberId: string;
};

const emptyOfficeForm = (): OfficeForm => ({
  id: null,
  sku: '',
  name: '',
  floor: '',
  unitNumber: '',
  spaceType: 'office',
  capacity: 1,
  status: 'available',
  summary: '',
  sizeSqM: 0,
  rentFee: 0,
  optionalTerms: '',
  imageDataUrl: '',
  floorPlanDataUrl: '',
  assignedMemberId: ''
});

const pageShell = 'mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1920px] px-8 py-10 md:px-16 lg:px-24';
const card = 'rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm';
const input = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100';
const button = 'inline-flex items-center justify-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800';
const aboutNav = [
  { label: 'Introduction', path: '/about' },
  { label: 'Partners & Associates', path: '/about/partners-associates' }
];

@Component({
  selector: 'app-about-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="border-b border-neutral-200 bg-[#fbfaf7]" aria-label="About pages">
      <div class="mx-auto flex max-w-[1920px] justify-start gap-8 px-8 md:justify-end md:px-16 lg:px-24">
      @for (item of items; track item.path) {
        <a
          class="border-b-4 border-transparent px-1 py-5 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-950"
          routerLinkActive="border-neutral-500 text-neutral-950"
          [routerLinkActiveOptions]="{ exact: item.path === '/about' }"
          [routerLink]="item.path"
        >{{ item.label }}</a>
      }
      </div>
    </nav>
  `
})
export class AboutNavComponent {
  readonly items = aboutNav;
}

@Component({
  standalone: true,
  imports: [CommonModule, AboutNavComponent],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7] text-neutral-950">
      <app-about-nav />

      <div class="h-[34vh] min-h-72 overflow-hidden md:h-[42vh]">
        <img src="/williams.webp" alt="Williams Formula 1 car" class="h-full w-full object-cover object-center">
      </div>

      <div class="border-y border-neutral-200">
        <div class="mx-auto grid max-w-[1280px] gap-10 px-8 py-16 md:px-16 lg:grid-cols-[20rem_1fr] lg:px-24">
          <div>
            <p class="max-w-xs text-2xl font-medium leading-snug tracking-[0.08em] text-[#c90019]">A mixed-use address with a practical daily rhythm</p>
          </div>
          <article class="max-w-4xl text-neutral-700">
            <p class="text-xl leading-8 text-neutral-800">The Exchange is a shopping mall and office property designed around everyday convenience, clear access and a useful mix of public-facing retail, healthcare, flexible workspace and private offices.</p>
            <p class="mt-7 leading-8">The building brings together basement parking, ground-floor shops, Riverside Medical Centre on the first floor, a managed workspace level and three upper office floors. Each part of the property has its own pace, but the whole building works as one connected destination for shoppers, patients, professionals and tenants.</p>
            <p class="mt-6 leading-8">Our role is to keep that experience simple and well-managed: maintain the common areas, support tenant visibility, manage workplace services and make it easy for visitors to find the right space.</p>
            <p class="mt-6 leading-8">The result is a property that feels active throughout the day, with retail convenience at street level, healthcare services close by, flexible desks for walk-in work and private office suites above.</p>
          </article>
        </div>
      </div>
    </section>
  `
})
export class AboutPage {}

@Component({
  standalone: true,
  imports: [CommonModule, AboutNavComponent],
  template: `
    <section class="${pageShell}">
      <app-about-nav />
      <div class="mt-8 max-w-4xl">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Our history</p>
        <h1 class="mt-3 text-5xl font-bold leading-tight text-slate-950">Rooted in place, built for modern work</h1>
        <p class="mt-5 text-lg leading-8 text-slate-600">Our story is shaped by the character of our location, the businesses that have worked here and the ongoing need for adaptable office space in Ireland.</p>
      </div>

      <div class="mt-10 grid gap-5">
        <article class="${card}">
          <p class="text-sm font-semibold text-sky-700">The building</p>
          <h2 class="mt-2 text-2xl font-bold">A productive address</h2>
          <p class="mt-3 leading-7 text-slate-600">The Exchange has been developed as a practical base for companies that need more than a mailbox: private space, shared services, rooms for clients and a professional front door.</p>
        </article>
        <article class="${card}">
          <p class="text-sm font-semibold text-sky-700">The community</p>
          <h2 class="mt-2 text-2xl font-bold">Tenants, members and visitors</h2>
          <p class="mt-3 leading-7 text-slate-600">As the building grew, it became important to support different types of users: tenants leasing offices, members using shared facilities, visitors booking day passes and the public attending selected events.</p>
        </article>
        <article class="${card}">
          <p class="text-sm font-semibold text-sky-700">Today</p>
          <h2 class="mt-2 text-2xl font-bold">A digital layer for building operations</h2>
          <p class="mt-3 leading-7 text-slate-600">The current platform brings those operations together, giving staff, tenants and members clearer access to the services and information they need.</p>
        </article>
      </div>
    </section>
  `
})
export class AboutHistoryPage {}

const partners = [
  { name: 'Mara Doyle', role: 'Property Director', initials: 'MD', summary: 'Leads leasing strategy, tenant relationships and long-term property planning.' },
  { name: 'Eoin Walsh', role: 'Operations Manager', initials: 'EW', summary: 'Oversees building services, contractors, compliance and everyday running of the property.' },
  { name: 'Nadia Byrne', role: 'Retail Leasing Lead', initials: 'NB', summary: 'Works with shops, food operators and service tenants across the ground floor.' },
  { name: 'Tom Keane', role: 'Workspace Lead', initials: 'TK', summary: 'Manages day passes, hot desks, meeting rooms and the second-floor workspace experience.' }
];

const associates = [
  { name: 'Grace Osei', role: 'Front of House', initials: 'GO', summary: 'Welcomes visitors, supports wayfinding and coordinates day-to-day enquiries.' },
  { name: 'Liam Ryan', role: 'Facilities Coordinator', initials: 'LR', summary: 'Coordinates cleaning, maintenance requests and common-area presentation.' },
  { name: 'Ava Collins', role: 'Tenant Support', initials: 'AC', summary: 'Helps occupiers keep their profiles, hours and public information current.' },
  { name: 'Sean Murphy', role: 'Marketing Associate', initials: 'SM', summary: 'Supports tenant features, news items and building communications.' }
];

@Component({
  standalone: true,
  imports: [CommonModule, AboutNavComponent],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7] text-neutral-950">
      <app-about-nav />
      <div class="mx-auto max-w-[1920px] px-8 py-10 md:px-16 lg:px-24">
        <h1 class="text-xl font-semibold">Partners</h1>
        <div class="mt-8 grid gap-x-5 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
          @for (person of partners; track person.name) {
            <article class="group">
              <div class="grid aspect-[4/3] place-items-center overflow-hidden bg-neutral-200 text-5xl font-semibold text-neutral-400">
                <span class="transition duration-300 group-hover:scale-105">{{ person.initials }}</span>
              </div>
              <h2 class="mt-5 text-lg font-semibold">{{ person.name }}</h2>
              <p class="mt-1 text-sm font-semibold text-[#c90019]">{{ person.role }}</p>
              <p class="mt-3 text-sm leading-6 text-neutral-600">{{ person.summary }}</p>
            </article>
          }
        </div>

        <div class="mt-16 border-t border-neutral-200 pt-8">
          <h2 class="text-xl font-semibold">Associates</h2>
          <div class="mt-8 grid gap-x-5 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
            @for (person of associates; track person.name) {
              <article class="group">
                <div class="grid aspect-[4/3] place-items-center overflow-hidden bg-neutral-200 text-5xl font-semibold text-neutral-400">
                  <span class="transition duration-300 group-hover:scale-105">{{ person.initials }}</span>
                </div>
                <h3 class="mt-5 text-lg font-semibold">{{ person.name }}</h3>
                <p class="mt-1 text-sm font-semibold text-[#c90019]">{{ person.role }}</p>
                <p class="mt-3 text-sm leading-6 text-neutral-600">{{ person.summary }}</p>
              </article>
            }
          </div>
        </div>
      </div>
    </section>
  `
})
export class AboutTeamPage {
  readonly partners = partners;
  readonly associates = associates;
}

const exchangeSpaces: ExchangeSpace[] = [
  {
    id: 'b1-parking',
    name: 'Basement Parking',
    floor: 'Basement',
    category: 'Parking',
    tenant: 'Tenant and customer parking',
    summary: 'Secure basement parking serving shoppers, medical visitors, hot desk members and office tenants.',
    unit: 'B1',
    accent: 'bg-neutral-900',
    image: '/tenants/basement-parking-interior.png',
    path: '/'
  },
  {
    id: 'g1-restaurant',
    name: 'Ember Table',
    floor: 'Ground Floor',
    category: 'Food & Drink',
    tenant: 'Restaurant',
    summary: 'All-day restaurant with evening service, client lunches and direct street access.',
    unit: 'G.01',
    accent: 'bg-[#8f1f2f]',
    image: '/tenants/ember-table-interior.png',
    path: '/offices/ember-table-exch-g-01'
  },
  {
    id: 'g2-cafe',
    name: 'Exchange Coffee',
    floor: 'Ground Floor',
    category: 'Food & Drink',
    tenant: 'Cafe',
    summary: 'Neighbourhood cafe for commuters, office tenants and the co-working community.',
    unit: 'G.02',
    accent: 'bg-[#a96732]',
    image: '/tenants/exchange-coffee-interior.png',
    path: '/offices/exchange-coffee-exch-g-02'
  },
  {
    id: 'g3-supermarket',
    name: 'Market Hall Grocer',
    floor: 'Ground Floor',
    category: 'Retail',
    tenant: 'Supermarket',
    summary: 'Convenience-led supermarket carrying daily groceries, fresh food and workplace essentials.',
    unit: 'G.03',
    accent: 'bg-[#52663b]',
    image: '/tenants/market-hall-grocer-interior.png',
    path: '/offices/market-hall-grocer-exch-g-03'
  },
  {
    id: 'g4-pharmacy',
    name: 'Exchange Pharmacy',
    floor: 'Ground Floor',
    category: 'Health',
    tenant: 'Pharmacy',
    summary: 'Community pharmacy supporting medical visitors, residents and building occupiers.',
    unit: 'G.04',
    accent: 'bg-[#006c67]',
    image: '/tenants/exchange-pharmacy-interior.png',
    path: '/offices/exchange-pharmacy-exch-g-04'
  },
  {
    id: 'g5-sporting-goods',
    name: 'Stride Sporting Goods',
    floor: 'Ground Floor',
    category: 'Retail',
    tenant: 'Sporting goods store',
    summary: 'Performance footwear, training apparel and equipment for active city living.',
    unit: 'G.05',
    accent: 'bg-[#273f73]',
    image: '/tenants/stride-sporting-goods-interior.png',
    path: '/offices/stride-sporting-goods-exch-g-05'
  },
  {
    id: 'f1-riverside-medical',
    name: 'Riverside Medical Centre',
    floor: 'First Floor',
    category: 'Health',
    tenant: 'Medical practice',
    summary: 'Full-floor medical practice with consultation rooms, patient reception and lift access.',
    unit: '1.00',
    accent: 'bg-[#007c89]',
    image: '/riverside-medical-centre.png',
    path: '/riverside-medical-centre'
  },
  {
    id: 'f2-coworking',
    name: 'The Exchange Work Club',
    floor: 'Second Floor',
    category: 'Hot Desks',
    tenant: 'Managed co-working floor',
    summary: 'Hot desks, touchdown benches, booths, shared meeting rooms and managed reception support.',
    unit: '2.00',
    accent: 'bg-[#c90019]',
    image: '/workspace-open-plan.png',
    path: '/workspace'
  },
  {
    id: 'f3-01',
    name: 'North Star Digital',
    floor: 'Third Floor',
    category: 'Office',
    tenant: 'Product studio',
    summary: 'Private suite for web products, client workshops and hybrid product teams.',
    unit: '3.01',
    accent: 'bg-[#5a3f90]',
    image: '/tenants/north-star-digital-interior.png',
    path: '/offices/north-star-digital-exch-3-01'
  },
  {
    id: 'f3-02',
    name: 'Bricolage Works',
    floor: 'Third Floor',
    category: 'Office',
    tenant: 'Creative production',
    summary: 'Campaign, content and brand experience studio with a compact project room.',
    unit: '3.02',
    accent: 'bg-[#975f28]',
    image: '/tenants/bricolage-works-interior.png',
    path: '/offices/bricolage-exch-3-02'
  },
  {
    id: 'f3-03',
    name: 'Quantum Labs',
    floor: 'Third Floor',
    category: 'Office',
    tenant: 'Analytics team',
    summary: 'Research-led software office for analytics, data tooling and client demos.',
    unit: '3.03',
    accent: 'bg-[#445a77]',
    image: '/tenants/quantum-labs-interior.png',
    path: '/offices/quantum-exch-3-03'
  },
  {
    id: 'f3-04',
    name: 'Scribble & Stone',
    floor: 'Third Floor',
    category: 'Office',
    tenant: 'Communications',
    summary: 'Strategic communications office for public affairs, digital storytelling and campaigns.',
    unit: '3.04',
    accent: 'bg-[#6f5142]',
    image: '/tenants/scribble-stone-interior.png',
    path: '/offices/scribble-and-stone-exch-3-04'
  },
  {
    id: 'f3-05',
    name: 'Bee Events',
    floor: 'Third Floor',
    category: 'Office',
    tenant: 'Event design',
    summary: 'Event planning studio for guest experience, production logistics and launches.',
    unit: '3.05',
    accent: 'bg-[#b1851f]',
    image: '/tenants/bee-events-interior.png',
    path: '/offices/bee-exch-3-05'
  },
  {
    id: 'f3-06',
    name: 'Odin Consultants',
    floor: 'Third Floor',
    category: 'Office',
    tenant: 'Operations consultancy',
    summary: 'Consultancy suite supporting SMEs with systems, process and operational change.',
    unit: '3.06',
    accent: 'bg-[#475547]',
    image: '/tenants/odin-consultants-interior.png',
    path: '/offices/odin-consultants-exch-3-06'
  },
  {
    id: 'f4-01',
    name: 'Akara Studio',
    floor: 'Fourth Floor',
    category: 'Office',
    tenant: 'Product design',
    summary: 'Design partner for startups, cultural organisations and community platforms.',
    unit: '4.01',
    accent: 'bg-[#2f655d]',
    image: '/tenants/akara-studio-interior.png',
    path: '/offices/akara-exch-4-01'
  },
  {
    id: 'f4-02',
    name: 'Field Arts',
    floor: 'Fourth Floor',
    category: 'Office',
    tenant: 'Arts management',
    summary: 'Programming and audience development office for Irish venues and festivals.',
    unit: '4.02',
    accent: 'bg-[#6f3f52]',
    image: '/tenants/field-arts-interior.png',
    path: '/offices/field-arts-exch-4-02'
  },
  {
    id: 'f4-03',
    name: 'Neuromod Devices',
    floor: 'Fourth Floor',
    category: 'Office',
    tenant: 'Health technology',
    summary: 'Clinical innovation and device research suite with quiet focus rooms.',
    unit: '4.03',
    accent: 'bg-[#1f6b85]',
    image: '/tenants/neuromod-devices-interior.png',
    path: '/offices/neuromod-devices-exch-4-03'
  },
  {
    id: 'f4-04',
    name: 'Context Studio',
    floor: 'Fourth Floor',
    category: 'Office',
    tenant: 'Architecture',
    summary: 'Architecture, interiors and workplace strategy team focused on adaptive reuse.',
    unit: '4.04',
    accent: 'bg-[#7b5941]',
    image: '/tenants/context-studio-interior.png',
    path: '/offices/context-studio-exch-4-04'
  },
  {
    id: 'f4-05',
    name: 'Codema Energy',
    floor: 'Fourth Floor',
    category: 'Office',
    tenant: 'Sustainability advisors',
    summary: 'Energy planning office helping organisations plan practical building improvements.',
    unit: '4.05',
    accent: 'bg-[#546d2f]',
    image: '/tenants/codema-energy-interior.png',
    path: '/offices/codema-exch-4-05'
  },
  {
    id: 'f4-06',
    name: 'Alga Operations',
    floor: 'Fourth Floor',
    category: 'Office',
    tenant: 'Workflow software',
    summary: 'Digital operations team building workflow tools for distributed companies.',
    unit: '4.06',
    accent: 'bg-[#315c72]',
    image: '/tenants/alga-operations-interior.png',
    path: '/offices/alga-exch-4-06'
  },
  {
    id: 'f5-01',
    name: 'Kavaleer Media',
    floor: 'Fifth Floor',
    category: 'Office',
    tenant: 'Animation studio',
    summary: 'Media production suite for character-led stories, storyboarding and production teams.',
    unit: '5.01',
    accent: 'bg-[#60436d]',
    image: '/tenants/kavaleer-media-interior.png',
    path: '/offices/kavaleer-exch-5-01'
  },
  {
    id: 'f5-02',
    name: 'Harbour Legal',
    floor: 'Fifth Floor',
    category: 'Office',
    tenant: 'Legal practice',
    summary: 'Professional services office for commercial agreements, property and employment advice.',
    unit: '5.02',
    accent: 'bg-[#374151]',
    image: '/tenants/harbour-legal-interior.png',
    path: '/offices/office-suite-5-02-exch-5-02'
  },
  {
    id: 'f5-03',
    name: 'Copperline Finance',
    floor: 'Fifth Floor',
    category: 'Office',
    tenant: 'Financial advisory',
    summary: 'Advisory suite for owner-managed businesses, lending and financial planning.',
    unit: '5.03',
    accent: 'bg-[#8b5d28]',
    image: '/tenants/copperline-finance-interior.png',
    path: '/offices/office-suite-5-03-exch-5-03'
  },
  {
    id: 'f5-04',
    name: 'Atlas Recruitment',
    floor: 'Fifth Floor',
    category: 'Office',
    tenant: 'Recruitment',
    summary: 'Recruitment office supporting office, retail, medical and hospitality employers.',
    unit: '5.04',
    accent: 'bg-[#734343]',
    image: '/tenants/atlas-recruitment-interior.png',
    path: '/offices/office-suite-5-04-exch-5-04'
  },
  {
    id: 'f5-05',
    name: 'Mosaic HR',
    floor: 'Fifth Floor',
    category: 'Office',
    tenant: 'People consultancy',
    summary: 'HR consultancy suite for policy, culture, compliance and leadership support.',
    unit: '5.05',
    accent: 'bg-[#4f5f3b]',
    image: '/tenants/mosaic-hr-interior.png',
    path: '/offices/office-suite-5-05-exch-5-05'
  },
  {
    id: 'f5-06',
    name: 'Bluebridge Advisory',
    floor: 'Fifth Floor',
    category: 'Office',
    tenant: 'Business advisory',
    summary: 'Management advisory office for transformation programmes and board support.',
    unit: '5.06',
    accent: 'bg-[#264b68]',
    image: '/tenants/bluebridge-advisory-interior.png',
    path: '/offices/office-suite-5-06-exch-5-06'
  }
];

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7] text-neutral-950">
      <div class="border-b border-neutral-200 bg-[#fbfaf7]">
        <div class="mx-auto grid max-w-[1920px] gap-8 px-8 py-10 md:px-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-24">
          <div class="flex flex-col justify-center">
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c90019]">Mixed-use destination</p>
            <h1 class="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">The Exchange</h1>
            <p class="mt-5 max-w-xl text-sm leading-7 text-neutral-700">A shopping mall and office property with basement parking, ground-floor retail, a full medical floor, managed hot desks and upper-level private offices.</p>
            <div class="mt-8 grid max-w-xl grid-cols-2 gap-2 border-y border-neutral-200 py-5 text-sm md:grid-cols-4">
              <button
                class="p-3 text-left transition hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c90019]"
                [class.bg-white]="isHeroFilterActive('Parking')"
                type="button"
                (click)="applyHeroFilter('Parking')"
              >
                <p class="text-2xl font-semibold">B1</p>
                <p class="mt-1 text-xs uppercase text-neutral-500">Parking</p>
              </button>
              <button
                class="p-3 text-left transition hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c90019]"
                [class.bg-white]="isHeroFilterActive('All', 'Ground Floor')"
                type="button"
                (click)="applyHeroFilter('All', 'Ground Floor')"
              >
                <p class="text-2xl font-semibold">5</p>
                <p class="mt-1 text-xs uppercase text-neutral-500">Ground shops</p>
              </button>
              <button
                class="p-3 text-left transition hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c90019]"
                [class.bg-white]="isHeroFilterActive('Health', 'First Floor')"
                type="button"
                (click)="applyHeroFilter('Health', 'First Floor')"
              >
                <p class="text-2xl font-semibold">1</p>
                <p class="mt-1 text-xs uppercase text-neutral-500">Medical floor</p>
              </button>
              <button
                class="p-3 text-left transition hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c90019]"
                [class.bg-white]="isHeroFilterActive('Office')"
                type="button"
                (click)="applyHeroFilter('Office')"
              >
                <p class="text-2xl font-semibold">18</p>
                <p class="mt-1 text-xs uppercase text-neutral-500">Office suites</p>
              </button>
            </div>
          </div>

            <div class="min-h-80 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,.68)_100%),url('/home-background.webp')] bg-cover bg-center text-white">
            <div class="flex h-full min-h-80 items-end p-6">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Directory</p>
                <p class="mt-2 max-w-md text-2xl font-semibold leading-tight">Browse every occupied space by tenant, floor or use type.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sticky top-40 z-30 border-b border-neutral-200 bg-[#fbfaf7]/95 backdrop-blur">
        <form class="mx-auto grid max-w-[1920px] gap-3 px-8 py-4 md:px-16 lg:grid-cols-[1fr_16rem] lg:px-24" aria-label="Filter occupied spaces">
          <label class="sr-only" for="exchange-search">Search The Exchange</label>
          <input id="exchange-search" class="min-h-12 border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-[#c90019]" [(ngModel)]="query" name="query" type="search" placeholder="Search tenant, floor, unit or keyword">
          <label class="sr-only" for="exchange-type">Type</label>
          <select id="exchange-type" class="min-h-12 border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none focus:border-[#c90019]" [(ngModel)]="selectedType" name="selectedType">
            @for (type of spaceTypes; track type) {
              <option [value]="type">{{ type === 'All' ? 'All types' : type }}</option>
            }
          </select>
        </form>
      </div>

      <div class="mx-auto max-w-[1920px] px-8 py-8 md:px-16 lg:px-24">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
          <p>{{ filteredSpaces().length }} occupied spaces shown</p>
          <p>Basement, ground floor and five upper levels</p>
        </div>

        <div class="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          @for (space of filteredSpaces(); track space.id; let index = $index) {
            <a
              [routerLink]="space.path"
              [style.animation-delay.ms]="120 + (index * 70)"
              class="tenant-card group min-h-[27rem] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#c90019]"
            >
              <div class="relative h-56 overflow-hidden bg-neutral-200">
                <img [src]="space.image" [alt]="space.name" class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]">
                <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/80"></div>
                <div class="absolute left-4 top-4 flex items-center gap-2">
                  <span class="px-2 py-1 text-xs font-semibold text-white" [ngClass]="space.accent">{{ space.unit }}</span>
                  <span class="bg-white/90 px-2 py-1 text-xs font-semibold text-neutral-950">{{ space.category }}</span>
                </div>
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">{{ space.floor }}</p>
                  <h2 class="mt-2 text-xl font-semibold leading-tight text-white">{{ space.name }}</h2>
                </div>
              </div>

              <div class="p-5">
                <p class="text-sm font-semibold text-[#f06a5f]">{{ space.tenant }}</p>
                <p class="mt-3 text-sm leading-6 text-neutral-700">{{ space.summary }}</p>
                <div class="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs font-semibold uppercase text-neutral-500">
                  <span>Occupied</span>
                  <span>{{ space.floor }}</span>
                </div>
              </div>
            </a>
          } @empty {
            <div class="col-span-full border border-neutral-200 bg-white p-10 text-center">
              <h2 class="text-2xl font-semibold">No spaces found</h2>
              <p class="mt-3 text-sm text-neutral-600">Try another keyword or switch the type filter back to all.</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .tenant-card {
      animation: exchange-card-reveal 680ms cubic-bezier(0.19, 1, 0.22, 1) both;
      opacity: 0;
      transform: translateY(24px);
      will-change: opacity, transform;
    }

    @keyframes exchange-card-reveal {
      from {
        opacity: 0;
        transform: translateY(24px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .tenant-card {
        animation: none;
        opacity: 1;
        transform: none;
        will-change: auto;
      }
    }
  `]
})
export class HomePage {
  private readonly http = inject(HttpClient);

  readonly home = signal<HomeData | null>(null);
  readonly spaces = exchangeSpaces;
  readonly spaceTypes = ['All', 'Parking', 'Retail', 'Food & Drink', 'Health', 'Hot Desks', 'Office'];
  query = '';
  selectedType = 'All';

  constructor() {
    this.http.get<HomeData>('/api/home').subscribe((home) => this.home.set(home));
  }

  availableOffices() {
    return this.home()?.offices.filter((office) => office.status === 'available') ?? [];
  }

  publicItems() {
    return this.home()?.publicContent ?? [];
  }

  featuredOffices() {
    return (this.home()?.offices ?? []).slice(0, 3);
  }

  applyHeroFilter(type: string, query = '') {
    this.selectedType = type;
    this.query = query;
  }

  isHeroFilterActive(type: string, query = '') {
    return this.selectedType === type && this.query === query;
  }

  filteredSpaces() {
    const query = this.query.trim().toLowerCase();

    return this.spaces.filter((space) => {
      const matchesType = this.selectedType === 'All' || space.category === this.selectedType;
      const matchesQuery = !query || [space.name, space.floor, space.category, space.tenant, space.summary, space.unit]
        .some((value) => value.toLowerCase().includes(query));

      return matchesType && matchesQuery;
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7]">
      <div class="mx-auto max-w-[1920px] px-8 py-10 md:px-16 lg:px-24">
        <div class="border-b border-neutral-200 pb-8">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Office suites</p>
          <h1 class="mt-3 text-4xl font-semibold text-neutral-950">Level 3, 4 and 5 offices</h1>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-neutral-700">Browse the 18 office suites at The Exchange. Occupied suites show the current tenant profile, while available suites show rental details for the stable unit SKU.</p>
          <address class="mt-5 not-italic text-sm font-semibold text-neutral-600">The Exchange, 42 Market Street, Dublin 2</address>
        </div>

        <form class="mt-8 grid gap-3 border border-neutral-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_12rem]" aria-label="Search office suites">
          <label class="sr-only" for="property-query">Tenant, SKU, floor or keyword</label>
          <input id="property-query" class="min-h-12 border border-neutral-200 px-4 text-sm outline-none focus:border-[#c90019]" [(ngModel)]="query" name="query" type="search" placeholder="Tenant, SKU, floor or keyword">
          <label class="sr-only" for="property-status">Status</label>
          <select id="property-status" class="min-h-12 border border-neutral-200 px-4 text-sm outline-none focus:border-[#c90019]" [(ngModel)]="status" name="status">
            <option value="all">All statuses</option>
            <option value="occupied">Occupied tenants</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
          </select>
        </form>

        <div class="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-neutral-600">
          <p>{{ filteredOffices().length }} office suites found</p>
          <p>{{ occupiedCount() }} occupied · {{ availableCount() }} available</p>
        </div>

        <div class="mt-6 grid gap-5 lg:grid-cols-3">
          <article *ngFor="let office of filteredOffices()" class="bg-white shadow-sm">
            @if (coverImage(office)) {
              <img [src]="coverImage(office)" alt="" class="h-56 w-full object-cover">
            } @else {
              <div class="grid h-56 place-items-center bg-[#ece8df]">
                <div class="grid h-20 w-20 place-items-center rounded-full bg-white text-xl font-black text-neutral-950">{{ initials(office.displayName) }}</div>
              </div>
            }
            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">{{ office.floor }} · {{ office.unitNumber }} · {{ office.sku }}</p>
                  <h2 class="mt-2 text-lg font-semibold text-neutral-950">{{ office.displayName }}</h2>
                  <p class="mt-1 text-xs font-semibold uppercase text-[#c90019]">{{ typeLabel(office.spaceType) }}</p>
                </div>
                @if (office.tenantLogoDataUrl) {
                  <img [src]="office.tenantLogoDataUrl" alt="" class="h-12 w-12 object-contain">
                } @else {
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-neutral-200 text-xs font-black">{{ initials(office.displayName) }}</span>
                }
              </div>

              <p class="mt-4 text-sm leading-6 text-neutral-700">{{ office.status === 'occupied' ? (office.tenantSummary || office.summary) : office.summary }}</p>

              @if (office.status === 'occupied') {
                <dl class="mt-5 grid gap-2 border-t border-neutral-100 pt-5 text-sm">
                  <div class="flex justify-between gap-4"><dt class="text-neutral-500">Phone</dt><dd class="font-semibold">{{ office.tenantPhone || 'By enquiry' }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-neutral-500">Hours</dt><dd class="text-right font-semibold">{{ office.tenantTradingHours || 'Mall hours' }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-neutral-500">Closed</dt><dd class="text-right font-semibold">{{ office.tenantClosedDays || 'None listed' }}</dd></div>
                </dl>
              } @else {
                <dl class="mt-5 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-5 text-sm">
                  <div><dt class="text-xs text-neutral-500">Area</dt><dd class="font-semibold">{{ office.sizeSqM }} m²</dd></div>
                  <div><dt class="text-xs text-neutral-500">People</dt><dd class="font-semibold">{{ office.capacity }}</dd></div>
                  <div><dt class="text-xs text-neutral-500">Rent</dt><dd class="font-semibold">{{ rentLabel(office) }}</dd></div>
                </dl>
              }
              <div class="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                <span class="border border-neutral-200 px-2 py-1 text-[11px] font-semibold uppercase text-neutral-600">{{ office.status }}</span>
                <a [routerLink]="['/offices', office.slug]" class="text-sm font-semibold underline decoration-[#c90019] underline-offset-4">View details</a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  `
})
export class OfficesPage {
  private readonly http = inject(HttpClient);
  readonly offices = signal<Office[]>([]);
  query = '';
  propertyType = 'all';
  status = 'all';

  constructor() {
    this.http.get<{ offices: Office[] }>('/api/offices').subscribe(({ offices }) => this.offices.set(offices));
  }

  officeSuites() {
    return this.offices().filter((office) => office.spaceType === 'office');
  }

  filteredOffices() {
    const query = this.query.trim().toLowerCase();

    return this.officeSuites().filter((office) => {
      const matchesQuery = !query || [
        office.name,
        office.displayName,
        office.summary,
        office.tenantSummary ?? '',
        office.assignedBusinessName ?? '',
        office.sku,
        office.floor,
        office.unitNumber,
        office.spaceType
      ].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = this.status === 'all' || office.status === this.status;
      const matchesType = this.propertyType === 'all' || office.spaceType === this.propertyType;

      return matchesQuery && matchesStatus && matchesType;
    });
  }

  occupiedCount() {
    return this.officeSuites().filter((office) => office.status === 'occupied').length;
  }

  availableCount() {
    return this.officeSuites().filter((office) => office.status === 'available').length;
  }

  coverImage(office: Office) {
    return office.tenantCoverImageDataUrl || office.imageDataUrl;
  }

  rentLabel(office: Office) {
    const rent = office.rentFee || office.monthly_price;
    return rent ? `€${rent}` : 'POA';
  }

  typeLabel(type: string) {
    return type.replace(/-/g, ' ');
  }

  initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
}

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7]">
      <div class="mx-auto max-w-[1920px] px-8 py-10 md:px-16 lg:px-24">
        @if (medicalCentre(); as centre) {
          <div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div class="flex flex-col justify-center">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#c90019]">First floor medical practice</p>
              <h1 class="mt-3 text-4xl font-semibold leading-tight text-neutral-950 md:text-5xl">Riverside Medical Centre</h1>
              <p class="mt-5 max-w-2xl text-sm leading-7 text-neutral-700">{{ centre.tenantSummary || centre.summary }}</p>
              <dl class="mt-8 grid max-w-2xl gap-4 border-y border-neutral-200 py-6 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-xs font-semibold uppercase text-neutral-500">Location</dt>
                  <dd class="mt-1 font-semibold text-neutral-950">{{ centre.floor }} · Unit {{ centre.unitNumber }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-semibold uppercase text-neutral-500">Address</dt>
                  <dd class="mt-1 font-semibold text-neutral-950">{{ centre.address }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-semibold uppercase text-neutral-500">Phone</dt>
                  <dd class="mt-1 font-semibold text-neutral-950">{{ centre.tenantPhone || 'By enquiry' }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-semibold uppercase text-neutral-500">Email</dt>
                  <dd class="mt-1 font-semibold text-neutral-950">{{ centre.tenantEmail || 'By enquiry' }}</dd>
                </div>
              </dl>
              <div class="mt-8 flex flex-wrap gap-3">
                <a class="bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90019]" [href]="'mailto:' + (centre.tenantEmail || 'hello@theexchange.example')">Contact centre</a>
                <a href="/riverside-medical-centre#doctors" class="border border-neutral-950 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-950 hover:text-white">Learn more</a>
              </div>
            </div>

            <div class="min-h-[30rem] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,.42)_100%),url('/riverside-medical-centre.png')] bg-cover bg-center text-white">
              <div class="flex h-full min-h-[30rem] items-end p-6">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">The Exchange</p>
                  <p class="mt-2 max-w-md text-2xl font-semibold leading-tight text-white">Dedicated first-floor healthcare space with lift access from parking and the ground-floor mall.</p>
                </div>
              </div>
            </div>
          </div>

          <section class="mt-12 grid gap-6 lg:grid-cols-3">
            <article class="border-t border-neutral-200 pt-5">
              <h2 class="text-xl font-semibold">Trading Hours</h2>
              <p class="mt-3 text-sm leading-7 text-neutral-700">{{ centre.tenantTradingHours || 'Mall hours' }}</p>
            </article>
            <article class="border-t border-neutral-200 pt-5">
              <h2 class="text-xl font-semibold">Closed Days</h2>
              <p class="mt-3 text-sm leading-7 text-neutral-700">{{ centre.tenantClosedDays || 'None listed' }}</p>
            </article>
            <article class="border-t border-neutral-200 pt-5">
              <h2 class="text-xl font-semibold">Access</h2>
              <p class="mt-3 text-sm leading-7 text-neutral-700">Patient access is via the main mall lifts and basement parking at The Exchange.</p>
            </article>
          </section>

          <section id="doctors" class="mt-14 scroll-mt-44 border-t border-neutral-200 pt-10">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Clinical team</p>
                <h2 class="mt-3 text-3xl font-semibold text-neutral-950">Doctors and core services</h2>
              </div>
              <p class="max-w-xl text-sm leading-7 text-neutral-700">Seven clinicians provide primary care, diagnostics and specialist support from the first floor consultation rooms.</p>
            </div>

            <div class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              @for (doctor of doctors; track doctor.name) {
                <article class="bg-white p-5 shadow-sm">
                  <div class="flex items-start gap-4">
                    <img [src]="doctor.image" alt="" class="h-20 w-20 shrink-0 rounded-full object-cover">
                    <div>
                      <h3 class="text-lg font-semibold text-neutral-950">{{ doctor.name }}</h3>
                      <p class="mt-1 text-sm font-semibold text-[#c90019]">{{ doctor.qualification }}</p>
                      <p class="mt-3 text-sm leading-6 text-neutral-700">{{ doctor.speciality }}</p>
                    </div>
                  </div>
                </article>
              }
            </div>
          </section>
        } @else {
          <div class="bg-white p-8">
            <h1 class="text-3xl font-semibold text-neutral-950">Loading Riverside Medical Centre...</h1>
          </div>
        }
      </div>
    </section>
  `
})
export class MedicareCentrePage {
  private readonly http = inject(HttpClient);
  readonly medicalCentre = signal<Office | null>(null);
  readonly doctors = [
    {
      initials: 'EM',
      image: '/doctors/eva-murphy.png',
      name: 'Dr Eva Murphy',
      qualification: 'MB BCh BAO, MICGP',
      speciality: 'GP · Family medicine and preventative health',
      avatarClass: 'bg-[#7b5941]'
    },
    {
      initials: 'RK',
      image: '/doctors/ronan-kelly.png',
      name: 'Dr Ronan Kelly',
      qualification: 'MB BCh BAO, MRCGP',
      speciality: 'GP · Men\'s health and chronic disease reviews',
      avatarClass: 'bg-[#315c72]'
    },
    {
      initials: 'AS',
      image: '/doctors/aisling-shah.png',
      name: 'Dr Aisling Shah',
      qualification: 'MBBS, MICGP, DCH',
      speciality: 'GP · Women\'s health and paediatrics',
      avatarClass: 'bg-[#6f3f52]'
    },
    {
      initials: 'CN',
      image: '/doctors/ciaran-nolan.png',
      name: 'Dr Ciaran Nolan',
      qualification: 'MB BCh BAO, MICGP',
      speciality: 'GP · Urgent care and minor injuries',
      avatarClass: 'bg-[#475547]'
    },
    {
      initials: 'LM',
      image: '/doctors/leila-morgan.png',
      name: 'Dr Leila Morgan',
      qualification: 'MD, MRCPI',
      speciality: 'Cardiology · Heart health and blood pressure clinics',
      avatarClass: 'bg-[#8f1f2f]'
    },
    {
      initials: 'SO',
      image: '/doctors/sarah-oconnell.png',
      name: 'Dr Sarah O\'Connell',
      qualification: 'MB BCh, MSc Dermatology',
      speciality: 'Dermatology · Skin checks and minor procedures',
      avatarClass: 'bg-[#2f655d]'
    },
    {
      initials: 'PJ',
      image: '/doctors/patrick-joyce.png',
      name: 'Dr Patrick Joyce',
      qualification: 'MB BCh BAO, FFSEM',
      speciality: 'Sports medicine · Musculoskeletal assessment and rehab',
      avatarClass: 'bg-[#5a3f90]'
    }
  ];

  constructor() {
    this.http.get<{ office: Office }>('/api/offices/EXCH-1-00').subscribe(({ office }) => this.medicalCentre.set(office));
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7]">
      @if (toastMessage()) {
        <div class="fixed right-6 top-6 z-[90] max-w-sm bg-neutral-950 px-5 py-4 text-sm font-semibold text-white shadow-xl transition-opacity duration-500" [class.opacity-0]="toastLeaving()" [class.opacity-100]="!toastLeaving()">
          {{ toastMessage() }}
        </div>
      }

      <div class="mx-auto max-w-[1920px] px-8 py-10 md:px-16 lg:px-24">
        <a routerLink="/offices" class="text-sm font-semibold text-neutral-700 underline decoration-[#c90019] underline-offset-4">Back to offices</a>

        @if (office(); as property) {
          <div class="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              @if (coverImage(property)) {
                <img [src]="coverImage(property)" alt="" class="aspect-[16/10] w-full object-cover">
              } @else {
                <div class="grid aspect-[16/10] w-full place-items-center bg-neutral-100 text-sm text-neutral-500">Image coming soon</div>
              }
            </div>

            <aside class="self-start bg-white p-6 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">{{ property.status === 'occupied' ? 'Tenant profile' : 'Available space' }}</p>
                  <h1 class="mt-3 text-4xl font-semibold leading-tight text-neutral-950">{{ property.displayName }}</h1>
                </div>
                @if (property.tenantLogoDataUrl) {
                  <img [src]="property.tenantLogoDataUrl" alt="" class="h-16 w-16 object-contain">
                }
              </div>
              <p class="mt-3 text-sm text-neutral-500">{{ property.unitNumber }} · {{ property.floor }} · {{ property.sku }}</p>
              <p class="mt-1 text-sm text-neutral-500">{{ property.address }}</p>
              <span class="mt-5 inline-flex border border-neutral-200 px-3 py-1 text-xs font-semibold uppercase text-neutral-600">{{ property.status }}</span>

              <dl class="mt-8 grid grid-cols-3 gap-4 border-y border-neutral-100 py-6 text-sm">
                <div><dt class="text-xs text-neutral-500">Area</dt><dd class="mt-1 font-semibold">{{ property.sizeSqM }} m²</dd></div>
                <div><dt class="text-xs text-neutral-500">People</dt><dd class="mt-1 font-semibold">{{ property.capacity }}</dd></div>
                <div><dt class="text-xs text-neutral-500">{{ property.status === 'occupied' ? 'Type' : 'Rent' }}</dt><dd class="mt-1 font-semibold capitalize">{{ property.status === 'occupied' ? typeLabel(property.spaceType) : rentLabel(property) }}</dd></div>
              </dl>

              <p class="mt-6 text-sm leading-7 text-neutral-700">{{ property.status === 'occupied' ? (property.tenantSummary || property.summary) : property.summary }}</p>
              @if (property.optionalTerms) {
                <p class="mt-4 text-sm leading-7 text-neutral-600">{{ property.optionalTerms }}</p>
              }

              @if (property.status === 'occupied') {
                <dl class="mt-6 grid gap-3 border-t border-neutral-100 pt-5 text-sm">
                  <div><dt class="font-semibold text-neutral-950">Phone</dt><dd class="mt-1 text-neutral-700">{{ property.tenantPhone || 'By enquiry' }}</dd></div>
                  <div><dt class="font-semibold text-neutral-950">Email</dt><dd class="mt-1 text-neutral-700">{{ property.tenantEmail || 'By enquiry' }}</dd></div>
                  <div><dt class="font-semibold text-neutral-950">Trading hours</dt><dd class="mt-1 text-neutral-700">{{ property.tenantTradingHours || 'Mall hours' }}</dd></div>
                  <div><dt class="font-semibold text-neutral-950">Closed days</dt><dd class="mt-1 text-neutral-700">{{ property.tenantClosedDays || 'None listed' }}</dd></div>
                </dl>
              }

              <div class="mt-8 grid gap-3 sm:grid-cols-2">
                @if (property.status === 'occupied' && property.tenantEmail) {
                  <a class="inline-flex justify-center bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90019]" [href]="'mailto:' + property.tenantEmail">Contact tenant</a>
                } @else {
                  <button type="button" class="inline-flex justify-center bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90019]" (click)="showEnquiryModal.set(true)">Enquire now</button>
                }
                <button type="button" class="inline-flex justify-center border border-neutral-950 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-950 hover:text-white" (click)="showAddressModal.set(true)">Find us</button>
              </div>
            </aside>
          </div>

          <section class="mt-12 grid gap-6 lg:grid-cols-3">
            <article class="border-t border-neutral-200 pt-5">
              <h2 class="text-xl font-semibold">Management</h2>
              <p class="mt-3 text-sm leading-7 text-neutral-700">This unit is managed by The Exchange Commercial. The unit SKU stays fixed even when the tenant profile changes.</p>
            </article>
            <article class="border-t border-neutral-200 pt-5">
              <h2 class="text-xl font-semibold">Terms</h2>
              <p class="mt-3 text-sm leading-7 text-neutral-700">Flexible lease terms may be available depending on status, fit-out needs and occupier requirements.</p>
            </article>
            <article class="border-t border-neutral-200 pt-5">
              <h2 class="text-xl font-semibold">Privacy</h2>
              <p class="mt-3 text-sm leading-7 text-neutral-700">If a property is occupied, rental information is private and is not shown publicly.</p>
            </article>
          </section>
        } @else {
          <div class="mt-8 bg-white p-8">
            <h1 class="text-3xl font-semibold text-neutral-950">{{ error() || 'Loading property...' }}</h1>
            @if (error()) {
              <a routerLink="/offices" class="mt-5 inline-flex bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">View all offices</a>
            }
          </div>
        }
      </div>

      @if (showAddressModal() && office(); as property) {
        <div class="fixed inset-0 z-[80] grid place-items-center bg-neutral-950/50 px-4" role="dialog" aria-modal="true" aria-labelledby="office-address-title">
          <div class="w-full max-w-lg bg-white p-6 shadow-xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Office address</p>
                <h2 id="office-address-title" class="mt-2 text-2xl font-semibold text-neutral-950">{{ property.displayName }}</h2>
              </div>
              <button class="text-2xl leading-none text-neutral-500 hover:text-neutral-950" type="button" aria-label="Close address modal" (click)="showAddressModal.set(false)">×</button>
            </div>
            <address class="mt-6 not-italic text-sm leading-7 text-neutral-700">
              <p class="font-semibold text-neutral-950">{{ property.displayName }}</p>
              <p>{{ property.unitNumber }} · {{ property.floor }}</p>
              <p>{{ property.address }}</p>
              <p>Ireland</p>
            </address>
            <a class="mt-6 inline-flex bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90019]" [href]="mapUrl(property)" target="_blank" rel="noreferrer">Open in maps</a>
          </div>
        </div>
      }

      @if (showEnquiryModal() && office(); as property) {
        <div class="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-neutral-950/50 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="office-enquiry-title">
          <form class="w-full max-w-2xl bg-white p-6 shadow-xl" (ngSubmit)="submitEnquiry(property)">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Property enquiry</p>
                <h2 id="office-enquiry-title" class="mt-2 text-2xl font-semibold text-neutral-950">{{ property.displayName }}</h2>
              </div>
              <button class="text-2xl leading-none text-neutral-500 hover:text-neutral-950" type="button" aria-label="Close enquiry modal" (click)="showEnquiryModal.set(false)">×</button>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <label class="text-sm font-semibold text-neutral-800">Name
                <input class="mt-2 min-h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-[#c90019]" [(ngModel)]="enquiryForm.name" name="enquiryName" required>
              </label>
              <label class="text-sm font-semibold text-neutral-800">Email
                <input class="mt-2 min-h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-[#c90019]" [(ngModel)]="enquiryForm.email" name="enquiryEmail" type="email" required>
              </label>
              <label class="text-sm font-semibold text-neutral-800">Phone
                <input class="mt-2 min-h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-[#c90019]" [(ngModel)]="enquiryForm.phone" name="enquiryPhone" type="tel" required>
              </label>
              <label class="text-sm font-semibold text-neutral-800">Preferred contact
                <select class="mt-2 min-h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-[#c90019]" [(ngModel)]="enquiryForm.preferredContactMethod" name="preferredContactMethod" required>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </label>
              <label class="md:col-span-2 text-sm font-semibold text-neutral-800">Message
                <textarea class="mt-2 min-h-32 w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-[#c90019]" [(ngModel)]="enquiryForm.message" name="enquiryMessage" required></textarea>
              </label>
              <label class="md:col-span-2 flex items-start gap-3 text-sm leading-6 text-neutral-700">
                <input class="mt-1" type="checkbox" [(ngModel)]="enquiryForm.gdprApproved" name="gdprApproved" required>
                <span>I approve the processing of my details for the purpose of responding to this property enquiry.</span>
              </label>
            </div>

            <p class="mt-4 text-sm text-red-700">{{ enquiryMessage() }}</p>

            <div class="mt-6 flex flex-wrap justify-end gap-3">
              <button class="border border-neutral-300 px-5 py-3 text-sm font-semibold" type="button" (click)="showEnquiryModal.set(false)">Cancel</button>
              <button class="bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90019]" type="submit">Send enquiry</button>
            </div>
          </form>
        </div>
      }
    </section>
  `
})
export class OfficeDetailPage {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly office = signal<Office | null>(null);
  readonly error = signal('');
  readonly showAddressModal = signal(false);
  readonly showEnquiryModal = signal(false);
  readonly enquiryMessage = signal('');
  readonly toastMessage = signal('');
  readonly toastLeaving = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastFadeTimer: ReturnType<typeof setTimeout> | null = null;
  enquiryForm = {
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredContactMethod: 'email',
    gdprApproved: false
  };

  constructor() {
    const officeId = this.route.snapshot.paramMap.get('id');

    if (!officeId) {
      this.error.set('Office not found');
      return;
    }

    this.http.get<{ office: Office }>(`/api/offices/${encodeURIComponent(officeId)}`).subscribe({
      next: ({ office }) => this.office.set(office),
      error: () => this.error.set('Office not found')
    });
  }

  rentLabel(office: Office) {
    if (office.status === 'occupied') {
      return 'Private';
    }

    const rent = office.rentFee || office.monthly_price;
    return rent ? `€${rent}` : 'Price on request';
  }

  officeAddress(office: Office) {
    return `${office.displayName}, ${office.address}`;
  }

  mapUrl(office: Office) {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(this.officeAddress(office) + ', Ireland')}`;
  }

  coverImage(office: Office) {
    return office.tenantCoverImageDataUrl || office.imageDataUrl;
  }

  typeLabel(type: string) {
    return type.replace(/-/g, ' ');
  }

  submitEnquiry(office: Office) {
    this.enquiryMessage.set('');

    this.http.post(`/api/offices/${encodeURIComponent(office.id)}/enquiries`, this.enquiryForm).subscribe({
      next: () => {
        this.showEnquiryModal.set(false);
        this.showToast('Your enquiry has been received.');
        this.enquiryForm = {
          name: '',
          email: '',
          phone: '',
          message: '',
          preferredContactMethod: 'email',
          gdprApproved: false
        };
      },
      error: () => this.enquiryMessage.set('Please complete every required field and approve GDPR processing.')
    });
  }

  showToast(message: string) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    if (this.toastFadeTimer) {
      clearTimeout(this.toastFadeTimer);
    }

    this.toastLeaving.set(false);
    this.toastMessage.set(message);
    this.toastFadeTimer = setTimeout(() => this.toastLeaving.set(true), 2600);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
      this.toastLeaving.set(false);
    }, 3200);
  }
}

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7] text-neutral-950">
      <div class="border-b border-neutral-200">
        <div class="mx-auto grid max-w-[1920px] gap-10 px-8 py-12 md:px-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-24">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#c90019]">Basement level</p>
            <h1 class="mt-3 text-5xl font-semibold leading-tight text-neutral-950">Free parking at The Exchange</h1>
            <p class="mt-5 max-w-xl text-lg leading-8 text-neutral-700">The Exchange includes a free basement parking area with straightforward access back to the ground-floor mall and building entrances.</p>
          </div>

          <div class="relative min-h-80 overflow-hidden text-white">
            <img src="/tenants/basement-parking-interior.png" alt="Basement parking area with lift lobby at The Exchange" class="absolute inset-0 h-full w-full object-cover object-center">
            <div class="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/75"></div>
            <div class="relative flex h-full min-h-80 items-end p-6">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Visitor access</p>
                <p class="mt-2 max-w-md text-2xl font-semibold leading-tight">Park below the property, then continue by stairs, lift or ramp to ground level.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-[1280px] px-8 py-14 md:px-16 lg:px-24">
        <div class="grid gap-6 md:grid-cols-3">
          <article class="border border-neutral-200 bg-white p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#c90019]">Price</p>
            <h2 class="mt-3 text-2xl font-semibold">Free parking</h2>
            <p class="mt-4 text-sm leading-7 text-neutral-700">Parking is available free of charge for visitors using The Exchange.</p>
          </article>

          <article class="border border-neutral-200 bg-white p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#c90019]">Vertical access</p>
            <h2 class="mt-3 text-2xl font-semibold">2 stairs and 2 elevators</h2>
            <p class="mt-4 text-sm leading-7 text-neutral-700">Two stair cores and two elevators connect the parking area with the ground-floor mall level.</p>
          </article>

          <article class="border border-neutral-200 bg-white p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#c90019]">Step-free route</p>
            <h2 class="mt-3 text-2xl font-semibold">Ramp to ground level</h2>
            <p class="mt-4 text-sm leading-7 text-neutral-700">A ramp route is also available for direct access from the parking area to ground level.</p>
          </article>
        </div>

        <div class="mt-12 grid gap-10 border-y border-neutral-200 py-12 lg:grid-cols-[20rem_1fr]">
          <div>
            <h2 class="text-2xl font-semibold">Using the parking area</h2>
          </div>
          <div class="max-w-3xl text-sm leading-7 text-neutral-700">
            <p>The parking area sits at basement level and is intended to make visits to the shops, medical centre, workspace and office suites simpler. From the car park, visitors can reach ground level by either of the two stair routes, either of the two elevators, or the ramp access route.</p>
            <p class="mt-5">Once at ground level, you can continue into the mall, reach reception points, or move onward to the upper floors through the building circulation routes.</p>
            <a routerLink="/find-us" class="mt-8 inline-flex bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90019]">Find The Exchange</a>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ParkingPage {}

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7] text-neutral-950">
      <div class="border-b border-neutral-200">
        <div class="mx-auto max-w-[1920px] px-8 py-5 md:px-16 lg:px-24">
          <h1 class="text-lg font-semibold">Contact Us</h1>
        </div>
      </div>

      <div class="h-[34vh] min-h-72 overflow-hidden md:h-[42vh]">
        <img src="/williams.webp" alt="Williams Formula 1 car" class="h-full w-full object-cover object-center">
      </div>

      <div class="border-y border-neutral-200 bg-white">
        <div class="mx-auto grid max-w-[1280px] gap-8 px-8 py-12 md:grid-cols-3 md:px-16 lg:px-24">
          <section>
            <h2 class="text-xl font-medium tracking-[0.08em] text-[#c90019]">Get in touch</h2>
            <div class="mt-6 text-sm leading-7 text-neutral-700">
              <p><span class="font-semibold text-neutral-950">Tel:</span> +353 1 600 0050</p>
              <p><span class="font-semibold text-neutral-950">Email:</span> hello&#64;theexchange.example</p>
            </div>
          </section>

          <section>
            <h2 class="text-xl font-medium tracking-[0.08em] text-[#c90019]">Physical Address</h2>
            <address class="mt-6 not-italic text-sm leading-7 text-neutral-700">
              <p>The Exchange</p>
              <p>Riverwalk Avenue</p>
              <p>Dublin Docklands</p>
              <p>Dublin, Ireland</p>
            </address>
          </section>

          <section>
            <h2 class="text-xl font-medium tracking-[0.08em] text-[#c90019]">Postal Address</h2>
            <address class="mt-6 not-italic text-sm leading-7 text-neutral-700">
              <p>PO Box 4200</p>
              <p>Dublin 2</p>
              <p>Ireland</p>
            </address>
          </section>
        </div>
      </div>

      <div class="bg-[#f2efea]">
        <div class="mx-auto grid max-w-[1280px] gap-10 px-8 py-14 md:px-16 lg:grid-cols-2 lg:px-24">
          <form class="self-start" (ngSubmit)="sendMessage()">
            <h2 class="text-lg font-medium text-neutral-950">Contact us here:</h2>
            <p class="mt-2 text-xs italic text-neutral-500">Your email address will not be published. Required fields are marked *</p>

            <div class="mt-8 grid gap-6 sm:grid-cols-2">
              <label class="text-sm text-neutral-600">First name *
                <input class="mt-3 min-h-12 w-full border-0 border-b border-neutral-300 bg-transparent px-0 text-sm outline-none placeholder:text-neutral-400 focus:border-[#c90019]" name="firstName" [(ngModel)]="form.firstName" placeholder="John*" required>
              </label>
              <label class="text-sm text-neutral-600">Last name *
                <input class="mt-3 min-h-12 w-full border-0 border-b border-neutral-300 bg-transparent px-0 text-sm outline-none placeholder:text-neutral-400 focus:border-[#c90019]" name="lastName" [(ngModel)]="form.lastName" placeholder="Doe*" required>
              </label>
            </div>

            <label class="mt-6 block text-sm text-neutral-600">Email *
              <input class="mt-3 min-h-12 w-full border-0 border-b border-neutral-300 bg-transparent px-0 text-sm outline-none placeholder:text-neutral-400 focus:border-[#c90019]" name="email" [(ngModel)]="form.email" type="email" placeholder="johndoe@company.com*" required>
            </label>

            <label class="mt-6 block text-sm text-neutral-600">Company *
              <input class="mt-3 min-h-12 w-full border-0 border-b border-neutral-300 bg-transparent px-0 text-sm outline-none placeholder:text-neutral-400 focus:border-[#c90019]" name="company" [(ngModel)]="form.company" placeholder="Company*" required>
            </label>

            <label class="mt-6 block text-sm text-neutral-600">Phone number *
              <input class="mt-3 min-h-12 w-full border-0 border-b border-neutral-300 bg-transparent px-0 text-sm outline-none placeholder:text-neutral-400 focus:border-[#c90019]" name="phone" [(ngModel)]="form.phone" type="tel" placeholder="e.g. +353 1 600 0050*" required>
            </label>

            <label class="mt-8 block text-sm text-neutral-600">Your message
              <textarea class="mt-3 min-h-36 w-full resize-y border-0 border-b border-neutral-300 bg-transparent px-0 text-sm outline-none focus:border-[#c90019]" name="message" [(ngModel)]="form.message"></textarea>
            </label>

            <button type="submit" class="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-neutral-700 transition hover:text-[#c90019]">
              <span aria-hidden="true">→</span>
              <span>Send Message</span>
            </button>
            @if (message()) {
              <p class="mt-4 text-sm font-semibold text-[#c90019]">{{ message() }}</p>
            }
          </form>

          <div class="min-h-[32rem] overflow-hidden bg-white shadow-sm">
            <iframe
              title="Map to The Exchange"
              class="h-full min-h-[32rem] w-full border-0"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-6.2708%2C53.3404%2C-6.2458%2C53.3524&layer=mapnik&marker=53.3464%2C-6.2583"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  `
})
export class FindUsPage {
  readonly message = signal('');
  form = {
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  };

  sendMessage() {
    this.message.set('Thanks. Your message has been recorded for the property team.');
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      message: ''
    };
  }
}

@Component({
  standalone: true,
  template: `
    <section class="bg-[#fbfaf7]">
      <div class="mx-auto max-w-[1920px] px-8 py-14 md:px-16 lg:px-24">
        <div class="mx-auto max-w-4xl">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Legal notice</p>
          <h1 class="mt-3 text-4xl font-semibold text-neutral-950">Imprint</h1>
          <p class="mt-5 text-sm leading-7 text-neutral-700">This imprint is populated from the Business Information record used across the website.</p>

          <div class="mt-10 grid gap-6">
            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Publisher</h2>
              <address class="mt-4 not-italic text-sm leading-7 text-neutral-700">
                <p>{{ businessInfo.info().name }}</p>
                @if (businessInfo.info().tradingName && businessInfo.info().tradingName !== businessInfo.info().name) {
                  <p>Trading as {{ businessInfo.info().tradingName }}</p>
                }
                @for (line of businessInfo.addressLines(); track line) {
                  <p>{{ line }}</p>
                }
                <p class="mt-4">Email: <a class="hover:text-[#c90019]" [href]="'mailto:' + businessInfo.info().email">{{ businessInfo.info().email }}</a></p>
                <p>Phone: <a class="hover:text-[#c90019]" [href]="'tel:' + businessInfo.info().phoneNo">{{ businessInfo.info().phoneNo }}</a></p>
                <p>Website: <a class="hover:text-[#c90019]" [href]="businessInfo.info().homePage" target="_blank" rel="noreferrer">{{ businessInfo.info().homePage }}</a></p>
              </address>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Business Information</h2>
              <dl class="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                <div><dt class="font-semibold text-neutral-950">Registered company</dt><dd>{{ businessInfo.info().name }}</dd></div>
                <div><dt class="font-semibold text-neutral-950">Company registration</dt><dd>{{ businessInfo.info().registrationNo || '-' }}</dd></div>
                <div><dt class="font-semibold text-neutral-950">VAT number</dt><dd>{{ businessInfo.info().vatRegistrationNo || '-' }}</dd></div>
                <div><dt class="font-semibold text-neutral-950">Industrial classification</dt><dd>{{ businessInfo.info().industrialClassification || '-' }}</dd></div>
                <div><dt class="font-semibold text-neutral-950">Language</dt><dd>{{ businessInfo.info().languageCode || '-' }}</dd></div>
                <div><dt class="font-semibold text-neutral-950">Currency</dt><dd>{{ businessInfo.info().currencyCode || '-' }}</dd></div>
              </dl>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Liability for Content</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">The information on this website is provided for general information only. While we aim to keep content accurate and up to date, property availability, pricing and details may change without notice.</p>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Copyright</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">Text, images, layouts and other website materials are protected by copyright unless otherwise stated. Reuse requires prior written permission from the rights holder.</p>
            </section>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ImprintPage {
  protected readonly businessInfo = inject(BusinessInfoService);
}

@Component({
  standalone: true,
  template: `
    <section class="bg-[#fbfaf7]">
      <div class="mx-auto max-w-[1920px] px-8 py-14 md:px-16 lg:px-24">
        <div class="mx-auto max-w-4xl">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Data protection</p>
          <h1 class="mt-3 text-4xl font-semibold text-neutral-950">Privacy Policy</h1>
          <p class="mt-5 text-sm leading-7 text-neutral-700">This privacy policy describes how {{ businessInfo.info().tradingName || businessInfo.info().name }} handles personal information submitted through this website.</p>

          <div class="mt-10 grid gap-6">
            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Controller</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">{{ businessInfo.info().name }}, {{ businessInfo.info().city }}, {{ businessInfo.info().countryRegionCode }}. Contact: {{ businessInfo.info().email }}.</p>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Information We Collect</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">We may collect contact details, account information, enquiry details, booking information, property preferences and technical information such as browser type, device information and basic usage data.</p>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">How We Use Information</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">We use information to respond to enquiries, manage accounts, process bookings, display business directory entries, administer office availability, improve the website and meet legal or operational obligations.</p>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Cookies and Analytics</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">This website may use essential cookies for login and site functionality. Optional analytics or marketing cookies should only be enabled after appropriate consent controls are configured.</p>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Sharing and Retention</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">We do not sell personal information. We may share data with service providers who support website hosting, communications, property management or administration. Data is retained only for as long as needed for the purposes described here.</p>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Your Rights</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">Depending on applicable law, you may have rights to access, correct, delete, restrict or object to processing of your personal data. Contact us at hello&#64;theexchange.example to make a request.</p>
            </section>

            <section class="border-t border-neutral-200 pt-6">
              <h2 class="text-xl font-semibold text-neutral-950">Updates</h2>
              <p class="mt-4 text-sm leading-7 text-neutral-700">We may update this policy from time to time. The latest version will be published on this page.</p>
            </section>
          </div>
        </div>
      </div>
    </section>
  `
})
export class PrivacyPolicyPage {
  protected readonly businessInfo = inject(BusinessInfoService);
}

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7]">
      <div class="mx-auto max-w-[1920px] px-8 py-10 md:px-16 lg:px-24">
        <div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="flex flex-col justify-center">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#c90019]">Second floor workspace</p>
            <h1 class="mt-3 text-4xl font-semibold leading-tight text-neutral-950 md:text-5xl">Workspace at The Exchange</h1>
            <p class="mt-5 max-w-2xl text-sm leading-7 text-neutral-700">Walk-in customers and day-pass visitors can use our open-plan workspace with fast Wi-Fi, call booths, lockable drawers, coffee, food and practical office facilities.</p>
            <div class="mt-8 grid max-w-2xl grid-cols-2 gap-4 border-y border-neutral-200 py-6 text-sm md:grid-cols-4">
              <div><p class="text-2xl font-semibold">€25</p><p class="mt-1 text-xs uppercase text-neutral-500">Day rate</p></div>
              <div><p class="text-2xl font-semibold">9-6</p><p class="mt-1 text-xs uppercase text-neutral-500">Opening hours</p></div>
              <div><p class="text-2xl font-semibold">2F</p><p class="mt-1 text-xs uppercase text-neutral-500">Open plan</p></div>
              <div><p class="text-2xl font-semibold">Wi-Fi</p><p class="mt-1 text-xs uppercase text-neutral-500">Fast included</p></div>
            </div>
          </div>

          <div class="min-h-[30rem] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,.64)_100%),url('/workspace-open-plan.png')] bg-cover bg-center text-white">
            <div class="flex h-full min-h-[30rem] items-end p-6">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Open-plan workspace</p>
                <p class="mt-2 max-w-md text-2xl font-semibold leading-tight text-white">Desks, booths, meeting space and support facilities for productive day use.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-12 grid gap-8 lg:grid-cols-[1fr_28rem]">
          <div>
            <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Walk-in customers</h2><p class="mt-3 text-sm leading-7 text-neutral-700">Visitors can arrive during opening hours and pay the day rate when desks are available.</p></article>
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Fast Wi-Fi</h2><p class="mt-3 text-sm leading-7 text-neutral-700">Reliable high-speed Wi-Fi is included for all day-pass and member workspace users.</p></article>
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Lockable drawers</h2><p class="mt-3 text-sm leading-7 text-neutral-700">Store notebooks, chargers and small work items securely while you use the space.</p></article>
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Call booths</h2><p class="mt-3 text-sm leading-7 text-neutral-700">Private booths are available for calls, video meetings and short focus sessions.</p></article>
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Coffee station</h2><p class="mt-3 text-sm leading-7 text-neutral-700">Tea and coffee are available on the workspace floor throughout the day.</p></article>
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Sandwich bar</h2><p class="mt-3 text-sm leading-7 text-neutral-700">Grab sandwiches, snacks and quick lunches without leaving The Exchange.</p></article>
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Cleaning staff</h2><p class="mt-3 text-sm leading-7 text-neutral-700">Shared desks, meeting areas and common facilities are cleaned by the building team.</p></article>
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Meeting room</h2><p class="mt-3 text-sm leading-7 text-neutral-700">A bookable meeting room is available for client conversations and small team sessions.</p></article>
              <article class="border-t border-neutral-200 pt-5"><h2 class="text-lg font-semibold">Print and scan</h2><p class="mt-3 text-sm leading-7 text-neutral-700">Print, scan and copy facilities are available for practical office tasks.</p></article>
            </section>
          </div>

          <form class="bg-white p-6 shadow-sm" (ngSubmit)="book()">
            <h2 class="text-xl font-semibold text-neutral-950">Book a workspace day pass</h2>
            <p class="mt-2 text-sm leading-6 text-neutral-600">Reserve your desk before you arrive, or walk in and check availability at reception.</p>
            <label class="mt-5 block text-sm font-medium">Name<input class="${input} mt-1" [(ngModel)]="form.name" name="name" required></label>
            <label class="mt-4 block text-sm font-medium">Email<input class="${input} mt-1" [(ngModel)]="form.email" name="email" type="email" required></label>
            <fieldset class="mt-4">
              <legend class="text-sm font-medium">Date</legend>
              <div class="mt-1 grid grid-cols-3 gap-3">
                <label class="sr-only" for="workspace-year">Year</label>
                <select id="workspace-year" class="${input}" [ngModel]="selectedYear" name="bookingYear" (ngModelChange)="setSelectedYear($event)" required>
                  <option *ngFor="let year of yearOptions" [ngValue]="year">{{ year }}</option>
                </select>
                <label class="sr-only" for="workspace-month">Month</label>
                <select id="workspace-month" class="${input}" [ngModel]="selectedMonth" name="bookingMonth" (ngModelChange)="setSelectedMonth($event)" required>
                  <option *ngFor="let month of monthOptions" [ngValue]="month.value">{{ month.label }}</option>
                </select>
                <label class="sr-only" for="workspace-day">Day</label>
                <select id="workspace-day" class="${input}" [ngModel]="selectedDay" name="bookingDay" (ngModelChange)="setSelectedDay($event)" required>
                  <option *ngFor="let day of dayOptions()" [ngValue]="day">{{ day }}</option>
                </select>
              </div>
            </fieldset>
            <label class="mt-4 block text-sm font-medium">Passes<input class="${input} mt-1" [(ngModel)]="form.quantity" name="quantity" type="number" min="1" required></label>
            <button class="mt-6 w-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90019]" type="submit">Book day pass</button>
            <p class="mt-3 text-sm text-emerald-700">{{ message() }}</p>
          </form>
        </div>
      </div>
    </section>
  `
})
export class WorkspacePage {
  private readonly http = inject(HttpClient);
  readonly message = signal('');
  form = { name: '', email: '', bookingDate: '', quantity: 1 };
  readonly yearOptions = [2026, 2027, 2028];
  readonly monthOptions = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' }
  ];
  selectedYear = 2026;
  selectedMonth = 4;
  selectedDay = 30;

  constructor() {
    this.updateBookingDate();
  }

  dayOptions() {
    return Array.from({ length: this.daysInSelectedMonth() }, (_, index) => index + 1);
  }

  setSelectedYear(year: number) {
    this.selectedYear = Number(year);
    this.updateBookingDate();
  }

  setSelectedMonth(month: number) {
    this.selectedMonth = Number(month);
    this.updateBookingDate();
  }

  setSelectedDay(day: number) {
    this.selectedDay = Number(day);
    this.updateBookingDate();
  }

  updateBookingDate() {
    const daysInMonth = this.daysInSelectedMonth();

    if (this.selectedDay > daysInMonth) {
      this.selectedDay = daysInMonth;
    }

    this.form.bookingDate = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(this.selectedDay).padStart(2, '0')}`;
  }

  private daysInSelectedMonth() {
    return new Date(this.selectedYear, this.selectedMonth, 0).getDate();
  }

  book() {
    this.http.post('/api/hot-desks/book', this.form).subscribe(() => {
      this.message.set('Your workspace day pass request has been recorded.');
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#fbfaf7] text-neutral-950">
      <div class="border-b border-neutral-200">
        <div class="mx-auto max-w-[1920px] px-8 py-5 md:px-16 lg:px-24">
          <h1 class="text-lg font-semibold">News Events</h1>
        </div>
      </div>

      <div class="mx-auto max-w-[1120px] px-8 py-8 md:px-16">
        <div class="grid gap-0">
          @for (publication of publications; track publication.title) {
            <article class="grid gap-6 border-b border-neutral-200 py-8 md:grid-cols-[18rem_1fr] md:gap-9">
              <a [routerLink]="publication.path" class="group block overflow-hidden bg-neutral-200">
                <img [src]="publication.image" [alt]="publication.title" class="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.03]">
              </a>

              <div class="self-center">
                <h2 class="max-w-2xl text-xl font-semibold leading-tight text-neutral-950">
                  <a [routerLink]="publication.path" class="hover:text-[#c90019]">{{ publication.title }}</a>
                </h2>
                <p class="mt-5 max-w-2xl text-sm leading-7 text-neutral-600">{{ publication.summary }}</p>
                <div class="mt-5 flex items-center gap-3 text-xs text-neutral-500">
                  <span>{{ publication.meta }}</span>
                  <a [routerLink]="publication.path" class="font-semibold text-neutral-600 transition hover:text-[#c90019]">Read More</a>
                </div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class NewsEventsPage {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  readonly items = signal<ContentItem[]>([]);
  readonly publications: NewsPublication[] = [
    {
      title: 'Riverside Medical Centre opens its full-floor clinic at The Exchange',
      summary: 'The first floor has been fitted out with consultation rooms, diagnostics support, patient reception and a calm waiting area for local families and workers.',
      image: '/riverside-medical-centre.png',
      path: '/riverside-medical-centre',
      meta: 'Health'
    },
    {
      title: 'Workspace day passes now available for walk-in customers',
      summary: 'The second-floor workspace welcomes day visitors with hot desks, fast wi-fi, coffee, call booths, lockable drawers and access to shared meeting facilities.',
      image: '/workspace-open-plan.png',
      path: '/workspace',
      meta: 'Workspace'
    },
    {
      title: 'Ground-floor retail mix brings daily convenience to The Exchange',
      summary: 'Restaurants, coffee, groceries, pharmacy services and sporting goods create an active street-level experience for visitors, tenants and nearby residents.',
      image: '/home-background.webp',
      path: '/',
      meta: 'Retail'
    },
    {
      title: 'Office suites on levels three to five support smaller teams',
      summary: 'The upper floors are divided into 18 private suites, giving growing businesses a clear address with parking, shops, healthcare and workspace nearby.',
      image: '/home-background.webp',
      path: '/offices',
      meta: 'Office suites'
    },
    {
      title: 'Meeting room and print facilities added to workspace services',
      summary: 'Workspace users can now access bookable rooms, print and scan facilities, cleaning support and front-of-house assistance during normal opening hours.',
      image: '/workspace-open-plan.png',
      path: '/workspace',
      meta: 'Amenity'
    },
    {
      title: 'Basement parking improves access for customers and tenants',
      summary: 'The B1 parking level supports shoppers, medical visitors, workspace users and office tenants with direct building access from below ground.',
      image: '/home-background.webp',
      path: '/',
      meta: 'Parking'
    },
    {
      title: 'Riverside Medical Centre confirms seven-practitioner roster',
      summary: 'The clinic includes four general practitioners plus specialists in physiotherapy, dietetics and sports medicine for a broad healthcare offer.',
      image: '/riverside-medical-centre.png',
      path: '/riverside-medical-centre',
      meta: 'Medical'
    },
    {
      title: 'The Exchange updates public directory and tenant profile pages',
      summary: 'Tenant listings now link through to individual detail pages with contact information, trading hours, descriptions, images and fixed unit SKU references.',
      image: '/home-background.webp',
      path: '/',
      meta: 'Directory'
    }
  ];

  constructor() {
    this.http.get<{ items: ContentItem[] }>('/api/content', this.auth.authHeaders()).subscribe(({ items }) => this.items.set(items));
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="min-h-[calc(100dvh-10rem)] bg-[#f3f0ec]">
      <div class="bg-teal-100">
        <div class="mx-auto grid max-w-[1920px] gap-8 px-8 py-14 md:px-16 lg:grid-cols-[1fr_1fr] lg:px-24">
          <div>
            <p class="text-xs font-semibold text-slate-600">Home / Member Directory</p>
            <h1 class="mt-5 text-4xl font-bold text-slate-950">Member Directory</h1>
          </div>
          <div class="max-w-xl self-center">
            <p class="text-lg leading-8 text-slate-800">The Exchange Hub is home to companies, organisations and individuals at the forefront of technology, creativity and enterprise in Ireland.</p>
            <a routerLink="/login" class="mt-5 inline-flex rounded-md border border-slate-950 px-4 py-2 text-sm font-semibold hover:bg-slate-950 hover:text-white">Join Members</a>
          </div>
        </div>
      </div>

      <div class="mx-auto max-w-[1920px] px-8 py-12 md:px-16 lg:px-24">
        <section class="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 class="text-3xl font-bold text-slate-950">A Curated Membership Base</h2>
            <p class="mt-5 max-w-2xl leading-7 text-slate-700">Our members are skilled technologists, creatives, business advisors, production teams and service providers. Together they make the building a practical and ambitious place to work.</p>
            <p class="mt-4 max-w-2xl leading-7 text-slate-700">A unique feature of The Exchange Hub is our mix of tenants and members who collaborate across sectors while contributing to the resilience and sustainability of the local economy.</p>
          </div>
          <div class="relative hidden lg:block">
            <div class="absolute left-0 top-8 h-28 w-28 rounded-full bg-rose-200"></div>
            <div class="absolute right-3 top-2 h-48 w-48 rounded-full bg-white p-4 shadow-sm">
              <div class="grid h-full place-items-center rounded-full bg-slate-100 text-center text-sm font-semibold text-slate-600">Members<br>at work</div>
            </div>
            <div class="absolute bottom-4 left-14 h-16 w-16 rounded-full border-[10px] border-teal-400 bg-white"></div>
          </div>
        </section>

        <section class="mt-16">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <h2 class="text-2xl font-bold text-slate-950">Our Members</h2>
            <label class="text-sm font-semibold text-slate-600">Sort Members
              <select class="ml-3 rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm" [(ngModel)]="sortMode" name="memberSort">
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
            </label>
          </div>

          <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article *ngFor="let profile of sortedProfiles()" class="grid min-h-56 place-items-center bg-white p-7 text-center shadow-sm">
              <div class="grid h-20 w-20 place-items-center rounded-full border border-slate-200 text-2xl font-black text-slate-950">{{ initials(profile.businessName) }}</div>
              <div>
                <h3 class="mt-5 text-lg font-bold text-slate-950">{{ profile.businessName }}</h3>
                <a class="mt-2 block text-xs font-semibold text-teal-700" [href]="profile.website">{{ displayUrl(profile.website) }}</a>
                <a class="mt-5 inline-flex text-sm font-semibold underline decoration-teal-500 underline-offset-4" [href]="'mailto:' + profile.contactEmail">Learn More</a>
              </div>
            </article>
          </div>
        </section>
      </div>
    </section>
  `
})
export class DirectoryPage {
  private readonly http = inject(HttpClient);
  readonly profiles = signal<Profile[]>([]);
  sortMode = 'az';

  constructor() {
    this.http.get<{ profiles: Profile[] }>('/api/profiles').subscribe(({ profiles }) => this.profiles.set(profiles));
  }

  sortedProfiles() {
    const multiplier = this.sortMode === 'za' ? -1 : 1;

    return [...this.profiles()].sort((first, second) => first.businessName.localeCompare(second.businessName) * multiplier);
  }

  initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  displayUrl(url: string) {
    return url.replace(/^https?:\/\//, '');
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="${pageShell}">
      <h1 class="text-4xl font-bold text-slate-950">Jobs</h1>
      <p class="mt-4 max-w-3xl text-slate-600">Jobs can be posted by the building team and by members. Public visitors can apply directly.</p>
      <div class="mt-8 grid gap-5 lg:grid-cols-2">
        <article *ngFor="let job of jobs()" class="${card}">
          <p class="text-sm font-semibold text-sky-700">{{ job.company }} · {{ job.location }} · {{ job.type }}</p>
          <h2 class="mt-2 text-xl font-bold">{{ job.title }}</h2>
          <p class="mt-3 text-slate-600">{{ job.summary }}</p>
          <form class="mt-5 grid gap-3" (ngSubmit)="apply(job.id)">
            <input class="${input}" [(ngModel)]="applications[job.id].name" [name]="'name-' + job.id" placeholder="Your name" required>
            <input class="${input}" [(ngModel)]="applications[job.id].email" [name]="'email-' + job.id" placeholder="Email" type="email" required>
            <textarea class="${input}" [(ngModel)]="applications[job.id].note" [name]="'note-' + job.id" placeholder="Short note"></textarea>
            <button class="${button}" type="submit">Apply</button>
          </form>
        </article>
      </div>
      <p class="mt-5 text-sm text-emerald-700">{{ message() }}</p>
    </section>
  `
})
export class JobsPage {
  private readonly http = inject(HttpClient);
  readonly jobs = signal<Job[]>([]);
  readonly message = signal('');
  applications: Record<string, { name: string; email: string; note: string }> = {};

  constructor() {
    this.load();
  }

  load() {
    this.http.get<{ jobs: Job[] }>('/api/jobs').subscribe(({ jobs }) => {
      this.jobs.set(jobs);
      this.applications = Object.fromEntries(jobs.map((job) => [job.id, { name: '', email: '', note: '' }]));
    });
  }

  apply(jobId: string) {
    this.http.post(`/api/jobs/${jobId}/apply`, this.applications[jobId]).subscribe(() => this.message.set('Application received.'));
  }
}

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="${pageShell}">
      <form class="${card} mx-auto max-w-md" (ngSubmit)="login()">
        <h1 class="text-3xl font-bold text-slate-950">Member login</h1>
        <p class="mt-3 text-sm text-slate-600">Everyone uses this login. Superuser: bridgemediaireland / HelloWorld123!</p>
        <label class="mt-6 block text-sm font-medium">Email or username<input class="${input} mt-1" [(ngModel)]="email" name="email" required></label>
        <label class="mt-4 block text-sm font-medium">Password<input class="${input} mt-1" [(ngModel)]="password" name="password" type="password" required></label>
        <button class="${button} mt-6 w-full" type="submit">Log in</button>
        <p class="mt-3 text-sm text-red-700">{{ error() }}</p>
      </form>
    </section>
  `
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal('');
  email = 'bridgemediaireland';
  password = 'HelloWorld123!';

  login() {
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.dashboardPath()),
      error: () => this.error.set('Invalid email or password.')
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="${pageShell}">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{{ dashboard()?.role }} dashboard</p>
        <h1 class="mt-3 text-4xl font-bold text-slate-950">{{ title }}</h1>
        <p class="mt-4 max-w-3xl text-slate-600">{{ summary }}</p>
      </div>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article *ngFor="let item of countItems()" class="${card}">
          <p class="text-3xl font-bold text-slate-950">{{ item.value }}</p>
          <p class="mt-1 text-sm capitalize text-slate-600">{{ item.label }}</p>
        </article>
      </div>

      @if (dashboard()?.users?.length) {
        <section class="${card} mt-8 overflow-x-auto">
          <h2 class="text-2xl font-bold">Users and roles</h2>
          <table class="mt-5 w-full min-w-[46rem] text-left text-sm">
            <thead class="text-slate-500"><tr><th class="py-2">Name</th><th>Email</th><th>Username</th><th>Role</th><th>Business</th></tr></thead>
            <tbody>
              <tr *ngFor="let user of dashboard()?.users" class="border-t border-slate-200">
                <td class="py-3 font-semibold">{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.username }}</td>
                <td><span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">{{ user.role }}</span></td>
                <td>{{ user.businessName || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      }

      @if (dashboard()?.members?.length) {
        <section class="${card} mt-8">
          <h2 class="text-2xl font-bold">Members</h2>
          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <article *ngFor="let member of dashboard()?.members" class="rounded-md bg-slate-50 p-4">
              <p class="font-semibold">{{ member.businessName }}</p>
              <p class="text-sm text-slate-600">{{ member.name }} · {{ member.email }}</p>
              <p class="mt-2 text-sm text-slate-600">{{ member.contactEmail }} · {{ member.phone }}</p>
            </article>
          </div>
        </section>
      }

      <section class="${card} mt-8">
        <h2 class="text-2xl font-bold">General queries and hot desk requests</h2>
        <div class="mt-5 grid gap-3">
          <article *ngFor="let query of dashboard()?.queries" class="rounded-md border border-slate-200 p-4">
            <p class="font-semibold">{{ query.name }} · {{ query.email }}</p>
            <p class="text-sm text-slate-600">{{ query.quantity }} pass(es) for {{ query.booking_date }}</p>
          </article>
        </div>
      </section>
    </section>
  `
})
export class StaffDashboardPage {
  protected readonly http = inject(HttpClient);
  protected readonly auth = inject(AuthService);
  protected readonly router = inject(Router);
  readonly dashboard = signal<AdminDashboard | null>(null);
  title = 'Staff operations';
  summary = 'Manage members, room bookings, hot desk requests and general building queries.';

  constructor() {
    this.load();
  }

  load() {
    this.http.get<AdminDashboard>('/api/dashboard', this.auth.authHeaders()).subscribe({
      next: (dashboard) => {
        if (dashboard.redirectTo) {
          this.router.navigateByUrl(dashboard.redirectTo);
          return;
        }

        this.dashboard.set(dashboard);
        this.afterDashboardLoad(dashboard);
      },
      error: () => this.router.navigateByUrl('/login')
    });
  }

  protected afterDashboardLoad(_dashboard: AdminDashboard) {}

  countItems() {
    return Object.entries(this.dashboard()?.counts ?? {}).map(([label, value]) => ({ label, value }));
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="${pageShell}">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{{ dashboard()?.role }} dashboard</p>
        <h1 class="mt-3 text-4xl font-bold text-slate-950">Administration</h1>
        <p class="mt-4 max-w-3xl text-slate-600">Manage staff, members, offices, rooms, availability, content, jobs and operational requests from one dashboard.</p>
      </div>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6" role="tablist" aria-label="Admin dashboard sections">
        <button
          *ngFor="let item of adminTabs()"
          class="rounded-lg border p-5 text-left shadow-sm transition"
          [class.border-sky-600]="activeTab() === item.key"
          [class.bg-sky-50]="activeTab() === item.key"
          [class.border-slate-200]="activeTab() !== item.key"
          [class.bg-white]="activeTab() !== item.key"
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === item.key"
          (click)="setActiveTab(item.key)"
        >
          <p class="text-3xl font-bold text-slate-950">{{ item.value }}</p>
          <p class="mt-1 text-sm capitalize text-slate-600">{{ item.label }}</p>
        </button>
      </div>

      @if (activeTab() === 'business') {
      <form class="${card} mt-8" (ngSubmit)="saveBusinessInfo()">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold">Business Information</h2>
            <p class="mt-2 max-w-2xl text-sm text-slate-600">These values power the header, footer, imprint, privacy controller details and any reusable company details across the site.</p>
          </div>
          <button class="${button}" type="submit">Save business info</button>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-3">
          <section>
            <h3 class="text-sm font-bold uppercase tracking-wide text-slate-500">General details</h3>
            <label class="mt-4 block text-sm font-medium">Legal name<input class="${input} mt-1" [(ngModel)]="businessInfoForm.name" name="businessName" required></label>
            <label class="mt-4 block text-sm font-medium">Trading name<input class="${input} mt-1" [(ngModel)]="businessInfoForm.tradingName" name="tradingName"></label>
            <label class="mt-4 block text-sm font-medium">Address<input class="${input} mt-1" [(ngModel)]="businessInfoForm.address" name="businessAddress"></label>
            <label class="mt-4 block text-sm font-medium">Address 2<input class="${input} mt-1" [(ngModel)]="businessInfoForm.address2" name="businessAddress2"></label>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="block text-sm font-medium">City<input class="${input} mt-1" [(ngModel)]="businessInfoForm.city" name="businessCity"></label>
              <label class="block text-sm font-medium">Post code<input class="${input} mt-1" [(ngModel)]="businessInfoForm.postCode" name="businessPostCode"></label>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="block text-sm font-medium">County<input class="${input} mt-1" [(ngModel)]="businessInfoForm.county" name="businessCounty"></label>
              <label class="block text-sm font-medium">Country code<input class="${input} mt-1" [(ngModel)]="businessInfoForm.countryRegionCode" name="businessCountry"></label>
            </div>
            <label class="mt-4 block text-sm font-medium">Phone<input class="${input} mt-1" [(ngModel)]="businessInfoForm.phoneNo" name="businessPhone"></label>
            <label class="mt-4 block text-sm font-medium">Mobile<input class="${input} mt-1" [(ngModel)]="businessInfoForm.mobilePhoneNo" name="businessMobile"></label>
            <label class="mt-4 block text-sm font-medium">Email<input class="${input} mt-1" [(ngModel)]="businessInfoForm.email" name="businessEmail" type="email"></label>
            <label class="mt-4 block text-sm font-medium">Home page<input class="${input} mt-1" [(ngModel)]="businessInfoForm.homePage" name="businessHomePage" type="url"></label>
          </section>

          <section>
            <h3 class="text-sm font-bold uppercase tracking-wide text-slate-500">Registration and regional</h3>
            <label class="mt-4 block text-sm font-medium">VAT registration no.<input class="${input} mt-1" [(ngModel)]="businessInfoForm.vatRegistrationNo" name="businessVat"></label>
            <label class="mt-4 block text-sm font-medium">Registration no.<input class="${input} mt-1" [(ngModel)]="businessInfoForm.registrationNo" name="businessRegistration"></label>
            <label class="mt-4 block text-sm font-medium">Industrial classification<textarea class="${input} mt-1" [(ngModel)]="businessInfoForm.industrialClassification" name="businessIndustrial"></textarea></label>
            <label class="mt-4 block text-sm font-medium">Tax area code<input class="${input} mt-1" [(ngModel)]="businessInfoForm.taxAreaCode" name="businessTaxArea"></label>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="block text-sm font-medium">Language<input class="${input} mt-1" [(ngModel)]="businessInfoForm.languageCode" name="businessLanguage"></label>
              <label class="block text-sm font-medium">Currency<input class="${input} mt-1" [(ngModel)]="businessInfoForm.currencyCode" name="businessCurrency"></label>
            </div>
            <label class="mt-4 block text-sm font-medium">Time zone<input class="${input} mt-1" [(ngModel)]="businessInfoForm.timeZone" name="businessTimeZone"></label>
            <label class="mt-4 block text-sm font-medium">Logo / picture data URL<textarea class="${input} mt-1" [(ngModel)]="businessInfoForm.picture" name="businessPicture"></textarea></label>
            <label class="mt-4 block text-sm font-medium">Report logo data URL<textarea class="${input} mt-1" [(ngModel)]="businessInfoForm.reportLogo" name="businessReportLogo"></textarea></label>
          </section>

          <section>
            <h3 class="text-sm font-bold uppercase tracking-wide text-slate-500">Banking, system and shipping</h3>
            <label class="mt-4 block text-sm font-medium">Bank name<input class="${input} mt-1" [(ngModel)]="businessInfoForm.bankName" name="businessBankName"></label>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="block text-sm font-medium">Account no.<input class="${input} mt-1" [(ngModel)]="businessInfoForm.bankAccountNo" name="businessBankAccount"></label>
              <label class="block text-sm font-medium">SWIFT<input class="${input} mt-1" [(ngModel)]="businessInfoForm.swiftCode" name="businessSwift"></label>
            </div>
            <label class="mt-4 block text-sm font-medium">IBAN<input class="${input} mt-1" [(ngModel)]="businessInfoForm.iban" name="businessIban"></label>
            <label class="mt-4 block text-sm font-medium">Payment routing info<textarea class="${input} mt-1" [(ngModel)]="businessInfoForm.paymentRoutingInfo" name="businessPaymentRouting"></textarea></label>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="block text-sm font-medium">Base calendar<input class="${input} mt-1" [(ngModel)]="businessInfoForm.baseCalendarCode" name="businessBaseCalendar"></label>
              <label class="block text-sm font-medium">IC partner<input class="${input} mt-1" [(ngModel)]="businessInfoForm.icPartnerCode" name="businessIcPartner"></label>
            </div>
            <label class="mt-4 block text-sm font-medium">Responsibility center<input class="${input} mt-1" [(ngModel)]="businessInfoForm.responsibilityCenter" name="businessResponsibility"></label>
            <label class="mt-4 block text-sm font-medium">Shipment address<input class="${input} mt-1" [(ngModel)]="businessInfoForm.shipmentAddress" name="businessShipmentAddress"></label>
            <label class="mt-4 block text-sm font-medium">Shipment address 2<input class="${input} mt-1" [(ngModel)]="businessInfoForm.shipmentAddress2" name="businessShipmentAddress2"></label>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="block text-sm font-medium">Shipment city<input class="${input} mt-1" [(ngModel)]="businessInfoForm.shipmentCity" name="businessShipmentCity"></label>
              <label class="block text-sm font-medium">Shipment post code<input class="${input} mt-1" [(ngModel)]="businessInfoForm.shipmentPostCode" name="businessShipmentPostCode"></label>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="block text-sm font-medium">Location code<input class="${input} mt-1" [(ngModel)]="businessInfoForm.locationCode" name="businessLocationCode"></label>
              <label class="block text-sm font-medium">Shipping agent<input class="${input} mt-1" [(ngModel)]="businessInfoForm.shippingAgentCode" name="businessShippingAgent"></label>
            </div>
          </section>
        </div>
        <p class="mt-4 text-sm text-emerald-700">{{ businessInfoMessage() }}</p>
      </form>
      }

      @if (activeTab() === 'users') {
      <section class="${card} mt-8 overflow-x-auto">
        <h2 class="text-2xl font-bold">Staff, members and roles</h2>
        <table class="mt-5 w-full min-w-[48rem] text-left text-sm">
          <thead class="text-slate-500"><tr><th class="py-2">Name</th><th>Email</th><th>Username</th><th>Role</th><th>Business</th></tr></thead>
          <tbody>
            <tr *ngFor="let user of dashboard()?.users" class="border-t border-slate-200">
              <td class="py-3 font-semibold">{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.username }}</td>
              <td><span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">{{ user.role }}</span></td>
              <td>{{ user.businessName || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      }

      @if (activeTab() === 'offices') {
      <div class="mt-8 grid gap-6 xl:grid-cols-[1fr_26rem]">
        <section class="${card} overflow-x-auto">
          <h2 class="text-2xl font-bold">Office profiles</h2>
          <table class="mt-5 w-full min-w-[58rem] text-left text-sm">
            <thead class="text-slate-500">
              <tr><th class="py-2">Unit</th><th>Size</th><th>Rent</th><th>Status</th><th>Assigned tenant</th><th>Assets</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let office of dashboard()?.offices" class="border-t border-slate-200 align-top">
                <td class="py-3">
                  <p class="font-semibold">{{ office.name }}</p>
                  <p class="mt-1 text-xs font-semibold text-slate-500">{{ office.sku }} · {{ office.floor }} · {{ office.unitNumber }} · {{ office.spaceType }}</p>
                  <p class="mt-1 max-w-xs text-slate-600">{{ office.summary }}</p>
                  <p class="mt-1 max-w-xs text-slate-500" *ngIf="office.optionalTerms">{{ office.optionalTerms }}</p>
                </td>
                <td>{{ office.sizeSqM }} m²<br><span class="text-slate-500">{{ office.capacity }} people</span></td>
                <td>€{{ office.rentFee || office.monthly_price }}/mo</td>
                <td><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{{ office.status }}</span></td>
                <td>{{ office.assignedBusinessName || 'Unassigned' }}</td>
                <td>
                  <span class="block">{{ office.imageDataUrl ? 'Office image' : 'No image' }}</span>
                  <span class="block text-slate-500">{{ office.floorPlanDataUrl ? 'Floor plan' : 'No floor plan' }}</span>
                </td>
                <td class="space-y-2">
                  <button class="rounded-md border border-slate-300 px-3 py-1 font-semibold" type="button" (click)="editOffice(office)">Edit</button>
                  <button class="rounded-md border border-red-300 px-3 py-1 font-semibold text-red-700" type="button" (click)="deleteOffice(office.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <form class="${card}" (ngSubmit)="saveOffice()">
          <h2 class="text-2xl font-bold">{{ officeForm.id ? 'Edit office' : 'Create office' }}</h2>
          <label class="mt-5 block text-sm font-medium">Stable SKU<input class="${input} mt-1" [(ngModel)]="officeForm.sku" name="officeSku" placeholder="EXCH-5-07" required></label>
          <label class="mt-5 block text-sm font-medium">Name<input class="${input} mt-1" [(ngModel)]="officeForm.name" name="officeName" required></label>
          <div class="mt-4 grid grid-cols-3 gap-3">
            <label class="block text-sm font-medium">Floor<input class="${input} mt-1" [(ngModel)]="officeForm.floor" name="officeFloor" placeholder="Fifth Floor"></label>
            <label class="block text-sm font-medium">Unit<input class="${input} mt-1" [(ngModel)]="officeForm.unitNumber" name="officeUnitNumber" placeholder="5.07"></label>
            <label class="block text-sm font-medium">Type
              <select class="${input} mt-1" [(ngModel)]="officeForm.spaceType" name="officeSpaceType">
                <option value="retail">retail</option>
                <option value="food">food</option>
                <option value="health">health</option>
                <option value="medical">medical</option>
                <option value="hot-desk">hot-desk</option>
                <option value="office">office</option>
                <option value="parking">parking</option>
              </select>
            </label>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <label class="block text-sm font-medium">Size m²<input class="${input} mt-1" [(ngModel)]="officeForm.sizeSqM" name="officeSize" type="number" min="0"></label>
            <label class="block text-sm font-medium">Capacity<input class="${input} mt-1" [(ngModel)]="officeForm.capacity" name="officeCapacity" type="number" min="1"></label>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <label class="block text-sm font-medium">Rent fee €<input class="${input} mt-1" [(ngModel)]="officeForm.rentFee" name="officeRent" type="number" min="0"></label>
            <label class="block text-sm font-medium">Status
              <select class="${input} mt-1" [(ngModel)]="officeForm.status" name="officeStatus">
                <option value="available">available</option>
                <option value="reserved">reserved</option>
                <option value="occupied">occupied</option>
                <option value="maintenance">maintenance</option>
              </select>
            </label>
          </div>
          <label class="mt-4 block text-sm font-medium">Assign tenant
            <select class="${input} mt-1" [(ngModel)]="officeForm.assignedMemberId" name="assignedMemberId">
              <option value="">Unassigned</option>
              <option *ngFor="let tenant of dashboard()?.tenants" [value]="tenant.id">{{ tenant.businessName }} · {{ tenant.role }}</option>
            </select>
          </label>
          <label class="mt-4 block text-sm font-medium">Summary<textarea class="${input} mt-1" [(ngModel)]="officeForm.summary" name="officeSummary"></textarea></label>
          <label class="mt-4 block text-sm font-medium">Optional extras / terms<textarea class="${input} mt-1" [(ngModel)]="officeForm.optionalTerms" name="officeOptions"></textarea></label>
          <label class="mt-4 block text-sm font-medium">Empty office image<input class="${input} mt-1" type="file" accept="image/*" (change)="readOfficeFile($event, 'imageDataUrl')"></label>
          <img *ngIf="officeForm.imageDataUrl" [src]="officeForm.imageDataUrl" alt="" class="mt-3 aspect-video w-full rounded-md object-cover">
          <label class="mt-4 block text-sm font-medium">Tenant-only floor plan<input class="${input} mt-1" type="file" accept="image/*,application/pdf" (change)="readOfficeFile($event, 'floorPlanDataUrl')"></label>
          <p class="mt-2 text-sm text-slate-500">{{ officeForm.floorPlanDataUrl ? 'Floor plan uploaded for assigned tenant/admin access.' : 'No floor plan uploaded.' }}</p>
          <div class="mt-5 flex gap-3">
            <button class="${button}" type="submit">Save office</button>
            <button class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" type="button" (click)="resetOfficeForm()">Clear</button>
          </div>
          <p class="mt-3 text-sm text-emerald-700">{{ officeMessage() }}</p>
        </form>
      </div>
      }

      @if (activeTab() === 'members') {
      <section class="${card} mt-8">
        <h2 class="text-2xl font-bold">Tenants and members</h2>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <article *ngFor="let tenant of dashboard()?.tenants" class="rounded-md border border-slate-200 p-4">
            <p class="font-semibold">{{ tenant.businessName }}</p>
            <p class="text-sm text-slate-600">{{ tenant.name }} · {{ tenant.email }}</p>
            <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-700">{{ tenant.role }}</p>
          </article>
        </div>
      </section>
      }

      @if (activeTab() === 'rooms') {
        <section class="${card} mt-8">
          <h2 class="text-2xl font-bold">Rooms</h2>
          <div class="mt-5 grid gap-3">
            <article *ngFor="let room of dashboard()?.spaces" class="rounded-md bg-slate-50 p-4">
              <p class="font-semibold">{{ room.name }} · €{{ room.hourly_rate }}/hr</p>
              <p class="text-sm text-slate-600">{{ room.type }} · {{ room.capacity }} people</p>
            </article>
          </div>
        </section>
      }

      @if (activeTab() === 'requests') {
        <section class="${card} mt-8">
          <h2 class="text-2xl font-bold">Property enquiries and requests</h2>
          <div class="mt-5 grid gap-4">
            <button
              *ngFor="let enquiry of dashboard()?.propertyEnquiries"
              class="rounded-md border p-4 text-left transition"
              [class.border-slate-200]="!enquiry.read_at"
              [class.bg-white]="!enquiry.read_at"
              [class.border-emerald-200]="enquiry.read_at"
              [class.bg-emerald-50]="enquiry.read_at"
              type="button"
              [disabled]="!!enquiry.read_at"
              (click)="markEnquiryRead(enquiry.id)"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="font-semibold">{{ enquiry.officeName }}</p>
                  <p class="text-sm text-slate-600">{{ enquiry.name }} · {{ enquiry.email }} · {{ enquiry.phone }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold capitalize text-sky-800">{{ enquiry.preferred_contact_method }}</span>
                  @if (enquiry.read_at) {
                    <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Assigned</span>
                  } @else {
                    <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Click to claim</span>
                  }
                </div>
              </div>
              <p class="mt-3 text-sm text-slate-700">{{ enquiry.message }}</p>
              <p class="mt-2 text-xs text-slate-500">GDPR approved · {{ enquiry.created_at | date:'medium' }}</p>
              @if (enquiry.read_at) {
                <p class="mt-2 text-xs font-semibold text-emerald-800">Responsible: {{ enquiry.handledByName || enquiry.handledByEmail || 'Assigned staff member' }} · {{ enquiry.read_at | date:'medium' }}</p>
              }
            </button>
          </div>

          <h3 class="mt-8 text-xl font-bold">Hot desk requests</h3>
          <div class="mt-4 grid gap-3">
            <article *ngFor="let query of dashboard()?.queries" class="rounded-md border border-slate-200 p-4">
              <p class="font-semibold">{{ query.name }} · {{ query.email }}</p>
              <p class="text-sm text-slate-600">{{ query.quantity }} pass(es) for {{ query.booking_date }}</p>
              <p class="text-xs text-slate-500">{{ query.created_at | date:'medium' }}</p>
            </article>
          </div>
        </section>
      }

      @if (activeTab() === 'applications') {
        <section class="${card} mt-8">
          <h2 class="text-2xl font-bold">Job applications</h2>
          <p class="mt-3 text-sm text-slate-600">Application management will live here once applications are attached to the dashboard feed.</p>
        </section>
      }
    </section>
  `
})
export class AdminDashboardPage extends StaffDashboardPage {
  private readonly businessInfo = inject(BusinessInfoService);
  readonly activeTab = signal<AdminTab>('business');
  officeForm = emptyOfficeForm();
  readonly officeMessage = signal('');
  businessInfoForm: BusinessInfo = { ...defaultBusinessInfo };
  readonly businessInfoMessage = signal('');

  adminTabs() {
    const counts = this.dashboard()?.counts ?? {};

    return [
      { key: 'business' as const, label: 'business', value: 1 },
      { key: 'users' as const, label: 'users', value: counts['users'] ?? 0 },
      { key: 'members' as const, label: 'members', value: counts['members'] ?? 0 },
      { key: 'offices' as const, label: 'offices', value: counts['offices'] ?? 0 },
      { key: 'rooms' as const, label: 'rooms', value: this.dashboard()?.spaces?.length ?? 0 },
      { key: 'requests' as const, label: 'requests', value: (counts['hotDeskBookings'] ?? 0) + (counts['propertyEnquiries'] ?? 0) },
      { key: 'applications' as const, label: 'applications', value: counts['jobApplications'] ?? 0 }
    ];
  }

  setActiveTab(tab: AdminTab) {
    this.activeTab.set(tab);
  }

  protected override afterDashboardLoad(dashboard: AdminDashboard) {
    if (dashboard.businessInfo) {
      this.businessInfoForm = { ...dashboard.businessInfo };
    }
  }

  saveBusinessInfo() {
    this.http.put<{ businessInfo: BusinessInfo }>('/api/admin/business-info', this.businessInfoForm, this.auth.authHeaders()).subscribe(({ businessInfo }) => {
      if (businessInfo) {
        this.businessInfoForm = { ...businessInfo };
        this.businessInfo.info.set(businessInfo);
      }

      this.businessInfoMessage.set('Business information saved.');
      this.load();
    });
  }

  markEnquiryRead(enquiryId: string) {
    this.http.put(`/api/admin/property-enquiries/${enquiryId}/read`, {}, this.auth.authHeaders()).subscribe(() => this.load());
  }

  editOffice(office: Office) {
    this.activeTab.set('offices');
    this.officeForm = {
      id: office.id,
      sku: office.sku,
      name: office.name,
      floor: office.floor,
      unitNumber: office.unitNumber,
      spaceType: office.spaceType,
      capacity: office.capacity,
      status: office.status,
      summary: office.summary,
      sizeSqM: office.sizeSqM ?? 0,
      rentFee: office.rentFee || office.monthly_price || 0,
      optionalTerms: office.optionalTerms ?? '',
      imageDataUrl: office.imageDataUrl ?? '',
      floorPlanDataUrl: office.floorPlanDataUrl ?? '',
      assignedMemberId: office.assignedMemberId ?? ''
    };
  }

  resetOfficeForm() {
    this.officeForm = emptyOfficeForm();
  }

  saveOffice() {
    const request = this.officeForm.id
      ? this.http.put(`/api/admin/offices/${this.officeForm.id}`, this.officeForm, this.auth.authHeaders())
      : this.http.post('/api/admin/offices', this.officeForm, this.auth.authHeaders());

    request.subscribe(() => {
      this.officeMessage.set('Office saved.');
      this.resetOfficeForm();
      this.load();
    });
  }

  deleteOffice(officeId: string) {
    this.http.delete(`/api/admin/offices/${officeId}`, this.auth.authHeaders()).subscribe(() => {
      this.officeMessage.set('Office deleted.');
      this.load();
    });
  }

  readOfficeFile(event: Event, field: 'imageDataUrl' | 'floorPlanDataUrl') {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.officeForm = {
        ...this.officeForm,
        [field]: String(reader.result)
      };
    };
    reader.readAsDataURL(file);
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="${pageShell}">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Member area</p>
          <h1 class="mt-3 text-4xl font-bold text-slate-950">Rooms, availability and profile</h1>
          <p class="mt-4 max-w-3xl text-slate-600">Meeting rooms, event rooms and seminar spaces are restricted to logged-in members.</p>
        </div>
        <a routerLink="/news-events" class="${button}">View member news</a>
      </div>

      <div class="mt-8 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div class="grid gap-6">
          <section class="${card}">
            <h2 class="text-2xl font-bold">Book a member room</h2>
            <form class="mt-5 grid gap-4 md:grid-cols-2" (ngSubmit)="createBooking()">
              <label class="text-sm font-medium">Room
                <select class="${input} mt-1" [(ngModel)]="booking.spaceId" name="spaceId" required>
                  <option *ngFor="let room of rooms()" [value]="room.id">{{ room.name }} · {{ room.capacity }} people · €{{ room.hourly_rate }}/hr</option>
                </select>
              </label>
              <label class="text-sm font-medium">Title<input class="${input} mt-1" [(ngModel)]="booking.title" name="title" required></label>
              <label class="text-sm font-medium">Starts<input class="${input} mt-1" [(ngModel)]="booking.startsAt" name="startsAt" type="datetime-local" required></label>
              <label class="text-sm font-medium">Ends<input class="${input} mt-1" [(ngModel)]="booking.endsAt" name="endsAt" type="datetime-local" required></label>
              <button class="${button} md:col-span-2" type="submit">Create booking</button>
            </form>
            <p class="mt-3 text-sm text-emerald-700">{{ message() }}</p>
          </section>

          @if (assignedOffice(); as office) {
            <section class="${card}">
              <h2 class="text-2xl font-bold">Your assigned office</h2>
              <div class="mt-5 grid gap-5 md:grid-cols-[16rem_1fr]">
                @if (office.imageDataUrl) {
                  <img [src]="office.imageDataUrl" alt="" class="aspect-video w-full rounded-md object-cover">
                } @else {
                  <div class="grid aspect-video place-items-center rounded-md bg-slate-100 text-sm text-slate-500">No office image</div>
                }
                <div>
                  <h3 class="text-xl font-bold">{{ office.name }}</h3>
                  <p class="mt-2 text-slate-600">{{ office.summary }}</p>
                  <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><dt class="text-slate-500">Size</dt><dd class="font-semibold">{{ office.sizeSqM }} m²</dd></div>
                    <div><dt class="text-slate-500">Rent</dt><dd class="font-semibold">€{{ office.rentFee || office.monthly_price }}/month</dd></div>
                  </dl>
                  <p class="mt-4 text-sm text-slate-500" *ngIf="office.optionalTerms">{{ office.optionalTerms }}</p>
                  @if (office.floorPlanDataUrl) {
                    <a class="mt-4 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" [href]="office.floorPlanDataUrl" target="_blank" rel="noreferrer">Open tenant floor plan</a>
                  }
                </div>
              </div>
            </section>
          }

          <section class="${card}">
            <h2 class="text-2xl font-bold">Availability calendar</h2>
            <div class="mt-5 grid gap-3 md:grid-cols-2">
              <div *ngFor="let rule of availability()" class="rounded-md bg-slate-50 p-4">
                <p class="font-semibold">{{ rule.spaceName }}</p>
                <p class="text-sm text-slate-600">{{ dayName(rule.day_of_week) }} · {{ rule.opens_at }}-{{ rule.closes_at }}</p>
              </div>
            </div>
          </section>

          <section class="${card}">
            <h2 class="text-2xl font-bold">Your bookings</h2>
            <div class="mt-5 grid gap-3">
              <article *ngFor="let item of bookings()" class="rounded-md border border-slate-200 p-4">
                <h3 class="font-semibold">{{ item.title }}</h3>
                <p class="text-sm text-slate-600">{{ item.spaceName }} · {{ item.starts_at | date:'medium' }} to {{ item.ends_at | date:'shortTime' }}</p>
              </article>
            </div>
          </section>
        </div>

        <aside class="grid gap-6">
          <form class="${card}" (ngSubmit)="saveProfile()">
            <h2 class="text-2xl font-bold">Public business profile</h2>
            <label class="mt-5 block text-sm font-medium">Business<input class="${input} mt-1" [(ngModel)]="profile.businessName" name="businessName"></label>
            <label class="mt-4 block text-sm font-medium">Contact email<input class="${input} mt-1" [(ngModel)]="profile.contactEmail" name="contactEmail"></label>
            <label class="mt-4 block text-sm font-medium">Phone<input class="${input} mt-1" [(ngModel)]="profile.phone" name="phone"></label>
            <label class="mt-4 block text-sm font-medium">Website<input class="${input} mt-1" [(ngModel)]="profile.website" name="website"></label>
            <label class="mt-4 block text-sm font-medium">Short description<textarea class="${input} mt-1" [(ngModel)]="profile.summary" name="summary"></textarea></label>
            <label class="mt-4 block text-sm font-medium">Trading hours<textarea class="${input} mt-1" [(ngModel)]="profile.tradingHours" name="tradingHours" placeholder="Monday-Friday 09:00-18:00; Saturday 10:00-17:00"></textarea></label>
            <label class="mt-4 block text-sm font-medium">Closed days<textarea class="${input} mt-1" [(ngModel)]="profile.closedDays" name="closedDays" placeholder="Public holidays; annual stocktake day"></textarea></label>
            <label class="mt-4 block text-sm font-medium">Cover image<input class="${input} mt-1" type="file" accept="image/*" (change)="readProfileFile($event, 'coverImageDataUrl')"></label>
            <img *ngIf="profile.coverImageDataUrl" [src]="profile.coverImageDataUrl" alt="" class="mt-3 aspect-video w-full rounded-md object-cover">
            <label class="mt-4 block text-sm font-medium">Logo<input class="${input} mt-1" type="file" accept="image/*" (change)="readProfileFile($event, 'logoDataUrl')"></label>
            <img *ngIf="profile.logoDataUrl" [src]="profile.logoDataUrl" alt="" class="mt-3 h-20 w-20 rounded-md object-contain">
            <label class="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="profile.isProfilePublic" name="isProfilePublic"> Show in public directory</label>
            <button class="${button} mt-5 w-full" type="submit">Save profile</button>
          </form>

          <form class="${card}" (ngSubmit)="postJob()">
            <h2 class="text-2xl font-bold">Post a job</h2>
            <label class="mt-5 block text-sm font-medium">Title<input class="${input} mt-1" [(ngModel)]="job.title" name="jobTitle"></label>
            <label class="mt-4 block text-sm font-medium">Location<input class="${input} mt-1" [(ngModel)]="job.location" name="jobLocation"></label>
            <label class="mt-4 block text-sm font-medium">Type<input class="${input} mt-1" [(ngModel)]="job.type" name="jobType"></label>
            <label class="mt-4 block text-sm font-medium">Apply email<input class="${input} mt-1" [(ngModel)]="job.applyEmail" name="jobApplyEmail"></label>
            <label class="mt-4 block text-sm font-medium">Summary<textarea class="${input} mt-1" [(ngModel)]="job.summary" name="jobSummary"></textarea></label>
            <button class="${button} mt-5 w-full" type="submit">Publish job</button>
          </form>
        </aside>
      </div>
    </section>
  `
})
export class MemberPage {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly rooms = signal<Room[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly availability = signal<AvailabilityRule[]>([]);
  readonly assignedOffice = signal<Office | null>(null);
  readonly message = signal('');

  booking = { spaceId: '', title: '', startsAt: '', endsAt: '' };
  profile: BusinessProfileForm = {
    businessName: '',
    contactEmail: '',
    phone: '',
    website: '',
    summary: '',
    tradingHours: '',
    closedDays: '',
    coverImageDataUrl: '',
    logoDataUrl: '',
    isProfilePublic: true
  };
  job = { title: '', location: '', type: 'Full time', summary: '', applyEmail: '' };

  constructor() {
    this.load();
  }

  load() {
    if (!this.auth.token()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.http.get<{
      rooms: Room[];
      bookings: Booking[];
      availability: AvailabilityRule[];
      profile: BusinessProfileForm;
      assignedOffice: Office | null;
    }>('/api/member/dashboard', this.auth.authHeaders()).subscribe({
      next: (dashboard) => {
        this.rooms.set(dashboard.rooms);
        this.bookings.set(dashboard.bookings);
        this.availability.set(dashboard.availability);
        this.assignedOffice.set(dashboard.assignedOffice);
        this.profile = { ...dashboard.profile, isProfilePublic: Boolean(dashboard.profile.isProfilePublic) };
        this.booking.spaceId = dashboard.rooms[0]?.id ?? '';
      },
      error: () => this.router.navigateByUrl('/login')
    });
  }

  createBooking() {
    this.http.post('/api/member/bookings', this.booking, this.auth.authHeaders()).subscribe(() => {
      this.message.set('Booking created.');
      this.load();
    });
  }

  saveProfile() {
    this.http.put('/api/member/profile', this.profile, this.auth.authHeaders()).subscribe(() => this.message.set('Profile saved.'));
  }

  readProfileFile(event: Event, field: 'coverImageDataUrl' | 'logoDataUrl') {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.profile = {
        ...this.profile,
        [field]: String(reader.result ?? '')
      };
    };
    reader.readAsDataURL(file);
  }

  postJob() {
    this.http.post('/api/member/jobs', this.job, this.auth.authHeaders()).subscribe(() => {
      this.message.set('Job published.');
      this.job = { title: '', location: '', type: 'Full time', summary: '', applyEmail: '' };
    });
  }

  dayName(day: number) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] ?? 'Day';
  }
}
