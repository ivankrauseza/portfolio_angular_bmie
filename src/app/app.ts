import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { BusinessInfoService } from './business-info.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly businessInfo = inject(BusinessInfoService);
  protected readonly menuOpen = signal(false);

  protected readonly navItems = [
    { label: 'About', path: '/about' },
    { label: 'Offices', path: '/offices' },
    { label: 'Hot desks', path: '/hot-desks' },
    { label: 'News & events', path: '/news-events' },
    { label: 'Directory', path: '/directory' },
    { label: 'Jobs', path: '/jobs' }
  ];

  constructor() {
    this.businessInfo.load();
  }

  protected closeMenu() {
    this.menuOpen.set(false);
  }

  protected logout() {
    this.auth.logout();
    this.closeMenu();
  }
}
