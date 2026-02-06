/**
 * render3d.js — 3D Brillouin zone renderer using Three.js.
 *
 * Renders 3D polyhedra with orbit controls, lighting, transparency,
 * and optional ray-traced appearance.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vlength } from '../core/math.js';

/** Zone colors for 3D rendering (neutral academic palette) */
const ZONE_COLORS_3D = [
  0x8b4513, 0xb22222, 0x556b2f, 0x808080, 0xa0522d,
  0x2f4f4f, 0x708090, 0x8b4513, 0xb22222, 0x556b2f
];

export class Renderer3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.zoneMeshes = [];
    this.labelSprites = [];
    this.pointsMesh = null;
    this.showLabels = true;
    this.rayTracingEnabled = false;
    this._animating = false;

    this._init();
  }

  _init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf7f6f3);

    // Camera
    const rect = this.container.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(12, 10, 15);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true
    });
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.8;

    // Lighting
    this._setupLighting();

    // Axes helper
    const axesHelper = new THREE.AxesHelper(8);
    this.scene.add(axesHelper);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xdddddd);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);

    // Start animation loop
    this._animate();

    // Handle resize
    window.addEventListener('resize', () => this.resize());
  }

  _setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambient);

    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xff8844, 0.3);
    rimLight.position.set(0, -5, 15);
    this.scene.add(rimLight);

    // Point light for ray-trace appearance
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight.position.set(5, 10, 5);
    this.scene.add(pointLight);
  }

  _animate() {
    if (this._animating) return;
    this._animating = true;
    const loop = () => {
      this._animId = requestAnimationFrame(loop);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  /** Clear all zone meshes and labels */
  clearZones() {
    for (const mesh of this.zoneMeshes) {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    }
    this.zoneMeshes = [];

    for (const sprite of this.labelSprites) {
      this.scene.remove(sprite);
    }
    this.labelSprites = [];

    if (this.pointsMesh) {
      this.scene.remove(this.pointsMesh);
      this.pointsMesh = null;
    }
  }

  /**
   * Add a 3D Brillouin zone from face data.
   * @param {Array} faces - Array of { vertices: [[x,y,z],...], normal: [nx,ny,nz] }
   * @param {number} zoneIndex - Zone number (1-indexed)
   * @param {number} opacity - Opacity (0-1)
   */
  addZone(faces, zoneIndex = 1, opacity = 0.6) {
    if (!faces || faces.length === 0) return;

    const colorIdx = (zoneIndex - 1) % ZONE_COLORS_3D.length;
    const color = ZONE_COLORS_3D[colorIdx];

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];

    for (const face of faces) {
      const fv = face.vertices;
      const fn = face.normal;
      // Triangulate face (fan from first vertex)
      for (let i = 1; i < fv.length - 1; i++) {
        vertices.push(...fv[0], ...fv[i], ...fv[i + 1]);
        normals.push(...fn, ...fn, ...fn);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

    // Material depends on ray tracing mode
    let material;
    if (this.rayTracingEnabled) {
      material = new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: opacity,
        roughness: 0.1,
        metalness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
        envMapIntensity: 1.0
      });
    } else {
      material = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: opacity,
        shininess: 80,
        specular: 0x444444,
        side: THREE.DoubleSide
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.zoneMeshes.push(mesh);

    // Add wireframe edges
    const edgeGeo = new THREE.EdgesGeometry(geometry, 15);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.5
    });
    const wireframe = new THREE.LineSegments(edgeGeo, edgeMat);
    this.scene.add(wireframe);
    this.zoneMeshes.push(wireframe);
  }

  /**
   * Add reciprocal lattice points as spheres.
   * @param {Array} points - Array of [x,y,z] vectors
   */
  addReciprocalPoints(points) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3 + 3); // +3 for origin
    // Origin
    positions[0] = 0; positions[1] = 0; positions[2] = 0;
    for (let i = 0; i < points.length; i++) {
      positions[(i + 1) * 3] = points[i][0];
      positions[(i + 1) * 3 + 1] = points[i][1];
      positions[(i + 1) * 3 + 2] = points[i][2];
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x333333,
      size: 0.2,
      sizeAttenuation: true
    });
    this.pointsMesh = new THREE.Points(geometry, material);
    this.scene.add(this.pointsMesh);
  }

  /**
   * Add high-symmetry point labels as text sprites.
   * @param {Object} points - Map of label to [x,y,z]
   */
  addHighSymmetryLabels(points) {
    if (!this.showLabels) return;

    for (const [label, pos] of Object.entries(points)) {
      const sprite = this._createTextSprite(label, pos);
      this.scene.add(sprite);
      this.labelSprites.push(sprite);

      // Add small sphere at point
      const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(sphere);
      this.zoneMeshes.push(sphere);
    }
  }

  /** Create a text sprite for 3D labels */
  _createTextSprite(text, position) {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8b4513';
    ctx.font = 'bold 64px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(position[0], position[1] + 0.5, position[2]);
    sprite.scale.set(1.2, 1.2, 1);
    return sprite;
  }

  /** Toggle ray tracing mode */
  setRayTracing(enabled) {
    this.rayTracingEnabled = enabled;
    if (enabled) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.5;
    } else {
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.renderer.toneMappingExposure = 1.0;
    }
  }

  /** Resize renderer */
  resize() {
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  /** Get the WebGL canvas element for export */
  getCanvas() {
    return this.renderer.domElement;
  }

  /** Dispose of all resources */
  dispose() {
    if (this._animId) cancelAnimationFrame(this._animId);
    this._animating = false;
    this.clearZones();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
