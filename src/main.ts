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
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import './style.css';
import { gameStory, type StoryStep } from './story-data';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;

// Sem WebGL o jogo não roda: mostra uma orientação em vez de uma tela quebrada.
function hasWebGL() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}
if (!hasWebGL()) {
  document.querySelector<HTMLElement>('#intro')?.classList.add('hidden');
  document.querySelector<HTMLElement>('#no-webgl')!.hidden = false;
  throw new Error('WebGL indisponível: o jogo 3D não pode ser iniciado.');
}
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
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

const ground = MeshBuilder.CreateGround('lunar-surface', { width: 70, height: 70, subdivisions: 2 }, scene);
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

const starMat = material('stars', Color3.White(), new Color3(1, 0.9, 0.78));
for (let i = 0; i < 170; i += 1) {
  const star = MeshBuilder.CreateSphere(`star-${i}`, { diameter: 0.045 + (i % 5) * 0.018, segments: 4 }, scene);
  const angle = i * 2.399;
  const distance = 28 + (i % 9);
  star.position.set(Math.cos(angle) * distance, 5 + ((i * 19) % 20), Math.sin(angle) * distance);
  star.material = starMat;
}

const earthMat = material('earth', new Color3(0.13, 0.4, 0.9), new Color3(0.035, 0.14, 0.32));
const earth = MeshBuilder.CreateSphere('earth', { diameter: 4.4, segments: 48 }, scene);
earth.position.set(10, 16, -24);
earth.material = earthMat;
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

// Representação simplificada do ALSEP: central com antena, ligada por cabos
// a instrumentos espalhados no solo (sismômetro e outros sensores).
function buildLunarStation() {
  const root = new TransformNode('apollo-12-station', scene);
  root.position.set(1.8, 0, -6.5);
  const central = box('alsep-central', { width: 1.5, height: 0.7, depth: 1 }, new Vector3(0, 0.55, 0), goldMat, root);
  central.receiveShadows = true;
  box('alsep-sunshade', { width: 1.7, height: 0.06, depth: 1.2 }, new Vector3(0, 1.05, 0), metalMat, root);
  [-0.6, 0.6].forEach((x) => box(`alsep-leg-${x}`, { width: 0.08, height: 0.3, depth: 0.08 }, new Vector3(x, 0.15, 0), metalMat, root));
  box('station-panel', { width: 1, height: 0.35, depth: 0.05 }, new Vector3(0, 0.55, -0.52), orangeMat, root);

  const mast = MeshBuilder.CreateCylinder('antenna-mast', { diameter: 0.07, height: 1.6 }, scene);
  mast.parent = root;
  mast.position.set(0.45, 1.85, 0.2);
  mast.material = metalMat;
  shadows.addShadowCaster(mast);
  const dish = MeshBuilder.CreateCylinder('antenna-dish', { diameterTop: 0.9, diameterBottom: 0.12, height: 0.28, tessellation: 24 }, scene);
  dish.parent = root;
  dish.position.set(0.45, 2.7, 0.2);
  dish.rotation.x = -0.7;
  dish.material = metalMat;
  shadows.addShadowCaster(dish);
  const beacon = MeshBuilder.CreateSphere('beacon', { diameter: 0.22 }, scene);
  beacon.parent = root;
  beacon.position.set(0.45, 2.95, 0.05);
  beacon.material = orangeMat;

  // Instrumentos ligados por cabos à central.
  const instruments = [
    { name: 'sismometro', at: new Vector3(-2.4, 0, -1.4), shape: 'dome' },
    { name: 'magnetometro', at: new Vector3(2.5, 0, -1.1), shape: 'box' },
    { name: 'rtg', at: new Vector3(-1.9, 0, 1.6), shape: 'cyl' },
  ];
  for (const instrument of instruments) {
    if (instrument.shape === 'dome') {
      const dome = MeshBuilder.CreateSphere(`alsep-${instrument.name}`, { diameter: 0.75, slice: 0.5 }, scene);
      dome.parent = root;
      dome.position.copyFrom(instrument.at);
      dome.material = goldMat;
      shadows.addShadowCaster(dome);
    } else if (instrument.shape === 'box') {
      box(`alsep-${instrument.name}`, { width: 0.5, height: 0.5, depth: 0.5 }, instrument.at.add(new Vector3(0, 0.25, 0)), metalMat, root);
    } else {
      const cyl = MeshBuilder.CreateCylinder(`alsep-${instrument.name}`, { diameter: 0.45, height: 0.7, tessellation: 16 }, scene);
      cyl.parent = root;
      cyl.position.copyFrom(instrument.at.add(new Vector3(0, 0.35, 0)));
      cyl.material = metalMat;
      shadows.addShadowCaster(cyl);
    }
    addObstacle(root.position.x + instrument.at.x, root.position.z + instrument.at.z, 0.35);
    const cable = MeshBuilder.CreateTube(`alsep-cabo-${instrument.name}`, { path: [new Vector3(0, 0.03, 0), instrument.at.add(new Vector3(0, 0.03, 0))], radius: 0.025 }, scene);
    cable.parent = root;
    cable.material = darkDust;
  }
  addObstacle(root.position.x, root.position.z, 0.95);
  return root;
}

const astronaut = buildAstronaut();
// copyFrom mantém ângulo e distância; atribuir camera.target recalcularia o ângulo com a câmera parada.
camera.target.copyFrom(astronaut.position.add(new Vector3(0, 1.5, 0)));
const proceduralAstronautParts = astronaut.getChildren().slice();
const station = buildLunarStation();
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

const discoveryRing = MeshBuilder.CreateTorus('discovery-ring', { diameter: 6.6, thickness: 0.06, tessellation: 64 }, scene);
discoveryRing.position.set(station.position.x, 0.12, station.position.z);
discoveryRing.material = orangeMat;

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
let gameStarted = false;
let found = false;
const completedSteps = new Set<string>();

prologueEyebrow.textContent = gameStory.prologue.eyebrow;
prologueTitle.innerHTML = `As histórias que<br /><em>ficaram na Lua.</em>`;
prologuePages.innerHTML = gameStory.prologue.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');
prologueMission.textContent = gameStory.prologue.mission;
encounterCopy.innerHTML = gameStory.firstDiscovery.encounter.map((paragraph) => `<p>${paragraph}</p>`).join('');

const TOTAL_DISCOVERIES = 12;
const STORAGE_KEY = 'space-historians:progresso:v1';
const archiveCount = document.querySelector<HTMLElement>('#archive-count')!;
const archiveProgress = document.querySelector<HTMLElement>('#archive-progress')!;
const objectiveText = document.querySelector<HTMLElement>('#objective-text')!;
const routeFirst = document.querySelector<HTMLElement>('#route-01')!;

// Progresso salvo no navegador (sobrevive a recarregar a página no tablet).
function loadProgress() {
  try {
    // ?reiniciar na URL apaga o progresso (útil para testes e apresentações).
    if (new URLSearchParams(location.search).has('reiniciar')) localStorage.removeItem(STORAGE_KEY);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string[]>;
    const validIds = new Set<string>(gameStory.firstDiscovery.steps.map((step) => step.id));
    (saved[gameStory.firstDiscovery.number] ?? []).filter((id) => validIds.has(id)).forEach((id) => completedSteps.add(id));
  } catch { /* sem armazenamento disponível: segue sem salvar */ }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ [gameStory.firstDiscovery.number]: [...completedSteps] }));
  } catch { /* ignora */ }
}

function updateKnowledgeScore() {
  const steps = gameStory.firstDiscovery.steps;
  const maxScore = steps.reduce((total, step) => total + step.reward, 0);
  const score = steps
    .filter((step) => completedSteps.has(step.id))
    .reduce((total, step) => total + step.reward, 0);
  knowledgeScore.textContent = `${score} / ${maxScore} PONTOS`;

  const complete = steps.every((step) => completedSteps.has(step.id));
  knowledgeScore.classList.toggle('complete', complete);
  const completedDiscoveries = complete ? 1 : 0;
  archiveCount.textContent = String(completedDiscoveries).padStart(2, '0');
  archiveProgress.style.width = `${(completedDiscoveries / TOTAL_DISCOVERIES) * 100}%`;
  routeFirst.classList.toggle('done', complete);
  routeFirst.querySelector('span')!.textContent = complete ? `${gameStory.firstDiscovery.mission} · concluído ✓` : `${gameStory.firstDiscovery.mission} · atual`;
  objectiveText.textContent = complete ? `Ficha ${gameStory.firstDiscovery.number} concluída · ${maxScore} pontos` : 'Encontre a estação lunar';
  objectiveText.parentElement!.parentElement!.classList.toggle('done', complete);
  saveProgress();
}

function openStoryStep(step: StoryStep, tab: HTMLButtonElement) {
  storyTabs.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
  tab.classList.add('active');
  storyPanel.classList.remove('hidden');
  const done = completedSteps.has(step.id);
  storyPanel.innerHTML = `
    <p class="story-reward">${done ? '✓ ' : '+'}${step.reward} PONTOS</p>
    <h3>${step.title}</h3>
    ${step.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}
    <div class="story-activity">
      <strong>${step.activity.prompt}</strong>
      <div class="story-options">${step.activity.options.map((option, index) => `<button data-option="${index}">${option}</button>`).join('')}</div>
      <p class="activity-feedback" aria-live="polite"></p>
    </div>`;

  const feedback = storyPanel.querySelector<HTMLElement>('.activity-feedback')!;
  const options = [...storyPanel.querySelectorAll<HTMLButtonElement>('[data-option]')];

  // Depois do acerto, a atividade fica travada mostrando a resposta certa.
  const lockAsSolved = (earned: boolean) => {
    options.forEach((button) => {
      button.disabled = true;
      button.classList.toggle('correct', Number(button.dataset.option) === step.activity.correct);
      button.classList.remove('wrong');
    });
    feedback.textContent = earned ? `${step.activity.success} +${step.reward} pontos.` : step.activity.success;
    feedback.className = 'activity-feedback success';
  };

  if (done) {
    lockAsSolved(false);
    return;
  }

  options.forEach((option) => {
    option.addEventListener('click', () => {
      if (Number(option.dataset.option) !== step.activity.correct) {
        option.classList.add('wrong');
        feedback.textContent = step.activity.hint ?? 'Quase! Observe as pistas e tente novamente.';
        feedback.className = 'activity-feedback try-again';
        return;
      }
      completedSteps.add(step.id);
      tab.classList.add('complete');
      lockAsSolved(true);
      updateKnowledgeScore();
    });
  });
}

loadProgress();
gameStory.firstDiscovery.steps.forEach((step) => {
  const tab = document.createElement('button');
  tab.innerHTML = `<span>${step.label}</span><small>+${step.reward}</small>`;
  tab.classList.toggle('complete', completedSteps.has(step.id));
  tab.addEventListener('click', () => openStoryStep(step, tab));
  storyTabs.appendChild(tab);
});
if (completedSteps.size > 0) found = true;
updateKnowledgeScore();

startButton.addEventListener('click', () => {
  intro.classList.add('hidden');
  gameStarted = true;
  canvas.focus();
});

const DISCOVERY_RADIUS = 7.5;
const CLICK_RADIUS = 14;
const toastEyebrow = document.querySelector<HTMLElement>('#toast-eyebrow')!;
const toastTitle = document.querySelector<HTMLElement>('#toast-title')!;
toastTitle.textContent = gameStory.firstDiscovery.title;

const isCardOpen = () => !discoveryCard.classList.contains('hidden');
const distanceToStation = () => Vector3.Distance(astronaut.position, station.position);

function openCard() {
  if (!gameStarted || isCardOpen()) return;
  found = true;
  keys.clear();
  releaseJoystick();
  discoveryToast.classList.add('hidden');
  discoveryCard.classList.remove('hidden');
  storyTabs.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
}

function closeCard() {
  if (!isCardOpen()) return;
  discoveryCard.classList.add('hidden');
  canvas.focus();
}

// Mostra o aviso sempre que o astronauta está perto do equipamento,
// permitindo reabrir a ficha quantas vezes quiser.
function updateDiscoveryToast() {
  const near = gameStarted && !isCardOpen() && distanceToStation() < DISCOVERY_RADIUS;
  if (near && found) {
    toastEyebrow.textContent = 'FICHA DO ARQUIVO';
    investigateButton.firstChild!.textContent = 'ABRIR FICHA ';
  }
  discoveryToast.classList.toggle('hidden', !near);
}

investigateButton.addEventListener('click', openCard);
closeButton.addEventListener('click', closeCard);
// Esc ou clique fora do cartão também fecham a ficha.
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCard(); });
discoveryCard.addEventListener('click', (event) => { if (event.target === discoveryCard) closeCard(); });

window.addEventListener('keydown', (event) => {
  if ((event.key === 'e' || event.key === 'E' || event.key === 'Enter') && !isCardOpen() && distanceToStation() < DISCOVERY_RADIUS) {
    if (event.key === 'Enter' && document.activeElement instanceof HTMLButtonElement) return;
    openCard();
  }
});

// Clicar ou tocar no equipamento também abre a ficha.
scene.onPointerObservable.add((info) => {
  if (info.type !== PointerEventTypes.POINTERTAP) return;
  const mesh = info.pickInfo?.pickedMesh;
  if (mesh && mesh.isDescendantOf(station) && distanceToStation() < CLICK_RADIUS) openCard();
});

const WALK_SPEED = 4.5; // unidades por segundo (equivale ao antigo 0,075 por quadro a 60 fps)

// Entrada de movimento: x = direita/esquerda, z = frente/trás (valores de -1 a 1).
function readMovementInput() {
  const pressed = (...names: string[]) => names.some((name) => keys.has(name));
  const x = (pressed('d', 'arrowright') ? 1 : 0) - (pressed('a', 'arrowleft') ? 1 : 0) + touchInput.x;
  const z = (pressed('w', 'arrowup') ? 1 : 0) - (pressed('s', 'arrowdown') ? 1 : 0) + touchInput.z;
  return new Vector3(Math.max(-1, Math.min(1, x)), 0, Math.max(-1, Math.min(1, z)));
}

scene.onBeforeRenderObservable.add(() => {
  earth.rotation.y += 0.0008;
  discoveryRing.rotation.y += 0.012;
  discoveryRing.scaling.setAll(1 + Math.sin(performance.now() / 500) * 0.04);
  if (!gameStarted || !discoveryCard.classList.contains('hidden')) return;
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
    astronaut.position.x = Math.max(-25, Math.min(25, astronaut.position.x));
    astronaut.position.z = Math.max(-25, Math.min(25, astronaut.position.z));
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
  (window as unknown as { __game: unknown }).__game = { scene, camera, astronaut, station, landingSite };
}
