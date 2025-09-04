import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ar-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ar-viewer.component.html',
  styleUrls: ['./ar-viewer.component.css']
})
export class ArViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  exerciseName: string | null = null;
  stream: MediaStream | null = null;

  constructor(private route: ActivatedRoute) {}

  ngAfterViewInit(): void {
    // Obtener el parámetro de la URL y cargar la experiencia de AR
    this.route.queryParams.subscribe(params => {
      this.exerciseName = params['exercise'];
      this.loadARExperience(this.exerciseName);
    });

    // Iniciar la cámara después de que la vista esté inicializada
    this.startCamera();
  }

  async startCamera(): Promise<void> {
    try {
      // Solicita acceso a la cámara
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Cambia a 'environment' para la cámara trasera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // Asigna el flujo de video al elemento de video
      if (this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        await this.videoElement.nativeElement.play(); // Inicia la reproducción del video
        console.log("Cámara iniciada con éxito.");
      } else {
        console.error("El elemento de video no está disponible.");
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
    }
  }

  loadARExperience(exerciseName: string | null): void {
    console.log(`Cargando experiencia AR para el ejercicio: ${exerciseName}`);
    // Aquí puedes implementar lógica adicional para experiencias AR
  }

  ngOnDestroy(): void {
    // Detener la cámara cuando el componente se destruye
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
