import { AfterViewInit, Component, ViewChild, ElementRef, ContentChild, Input, OnDestroy } from '@angular/core';
import { SceneDirective } from '../basics/scene.directive';
import * as THREE from 'three';
import CameraControls from 'camera-controls';
import DragControls from 'drag-controls';

CameraControls.install({THREE});
DragControls.install({THREE});

@Component({
  selector: 'three-renderer-problem',
  template: '<canvas #canvas></canvas>'
})
export class RendererProblemComponent implements AfterViewInit {
  width!: number;
  height!: number;
  @Input() mode: string = "fullscreen";

  @ViewChild('canvas') canvasReference!: ElementRef;
  get canvas(): HTMLCanvasElement { return this.canvasReference.nativeElement; }

  @ContentChild(SceneDirective) scene!: SceneDirective

  renderer!: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  cameraControls!: CameraControls;
  dragControls!: DragControls;

  constructor() {
    if (this.mode === 'fullscreen') {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    } else if (this.mode === 'xxxx') {
      //TODO
      this.width = 300;
      this.height = 200;
    }
  }

  ngAfterViewInit() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 18, 18);
    this.camera.lookAt(0, 0, 0);

    this.adjustAspect();
    this.initWindowEvt();

    /* init controls */
    this.cameraControls = new CameraControls(this.camera, this.renderer.domElement);
    this.dragControls = new DragControls(this.scene.meshes, this.camera, this.canvas);
    (this.dragControls as any).enabled = false;

    //animation loop
    const clock = new THREE.Clock();
    let animationId: number;
    const renderLoop = () => {
      const delta = clock.getDelta();

      //TODO update physics
      this.cameraControls.update(delta);

      this.renderer.render(this.scene.object, this.camera);

      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  adjustAspect(): void {
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  initWindowEvt(): void {
    window.addEventListener('resize', () => {
      if (this.mode === 'fullscreen') {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

      } else if (this.mode === 'xxxx') {
        //TODO
        this.width = 123;
        this.height = 123;
      }

      this.adjustAspect();
    });
    // press f to drag
    window.addEventListener('keydown', e=>{
      this.cameraControls.enabled = false;
      (this.dragControls as any).enabled = true;
    });
    window.addEventListener('keyup', e=>{
      this.cameraControls.enabled = true;
      (this.dragControls as any).enabled = false;
    });
  }
}
