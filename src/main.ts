import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  GlowLayer,
  HemisphericLight,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  SceneLoader,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Vector3,
  WebGPUEngine,
  type AbstractEngine,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import './style.css';
import { gameStory, localizeStory, type Discovery, type GameStory, type StoryStep } from './story-data';
import { storyEn } from './story-data.en';
import { preferredLang, setLang, ui, type Lang } from './i18n';
import { renderActivity } from './activities';
import { buildEquipment, buildLabel, type ModelKit } from './models';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;

// Idioma: aplicado já no início (inclusive na mensagem sem WebGL); confirmado na tela de abertura.
const languagePreference = preferredLang();
setLang(languagePreference.lang);

// Motor 3D: WebGL quando disponível; se o navegador bloquear o WebGL, tenta WebGPU.
// Sem nenhum dos dois, mostra uma orientação em vez de uma tela quebrada.
function hasWebGL() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}
type Renderer = 'webgl' | 'webgpu';

async function createEngine(): Promise<{ engine: AbstractEngine; renderer: Renderer } | null> {
  // ?render=webgpu força o WebGPU (para testes).
  const forceWebGPU = new URLSearchParams(location.search).get('render') === 'webgpu';
  if (!forceWebGPU && hasWebGL()) {
    return { engine: new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }), renderer: 'webgl' };
  }
  try {
    if (await WebGPUEngine.IsSupportedAsync) {
      const webgpu = new WebGPUEngine(canvas, { antialias: true, stencil: true });
      await webgpu.initAsync();
      return { engine: webgpu, renderer: 'webgpu' };
    }
  } catch (error) {
    console.warn('WebGPU indisponível.', error);
  }
  return null;
}

const created = await createEngine();
if (!created) {
  document.querySelector<HTMLElement>('#intro')?.classList.add('hidden');
  document.querySelector<HTMLElement>('#no-webgl')!.hidden = false;
  throw new Error('WebGL e WebGPU indisponíveis: o jogo 3D não pode ser iniciado.');
}
const engine = created.engine;
document.documentElement.dataset.renderer = created.renderer;
const scene = new Scene(engine);
scene.clearColor = new Color4(0.018, 0.022, 0.09, 1);
scene.fogMode = Scene.FOGMODE_EXP2;
scene.fogDensity = 0.008;
scene.fogColor = new Color3(0.04, 0.055, 0.13);

// A câmera começa atrás do astronauta, olhando na direção da primeira estação.
const camera = new ArcRotateCamera('camera', Math.PI / 2, 1.12, 18, new Vector3(0, 2, 2), scene);
// As setas do teclado movem o astronauta; não devem girar a câmera.
camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 11;
camera.upperRadiusLimit = 24;
camera.lowerBetaLimit = 0.75;
camera.upperBetaLimit = 1.35;
camera.wheelPrecision = 35;
camera.panningSensibility = 0;

const ambient = new HemisphericLight('ambient', new Vector3(-0.3, 1, 0.2), scene);
ambient.intensity = 0.75;
ambient.diffuse = new Color3(0.55, 0.63, 1);
ambient.groundColor = new Color3(0.16, 0.11, 0.22);

const sun = new DirectionalLight('sun', new Vector3(-0.55, -1, 0.35), scene);
sun.position = new Vector3(16, 24, -12);
sun.intensity = 2.25;
sun.diffuse = new Color3(1, 0.76, 0.52);
// A área de sombra acompanha o astronauta (o mapa é grande demais para uma sombra só).
sun.autoUpdateExtends = false;
sun.orthoLeft = -32;
sun.orthoRight = 32;
sun.orthoTop = 32;
sun.orthoBottom = -32;
sun.shadowMinZ = 1;
sun.shadowMaxZ = 90;
const SUN_OFFSET = sun.direction.scale(-40);
const shadows = new ShadowGenerator(2048, sun);
shadows.useBlurExponentialShadowMap = true;
shadows.blurKernel = 24;

const glow = new GlowLayer('glow', scene);
glow.intensity = 0.45;

function material(name: string, color: Color3, emissive?: Color3) {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = color;
  result.specularColor = new Color3(0.08, 0.08, 0.1);
  if (emissive) result.emissiveColor = emissive;
  return result;
}

const moonMat = material('moon-dust', new Color3(0.39, 0.37, 0.44));
moonMat.roughness = 1;
const darkDust = material('crater-shadow', new Color3(0.16, 0.15, 0.21));
const whiteSuit = material('suit', new Color3(0.92, 0.91, 0.86));
const visorMat = material('visor', new Color3(0.13, 0.22, 0.34), new Color3(0.03, 0.08, 0.14));
visorMat.specularColor = new Color3(0.95, 0.66, 0.25);
const goldMat = material('gold', new Color3(0.72, 0.33, 0.08), new Color3(0.08, 0.025, 0));
const metalMat = material('metal', new Color3(0.22, 0.25, 0.32));
const orangeMat = material('mission-orange', new Color3(1, 0.35, 0.08), new Color3(0.35, 0.045, 0));

// Colisão simples: cada obstáculo é um círculo no chão (x, z, raio).
type Obstacle = { x: number; z: number; r: number };
const obstacles: Obstacle[] = [];
const ASTRONAUT_RADIUS = 0.45;
const addObstacle = (x: number, z: number, r: number) => obstacles.push({ x, z, r });

function resolveCollisions(position: Vector3) {
  for (const obstacle of obstacles) {
    const dx = position.x - obstacle.x;
    const dz = position.z - obstacle.z;
    const distance = Math.hypot(dx, dz);
    const minimum = obstacle.r + ASTRONAUT_RADIUS;
    if (distance < minimum && distance > 1e-4) {
      position.x = obstacle.x + (dx / distance) * minimum;
      position.z = obstacle.z + (dz / distance) * minimum;
    }
  }
}

// Mapa compacto com os 12 locais (fora de escala: na Lua real, eles ficam a centenas de quilômetros).
const MAP_LIMIT = 62;
const ground = MeshBuilder.CreateGround('lunar-surface', { width: 150, height: 150, subdivisions: 2 }, scene);
ground.material = moonMat;
ground.receiveShadows = true;

function createCrater(x: number, z: number, radius: number, depth = 0.16) {
  const hollow = MeshBuilder.CreateCylinder(`crater-${x}-${z}`, { diameter: radius * 1.48, height: 0.06, tessellation: 48 }, scene);
  hollow.position.set(x, 0.015, z);
  hollow.material = darkDust;
  const rim = MeshBuilder.CreateTorus(`rim-${x}-${z}`, { diameter: radius * 1.72, thickness: radius * depth, tessellation: 48 }, scene);
  rim.position.set(x, 0.07, z);
  rim.scaling.y = 0.35;
  rim.material = moonMat;
  rim.receiveShadows = true;
}

[
  [-10, -1, 2.8], [11, 5, 3.8], [-15, 10, 2.1], [15, -8, 1.8],
  [-5, -13, 1.5], [4, 14, 2.4], [19, 12, 3.2], [-20, -10, 2.6],
].forEach(([x, z, r]) => createCrater(x, z, r));

for (let i = 0; i < 36; i += 1) {
  const radius = 0.12 + ((i * 13) % 9) / 18;
  const rock = MeshBuilder.CreateIcoSphere(`rock-${i}`, { radius, subdivisions: 1 }, scene);
  rock.position.set(-27 + ((i * 11) % 54), radius * 0.58, -25 + ((i * 17) % 50));
  rock.rotation.set(i * 0.31, i * 0.57, i * 0.19);
  rock.scaling.y = 0.55;
  rock.material = i % 3 === 0 ? darkDust : moonMat;
  shadows.addShadowCaster(rock);
  if (radius > 0.3) addObstacle(rock.position.x, rock.position.z, radius * 0.9);
}

// Relevo extra espalhado pelo mapa, sem cobrir os locais das descobertas.
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = seededRandom(1969);
const nearDiscoverySite = (x: number, z: number, margin: number) =>
  gameStory.discoveries.some((d) => Math.hypot(d.position.x - x, d.position.z - z) < margin) || Math.hypot(x + 4.2, z - 7) < margin;
for (let i = 0; i < 22; i += 1) {
  const x = -60 + random() * 120;
  const z = -60 + random() * 120;
  if (Math.abs(x) < 26 && Math.abs(z) < 26) continue;
  if (nearDiscoverySite(x, z, 9)) continue;
  createCrater(x, z, 1.6 + random() * 3);
}
for (let i = 0; i < 170; i += 1) {
  const x = -60 + random() * 120;
  const z = -60 + random() * 120;
  if (Math.abs(x) < 28 && Math.abs(z) < 26) continue;
  if (nearDiscoverySite(x, z, 5)) continue;
  const radius = 0.12 + random() * 0.45;
  const rock = MeshBuilder.CreateIcoSphere(`rock-extra-${i}`, { radius, subdivisions: 1 }, scene);
  rock.position.set(x, radius * 0.58, z);
  rock.rotation.set(random() * 3, random() * 3, random() * 3);
  rock.scaling.y = 0.55;
  rock.material = i % 3 === 0 ? darkDust : moonMat;
  shadows.addShadowCaster(rock);
  if (radius > 0.3) addObstacle(x, z, radius * 0.9);
}

// Estrelas e Terra ficam num "céu" que acompanha a câmera.
const sky = new TransformNode('sky', scene);
const starMat = material('stars', Color3.White(), new Color3(1, 0.9, 0.78));
for (let i = 0; i < 170; i += 1) {
  const star = MeshBuilder.CreateSphere(`star-${i}`, { diameter: 0.045 + (i % 5) * 0.018, segments: 4 }, scene);
  const angle = i * 2.399;
  const distance = 28 + (i % 9);
  star.position.set(Math.cos(angle) * distance, 5 + ((i * 19) % 20), Math.sin(angle) * distance);
  star.material = starMat;
  star.parent = sky;
  star.isPickable = false;
}

const earthMat = material('earth', new Color3(0.13, 0.4, 0.9), new Color3(0.035, 0.14, 0.32));
const earth = MeshBuilder.CreateSphere('earth', { diameter: 4.4, segments: 48 }, scene);
earth.position.set(10, 16, -24);
earth.material = earthMat;
earth.parent = sky;
earth.isPickable = false;
const cloudMat = material('clouds', new Color3(0.85, 0.9, 1), new Color3(0.12, 0.16, 0.22));
const cloudBand = MeshBuilder.CreateTorus('earth-clouds', { diameter: 3.65, thickness: 0.12, tessellation: 64 }, scene);
cloudBand.parent = earth;
cloudBand.rotation.x = 1.15;
cloudBand.material = cloudMat;

function box(name: string, size: { width: number; height: number; depth: number }, position: Vector3, mat: StandardMaterial, parent?: TransformNode) {
  const mesh = MeshBuilder.CreateBox(name, size, scene);
  mesh.position = position;
  mesh.material = mat;
  if (parent) mesh.parent = parent;
  shadows.addShadowCaster(mesh);
  return mesh;
}

function buildAstronaut() {
  const root = new TransformNode('astronaut-root', scene);
  root.position.set(-4.2, 0, 7);
  const torso = MeshBuilder.CreateCapsule('astronaut-torso', { height: 1.65, radius: 0.55, tessellation: 32 }, scene);
  torso.parent = root;
  torso.position.y = 1.72;
  torso.material = whiteSuit;
  shadows.addShadowCaster(torso);
  box('backpack', { width: 0.92, height: 1.25, depth: 0.45 }, new Vector3(0, 1.72, 0.43), whiteSuit, root);
  const helmet = MeshBuilder.CreateSphere('helmet', { diameter: 1.22, segments: 32 }, scene);
  helmet.parent = root;
  helmet.position.y = 2.75;
  helmet.material = whiteSuit;
  shadows.addShadowCaster(helmet);
  const visor = MeshBuilder.CreateSphere('visor', { diameter: 0.94, segments: 32, slice: 0.64 }, scene);
  visor.parent = root;
  visor.position.set(0, 2.75, -0.29);
  visor.rotation.x = -0.2;
  visor.material = visorMat;
  [-0.7, 0.7].forEach((x) => {
    const arm = MeshBuilder.CreateCapsule(`arm-${x}`, { height: 1.25, radius: 0.19 }, scene);
    arm.parent = root;
    arm.position.set(x, 1.7, 0);
    arm.rotation.z = x > 0 ? -0.16 : 0.16;
    arm.material = whiteSuit;
    shadows.addShadowCaster(arm);
    const leg = MeshBuilder.CreateCapsule(`leg-${x}`, { height: 1.2, radius: 0.24 }, scene);
    leg.parent = root;
    leg.position.set(x * 0.48, 0.63, 0);
    leg.material = whiteSuit;
    shadows.addShadowCaster(leg);
    box(`boot-${x}`, { width: 0.48, height: 0.25, depth: 0.68 }, new Vector3(x * 0.48, 0.15, -0.12), metalMat, root);
  });
  box('chest-panel', { width: 0.65, height: 0.45, depth: 0.12 }, new Vector3(0, 1.78, -0.53), metalMat, root);
  return root;
}

const astronaut = buildAstronaut();
// copyFrom mantém ângulo e distância; atribuir camera.target recalcularia o ângulo com a câmera parada.
camera.target.copyFrom(astronaut.position.add(new Vector3(0, 1.5, 0)));
const proceduralAstronautParts = astronaut.getChildren().slice();
// Equipamentos das 12 descobertas (modelos simplificados, ver models.ts).
const kit: ModelKit = {
  scene,
  shadows,
  materials: { gold: goldMat, metal: metalMat, orange: orangeMat, dark: darkDust, moon: moonMat, white: whiteSuit },
  addObstacle,
};
// História no idioma escolhido (as posições e respostas são as mesmas nos dois idiomas).
let story: GameStory = gameStory;
let discoveries = story.discoveries;
const equipment = discoveries.map((discovery) => buildEquipment(kit, discovery));
const station = equipment[0];
const landingSite = new TransformNode('apollo-12-landing-site', scene);
landingSite.position.set(station.position.x - 1, 0, station.position.z - 7);
landingSite.rotation.y = -0.5;
addObstacle(landingSite.position.x, landingSite.position.z, 2);

async function importSceneAsset(
  fileName: string,
  assetName: string,
  parent: TransformNode,
  targetSpan: number,
  rootUrl = '/models/kenney/',
) {
  const result = await SceneLoader.ImportMeshAsync('', rootUrl, fileName, scene);
  const importedRoot = result.meshes[0];
  importedRoot.name = assetName;
  importedRoot.computeWorldMatrix(true);
  const bounds = importedRoot.getHierarchyBoundingVectors(true);
  const dimensions = bounds.max.subtract(bounds.min);
  const largestDimension = Math.max(dimensions.x, dimensions.y, dimensions.z);
  const assetScale = largestDimension > 0 ? targetSpan / largestDimension : 1;
  importedRoot.scaling.setAll(assetScale);
  importedRoot.computeWorldMatrix(true);
  const scaledBounds = importedRoot.getHierarchyBoundingVectors(true);
  importedRoot.position.y -= scaledBounds.min.y;
  importedRoot.parent = parent;

  for (const mesh of result.meshes) {
    mesh.receiveShadows = true;
    shadows.addShadowCaster(mesh);
  }
  return importedRoot;
}

async function loadKenneySceneAssets() {
  try {
    await importSceneAsset(
      'astronaut-poly-google.glb',
      'poly-google-astronaut',
      astronaut,
      1.9,
      '/models/poly/',
    );
    for (const part of proceduralAstronautParts) part.setEnabled(false);

    const environmentAssets = [
      { file: 'crater-large.glb', name: 'kenney-crater-a', position: new Vector3(-8, 0.01, 3), span: 4.2, rotation: 0.25 },
      { file: 'crater-large.glb', name: 'kenney-crater-b', position: new Vector3(10, 0.01, -11), span: 3.1, rotation: -0.4 },
      { file: 'rock.glb', name: 'kenney-rock-a', position: new Vector3(-6, 0, -5), span: 0.9, rotation: 0.7 },
      { file: 'rock.glb', name: 'kenney-rock-b', position: new Vector3(7, 0, 5), span: 0.7, rotation: -0.35 },
      { file: 'rocks-small.glb', name: 'kenney-rocks-small', position: new Vector3(3.5, 0, -1.5), span: 1.15, rotation: 1.1 },
    ];

    await Promise.all(environmentAssets.map(async (asset) => {
      const anchor = new TransformNode(`${asset.name}-anchor`, scene);
      anchor.position.copyFrom(asset.position);
      anchor.rotation.y = asset.rotation;
      if (asset.file.startsWith('rock')) addObstacle(asset.position.x, asset.position.z, asset.span * 0.45);
      await importSceneAsset(asset.file, asset.name, anchor, asset.span);
    }));
    document.documentElement.dataset.kenneyAssets = 'loaded';
  } catch (error) {
    console.error('Não foi possível carregar os recursos Kenney.', error);
    document.documentElement.dataset.kenneyAssets = 'fallback';
  }
}

void loadKenneySceneAssets();

async function loadOfficialNasaLunarModule() {
  try {
    const result = await SceneLoader.ImportMeshAsync(
      '',
      '/models/nasa/',
      'apollo-lunar-module.glb',
      scene,
    );
    const importedRoot = result.meshes[0];
    importedRoot.name = 'nasa-apollo-lunar-module';
    importedRoot.computeWorldMatrix(true);
    const initialBounds = importedRoot.getHierarchyBoundingVectors(true);
    const modelHeight = initialBounds.max.y - initialBounds.min.y;
    const modelScale = modelHeight > 0 ? 3.15 / modelHeight : 1;
    importedRoot.scaling.setAll(modelScale);
    importedRoot.computeWorldMatrix(true);
    const scaledBounds = importedRoot.getHierarchyBoundingVectors(true);
    importedRoot.position.y -= scaledBounds.min.y;
    // O módulo fica ao lado da estação, como marco do local de pouso.
    importedRoot.parent = landingSite;

    for (const mesh of result.meshes) {
      mesh.receiveShadows = true;
      shadows.addShadowCaster(mesh);
    }
    document.documentElement.dataset.nasaModel = 'loaded';
  } catch (error) {
    console.error('Não foi possível carregar o modelo oficial da NASA.', error);
    document.documentElement.dataset.nasaModel = 'fallback';
  }
}

void loadOfficialNasaLunarModule();

// Marcadores no chão: laranja = próxima descoberta, verde = concluída, cinza = bloqueada.
const doneMat = material('ring-done', new Color3(0.2, 0.8, 0.55), new Color3(0.1, 0.45, 0.3));
const lockedMat = material('ring-locked', new Color3(0.35, 0.36, 0.45), new Color3(0.06, 0.06, 0.09));
const rings = discoveries.map((discovery) => {
  const ring = MeshBuilder.CreateTorus(`discovery-ring-${discovery.number}`, { diameter: discovery.kind === 'alsep' ? 6.6 : 5.6, thickness: 0.06, tessellation: 64 }, scene);
  ring.position.set(discovery.position.x, 0.12, discovery.position.z);
  ring.material = lockedMat;
  ring.isPickable = false;
  return ring;
});
// Placas com o nome de cada equipamento, recriadas quando o idioma muda.
const buildLabels = () => discoveries.map((discovery) => buildLabel(kit, `${discovery.number} · ${discovery.title}`, new Vector3(discovery.position.x, 0, discovery.position.z), discovery.kind === 'lm-descent' ? 4.6 : 3.8));
let labels = buildLabels();

// Seta no chão apontando para a próxima descoberta.
const guideArrow = MeshBuilder.CreateCylinder('seta-guia', { diameterTop: 0, diameterBottom: 0.9, height: 1.3, tessellation: 3 }, scene);
guideArrow.rotation.x = Math.PI / 2;
guideArrow.bakeCurrentTransformIntoVertices();
guideArrow.scaling.y = 0.15;
guideArrow.material = orangeMat;
guideArrow.isPickable = false;
guideArrow.setEnabled(false);

const keys = new Set<string>();
window.addEventListener('keydown', (event) => keys.add(event.key.toLowerCase()));
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
// Controle por toque: joystick virtual exibido em telas sensíveis ao toque.
const joystick = document.querySelector<HTMLElement>('#joystick')!;
const joystickKnob = joystick.querySelector<HTMLElement>('.joystick-knob')!;
const touchInput = { x: 0, z: 0 };
let joystickPointer: number | null = null;
const enableTouchMode = () => document.documentElement.classList.add('touch');
if (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) enableTouchMode();
window.addEventListener('touchstart', enableTouchMode, { once: true, passive: true });

function updateJoystick(event: PointerEvent) {
  const rect = joystick.getBoundingClientRect();
  const maxOffset = rect.width / 2;
  let dx = event.clientX - (rect.left + maxOffset);
  let dy = event.clientY - (rect.top + maxOffset);
  const length = Math.hypot(dx, dy);
  if (length > maxOffset) { dx *= maxOffset / length; dy *= maxOffset / length; }
  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  const x = dx / maxOffset;
  const z = -dy / maxOffset;
  const deadZone = Math.hypot(x, z) < 0.15;
  touchInput.x = deadZone ? 0 : x;
  touchInput.z = deadZone ? 0 : z;
}
function releaseJoystick() {
  joystickPointer = null;
  touchInput.x = 0;
  touchInput.z = 0;
  joystickKnob.style.transform = '';
}
joystick.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
joystick.addEventListener('pointermove', (event) => { if (event.pointerId === joystickPointer) updateJoystick(event); });
joystick.addEventListener('pointerup', (event) => { if (event.pointerId === joystickPointer) releaseJoystick(); });
joystick.addEventListener('pointercancel', (event) => { if (event.pointerId === joystickPointer) releaseJoystick(); });

// Evita o astronauta "andando sozinho" quando a janela perde o foco com uma tecla apertada.
window.addEventListener('blur', () => { keys.clear(); releaseJoystick(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) keys.clear(); });

const intro = document.querySelector<HTMLElement>('#intro')!;
const startButton = document.querySelector<HTMLButtonElement>('#start-button')!;
const discoveryToast = document.querySelector<HTMLElement>('#discovery-toast')!;
const discoveryCard = document.querySelector<HTMLElement>('#discovery-card')!;
const investigateButton = document.querySelector<HTMLButtonElement>('#investigate-button')!;
const closeButton = document.querySelector<HTMLButtonElement>('#continue-button')!;
const prologueEyebrow = document.querySelector<HTMLElement>('#prologue-eyebrow')!;
const prologueTitle = document.querySelector<HTMLElement>('#prologue-title')!;
const prologuePages = document.querySelector<HTMLElement>('#prologue-pages')!;
const prologueMission = document.querySelector<HTMLElement>('#prologue-mission')!;
const encounterCopy = document.querySelector<HTMLElement>('#encounter-copy')!;
const storyTabs = document.querySelector<HTMLElement>('#story-tabs')!;
const storyPanel = document.querySelector<HTMLElement>('#story-panel')!;
const knowledgeScore = document.querySelector<HTMLElement>('#knowledge-score')!;
const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const card = {
  number: byId('card-number'), icon: byId('card-icon'), location: byId('card-location'), eyebrow: byId('card-eyebrow'),
  title: byId('card-title'), subtitle: byId('card-subtitle'), mission: byId('card-mission'), year: byId('card-year'),
  facts: byId('card-facts'), fiction: byId('card-fiction'),
};
const hud = {
  missionEyebrow: byId('mission-eyebrow'), missionTitle: byId('mission-title'), missionTeaser: byId('mission-teaser'),
  objective: byId('objective-text'), route: byId('route-list'), archiveCount: byId('archive-count'), archiveProgress: byId('archive-progress'),
};
const epilogue = {
  root: byId('epilogue'), eyebrow: byId('epilogue-eyebrow'), title: byId('epilogue-title'), text: byId('epilogue-text'),
  score: byId('epilogue-score'), distinction: byId('epilogue-distinction'), prompt: byId('epilogue-favorite-prompt'),
  favorites: byId('epilogue-favorites'), closing: byId('epilogue-closing'), close: byId<HTMLButtonElement>('epilogue-close'),
};
const toastEyebrow = byId('toast-eyebrow');
const toastTitle = byId('toast-title');
const toastNote = byId('toast-note');

let gameStarted = false;
/** Etapas concluídas, no formato "número:etapa" (ex.: "01:identity"). */
const completedSteps = new Set<string>();
const openedDiscoveries = new Set<string>();
let activeDiscovery: Discovery | null = null;
let justCompleted: Discovery | null = null;
let favorite: string | null = null;
let epilogueSeen = false;

const stepKey = (discovery: Discovery, step: StoryStep) => `${discovery.number}:${step.id}`;
const isStepDone = (discovery: Discovery, step: StoryStep) => completedSteps.has(stepKey(discovery, step));
const isComplete = (discovery: Discovery) => discovery.steps.every((step) => isStepDone(discovery, step));
const maxScore = (discovery: Discovery) => discovery.steps.reduce((total, step) => total + step.reward, 0);
const scoreOf = (discovery: Discovery) => discovery.steps.filter((step) => isStepDone(discovery, step)).reduce((total, step) => total + step.reward, 0);
const totalScore = () => discoveries.reduce((total, discovery) => total + scoreOf(discovery), 0);
const totalMaxScore = discoveries.reduce((total, discovery) => total + maxScore(discovery), 0);
/** Índice da próxima descoberta: as fichas são liberadas em ordem, uma de cada vez. */
const currentIndex = () => { const index = discoveries.findIndex((discovery) => !isComplete(discovery)); return index === -1 ? discoveries.length : index; };
const isUnlocked = (index: number) => index <= currentIndex();
const allComplete = () => currentIndex() >= discoveries.length;

function renderPrologue() {
  prologueEyebrow.textContent = story.prologue.eyebrow;
  prologueTitle.innerHTML = ui().prologueTitle;
  prologuePages.innerHTML = story.prologue.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');
  prologueMission.textContent = story.prologue.mission;
}

const TOTAL_DISCOVERIES = discoveries.length;
const STORAGE_KEY = 'space-historians:progresso:v1';

// Progresso salvo no navegador (sobrevive a recarregar a página no tablet).
// Formato: { "01": ["identity", ...], ..., "_meta": { favorite, epilogueSeen } }
function loadProgress() {
  try {
    // ?reiniciar na URL apaga o progresso (útil para testes e apresentações).
    if (new URLSearchParams(location.search).has('reiniciar')) localStorage.removeItem(STORAGE_KEY);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    for (const discovery of discoveries) {
      const ids = saved[discovery.number];
      if (!Array.isArray(ids)) continue;
      discovery.steps.filter((step) => ids.includes(step.id)).forEach((step) => {
        completedSteps.add(stepKey(discovery, step));
        openedDiscoveries.add(discovery.number);
      });
    }
    const meta = (saved._meta ?? {}) as { favorite?: string; epilogueSeen?: boolean };
    favorite = typeof meta.favorite === 'string' ? meta.favorite : null;
    epilogueSeen = meta.epilogueSeen === true;
  } catch { /* sem armazenamento disponível: segue sem salvar */ }
}

function saveProgress() {
  try {
    const data: Record<string, unknown> = { _meta: { favorite, epilogueSeen } };
    for (const discovery of discoveries) data[discovery.number] = discovery.steps.filter((step) => isStepDone(discovery, step)).map((step) => step.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignora */ }
}

/** "O chão guardou a partida" → "O chão guardou<br><em>a partida.</em>" */
function headline(text: string) {
  const words = text.split(' ');
  const tail = words.length >= 4 ? 2 : 1;
  return `${words.slice(0, -tail).join(' ')}<br /><em>${words.slice(-tail).join(' ')}.</em>`;
}

function updateHud() {
  const index = currentIndex();
  const done = discoveries.filter(isComplete).length;
  hud.archiveCount.textContent = String(done).padStart(2, '0');
  hud.archiveProgress.style.width = `${(done / TOTAL_DISCOVERIES) * 100}%`;
  const objectiveBox = hud.objective.parentElement!.parentElement!;
  if (allComplete()) {
    hud.missionEyebrow.textContent = ui().archiveDoneEyebrow;
    hud.missionTitle.innerHTML = headline(ui().archiveDoneTitle);
    hud.missionTeaser.textContent = story.epilogue.closing;
    hud.objective.textContent = ui().archiveDoneObjective(totalScore());
    objectiveBox.classList.add('done');
  } else {
    const current = discoveries[index];
    hud.missionEyebrow.textContent = ui().missionEyebrow(current.number, current.mission);
    hud.missionTitle.innerHTML = headline(current.subtitle);
    hud.missionTeaser.textContent = current.teaser;
    hud.objective.textContent = justCompleted
      ? ui().justCompleted(justCompleted.number, current.title)
      : current.objective;
    objectiveBox.classList.toggle('done', Boolean(justCompleted));
  }
  renderRoute();
  updateMarkers();
}

function renderRoute() {
  const index = Math.min(currentIndex(), discoveries.length - 1);
  const first = Math.max(0, Math.min(index - 1, discoveries.length - 3));
  hud.route.innerHTML = '';
  discoveries.slice(first, first + 3).forEach((discovery, offset) => {
    const position = first + offset;
    const complete = isComplete(discovery);
    const unlocked = isUnlocked(position);
    const item = document.createElement(complete ? 'button' : 'div');
    item.id = `route-${discovery.number}`;
    item.className = `route-item${complete ? ' done' : unlocked ? ' active' : ''}`;
    const status = complete ? ui().routeDone : unlocked ? ui().routeCurrent : ui().routeLocked;
    item.innerHTML = `<b>${discovery.number}</b><div><strong>${discovery.route.label}</strong><span>${discovery.route.detail} · ${status}</span></div>`;
    if (complete) {
      item.title = ui().rereadCard;
      item.addEventListener('click', () => openCard(discovery));
    }
    hud.route.appendChild(item);
  });
}

function updateMarkers() {
  discoveries.forEach((discovery, index) => {
    rings[index].material = isComplete(discovery) ? doneMat : isUnlocked(index) ? orangeMat : lockedMat;
    labels[index].setEnabled(isUnlocked(index));
  });
}

const ICONS: Record<Discovery['kind'], string> = { alsep: '⌁', surveyor: '△', rover: '⊚', reflector: '▦', 'lm-descent': '⌂', psep: '◫' };

function updateCardScore(discovery: Discovery) {
  knowledgeScore.textContent = ui().points(scoreOf(discovery), maxScore(discovery));
  knowledgeScore.classList.toggle('complete', isComplete(discovery));
}

function renderCard(discovery: Discovery) {
  card.number.textContent = discovery.number;
  card.icon.textContent = ICONS[discovery.kind];
  card.location.textContent = discovery.location.toUpperCase();
  card.eyebrow.textContent = ui().cardEyebrow(discovery.number, String(TOTAL_DISCOVERIES).padStart(2, '0'));
  card.title.textContent = discovery.title;
  card.subtitle.textContent = discovery.subtitle;
  card.mission.textContent = discovery.mission;
  card.year.textContent = discovery.year;
  card.facts.textContent = discovery.facts;
  card.fiction.textContent = discovery.fiction;
  encounterCopy.innerHTML = discovery.encounter.map((paragraph) => `<p>${paragraph}</p>`).join('');
  storyPanel.classList.add('hidden');
  storyPanel.innerHTML = '';
  storyTabs.innerHTML = '';
  discovery.steps.forEach((step) => {
    const tab = document.createElement('button');
    tab.innerHTML = `<span>${ui().tabs[step.id]}</span><small>+${step.reward}</small>`;
    tab.classList.toggle('complete', isStepDone(discovery, step));
    tab.addEventListener('click', () => openStoryStep(discovery, step, tab));
    storyTabs.appendChild(tab);
  });
  updateCardScore(discovery);
  discoveryCard.querySelector('.artifact-copy')?.scrollTo(0, 0);
}

function openStoryStep(discovery: Discovery, step: StoryStep, tab: HTMLButtonElement) {
  storyTabs.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
  tab.classList.add('active');
  storyPanel.classList.remove('hidden');
  const done = isStepDone(discovery, step);
  storyPanel.innerHTML = `
    <p class="story-reward">${ui().reward(done, step.reward)}</p>
    <h3>${step.title}</h3>
    ${step.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}`;
  renderActivity(storyPanel, step.activity, {
    solved: done,
    successText: (earned) => (earned ? `${step.activity.success} ${ui().earned(step.reward)}` : step.activity.success),
    onSolved: () => {
      if (isStepDone(discovery, step)) return;
      completedSteps.add(stepKey(discovery, step));
      tab.classList.add('complete');
      updateCardScore(discovery);
      if (isComplete(discovery)) justCompleted = discovery;
      saveProgress();
      updateHud();
    },
  });
}

loadProgress();
updateHud();

// Abertura: 1) escolha do idioma; 2) prólogo; 3) jogo. O idioma vale para toda a sessão.
const languageStep = byId('language-step');
const prologueStep = byId('prologue-step');
const languageButtons = [...document.querySelectorAll<HTMLButtonElement>('.language-option')];

function applyLanguage(lang: Lang) {
  setLang(lang);
  story = lang === 'en' ? localizeStory(storyEn) : gameStory;
  discoveries = story.discoveries;
  labels.forEach((label) => { label.material?.dispose(true, true); label.dispose(); });
  labels = buildLabels();
  renderPrologue();
  updateHud();
}

function showLanguageStep() {
  prologueStep.classList.add('step-hidden');
  languageStep.classList.remove('step-hidden');
  const suggested = languageButtons.find((button) => button.dataset.lang === languagePreference.lang) ?? languageButtons[0];
  languageButtons.forEach((button) => button.classList.toggle('suggested', button === suggested));
  suggested.focus({ preventScroll: true });
}

function showPrologueStep(lang: Lang) {
  applyLanguage(lang);
  languageStep.classList.add('step-hidden');
  prologueStep.classList.remove('step-hidden');
  startButton.focus({ preventScroll: true });
}

languageButtons.forEach((button) => button.addEventListener('click', () => showPrologueStep(button.dataset.lang as Lang)));
byId('change-language').addEventListener('click', showLanguageStep);
// ?lang=pt ou ?lang=en na URL pula a escolha (útil para links de apresentação).
if (languagePreference.fromUrl) showPrologueStep(languagePreference.lang);
else showLanguageStep();

startButton.addEventListener('click', () => {
  intro.classList.add('hidden');
  gameStarted = true;
  canvas.focus();
});

const DISCOVERY_RADIUS = 7.5;
const CLICK_RADIUS = 14;
let toastTarget: Discovery | null = null;

const isCardOpen = () => !discoveryCard.classList.contains('hidden');
const isEpilogueOpen = () => !epilogue.root.classList.contains('hidden');
const distanceTo = (index: number) => Math.hypot(astronaut.position.x - discoveries[index].position.x, astronaut.position.z - discoveries[index].position.z);

function nearestDiscovery() {
  let best = 0;
  discoveries.forEach((_, index) => { if (distanceTo(index) < distanceTo(best)) best = index; });
  return { index: best, discovery: discoveries[best], distance: distanceTo(best) };
}

function openCard(discovery: Discovery) {
  if (!gameStarted || isCardOpen() || isEpilogueOpen()) return;
  activeDiscovery = discovery;
  openedDiscoveries.add(discovery.number);
  if (justCompleted && justCompleted !== discovery) justCompleted = null;
  keys.clear();
  releaseJoystick();
  renderCard(discovery);
  discoveryToast.classList.add('hidden');
  discoveryCard.classList.remove('hidden');
  storyTabs.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
}

function closeCard() {
  if (!isCardOpen()) return;
  discoveryCard.classList.add('hidden');
  activeDiscovery = null;
  canvas.focus();
  updateHud();
  if (allComplete() && !epilogueSeen) showEpilogue();
}

function showEpilogue() {
  const text = story.epilogue;
  epilogue.eyebrow.textContent = text.eyebrow;
  epilogue.title.innerHTML = headline(text.title);
  epilogue.text.innerHTML = text.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');
  epilogue.score.textContent = ui().epilogueScore(totalScore(), totalMaxScore);
  epilogue.distinction.textContent = text.distinction;
  epilogue.prompt.textContent = text.favoritePrompt;
  epilogue.closing.textContent = text.closing;
  epilogue.favorites.innerHTML = '';
  discoveries.forEach((discovery) => {
    const button = document.createElement('button');
    button.innerHTML = `<b>${discovery.number}</b> ${discovery.title}`;
    button.classList.toggle('selected', favorite === discovery.number);
    button.addEventListener('click', () => {
      favorite = discovery.number;
      epilogue.favorites.querySelectorAll('button').forEach((other) => other.classList.toggle('selected', other === button));
      saveProgress();
    });
    epilogue.favorites.appendChild(button);
  });
  keys.clear();
  releaseJoystick();
  discoveryToast.classList.add('hidden');
  epilogue.root.classList.remove('hidden');
  epilogue.close.focus({ preventScroll: true });
}

function closeEpilogue() {
  if (!isEpilogueOpen()) return;
  epilogue.root.classList.add('hidden');
  epilogueSeen = true;
  saveProgress();
  canvas.focus();
}
epilogue.close.addEventListener('click', closeEpilogue);

// Mostra o aviso sempre que o astronauta está perto de um equipamento,
// permitindo reabrir a ficha quantas vezes quiser.
function updateDiscoveryToast() {
  const { index, discovery, distance } = nearestDiscovery();
  const near = gameStarted && !isCardOpen() && !isEpilogueOpen() && distance < DISCOVERY_RADIUS;
  discoveryToast.classList.toggle('hidden', !near);
  if (!near) { toastTarget = null; return; }
  const unlocked = isUnlocked(index);
  toastTarget = unlocked ? discovery : null;
  toastTitle.textContent = discovery.title;
  investigateButton.classList.toggle('is-hidden', !unlocked);
  if (!unlocked) {
    const next = discoveries[currentIndex()];
    toastEyebrow.textContent = ui().toastLocked;
    toastNote.textContent = ui().toastLockedNote(next.number, next.title);
    return;
  }
  const opened = openedDiscoveries.has(discovery.number);
  toastEyebrow.textContent = opened ? ui().toastArchive : ui().toastFound;
  investigateButton.firstChild!.textContent = opened ? ui().openCard : ui().investigate;
  toastNote.textContent = '';
}

investigateButton.addEventListener('click', () => { if (toastTarget) openCard(toastTarget); });
closeButton.addEventListener('click', closeCard);
// Esc ou clique fora do cartão também fecham a ficha.
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeCard(); closeEpilogue(); } });
discoveryCard.addEventListener('click', (event) => { if (event.target === discoveryCard) closeCard(); });

window.addEventListener('keydown', (event) => {
  if ((event.key === 'e' || event.key === 'E' || event.key === 'Enter') && !isCardOpen() && toastTarget) {
    if (event.key === 'Enter' && document.activeElement instanceof HTMLButtonElement) return;
    openCard(toastTarget);
  }
});

// Clicar ou tocar em um equipamento liberado também abre a ficha.
scene.onPointerObservable.add((info) => {
  if (info.type !== PointerEventTypes.POINTERTAP) return;
  const mesh = info.pickInfo?.pickedMesh;
  if (!mesh) return;
  const index = equipment.findIndex((root) => mesh.isDescendantOf(root));
  if (index >= 0 && isUnlocked(index) && distanceTo(index) < CLICK_RADIUS) openCard(discoveries[index]);
});

const WALK_SPEED = 4.5; // unidades por segundo (equivale ao antigo 0,075 por quadro a 60 fps)

// Entrada de movimento: x = direita/esquerda, z = frente/trás (valores de -1 a 1).
function readMovementInput() {
  const pressed = (...names: string[]) => names.some((name) => keys.has(name));
  const x = (pressed('d', 'arrowright') ? 1 : 0) - (pressed('a', 'arrowleft') ? 1 : 0) + touchInput.x;
  const z = (pressed('w', 'arrowup') ? 1 : 0) - (pressed('s', 'arrowdown') ? 1 : 0) + touchInput.z;
  return new Vector3(Math.max(-1, Math.min(1, x)), 0, Math.max(-1, Math.min(1, z)));
}

function updateGuideArrow() {
  const index = currentIndex();
  const target = discoveries[index];
  const distance = target ? distanceTo(index) : 0;
  const visible = gameStarted && Boolean(target) && distance > DISCOVERY_RADIUS && !isCardOpen();
  guideArrow.setEnabled(visible);
  if (!visible || !target) return;
  const dx = target.position.x - astronaut.position.x;
  const dz = target.position.z - astronaut.position.z;
  const length = Math.hypot(dx, dz);
  guideArrow.position.set(astronaut.position.x + (dx / length) * 2.2, 0.08, astronaut.position.z + (dz / length) * 2.2);
  guideArrow.rotation.y = Math.atan2(dx, dz);
}

scene.onBeforeRenderObservable.add(() => {
  earth.rotation.y += 0.0008;
  const pulse = 1 + Math.sin(performance.now() / 500) * 0.04;
  const next = currentIndex();
  rings.forEach((ring, index) => {
    ring.rotation.y += 0.012;
    ring.scaling.setAll(index === next ? pulse : 1);
  });
  // Céu e área de sombra acompanham o jogador.
  sky.position.set(camera.target.x, 0, camera.target.z);
  sun.position.copyFrom(astronaut.position.add(SUN_OFFSET));
  updateGuideArrow();
  if (!gameStarted || isCardOpen() || isEpilogueOpen()) return;
  // Tempo real entre quadros: a velocidade é a mesma em qualquer computador.
  const dt = Math.min(engine.getDeltaTime() / 1000, 0.1);
  const input = readMovementInput();
  if (input.lengthSquared() > 0) {
    // Direção relativa à câmera: "frente" é sempre para onde a câmera olha.
    const forward = camera.target.subtract(camera.position);
    forward.y = 0;
    forward.normalize();
    const right = Vector3.Cross(Vector3.Up(), forward);
    const direction = right.scale(input.x).add(forward.scale(input.z));
    if (direction.lengthSquared() > 1) direction.normalize();
    astronaut.position.addInPlace(direction.scale(WALK_SPEED * dt));
    resolveCollisions(astronaut.position);
    astronaut.position.y = Math.abs(Math.sin(performance.now() / 115)) * 0.055;
    astronaut.position.x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, astronaut.position.x));
    astronaut.position.z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, astronaut.position.z));
    // O modelo Poly considera o eixo frontal oposto ao usado pela movimentação.
    astronaut.rotation.y = Math.atan2(direction.x, direction.z) + Math.PI;
  } else {
    astronaut.position.y *= 0.82;
  }
  // A câmera acompanha o astronauta o tempo todo, de forma suave.
  const follow = 1 - Math.exp(-dt * 4);
  camera.target.copyFrom(Vector3.Lerp(camera.target, astronaut.position.add(new Vector3(0, 1.5, 0)), follow));
  updateDiscoveryToast();
});

engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());

// Gancho de depuração para testes automatizados (somente em desenvolvimento).
if (import.meta.env.DEV) {
  (window as unknown as { __game: unknown }).__game = {
    scene, camera, astronaut, station, landingSite, equipment,
    get story() { return story; },
    /** Coloca o astronauta diante de um equipamento (índice 0–11). */
    teleport(index: number, distance = 5) {
      const target = discoveries[index].position;
      astronaut.position.set(target.x, 0, target.z + distance);
      camera.alpha = Math.PI / 2;
      camera.target.copyFrom(astronaut.position.add(new Vector3(0, 1.5, 0)));
    },
  };
}
