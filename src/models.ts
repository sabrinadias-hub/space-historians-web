// Modelos 3D simplificados dos equipamentos, feitos com formas básicas.
// São representações do jogo, não réplicas em escala.
import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import type { Discovery, EquipmentKind } from './story-data';

export type ModelKit = {
  scene: Scene;
  shadows: ShadowGenerator;
  materials: { gold: StandardMaterial; metal: StandardMaterial; orange: StandardMaterial; dark: StandardMaterial; moon: StandardMaterial; white: StandardMaterial };
  addObstacle: (x: number, z: number, r: number) => void;
};

function makeHelpers(kit: ModelKit, root: TransformNode) {
  const { scene, shadows } = kit;
  const attach = <T extends Mesh>(mesh: T, position: Vector3, material: StandardMaterial, castShadow = true) => {
    mesh.parent = root;
    mesh.position.copyFrom(position);
    mesh.material = material;
    if (castShadow) shadows.addShadowCaster(mesh);
    return mesh;
  };
  return {
    box: (name: string, size: { width: number; height: number; depth: number }, position: Vector3, material: StandardMaterial) =>
      attach(MeshBuilder.CreateBox(name, size, scene), position, material),
    cylinder: (name: string, options: Parameters<typeof MeshBuilder.CreateCylinder>[1], position: Vector3, material: StandardMaterial) =>
      attach(MeshBuilder.CreateCylinder(name, options, scene), position, material),
    sphere: (name: string, options: Parameters<typeof MeshBuilder.CreateSphere>[1], position: Vector3, material: StandardMaterial) =>
      attach(MeshBuilder.CreateSphere(name, options, scene), position, material),
    tube: (name: string, path: Vector3[], radius: number, material: StandardMaterial) => {
      const tube = MeshBuilder.CreateTube(name, { path, radius }, scene);
      tube.parent = root;
      tube.material = material;
      return tube;
    },
    /** Marca achatada no chão (pegadas, marcas de rodas). */
    mark: (name: string, position: Vector3, width: number, depth: number, rotationY: number) => {
      const mark = MeshBuilder.CreateGround(name, { width, height: depth }, scene);
      mark.parent = root;
      mark.position.set(position.x, 0.02, position.z);
      mark.rotation.y = rotationY;
      mark.material = kit.materials.dark;
      return mark;
    },
  };
}

/** ALSEP: central com antena, ligada por cabos a instrumentos espalhados no solo. */
export function buildAlsep(kit: ModelKit, name: string, position: Vector3, variant = 0) {
  const root = new TransformNode(name, kit.scene);
  root.position.copyFrom(position);
  root.rotation.y = variant * 0.9;
  const { gold, metal, orange, dark } = kit.materials;
  const h = makeHelpers(kit, root);
  const central = h.box('alsep-central', { width: 1.5, height: 0.7, depth: 1 }, new Vector3(0, 0.55, 0), gold);
  central.receiveShadows = true;
  h.box('alsep-sunshade', { width: 1.7, height: 0.06, depth: 1.2 }, new Vector3(0, 1.05, 0), metal);
  [-0.6, 0.6].forEach((x) => h.box(`alsep-leg-${x}`, { width: 0.08, height: 0.3, depth: 0.08 }, new Vector3(x, 0.15, 0), metal));
  h.box('station-panel', { width: 1, height: 0.35, depth: 0.05 }, new Vector3(0, 0.55, -0.52), orange);
  h.cylinder('antenna-mast', { diameter: 0.07, height: 1.6 }, new Vector3(0.45, 1.85, 0.2), metal);
  const dish = h.cylinder('antenna-dish', { diameterTop: 0.9, diameterBottom: 0.12, height: 0.28, tessellation: 24 }, new Vector3(0.45, 2.7, 0.2), metal);
  dish.rotation.x = -0.7;
  h.sphere('beacon', { diameter: 0.22 }, new Vector3(0.45, 2.95, 0.05), orange);

  // Instrumentos ligados por cabos à central. A variante muda o arranjo entre as missões.
  const layouts = [
    [{ id: 'sismometro', at: new Vector3(-2.4, 0, -1.4), shape: 'dome' }, { id: 'magnetometro', at: new Vector3(2.5, 0, -1.1), shape: 'box' }, { id: 'rtg', at: new Vector3(-1.9, 0, 1.6), shape: 'cyl' }],
    [{ id: 'geofones', at: new Vector3(3, 0, 1.5), shape: 'line' }, { id: 'sismometro', at: new Vector3(-2.2, 0, -1.6), shape: 'dome' }, { id: 'rtg', at: new Vector3(-1.9, 0, 1.6), shape: 'cyl' }],
    [{ id: 'sonda-calor', at: new Vector3(2.4, 0, 1.4), shape: 'probe' }, { id: 'sismometro', at: new Vector3(-2.3, 0, -1.4), shape: 'dome' }, { id: 'rtg', at: new Vector3(-1.9, 0, 1.6), shape: 'cyl' }],
  ] as const;
  for (const instrument of layouts[variant % layouts.length]) {
    const at = instrument.at;
    if (instrument.shape === 'dome') {
      h.sphere(`alsep-${instrument.id}`, { diameter: 0.75, slice: 0.5 }, at, gold);
    } else if (instrument.shape === 'box') {
      h.box(`alsep-${instrument.id}`, { width: 0.5, height: 0.5, depth: 0.5 }, at.add(new Vector3(0, 0.25, 0)), metal);
    } else if (instrument.shape === 'cyl') {
      h.cylinder(`alsep-${instrument.id}`, { diameter: 0.45, height: 0.7, tessellation: 16 }, at.add(new Vector3(0, 0.35, 0)), metal);
    } else if (instrument.shape === 'probe') {
      [0, 1].forEach((i) => h.cylinder(`alsep-${instrument.id}-${i}`, { diameter: 0.1, height: 0.5 }, at.add(new Vector3(i * 0.8, 0.25, 0)), orange));
    } else {
      [0, 1, 2].forEach((i) => h.sphere(`alsep-${instrument.id}-${i}`, { diameter: 0.22, slice: 0.5 }, at.add(new Vector3(i * 0.9, 0, 0)), orange));
    }
    kit.addObstacle(...worldXZ(root, at), 0.35);
    h.tube(`alsep-cabo-${instrument.id}`, [new Vector3(0, 0.03, 0), at.add(new Vector3(0, 0.03, 0))], 0.025, dark);
  }
  kit.addObstacle(position.x, position.z, 0.95);
  return root;
}

/** Surveyor 3: estrutura de três pernas dentro de uma cratera, sem a câmera e a pá. */
function buildSurveyor(kit: ModelKit, root: TransformNode) {
  const { metal, white, gold, dark, moon } = kit.materials;
  const h = makeHelpers(kit, root);
  const hollow = MeshBuilder.CreateCylinder('surveyor-cratera', { diameter: 7, height: 0.05, tessellation: 48 }, kit.scene);
  hollow.parent = root;
  hollow.position.y = 0.02;
  hollow.material = dark;
  const rim = MeshBuilder.CreateTorus('surveyor-borda', { diameter: 7.6, thickness: 0.6, tessellation: 48 }, kit.scene);
  rim.parent = root;
  rim.position.y = 0.08;
  rim.scaling.y = 0.35;
  rim.material = moon;
  rim.receiveShadows = true;
  const body = h.cylinder('surveyor-corpo', { diameter: 1.1, height: 0.5, tessellation: 3 }, new Vector3(0, 1.3, 0), white);
  body.rotation.y = Math.PI / 6;
  [0, 1, 2].forEach((i) => {
    const angle = (i / 3) * Math.PI * 2;
    const foot = new Vector3(Math.cos(angle) * 1.5, 0.08, Math.sin(angle) * 1.5);
    h.tube(`surveyor-perna-${i}`, [new Vector3(0, 1.2, 0), foot], 0.05, metal);
    h.cylinder(`surveyor-pe-${i}`, { diameter: 0.35, height: 0.08 }, foot, metal);
  });
  h.cylinder('surveyor-mastro', { diameter: 0.06, height: 1.4 }, new Vector3(0, 2.2, 0), metal);
  const panel = h.box('surveyor-painel', { width: 1.1, height: 0.04, depth: 0.7 }, new Vector3(0.2, 2.9, 0), gold);
  panel.rotation.z = 0.4;
  kit.addObstacle(root.position.x, root.position.z, 1.4);
}

/** Rover lunar: chassi, quatro rodas, dois assentos, antena guarda-chuva e marcas de rodas. */
function buildRover(kit: ModelKit, root: TransformNode) {
  const { metal, white, gold, orange } = kit.materials;
  const h = makeHelpers(kit, root);
  h.box('rover-chassi', { width: 1.4, height: 0.12, depth: 2.6 }, new Vector3(0, 0.6, 0), metal);
  [-0.85, 0.85].forEach((x) => [-1.0, 1.0].forEach((z) => {
    const wheel = h.cylinder(`rover-roda-${x}-${z}`, { diameter: 0.7, height: 0.22, tessellation: 20 }, new Vector3(x, 0.35, z), gold);
    wheel.rotation.z = Math.PI / 2;
    h.box(`rover-paralama-${x}-${z}`, { width: 0.3, height: 0.05, depth: 0.8 }, new Vector3(x, 0.74, z), white);
  }));
  [-0.32, 0.32].forEach((x) => {
    h.box(`rover-assento-${x}`, { width: 0.5, height: 0.08, depth: 0.5 }, new Vector3(x, 0.75, 0.15), white);
    h.box(`rover-encosto-${x}`, { width: 0.5, height: 0.45, depth: 0.06 }, new Vector3(x, 0.98, 0.4), white);
  });
  h.box('rover-console', { width: 0.4, height: 0.4, depth: 0.12 }, new Vector3(0, 0.95, -0.4), metal);
  h.cylinder('rover-mastro', { diameter: 0.05, height: 1.1 }, new Vector3(0.3, 1.2, -0.95), metal);
  h.cylinder('rover-antena', { diameterTop: 0.9, diameterBottom: 0.05, height: 0.2, tessellation: 24 }, new Vector3(0.3, 1.8, -0.95), white);
  h.box('rover-camera', { width: 0.22, height: 0.18, depth: 0.25 }, new Vector3(-0.35, 1.05, -1.15), orange);
  // Marcas de rodas que levam até o carro.
  for (let i = 0; i < 14; i += 1) {
    const z = 2 + i * 0.7;
    const bend = Math.sin(i * 0.3) * 0.6;
    [-0.85, 0.85].forEach((x) => h.mark(`rover-marca-${i}-${x}`, new Vector3(x + bend, 0, z), 0.2, 0.55, 0.05));
  }
  kit.addObstacle(root.position.x, root.position.z, 1.4);
}

/** Refletor de laser: painel inclinado com uma grade de pequenos elementos. */
function buildReflector(kit: ModelKit, root: TransformNode) {
  const { metal, orange, white } = kit.materials;
  const h = makeHelpers(kit, root);
  const panel = h.box('refletor-painel', { width: 1.2, height: 0.08, depth: 0.9 }, new Vector3(0, 0.55, 0), metal);
  panel.rotation.x = -0.45;
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const cell = h.box(`refletor-celula-${i}-${j}`, { width: 0.22, height: 0.04, depth: 0.2 }, new Vector3(-0.39 + i * 0.26, 0.6 + (j - 1) * 0.1, -0.24 + j * 0.24), white);
      cell.rotation.x = -0.45;
    }
  }
  [-0.5, 0.5].forEach((x) => h.box(`refletor-pe-${x}`, { width: 0.06, height: 0.5, depth: 0.06 }, new Vector3(x, 0.25, 0.25), metal));
  h.sphere('refletor-brilho', { diameter: 0.12 }, new Vector3(0, 0.9, -0.2), orange);
  kit.addObstacle(root.position.x, root.position.z, 0.8);
}

/** Base do Eagle: estágio de descida com quatro pernas, escada e placa (sem a cabine). */
function buildLmDescent(kit: ModelKit, root: TransformNode) {
  const { gold, metal, white } = kit.materials;
  const h = makeHelpers(kit, root);
  const base = h.cylinder('eagle-base', { diameter: 2.6, height: 1.1, tessellation: 8 }, new Vector3(0, 1.45, 0), gold);
  base.rotation.y = Math.PI / 8;
  h.box('eagle-topo', { width: 1.6, height: 0.08, depth: 1.6 }, new Vector3(0, 2.04, 0), metal);
  [0, 1, 2, 3].forEach((i) => {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const foot = new Vector3(Math.cos(angle) * 2.3, 0.06, Math.sin(angle) * 2.3);
    h.tube(`eagle-perna-${i}`, [new Vector3(Math.cos(angle) * 1.1, 1.3, Math.sin(angle) * 1.1), foot], 0.07, metal);
    h.cylinder(`eagle-pe-${i}`, { diameter: 0.6, height: 0.08 }, foot, metal);
  });
  // Escada e placa na perna da frente.
  for (let i = 0; i < 5; i += 1) h.box(`eagle-degrau-${i}`, { width: 0.5, height: 0.04, depth: 0.04 }, new Vector3(0, 0.35 + i * 0.22, -1.45 + i * 0.06), metal);
  h.box('eagle-placa', { width: 0.5, height: 0.32, depth: 0.03 }, new Vector3(0, 1.45, -1.32), white);
  kit.addObstacle(root.position.x, root.position.z, 2.1);
}

/** PSEP: caixa central com dois painéis solares, antena e pegadas em volta. */
function buildPsep(kit: ModelKit, root: TransformNode) {
  const { gold, metal, orange } = kit.materials;
  const h = makeHelpers(kit, root);
  h.box('psep-caixa', { width: 0.7, height: 0.6, depth: 0.7 }, new Vector3(0, 0.3, 0), gold);
  [-1, 1].forEach((side) => {
    const panel = h.box(`psep-painel-${side}`, { width: 1.1, height: 0.04, depth: 0.7 }, new Vector3(side * 0.95, 0.35, 0), metal);
    panel.rotation.z = side * -0.15;
  });
  h.cylinder('psep-antena', { diameter: 0.04, height: 0.9 }, new Vector3(0.2, 1.05, 0.2), metal);
  h.sphere('psep-sinal', { diameter: 0.14 }, new Vector3(0.2, 1.52, 0.2), orange);
  // Pegadas que conduzem ao aparelho.
  for (let i = 0; i < 12; i += 1) {
    const side = i % 2 === 0 ? -0.18 : 0.18;
    h.mark(`psep-pegada-${i}`, new Vector3(side + Math.sin(i * 0.4) * 0.3, 0, 1.6 + i * 0.55), 0.16, 0.32, 0);
  }
  kit.addObstacle(root.position.x, root.position.z, 1.3);
}

function worldXZ(root: TransformNode, local: Vector3): [number, number] {
  const cos = Math.cos(root.rotation.y);
  const sin = Math.sin(root.rotation.y);
  return [root.position.x + local.x * cos + local.z * sin, root.position.z - local.x * sin + local.z * cos];
}

const BUILDERS: Record<Exclude<EquipmentKind, 'alsep'>, (kit: ModelKit, root: TransformNode) => void> = {
  surveyor: buildSurveyor,
  rover: buildRover,
  reflector: buildReflector,
  'lm-descent': buildLmDescent,
  psep: buildPsep,
};

let alsepVariant = 0;

/** Cria o equipamento de uma descoberta no mapa. */
export function buildEquipment(kit: ModelKit, discovery: Discovery) {
  const position = new Vector3(discovery.position.x, 0, discovery.position.z);
  const name = `equipamento-${discovery.number}`;
  if (discovery.kind === 'alsep') return buildAlsep(kit, name, position, alsepVariant++);
  const root = new TransformNode(name, kit.scene);
  root.position.copyFrom(position);
  BUILDERS[discovery.kind](kit, root);
  return root;
}

/** Placa flutuante com o número e o nome do equipamento. */
export function buildLabel(kit: ModelKit, text: string, position: Vector3, height: number) {
  const texture = new DynamicTexture(`placa-${text}`, { width: 512, height: 96 }, kit.scene, true);
  texture.hasAlpha = true;
  const context = texture.getContext() as CanvasRenderingContext2D;
  context.clearRect(0, 0, 512, 96);
  context.fillStyle = 'rgba(9,11,34,0.78)';
  context.beginPath();
  context.roundRect(4, 4, 504, 88, 44);
  context.fill();
  context.strokeStyle = 'rgba(255,157,76,0.9)';
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = '#ffffff';
  // Reduz a fonte até o texto caber na placa.
  let fontSize = 46;
  do {
    context.font = `bold ${fontSize}px "Barlow Condensed", "Nunito Sans", sans-serif`;
    fontSize -= 2;
  } while (context.measureText(text.toUpperCase()).width > 460 && fontSize > 20);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text.toUpperCase(), 256, 50);
  texture.update();
  const material = new StandardMaterial(`placa-mat-${text}`, kit.scene);
  material.diffuseTexture = texture;
  material.emissiveColor = Color3.White();
  material.disableLighting = true;
  material.useAlphaFromDiffuseTexture = true;
  material.backFaceCulling = false;
  const plane = MeshBuilder.CreatePlane(`placa-${text}`, { width: 4, height: 0.75 }, kit.scene);
  plane.material = material;
  plane.position.set(position.x, height, position.z);
  plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
  plane.isPickable = false;
  return plane;
}
