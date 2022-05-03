import { AfterViewInit, Component, ViewChild, ElementRef, ContentChild, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { SceneDirective } from './basics/scene.directive';
import * as THREE from 'three';
import { Player } from './entity/player'
import * as ORBIT from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon';
import { Vector3 } from 'three';
import { PlayerService } from '../services/player.service';
import { OtherPlayer } from './entity/other-player';


@Component({
  selector: 'three-renderer-world',
  template: '<canvas #canvas></canvas>'
})
export class RendererWorldComponent implements AfterViewInit, OnDestroy {
  width!: number;
  height!: number;

  @ViewChild('canvas') canvasReference!: ElementRef;
  get canvas(): HTMLCanvasElement { return this.canvasReference.nativeElement; }

  @ContentChild(SceneDirective) scene!: SceneDirective
  @Output() loadedEmitter = new EventEmitter<boolean>();

  renderer!: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  world!: CANNON.World;

  myPlayer!: Player;
  keyPressed: Map<string, boolean> = new Map();
  otherPlayers: { [key: string]: OtherPlayer } = {};

  constructor(private playerService:PlayerService) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  ngAfterViewInit() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    /**GLTF */
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 100);
    this.camera.position.set(1, 11, 10);

    this.adjustAspect();
    this.initWindowEvt();


    const orbitControls = new ORBIT.OrbitControls(this.camera, this.renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 20;
    orbitControls.enablePan = false;
    orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;

    orbitControls.target = new Vector3(0, 10, 0);
    orbitControls.update();

    this.myPlayer = new Player(this.scene, this.keyPressed, this.camera, orbitControls, localStorage.getItem('username')!);

    const clock = new THREE.Clock();
    let animationId: number;
    const renderLoop = () => {

      const delta = clock.getDelta();

      this.myPlayer.update(delta);

      orbitControls.update();

      // TODO
      this.playerService.myMove(this.myPlayer.quaternion, this.myPlayer.walkDir, this.myPlayer.activeAction, this.myPlayer.position);

      Object.keys(this.otherPlayers).forEach(key => {
        this.otherPlayers[key].update(delta);
      });

      //TODO update physics

      this.renderer.render(this.scene.object, this.camera);

      animationId = requestAnimationFrame(renderLoop);
    };
    
    this.myPlayer.load(localStorage.getItem('modelName')!).then(() => {
      renderLoop();
      this.loadedEmitter.emit(true);
      this.playerService.connect();
      this.initSocket();
    });
  }

  adjustAspect(): void {
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  initWindowEvt(): void {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.adjustAspect();
    });

    window.addEventListener('keydown', e => {
      this.keyPressed.set(e.key.toLowerCase(), true);
    });
    window.addEventListener('keyup', e => {
      this.keyPressed.set(e.key.toLowerCase(), false);
    });
  }

  initSocket(): void {
    this.playerService.onMyJoin().subscribe((resp: any) => {
      for (let one of resp.others) {
        const player = new OtherPlayer(this.scene, one.username);
        player.load(one.modelName).then(() => {
          this.otherPlayers[one.id] = player;
        });
      }
    });
    this.playerService.onOthersJoin().subscribe((one: any) => {
      if(one.username && one.id){
        const player = new OtherPlayer(this.scene, one.username);
        player.load(one.modelName).then(() => {
          this.otherPlayers[one.id] = player;
        })
      }
      
    });
    this.playerService.onOthersQuit().subscribe((id: any) => {
      this.otherPlayers[id].dispose();
      delete this.otherPlayers[id];
    });
    this.playerService.onOthersMove().subscribe((resp: any) => {
      Object.keys(this.otherPlayers).forEach(key => {
        let temp = resp[key];
        this.otherPlayers[key].setState(temp.quaternion, temp.walkDir, temp.currentAction, temp.position);
      })
    });
  }

  //TODO CANNON
  initCannon(): void {
    this.world = new CANNON.World();
  }

  updatePhysics(): void {

  }

  ngOnDestroy(): void {
    this.playerService.disconnect();
  }
}
