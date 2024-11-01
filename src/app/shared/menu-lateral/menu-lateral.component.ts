import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/data-access/auth.service';
import { User } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-lateral.component.html',
  styleUrls: []
})
export class MenuLateralComponent implements OnInit {
  user: User | null = null;

  private router = inject(Router);

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigateByUrl('/auth/sign-in');  // Redirige al usuario a la página de inicio de sesión después de cerrar sesión
    }).catch(error => {
      console.error('Logout failed', error);
    });
  }
}
