import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/data-access/auth.service';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-lateral.component.html',
  styleUrls: []
})
export class MenuLateralComponent {
  private router = inject(Router);

  constructor(private authService: AuthService) {}

  async logout() {
    try {
      await this.authService.logout();
      await this.router.navigateByUrl('/auth/sign-in');
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
}
