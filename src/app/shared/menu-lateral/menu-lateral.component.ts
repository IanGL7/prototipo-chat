import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/data-access/auth.service';
import { User } from '@angular/fire/auth';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-lateral.component.html',
  styleUrls: []
})
export class MenuLateralComponent implements OnInit {
  user: User | null = null;
  isExpanded = false; // Propiedad para controlar el estado del menú (expandido o contraído)
  showSettings = false;

  private router = inject(Router);

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  toggleMenu() {
    this.isExpanded = !this.isExpanded;
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigateByUrl('/auth/sign-in');
    }).catch(error => {
      console.error('Logout failed', error);
    });
  }
}
