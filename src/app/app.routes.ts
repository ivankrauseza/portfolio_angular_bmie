import { Routes } from '@angular/router';
import { AboutHistoryPage, AboutPage, AboutTeamPage, AdminDashboardPage, FindUsPage, HomePage, ImprintPage, JobsPage, LoginPage, MedicareCentrePage, MemberPage, NewsEventsPage, OfficeDetailPage, OfficesPage, ParkingPage, PrivacyPolicyPage, StaffDashboardPage, WorkspacePage } from './pages';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'about', component: AboutPage },
  { path: 'about/our-history', component: AboutHistoryPage },
  { path: 'about/partners-associates', component: AboutTeamPage },
  { path: 'about/our-team', component: AboutTeamPage },
  { path: 'riverside-medical-centre', component: MedicareCentrePage },
  { path: 'medicare-centre', redirectTo: 'riverside-medical-centre', pathMatch: 'full' },
  { path: 'offices', component: OfficesPage },
  { path: 'offices/:id', component: OfficeDetailPage },
  { path: 'parking', component: ParkingPage },
  { path: 'find-us', component: FindUsPage },
  { path: 'imprint', component: ImprintPage },
  { path: 'privacy-policy', component: PrivacyPolicyPage },
  { path: 'workspace', component: WorkspacePage },
  { path: 'hot-desks', redirectTo: 'workspace', pathMatch: 'full' },
  { path: 'news-events', component: NewsEventsPage },
  { path: 'directory', redirectTo: 'offices', pathMatch: 'full' },
  { path: 'jobs', component: JobsPage },
  { path: 'login', component: LoginPage },
  { path: 'member', component: MemberPage },
  { path: 'dashboard/admin', component: AdminDashboardPage },
  { path: 'dashboard/staff', component: StaffDashboardPage },
  { path: '**', redirectTo: '' }
];
