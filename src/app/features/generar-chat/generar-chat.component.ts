import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GenerarChatService } from './generar-chat.service';
import { HttpClientModule } from '@angular/common/http';
import { GenerarChatModule } from './generar-chat.module';
import { CommonModule } from '@angular/common';
import { AccessibilityMenuComponent } from '../../shared/accessibility-menu/accessibility-menu.component';
import { Router, RouterModule } from '@angular/router';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  isExercise?: boolean;  // Nuevo campo para identificar si el mensaje es un ejercicio
  exerciseName?: string; // Nombre del ejercicio si aplica
}

@Component({
  selector: 'app-generar-chat',
  standalone: true,
  imports: [FormsModule, GenerarChatModule, CommonModule, AccessibilityMenuComponent, RouterModule],
  templateUrl: './generar-chat.component.html',
  styleUrls: ['./generar-chat.component.css']
})
export class GenerarChatComponent implements OnInit {
  prompt = '';
  messages: Message[] = [
    { sender: 'bot', text: 'Hola, soy Emonical! ¿En qué puedo ayudarte?' }
  ];

  constructor(private generarChatService: GenerarChatService, private router: Router) {}

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.prompt.trim()) {
      const emotion = this.detectEmotion(this.prompt);

      // Agregar mensaje del usuario al array de mensajes
      this.messages.push({ sender: 'user', text: this.prompt });

      // Llamar al servicio para obtener la respuesta del bot
      this.generarChatService.getContent(this.prompt).subscribe(
        data => {
          const botMessage: Message = { sender: 'bot', text: data.content };

          // Verificar si la respuesta contiene una recomendación de ejercicio
          if (data.content.includes('Te recomiendo realizar el siguiente ejercicio en realidad aumentada')) {
            botMessage.isExercise = true;
            botMessage.exerciseName = this.extractExerciseName(data.content);
          }

          // Agregar respuesta del bot al array de mensajes
          this.messages.push(botMessage);
        },
        err => {
          // Manejar el error y mostrarlo en el chat
          this.messages.push({ sender: 'bot', text: 'Error: No se pudo obtener respuesta' });
        }
      );

      // Abrir el visor de AR según la emoción detectada
      this.openAR(emotion);

      // Limpiar el campo de entrada
      this.prompt = '';
    }
  }

  // Función para extraer el nombre del ejercicio del mensaje
  private extractExerciseName(content: string): string {
    const match = content.match(/Te recomiendo realizar el siguiente ejercicio en realidad aumentada para calmarte: (.+)\./);
    return match ? match[1] : 'Ejercicio';
  }

  private detectEmotion(text: string): string {
    const lower = text.toLowerCase();
    const sadness = ['triste', 'tristeza', 'deprimido', 'depresion'];
    const anxiety = ['ansiedad', 'ansioso', 'nervioso', 'angustia'];
    const stress = ['estres', 'estresado', 'tension', 'agobiado'];
    if (sadness.some(k => lower.includes(k))) return 'tristeza';
    if (anxiety.some(k => lower.includes(k))) return 'ansiedad';
    if (stress.some(k => lower.includes(k))) return 'estres';
    return 'default';
  }

  // Función para abrir el componente de AR
  openAR(emotion: string): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/ar-viewer'], { queryParams: { emotion } })
    );
    window.open(url, '_blank');
  }
}
