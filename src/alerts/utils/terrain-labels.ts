import { TerrainType } from 'src/generated/prisma/client';

const TERRAIN_LABELS: Record<TerrainType, string> = {
  ASPHALT: 'asphalte',
  HARD_PACKED: 'terrain dur compacté',
  MIXED: 'mixte',
  GRAVEL: 'gravier',
  ROCKY: 'rocheux',
  MUD: 'boueux',
  SOFT: 'meuble',
  SAND: 'sableux',
  WET: 'humide',
  UNKNOWN: 'inconnu',
};

export function formatTerrainLabel(terrain: TerrainType): string {
  return TERRAIN_LABELS[terrain];
}

export function formatTerrainList(terrains: TerrainType[]): string {
  return terrains.map(formatTerrainLabel).join(', ');
}
