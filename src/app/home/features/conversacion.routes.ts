import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./conversacion/conversacion.component').then(m => m.ConversacionComponent)
  }
] as Routes;
