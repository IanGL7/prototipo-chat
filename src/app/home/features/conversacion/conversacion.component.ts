import { Component, OnInit } from '@angular/core';
import { MenuLateralComponent } from '../../../shared/menu-lateral/menu-lateral.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-conversacion',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuLateralComponent],
  templateUrl: './conversacion.component.html'
})
export class ConversacionComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    // Inicialización necesaria para el componente de conversación
  }
}
