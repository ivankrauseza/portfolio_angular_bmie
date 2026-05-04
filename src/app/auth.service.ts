import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: 'superuser' | 'admin' | 'staff' | 'tenant' | 'member';
  memberId: string | null;
  businessName: string | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'building_member_token';

  readonly token = signal(localStorage.getItem(this.tokenKey));
  readonly user = signal<CurrentUser | null>(null);

  constructor() {
    if (this.token()) {
      this.refreshUser();
    }
  }

  authHeaders() {
    const token = this.token();

    return token ? {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    } : {};
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: CurrentUser }>('/api/auth/login', { email, password }).pipe(
      tap(({ token, user }) => {
        localStorage.setItem(this.tokenKey, token);
        this.token.set(token);
        this.user.set(user);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.token.set(null);
    this.user.set(null);
  }

  dashboardPath() {
    const role = this.user()?.role;

    if (role === 'superuser' || role === 'admin') {
      return '/dashboard/admin';
    }

    if (role === 'staff') {
      return '/dashboard/staff';
    }

    return '/member';
  }

  refreshUser() {
    this.http.get<{ user: CurrentUser }>('/api/auth/me', this.authHeaders()).subscribe({
      next: ({ user }) => this.user.set(user),
      error: () => this.logout()
    });
  }
}
