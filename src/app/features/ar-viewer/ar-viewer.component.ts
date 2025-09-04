import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import * as THREE from 'three';

declare var SelfieSegmentation: any;

@Component({
  selector: 'app-ar-viewer',
  templateUrl: './ar-viewer.component.html',
  styleUrls: ['./ar-viewer.component.css'],
  standalone: true
})
export class ArViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  private video!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D | null;
  private audio!: HTMLAudioElement;

  private selfieSegmentation: any;
  private stream: MediaStream | null = null;
  private animationId: number | null = null;

  // Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private sphere!: THREE.Mesh;
  private renderAnimationId: number | null = null;

  // Controles
  private isMouseDown = false;
  private mouseX = 0;
  private mouseY = 0;
  private targetRotationX = 0;
  private targetRotationY = 0;
  private currentRotationX = 0;
  private currentRotationY = 0;

  // Audio unlock
  private unlockAudioBound?: () => void;
  public hideEnableButton = false; // para ocultar botón tras habilitar sonido

  private emotion: string = 'default';

  constructor(private location: Location, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // No tocar DOM aquí
  }

  ngAfterViewInit(): void {
    this.route.queryParams.subscribe(params => {
      const emotionParam = params['emotion'];
      const valid = ['tristeza', 'ansiedad', 'estres', 'default'];
      if (emotionParam && valid.includes(emotionParam)) {
        this.emotion = emotionParam;
      } else {
        this.emotion = 'default';
      }
      setTimeout(() => {
        this.initializeElements();
        this.initThreeJS360();
        this.startCamera().then(() => {
          this.initMediaPipe();
          this.processFrame();
        }).catch(err => {
          console.error('Error al inicializar la cámara:', err);
        });
      }, 100);
    });
  }

  private initializeElements(): void {
    this.video = document.getElementById('video') as HTMLVideoElement;
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.audio = document.getElementById('backgroundAudio') as HTMLAudioElement;
    this.ctx = this.canvas?.getContext('2d');

    if (!this.video || !this.canvas || !this.ctx || !this.audio) {
      console.error('No se pudieron obtener los elementos del DOM');
      return;
    }

    // El canvas de segmentación NO debe bloquear drag/touch del 360
    this.canvas.style.pointerEvents = 'none';

    // Configurar audio (ruta recomendada en Angular)
    this.audio.src = this.getAudioForEmotion();
    this.audio.loop = true;
    this.audio.preload = 'auto';

    // Intento de autoplay silencioso (permitido por navegadores)
    this.audio.muted = true;
    this.audio.play().catch(() => { /* normal que falle hasta gesto */ });

    // Desbloquear al primer gesto del usuario
    this.unlockAudioBound = () => {
      this.audio.muted = false;
      this.audio.play().then(() => {
        this.hideEnableButton = true;
      }).catch(err => console.error('Audio play error:', err));
      window.removeEventListener('pointerdown', this.unlockAudioBound!);
      window.removeEventListener('keydown', this.unlockAudioBound!);
    };
    window.addEventListener('pointerdown', this.unlockAudioBound, { once: true });
    window.addEventListener('keydown', this.unlockAudioBound, { once: true });

    // Si el audio comienza, ocultamos el botón
    this.audio.addEventListener('playing', () => {
      this.hideEnableButton = true;
    });
  }

  private initThreeJS360(): void {
    const container = document.getElementById('viewer360') as HTMLDivElement;
    if (!container) {
      console.error('Contenedor viewer360 no encontrado');
      return;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.create360Sphere();
    this.addInteractionControls();
    this.startRenderLoop();
    this.handleWindowResize();

    container.style.touchAction = 'none'; // no robar gestos
  }

  private create360Sphere(): void {
    const geometry = new THREE.SphereGeometry(100, 64, 32);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    const imageUrl = this.getImageForEmotion();

    loader.load(
      imageUrl,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = -1; // invierte si lo ves al revés
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);
      },
      undefined,
      (error) => {
        console.error('Error cargando textura 360°:', error);
      }
    );
  }

  private getAudioForEmotion(): string {
    switch (this.emotion) {
      case 'tristeza':
        return '/audio/depresion1.mp3';
      case 'estres':
        return '/audio/Estres2.mp3';
      case 'ansiedad':
        return '/audio/Ansiedad1.mp3';
      default:
        return '/audio/Ansiedad1.mp3';
    }
  }

  private getImageForEmotion(): string {
    switch (this.emotion) {
      case 'tristeza':
        return '/imagenes/depresion.png';
      case 'estres':
        return '/imagenes/Estres.jpg';
      case 'ansiedad':
        return '/imagenes/Ansiedad.jpg';
      default:
        return '/imagenes/Ansiedad.jpg';
    }
  }

  private addInteractionControls(): void {
    const target = this.renderer.domElement;

    // Mouse
    target.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isMouseDown = true;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    document.addEventListener('mouseup', () => (this.isMouseDown = false));
    document.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const deltaX = e.clientX - this.mouseX;
      const deltaY = e.clientY - this.mouseY;
      this.targetRotationY += deltaX * 0.01; // yaw
      this.targetRotationX += deltaY * 0.01; // pitch
      this.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotationX));
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // Touch
    target.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      this.isMouseDown = true;
      this.mouseX = e.touches[0].clientX;
      this.mouseY = e.touches[0].clientY;
    }, { passive: false });

    document.addEventListener('touchend', () => (this.isMouseDown = false));
    document.addEventListener('touchmove', (e) => {
      if (!this.isMouseDown || e.touches.length !== 1) return;
      e.preventDefault();
      const deltaX = e.touches[0].clientX - this.mouseX;
      const deltaY = e.touches[0].clientY - this.mouseY;
      this.targetRotationY += deltaX * 0.01;
      this.targetRotationX += deltaY * 0.01;
      this.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotationX));
      this.mouseX = e.touches[0].clientX;
      this.mouseY = e.touches[0].clientY;
    }, { passive: false });
  }

  private startRenderLoop(): void {
    const render = () => {
      this.renderAnimationId = requestAnimationFrame(render);
      this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.08;
      this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.08;
      this.camera.rotation.x = this.currentRotationX;
      this.camera.rotation.y = this.currentRotationY;
      this.renderer.render(this.scene, this.camera);
    };
    render();
  }

  private handleWindowResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private async startCamera(): Promise<void> {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      // Autoplay de video en móviles / Chrome
      this.video.muted = true;
      (this.video as any).playsInline = true;

      await new Promise<void>((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play().then(() => {
            this.resizeCanvas();
            resolve();
          }).catch(err => {
            console.error('No se pudo reproducir el video:', err);
            resolve();
          });
        };
      });

    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      throw err;
    }
  }

  private resizeCanvas(): void {
    if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.objectFit = 'cover';
    }
  }

  private initMediaPipe(): void {
    this.selfieSegmentation = new SelfieSegmentation({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });

    this.selfieSegmentation.setOptions({
      modelSelection: 1,
      selfieMode: true
    });

    this.selfieSegmentation.onResults((results: any) => {
      if (!this.ctx || !this.canvas) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Persona
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);
      // Máscara
      this.ctx.globalCompositeOperation = 'destination-in';
      this.ctx.drawImage(results.segmentationMask, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalCompositeOperation = 'source-over';
    });
  }

  private async processFrame(): Promise<void> {
    if (this.video && this.video.videoWidth > 0 && this.selfieSegmentation) {
      try {
        await this.selfieSegmentation.send({ image: this.video });
      } catch (err) {
        console.error('Error procesando frame:', err);
      }
    }
    this.animationId = requestAnimationFrame(() => this.processFrame());
  }

  // Botón para habilitar sonido manualmente
  enableSound(): void {
    if (!this.audio) return;
    this.audio.muted = false;
    this.audio.play()
      .then(() => this.hideEnableButton = true)
      .catch(err => console.error('Audio play error:', err));
  }

  goBack(): void {
    this.location.back();
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderAnimationId) cancelAnimationFrame(this.renderAnimationId);

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.parentNode?.removeChild(this.renderer.domElement);
    }

    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    if (this.selfieSegmentation) this.selfieSegmentation.close();

    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.unlockAudioBound) {
      window.removeEventListener('pointerdown', this.unlockAudioBound);
      window.removeEventListener('keydown', this.unlockAudioBound);
    }
  }
}
