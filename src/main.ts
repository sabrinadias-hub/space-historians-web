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
  VertexBuffer,
  WebGPUEngine,
  type AbstractEngine,
  type Mesh,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import './style.css';
import { gameStory, localizeStory, type Discovery, type GameStory, type StoryStep } from './story-data';
import { storyEn } from './story-data.en';
import { getLang, preferredLang, setLang, ui, type Lang } from './i18n';
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
// Relevo só fora da área jogável (além de MAP_LIMIT): colinas emolduram o mapa
// sem tirar do chão os equipamentos, crateras, rochas e colisões, que ficam em y = 0.
function terrainHeight(x: number, z: number) {
  const fade = Math.min(1, Math.max(0, (Math.max(Math.abs(x), Math.abs(z)) - (MAP_LIMIT + 2)) / 8));
  return fade * (1.6 + Math.sin(x * 0.18) * Math.cos(z * 0.16) * 0.9 + Math.sin(x * 0.05 + z * 0.08) * 0.8);
}

const ground = MeshBuilder.CreateGround('lunar-surface', { width: 150, height: 150, subdivisions: 120, updatable: true }, scene);
const groundPositions = ground.getVerticesData(VertexBuffer.PositionKind)!;
for (let i = 0; i < groundPositions.length; i += 3) {
  groundPositions[i + 1] = terrainHeight(groundPositions[i], groundPositions[i + 2]);
}
ground.updateVerticesData(VertexBuffer.PositionKind, groundPositions);
ground.createNormals(false);
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
  const limbs: Record<'arms' | 'legs', Mesh[]> = { arms: [], legs: [] };
  [-0.7, 0.7].forEach((x) => {
    const arm = MeshBuilder.CreateCapsule(`arm-${x}`, { height: 1.25, radius: 0.19 }, scene);
    arm.parent = root;
    arm.position.set(x, 1.7, 0);
    arm.rotation.z = x > 0 ? -0.16 : 0.16;
    arm.material = whiteSuit;
    // Pivô no ombro / quadril: o membro balança como uma articulação.
    arm.setPivotPoint(new Vector3(0, 0.62, 0));
    shadows.addShadowCaster(arm);
    const leg = MeshBuilder.CreateCapsule(`leg-${x}`, { height: 1.2, radius: 0.24 }, scene);
    leg.parent = root;
    leg.position.set(x * 0.48, 0.63, 0);
    leg.material = whiteSuit;
    leg.setPivotPoint(new Vector3(0, 0.6, 0));
    shadows.addShadowCaster(leg);
    // A bota é filha da perna, para acompanhar o passo.
    box(`boot-${x}`, { width: 0.48, height: 0.25, depth: 0.68 }, new Vector3(0, -0.48, -0.12), metalMat, leg);
    limbs.arms.push(arm);
    limbs.legs.push(leg);
  });
  box('chest-panel', { width: 0.65, height: 0.45, depth: 0.12 }, new Vector3(0, 1.78, -0.53), metalMat, root);
  return { root, limbs };
}

const { root: astronaut, limbs: astronautLimbs } = buildAstronaut();
// copyFrom mantém ângulo e distância; atribuir camera.target recalcularia o ângulo com a câmera parada.
camera.target.copyFrom(astronaut.position.add(new Vector3(0, 1.5, 0)));

const proceduralAstronautParts = astronaut.getChildren().slice();

// Ciclo de caminhada. O personagem visível é o modelo Poly (malha única, sem esqueleto), então a animação
// é do corpo inteiro: quique a cada passo, leve inclinação para a frente e balanço lateral.
// Os membros do astronauta procedural também balançam, caso ele apareça como reserva (GLB não carregou).
let walkPhase = 0;
function animateWalk(dt: number, effort: number) {
  walkPhase += dt * 8 * effort;
  const swing = Math.sin(walkPhase);
  astronaut.position.y = Math.abs(Math.cos(walkPhase)) * 0.12 * effort;
  // O visor aponta para -Z local: inclinar para a frente é girar x no sentido negativo.
  astronaut.rotation.x = -0.09 * effort;
  astronaut.rotation.z = swing * 0.06 * effort;
  const [leftLeg, rightLeg] = astronautLimbs.legs;
  const [leftArm, rightArm] = astronautLimbs.arms;
  leftLeg.rotation.x = swing * 0.65;
  rightLeg.rotation.x = -swing * 0.65;
  leftArm.rotation.x = -swing * 0.5;
  rightArm.rotation.x = swing * 0.5;
}

function relaxPose() {
  for (const limb of [...astronautLimbs.arms, ...astronautLimbs.legs]) limb.rotation.x *= 0.8;
  astronaut.position.y *= 0.82;
  astronaut.rotation.x *= 0.82;
  astronaut.rotation.z *= 0.82;
}
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

// Marcadores no chão: laranja = destino escolhido, verde = concluída, azul-claro = disponível.
const doneMat = material('ring-done', new Color3(0.2, 0.8, 0.55), new Color3(0.1, 0.45, 0.3));
const availableMat = material('ring-available', new Color3(0.55, 0.68, 1), new Color3(0.12, 0.17, 0.35));
const rings = discoveries.map((discovery) => {
  const ring = MeshBuilder.CreateTorus(`discovery-ring-${discovery.number}`, { diameter: discovery.kind === 'alsep' ? 6.6 : 5.6, thickness: 0.06, tessellation: 64 }, scene);
  ring.position.set(discovery.position.x, 0.12, discovery.position.z);
  ring.material = availableMat;
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
const encounterCopy = document.querySelector<HTMLElement>('#encounter-copy')!;
const storyTabs = document.querySelector<HTMLElement>('#story-tabs')!;
const storyPanel = document.querySelector<HTMLElement>('#story-panel')!;
const knowledgeScore = document.querySelector<HTMLElement>('#knowledge-score')!;
const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const card = {
  number: byId('card-number'), icon: byId('card-icon'), location: byId('card-location'), eyebrow: byId('card-eyebrow'),
  title: byId('card-title'), subtitle: byId('card-subtitle'), mission: byId('card-mission'), year: byId('card-year'),
  facts: byId('card-facts'), fiction: byId('card-fiction'), badge: byId('card-badge'),
  photo: byId<HTMLImageElement>('card-photo'), photoFallback: byId('card-photo-fallback'), photoCredit: byId('card-photo-credit'),
  quiz: byId<HTMLDetailsElement>('bonus-quiz'), quizBody: byId('quiz-body'), quizStatus: byId('quiz-status'),
};
const hud = {
  missionEyebrow: byId('mission-eyebrow'), missionTitle: byId('mission-title'), missionTeaser: byId('mission-teaser'),
  objective: byId('objective-text'), route: byId('route-list'), archiveCount: byId('archive-count'), archiveProgress: byId('archive-progress'),
  knowledge: byId('hud-knowledge'), bonus: byId('hud-bonus'),
};
const epilogue = {
  root: byId('epilogue'), eyebrow: byId('epilogue-eyebrow'), title: byId('epilogue-title'), text: byId('epilogue-text'),
  score: byId('epilogue-score'), bonus: byId('epilogue-bonus'), total: byId('epilogue-total'),
  distinction: byId('epilogue-distinction'), prompt: byId('epilogue-favorite-prompt'),
  favorites: byId('epilogue-favorites'), closing: byId('epilogue-closing'), close: byId<HTMLButtonElement>('epilogue-close'),
};
const backpack = {
  root: byId('backpack'), open: byId<HTMLButtonElement>('backpack-button'), close: byId<HTMLButtonElement>('backpack-close'),
  name: byId('backpack-title'), nameView: byId('backpack-name-view'), nameForm: byId<HTMLFormElement>('backpack-name-form'),
  nameInput: byId<HTMLInputElement>('backpack-name-input'), nameError: byId('backpack-name-error'),
  edit: byId<HTMLButtonElement>('edit-name'), cancel: byId<HTMLButtonElement>('cancel-name'),
  knowledge: byId('backpack-knowledge'), bonus: byId('backpack-bonus'), grid: byId('badge-grid'),
};
const toastEyebrow = byId('toast-eyebrow');
const toastTitle = byId('toast-title');
const toastNote = byId('toast-note');

/** Ficha aberta no momento (número), para redesenhá-la ao trocar de idioma. */
let activeCardNumber: string | null = null;

const isCardOpen = () => !discoveryCard.classList.contains('hidden');
const isEpilogueOpen = () => !epilogue.root.classList.contains('hidden');
const isBackpackOpen = () => !backpack.root.classList.contains('hidden');
const isModalOpen = () => isCardOpen() || isEpilogueOpen() || isBackpackOpen();

let gameStarted = false;
/** Etapas concluídas, no formato "número:etapa" (ex.: "01:identity"). */
const completedSteps = new Set<string>();
const openedDiscoveries = new Set<string>();
/** Quizzes bônus acertados (número da descoberta). Guardados à parte do conhecimento. */
const completedQuizzes = new Set<string>();
/** Badges concedidos (número da descoberta): ganhos ao concluir as três camadas, uma única vez. */
const earnedBadges = new Set<string>();
let playerName = '';
/** Destino escolhido pelo jogador (número da descoberta) ou null: a exploração é livre. */
let activeDestination: string | null = null;
let justCompleted: Discovery | null = null;
let favorite: string | null = null;
let epilogueSeen = false;

const QUIZ_BONUS = 10;
const stepKey = (discovery: Discovery, step: StoryStep) => `${discovery.number}:${step.id}`;
const isStepDone = (discovery: Discovery, step: StoryStep) => completedSteps.has(stepKey(discovery, step));
const stepsDone = (discovery: Discovery) => discovery.steps.filter((step) => isStepDone(discovery, step)).length;
const isComplete = (discovery: Discovery) => discovery.steps.every((step) => isStepDone(discovery, step));
const maxScore = (discovery: Discovery) => discovery.steps.reduce((total, step) => total + step.reward, 0);
const scoreOf = (discovery: Discovery) => discovery.steps.filter((step) => isStepDone(discovery, step)).reduce((total, step) => total + step.reward, 0);
const knowledgeTotal = () => discoveries.reduce((total, discovery) => total + scoreOf(discovery), 0);
const knowledgeMax = discoveries.reduce((total, discovery) => total + maxScore(discovery), 0);
const bonusTotal = () => discoveries.filter((discovery) => completedQuizzes.has(discovery.number)).length * QUIZ_BONUS;
const bonusMax = discoveries.length * QUIZ_BONUS;
const allComplete = () => discoveries.every(isComplete);
type DiscoveryState = 'new' | 'progress' | 'done';
const stateOf = (discovery: Discovery): DiscoveryState =>
  isComplete(discovery) ? 'done' : stepsDone(discovery) > 0 || openedDiscoveries.has(discovery.number) || completedQuizzes.has(discovery.number) ? 'progress' : 'new';
const findDiscovery = (number: string | null) => discoveries.find((discovery) => discovery.number === number) ?? null;
/** Próxima descoberta não concluída na ordem recomendada, a partir de uma posição. */
function nextRecommended(after = -1) {
  for (let offset = 1; offset <= discoveries.length; offset += 1) {
    const candidate = discoveries[(after + offset + discoveries.length) % discoveries.length];
    if (!isComplete(candidate)) return candidate;
  }
  return null;
}

// Nome do explorador: obrigatório, 2 a 24 caracteres, sem espaços nas pontas.
const NAME_MIN = 2;
const NAME_MAX = 24;
const cleanName = (value: string) => value.trim();
const isValidName = (value: string) => cleanName(value).length >= NAME_MIN && cleanName(value).length <= NAME_MAX;

// Prólogo em páginas curtas, avançando por botão ou teclado (← →).
const prologueEyebrow = byId('prologue-eyebrow');
const prologueTitle = byId('prologue-title');
const prologuePage = byId('prologue-page');
const prologueDots = byId('prologue-dots');
const prologueBack = byId<HTMLButtonElement>('prologue-back');
const prologueNext = byId<HTMLButtonElement>('prologue-next');
let prologueIndex = 0;

function renderPrologue() {
  const { pages } = story.prologue;
  prologueIndex = Math.max(0, Math.min(prologueIndex, pages.length - 1));
  const page = pages[prologueIndex];
  const last = prologueIndex === pages.length - 1;
  prologueEyebrow.textContent = story.prologue.eyebrow;
  prologueTitle.textContent = story.prologue.title;
  prologuePage.innerHTML = page.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')
    + (page.quote ? `<blockquote>“${page.quote}”</blockquote>` : '');
  prologueDots.innerHTML = pages.map((_, index) => `<i class="${index === prologueIndex ? 'current' : ''}"></i>`).join('');
  prologueDots.setAttribute('aria-label', ui().prologuePage(prologueIndex + 1, pages.length));
  prologueBack.classList.toggle('is-invisible', prologueIndex === 0);
  prologueNext.classList.toggle('step-hidden', last);
  startButton.classList.toggle('step-hidden', !last);
}

function goToProloguePage(index: number) {
  prologueIndex = index;
  renderPrologue();
  const last = prologueIndex === story.prologue.pages.length - 1;
  (last ? startButton : prologueNext).focus({ preventScroll: true });
}

// Progresso salvo no navegador, em uma única chave versionada.
const STORAGE_KEY = 'space-historians:progress:v2';
const LEGACY_KEY = 'space-historians:progresso:v1';
const LEGACY_NAME_KEY = 'space-historians:nome';

type SavedProgress = {
  version: 2;
  playerName: string;
  selectedLanguage: Lang;
  activeDestination: string | null;
  completedSteps: Record<string, string[]>;
  completedQuizzes: string[];
  earnedBadges: string[];
  favoriteDiscovery: string | null;
  epilogueSeen: boolean;
};

function restoreSteps(source: Record<string, unknown>) {
  for (const discovery of discoveries) {
    const ids = source[discovery.number];
    if (!Array.isArray(ids)) continue;
    discovery.steps.filter((step) => ids.includes(step.id)).forEach((step) => {
      completedSteps.add(stepKey(discovery, step));
      openedDiscoveries.add(discovery.number);
    });
  }
}

function loadProgress() {
  try {
    // ?reiniciar na URL apaga nome, pontos, etapas, quizzes, badges, destino e favorita.
    if (new URLSearchParams(location.search).has('reiniciar')) {
      [STORAGE_KEY, LEGACY_KEY, LEGACY_NAME_KEY].forEach((key) => localStorage.removeItem(key));
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<SavedProgress>;
      if (saved.version !== 2) return;
      playerName = typeof saved.playerName === 'string' && isValidName(saved.playerName) ? cleanName(saved.playerName) : '';
      restoreSteps((saved.completedSteps ?? {}) as Record<string, unknown>);
      const known = new Set(discoveries.map((discovery) => discovery.number));
      (saved.completedQuizzes ?? []).filter((number) => known.has(number)).forEach((number) => { completedQuizzes.add(number); openedDiscoveries.add(number); });
      activeDestination = saved.activeDestination && known.has(saved.activeDestination) ? saved.activeDestination : null;
      favorite = saved.favoriteDiscovery && known.has(saved.favoriteDiscovery) ? saved.favoriteDiscovery : null;
      epilogueSeen = saved.epilogueSeen === true;
    } else {
      // Migração da v1 ({ "01": ["identity", ...], _meta: { favorite, epilogueSeen } }): etapas e favorita são mantidas.
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const saved = JSON.parse(legacy) as Record<string, unknown>;
        restoreSteps(saved);
        const meta = (saved._meta ?? {}) as { favorite?: string; epilogueSeen?: boolean };
        favorite = typeof meta.favorite === 'string' ? meta.favorite : null;
        epilogueSeen = meta.epilogueSeen === true;
      }
      const legacyName = localStorage.getItem(LEGACY_NAME_KEY) ?? '';
      if (isValidName(legacyName)) playerName = cleanName(legacyName);
    }
    // O badge acompanha a conclusão das três camadas (nunca é concedido duas vezes: é um conjunto).
    discoveries.filter(isComplete).forEach((discovery) => earnedBadges.add(discovery.number));
  } catch { /* sem armazenamento disponível: segue sem salvar */ }
}

function saveProgress() {
  try {
    const steps: Record<string, string[]> = {};
    for (const discovery of discoveries) {
      const ids = discovery.steps.filter((step) => isStepDone(discovery, step)).map((step) => step.id);
      if (ids.length) steps[discovery.number] = ids;
    }
    const data: SavedProgress = {
      version: 2,
      playerName,
      selectedLanguage: getLang(),
      activeDestination,
      completedSteps: steps,
      completedQuizzes: [...completedQuizzes].sort(),
      earnedBadges: [...earnedBadges].sort(),
      favoriteDiscovery: favorite,
      epilogueSeen,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem(LEGACY_NAME_KEY);
  } catch { /* ignora */ }
}

/** "O chão guardou a partida" → "O chão guardou<br><em>a partida.</em>" */
function headline(text: string) {
  const words = text.split(' ');
  const tail = words.length >= 4 ? 2 : 1;
  return `${words.slice(0, -tail).join(' ')}<br /><em>${words.slice(-tail).join(' ')}.</em>`;
}

function updateScores() {
  const knowledge = ui().epilogueScore(knowledgeTotal(), knowledgeMax);
  const bonus = ui().epilogueScore(bonusTotal(), bonusMax);
  hud.knowledge.textContent = knowledge;
  hud.bonus.textContent = bonus;
  backpack.knowledge.textContent = knowledge;
  backpack.bonus.textContent = bonus;
}

function updateHud() {
  const done = discoveries.filter(isComplete).length;
  hud.archiveCount.textContent = String(done).padStart(2, '0');
  hud.archiveProgress.style.width = `${(done / discoveries.length) * 100}%`;
  updateScores();
  const objectiveBox = hud.objective.parentElement!.parentElement!;
  const target = findDiscovery(activeDestination);
  if (allComplete()) {
    hud.missionEyebrow.textContent = ui().archiveDoneEyebrow;
    hud.missionTitle.innerHTML = headline(ui().archiveDoneTitle);
    hud.missionTeaser.textContent = story.epilogue.closing;
    hud.objective.textContent = ui().archiveDoneObjective(knowledgeTotal() + bonusTotal());
    objectiveBox.classList.add('done');
  } else if (target) {
    hud.missionEyebrow.textContent = ui().missionEyebrow(target.number, target.mission);
    hud.missionTitle.innerHTML = headline(target.subtitle);
    hud.missionTeaser.textContent = target.teaser;
    hud.objective.textContent = justCompleted ? ui().justCompleted(justCompleted.number, target.title) : target.objective;
    objectiveBox.classList.toggle('done', Boolean(justCompleted));
  } else {
    hud.missionEyebrow.textContent = ui().freeEyebrow;
    hud.missionTitle.innerHTML = headline(ui().freeTitle);
    hud.missionTeaser.textContent = playerName ? ui().welcome(playerName) : '';
    hud.objective.textContent = ui().freeObjective;
    objectiveBox.classList.remove('done');
  }
  renderRoute();
  updateMarkers();
  if (isBackpackOpen()) renderBackpack();
}

function setDestination(discovery: Discovery | null) {
  activeDestination = discovery?.number ?? null;
  justCompleted = null;
  saveProgress();
  updateHud();
}

const routeStatus = (discovery: Discovery) => ({ new: ui().routeNew, progress: ui().routeProgress, done: ui().routeDone })[stateOf(discovery)];

function renderRoute() {
  hud.route.innerHTML = '';
  discoveries.forEach((discovery) => {
    const item = document.createElement('button');
    const active = discovery.number === activeDestination;
    item.id = `route-${discovery.number}`;
    item.className = `route-item state-${stateOf(discovery)}${active ? ' active' : ''}`;
    item.title = ui().setDestination;
    item.setAttribute('aria-pressed', String(active));
    item.innerHTML = `<b>${discovery.number}</b><div><strong>${discovery.route.label}</strong><span>${discovery.route.detail} · ${active ? `${ui().routeActive} · ` : ''}${routeStatus(discovery)}</span></div>`;
    item.addEventListener('click', () => setDestination(discovery));
    hud.route.appendChild(item);
  });
  hud.route.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
}

function updateMarkers() {
  discoveries.forEach((discovery, index) => {
    rings[index].material = isComplete(discovery) ? doneMat : discovery.number === activeDestination ? orangeMat : availableMat;
    labels[index].setEnabled(true);
  });
}

const ICONS: Record<Discovery['kind'], string> = { alsep: '⌁', surveyor: '△', rover: '⊚', reflector: '▦', 'lm-descent': '⌂', psep: '◫' };

/** Badge gerado pelo jogo: número, ícone da categoria, nome, missão, estado e estrela do bônus. */
function buildBadge(discovery: Discovery, tag: 'button' | 'div' = 'div') {
  const state = stateOf(discovery);
  const bonus = completedQuizzes.has(discovery.number);
  const badge = document.createElement(tag);
  badge.className = `badge state-${state}${bonus ? ' has-bonus' : ''}`;
  const detail = state === 'progress' ? ui().badgeSteps(stepsDone(discovery)) : ui().badgeStates[state];
  badge.innerHTML = `
    <span class="badge-medal" aria-hidden="true"><span class="badge-icon">${ICONS[discovery.kind]}</span><b>${discovery.number}</b>
      ${state === 'progress' ? `<svg class="badge-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" pathLength="3" stroke-dasharray="${stepsDone(discovery)} 3"></circle></svg>` : ''}
    </span>
    <span class="badge-text"><strong>${discovery.title}</strong><small>${discovery.mission}</small><em>${detail}</em></span>
    ${bonus ? `<span class="badge-star" title="${ui().quizDone}">★ ${ui().badgeBonus}</span>` : ''}`;
  badge.setAttribute('aria-label', `${discovery.number} · ${discovery.title} · ${discovery.mission} · ${detail}${bonus ? ` · ${ui().badgeBonus}` : ''}`);
  return badge;
}

function updateCardScore(discovery: Discovery) {
  const bonus = completedQuizzes.has(discovery.number);
  knowledgeScore.textContent = `${ui().points(scoreOf(discovery), maxScore(discovery))}${bonus ? ` · +${QUIZ_BONUS} ★` : ''}`;
  knowledgeScore.classList.toggle('complete', isComplete(discovery));
  const earned = earnedBadges.has(discovery.number);
  card.badge.hidden = !earned;
  card.badge.innerHTML = '';
  if (earned) {
    const label = document.createElement('p');
    label.className = 'eyebrow';
    label.textContent = ui().badgeEarned;
    card.badge.append(label, buildBadge(discovery));
  }
  card.quiz.classList.toggle('done', bonus);
  card.quizStatus.textContent = bonus ? ui().quizDone : ui().quizValue;
}

function renderPhoto(discovery: Discovery) {
  card.photo.hidden = false;
  card.photoFallback.hidden = true;
  card.photo.alt = discovery.imageAlt;
  card.photo.src = discovery.image;
  card.photoCredit.textContent = ui().photoCredit(discovery.imageCredit);
  card.icon.classList.add('behind-photo');
}
// Sem a foto, o cartão volta ao ícone do equipamento e mostra um aviso.
card.photo.addEventListener('error', () => {
  card.photo.hidden = true;
  card.photoFallback.hidden = false;
  card.photoFallback.textContent = ui().photoFallback;
  card.icon.classList.remove('behind-photo');
});

function renderCard(discovery: Discovery) {
  card.number.textContent = discovery.number;
  card.icon.textContent = ICONS[discovery.kind];
  card.location.textContent = discovery.location.toUpperCase();
  card.eyebrow.textContent = ui().cardEyebrow(discovery.number, String(discoveries.length).padStart(2, '0'));
  card.title.textContent = discovery.title;
  card.subtitle.textContent = discovery.subtitle;
  card.mission.textContent = discovery.mission;
  card.year.textContent = discovery.year;
  card.facts.textContent = discovery.facts;
  card.fiction.textContent = discovery.fiction;
  renderPhoto(discovery);
  encounterCopy.innerHTML = discovery.encounter.map((paragraph) => `<p>${paragraph}</p>`).join('');
  storyPanel.classList.add('hidden');
  storyPanel.innerHTML = '';
  storyTabs.innerHTML = '';
  discovery.steps.forEach((step) => {
    const tab = document.createElement('button');
    tab.innerHTML = `<span>${ui().tabs[step.id]}</span><small>+${step.reward}</small>`;
    tab.dataset.done = ui().stepDone;
    tab.classList.toggle('complete', isStepDone(discovery, step));
    tab.addEventListener('click', () => openStoryStep(discovery, step, tab));
    storyTabs.appendChild(tab);
  });
  renderQuiz(discovery);
  updateCardScore(discovery);
  discoveryCard.querySelector('.artifact-copy')?.scrollTo(0, 0);
}

function completeStep(discovery: Discovery, step: StoryStep) {
  if (isStepDone(discovery, step)) return false;
  completedSteps.add(stepKey(discovery, step));
  if (isComplete(discovery) && !earnedBadges.has(discovery.number)) {
    earnedBadges.add(discovery.number);
    justCompleted = discovery;
    // Sugere a próxima da ordem, sem impedir outra escolha.
    const index = discoveries.indexOf(discovery);
    activeDestination = nextRecommended(index)?.number ?? null;
  }
  saveProgress();
  return true;
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
      if (!completeStep(discovery, step)) return;
      tab.classList.add('complete');
      updateCardScore(discovery);
      updateHud();
    },
  });
}

/** Quiz opcional: vale 10 pontos bônus uma única vez; errar não tira pontos e não bloqueia nada. */
function renderQuiz(discovery: Discovery) {
  card.quiz.open = false;
  card.quizBody.innerHTML = '';
  const solved = completedQuizzes.has(discovery.number);
  renderActivity(card.quizBody, discovery.quiz, {
    solved,
    successText: (earned) => (earned ? `${discovery.quiz.success} ${ui().earnedBonus(QUIZ_BONUS)}` : discovery.quiz.success),
    onSolved: () => {
      if (completedQuizzes.has(discovery.number)) return;
      completedQuizzes.add(discovery.number);
      saveProgress();
      updateCardScore(discovery);
      updateHud();
    },
  });
}

loadProgress();
updateHud();

// Abertura: 1) idioma; 2) nome do explorador (obrigatório); 3) prólogo em páginas; 4) mapa com os 12 locais.
const languageStep = byId('language-step');
const nameStep = byId('name-step');
const prologueStep = byId('prologue-step');
const languageButtons = [...document.querySelectorAll<HTMLButtonElement>('.language-option')];
const nameInput = document.querySelector<HTMLInputElement>('#player-name')!;
const nameError = byId('name-error');

function applyLanguage(lang: Lang) {
  setLang(lang);
  story = lang === 'en' ? localizeStory(storyEn) : gameStory;
  discoveries = story.discoveries;
  labels.forEach((label) => { label.material?.dispose(true, true); label.dispose(); });
  labels = buildLabels();
  renderPrologue();
  nameInput.placeholder = ui().namePlaceholder;
  updateHud();
  // Uma ficha aberta é redesenhada no novo idioma, sem perder o estado.
  if (activeCardNumber) { const open = findDiscovery(activeCardNumber); if (open) renderCard(open); }
  saveProgress();
}

function showStep(step: HTMLElement) {
  [languageStep, nameStep, prologueStep].forEach((node) => node.classList.toggle('step-hidden', node !== step));
}

function showLanguageStep() {
  showStep(languageStep);
  const suggested = languageButtons.find((button) => button.dataset.lang === languagePreference.lang) ?? languageButtons[0];
  languageButtons.forEach((button) => button.classList.toggle('suggested', button === suggested));
  suggested.focus({ preventScroll: true });
}

function showNameStep() {
  nameInput.value = playerName;
  nameError.textContent = '';
  showStep(nameStep);
  nameInput.focus({ preventScroll: true });
}

function showPrologueStep() {
  showStep(prologueStep);
  goToProloguePage(0);
}

function confirmName() {
  if (!isValidName(nameInput.value)) {
    nameError.textContent = ui().nameError;
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus({ preventScroll: true });
    return;
  }
  nameInput.removeAttribute('aria-invalid');
  playerName = cleanName(nameInput.value);
  saveProgress();
  updateHud();
  showPrologueStep();
}

languageButtons.forEach((button) => button.addEventListener('click', () => { applyLanguage(button.dataset.lang as Lang); showNameStep(); }));
byId('name-continue').addEventListener('click', confirmName);
nameInput.addEventListener('input', () => { if (nameError.textContent && isValidName(nameInput.value)) nameError.textContent = ''; });
nameInput.addEventListener('keydown', (event) => {
  // As teclas digitadas no nome não podem chegar aos controles do jogo.
  event.stopPropagation();
  // preventDefault: sem ele, o mesmo Enter "clica" no botão do prólogo, que recebe o foco, e pula a tela.
  if (event.key === 'Enter') { event.preventDefault(); confirmName(); }
});
prologueBack.addEventListener('click', () => goToProloguePage(prologueIndex - 1));
prologueNext.addEventListener('click', () => goToProloguePage(prologueIndex + 1));
window.addEventListener('keydown', (event) => {
  if (gameStarted || prologueStep.classList.contains('step-hidden')) return;
  if (event.key === 'ArrowRight' && prologueIndex < story.prologue.pages.length - 1) goToProloguePage(prologueIndex + 1);
  if (event.key === 'ArrowLeft' && prologueIndex > 0) goToProloguePage(prologueIndex - 1);
});
byId('change-language').addEventListener('click', showLanguageStep);
// ?lang=pt ou ?lang=en na URL pula a escolha do idioma (útil para links de apresentação); o nome continua obrigatório.
if (languagePreference.fromUrl) {
  applyLanguage(languagePreference.lang);
  if (playerName) showPrologueStep(); else showNameStep();
} else showLanguageStep();

startButton.addEventListener('click', () => {
  intro.classList.add('hidden');
  gameStarted = true;
  updateHud();
  canvas.focus();
});

const DISCOVERY_RADIUS = 7.5;
const CLICK_RADIUS = 14;
let toastTarget: Discovery | null = null;
const distanceTo = (index: number) => Math.hypot(astronaut.position.x - discoveries[index].position.x, astronaut.position.z - discoveries[index].position.z);

function nearestDiscovery() {
  let best = 0;
  discoveries.forEach((_, index) => { if (distanceTo(index) < distanceTo(best)) best = index; });
  return { index: best, discovery: discoveries[best], distance: distanceTo(best) };
}

function openCard(discovery: Discovery) {
  if (!gameStarted || isCardOpen() || isEpilogueOpen()) return;
  closeBackpack(false);
  activeCardNumber = discovery.number;
  openedDiscoveries.add(discovery.number);
  if (justCompleted && justCompleted !== discovery) justCompleted = null;
  keys.clear();
  releaseJoystick();
  renderCard(discovery);
  discoveryToast.classList.add('hidden');
  discoveryCard.classList.remove('hidden');
  storyTabs.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  updateHud();
}

function closeCard() {
  if (!isCardOpen()) return;
  discoveryCard.classList.add('hidden');
  activeCardNumber = null;
  canvas.focus();
  updateHud();
  if (allComplete() && !epilogueSeen) showEpilogue();
}

function showEpilogue() {
  const text = story.epilogue;
  epilogue.eyebrow.textContent = text.eyebrow;
  epilogue.title.innerHTML = headline(text.title);
  epilogue.text.innerHTML = text.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');
  epilogue.score.textContent = ui().epilogueScore(knowledgeTotal(), knowledgeMax);
  epilogue.bonus.textContent = ui().epilogueScore(bonusTotal(), bonusMax);
  epilogue.total.textContent = ui().epilogueScore(knowledgeTotal() + bonusTotal(), knowledgeMax + bonusMax);
  epilogue.distinction.textContent = ui().epilogueExplorer(playerName, text.distinction);
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

// Mochila: 12 espaços desde o início, nome editável e troca de idioma.
function renderBackpack() {
  backpack.name.textContent = playerName;
  backpack.grid.innerHTML = '';
  discoveries.forEach((discovery) => {
    const badge = buildBadge(discovery, 'button');
    badge.addEventListener('click', () => {
      // Locais ainda não explorados viram destino; os demais reabrem a ficha.
      if (stateOf(discovery) === 'new') { setDestination(discovery); closeBackpack(); return; }
      openCard(discovery);
    });
    backpack.grid.appendChild(badge);
  });
  document.querySelectorAll<HTMLButtonElement>('.backpack-lang button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === getLang()));
  });
  updateScores();
}

function openBackpack() {
  if (!gameStarted || isModalOpen()) return;
  keys.clear();
  releaseJoystick();
  showNameView();
  renderBackpack();
  discoveryToast.classList.add('hidden');
  backpack.root.classList.remove('hidden');
  backpack.close.focus({ preventScroll: true });
}

function closeBackpack(focusCanvas = true) {
  if (!isBackpackOpen()) return;
  backpack.root.classList.add('hidden');
  if (focusCanvas) canvas.focus();
}

function showNameView() {
  backpack.nameForm.hidden = true;
  backpack.nameView.hidden = false;
  backpack.nameError.textContent = '';
}

backpack.open.addEventListener('click', openBackpack);
backpack.close.addEventListener('click', () => closeBackpack());
backpack.root.addEventListener('click', (event) => { if (event.target === backpack.root) closeBackpack(); });
backpack.edit.addEventListener('click', () => {
  backpack.nameView.hidden = true;
  backpack.nameForm.hidden = false;
  backpack.nameInput.value = playerName;
  backpack.nameInput.focus();
  backpack.nameInput.select();
});
backpack.cancel.addEventListener('click', showNameView);
backpack.nameInput.addEventListener('keydown', (event) => { event.stopPropagation(); if (event.key === 'Escape') showNameView(); });
backpack.nameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!isValidName(backpack.nameInput.value)) { backpack.nameError.textContent = ui().nameError; return; }
  playerName = cleanName(backpack.nameInput.value);
  saveProgress();
  showNameView();
  renderBackpack();
  updateHud();
  backpack.edit.focus();
});
document.querySelectorAll<HTMLButtonElement>('.backpack-lang button').forEach((button) => {
  button.addEventListener('click', () => { applyLanguage(button.dataset.lang as Lang); renderBackpack(); });
});

// Mostra o aviso sempre que o astronauta está perto de um equipamento,
// permitindo reabrir a ficha quantas vezes quiser. Todos os 12 estão liberados.
function updateDiscoveryToast() {
  const { discovery, distance } = nearestDiscovery();
  const near = gameStarted && !isModalOpen() && distance < DISCOVERY_RADIUS;
  discoveryToast.classList.toggle('hidden', !near);
  if (!near) { toastTarget = null; return; }
  toastTarget = discovery;
  toastTitle.textContent = discovery.title;
  const opened = openedDiscoveries.has(discovery.number);
  const eyebrow = opened ? ui().toastArchive : ui().toastFound;
  toastEyebrow.textContent = playerName ? `${eyebrow} · ${playerName.toUpperCase()}` : eyebrow;
  investigateButton.firstChild!.textContent = opened ? ui().openCard : ui().investigate;
  toastNote.textContent = '';
}

investigateButton.addEventListener('click', () => { if (toastTarget) openCard(toastTarget); });
closeButton.addEventListener('click', closeCard);
// Esc ou clique fora do cartão também fecham a ficha.
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeCard(); closeEpilogue(); closeBackpack(); } });
discoveryCard.addEventListener('click', (event) => { if (event.target === discoveryCard) closeCard(); });

window.addEventListener('keydown', (event) => {
  if ((event.key === 'e' || event.key === 'E' || event.key === 'Enter') && !isModalOpen() && toastTarget) {
    if (event.key === 'Enter' && document.activeElement instanceof HTMLButtonElement) return;
    openCard(toastTarget);
  }
  // M abre a mochila.
  if ((event.key === 'm' || event.key === 'M') && gameStarted && !isModalOpen()) openBackpack();
});

// Clicar ou tocar em um equipamento também abre a ficha.
scene.onPointerObservable.add((info) => {
  if (info.type !== PointerEventTypes.POINTERTAP) return;
  const mesh = info.pickInfo?.pickedMesh;
  if (!mesh) return;
  const index = equipment.findIndex((root) => mesh.isDescendantOf(root));
  if (index >= 0 && distanceTo(index) < CLICK_RADIUS) openCard(discoveries[index]);
});

const WALK_SPEED = 4.5; // unidades por segundo (equivale ao antigo 0,075 por quadro a 60 fps)

// Entrada de movimento: x = direita/esquerda, z = frente/trás (valores de -1 a 1).
function readMovementInput() {
  const pressed = (...names: string[]) => names.some((name) => keys.has(name));
  const x = (pressed('d', 'arrowright') ? 1 : 0) - (pressed('a', 'arrowleft') ? 1 : 0) + touchInput.x;
  const z = (pressed('w', 'arrowup') ? 1 : 0) - (pressed('s', 'arrowdown') ? 1 : 0) + touchInput.z;
  return new Vector3(Math.max(-1, Math.min(1, x)), 0, Math.max(-1, Math.min(1, z)));
}

// Seta aponta para o destino escolhido pelo jogador (sem destino, não aparece).
function updateGuideArrow() {
  const target = findDiscovery(activeDestination);
  const index = target ? discoveries.indexOf(target) : -1;
  const distance = target ? distanceTo(index) : 0;
  const visible = gameStarted && Boolean(target) && distance > DISCOVERY_RADIUS && !isModalOpen();
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
  rings.forEach((ring, index) => {
    ring.rotation.y += 0.012;
    ring.scaling.setAll(discoveries[index].number === activeDestination ? pulse : 1);
  });
  // Céu e área de sombra acompanham o jogador.
  sky.position.set(camera.target.x, 0, camera.target.z);
  sun.position.copyFrom(astronaut.position.add(SUN_OFFSET));
  updateGuideArrow();
  if (!gameStarted || isModalOpen()) return;
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
    astronaut.position.x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, astronaut.position.x));
    astronaut.position.z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, astronaut.position.z));
    // O visor do astronauta aponta para -Z, por isso a meia-volta.
    astronaut.rotation.y = Math.atan2(direction.x, direction.z) + Math.PI;
    // No joystick, empurrar pouco dá passos mais lentos.
    animateWalk(dt, Math.min(1, Math.sqrt(input.lengthSquared())));
  } else {
    relaxPose();
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
    /** Estado de pontuação, para conferir nos testes. */
    get progress() { return { knowledge: knowledgeTotal(), bonus: bonusTotal(), badges: [...earnedBadges], quizzes: [...completedQuizzes], name: playerName, destination: activeDestination }; },
    /** Conclui as camadas (e, se pedido, o quiz) pelo mesmo caminho das atividades. */
    complete(index: number, withQuiz = false) {
      const discovery = discoveries[index];
      openedDiscoveries.add(discovery.number);
      discovery.steps.forEach((step) => completeStep(discovery, step));
      if (withQuiz && !completedQuizzes.has(discovery.number)) { completedQuizzes.add(discovery.number); saveProgress(); }
      updateHud();
    },
    closeCard,
    /** Coloca o astronauta diante de um equipamento (índice 0–11). */
    teleport(index: number, distance = 5) {
      const target = discoveries[index].position;
      astronaut.position.set(target.x, 0, target.z + distance);
      camera.alpha = Math.PI / 2;
      camera.target.copyFrom(astronaut.position.add(new Vector3(0, 1.5, 0)));
    },
  };
}
