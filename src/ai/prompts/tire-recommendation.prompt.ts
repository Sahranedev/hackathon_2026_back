import { TireData } from 'src/generated/prisma/client';

type Message = {
  role: 'system' | 'user';
  content: string;
};

export type CompactTireCatalogEntry = {
  id: number;
  model: string;
  terrainTypes: string[];
  usageType: string | null;
  etrtoWidth: number | null;
  etrtoDiameter: number | null;
  rimType: string | null;
  sealingType: string | null;
  eBikeCompatible: boolean;
  performanceProfiles: string[];
  familyName: string | null;
  productRange: string | null;
};

export function toCompactTireCatalogEntry(
  tire: TireData,
): CompactTireCatalogEntry {
  return {
    id: tire.id,
    model: tire.model,
    terrainTypes: tire.terrainTypes,
    usageType: tire.usageType,
    etrtoWidth: tire.etrtoWidth,
    etrtoDiameter: tire.etrtoDiameter,
    rimType: tire.rimType,
    sealingType: tire.sealingType,
    eBikeCompatible: tire.eBikeCompatible,
    performanceProfiles: tire.performanceProfiles,
    familyName: tire.familyName,
    productRange: tire.productRange,
  };
}

export const tireRecommendationPrompt = (
  userPrompt: string,
  catalog: CompactTireCatalogEntry[],
): Message[] => {
  return [
    {
      role: 'system',
      content: `
Tu es un expert Michelin en pneumatiques cyclistes.

Ta mission est de recommander les pneus les plus adaptés à la pratique décrite par l'utilisateur, en te basant UNIQUEMENT sur le catalogue fourni.

Règles :
- Analyse la pratique : type de vélo, terrains, fréquence, priorités (confort, vitesse, grip, durabilité, anti-crevaison), usage e-bike, etc.
- Sélectionne entre 3 et 5 pneus parmi le catalogue.
- Ne recommande que des identifiants (id) présents dans le catalogue.
- Privilégie la diversité des gammes quand plusieurs pneus sont équivalents.
- Chaque raison doit être courte, concrète et en français.
- Retourne uniquement un tableau JSON valide, sans texte supplémentaire.

Format attendu :
[
  {
    "id": 123,
    "reason": "Explication courte en français"
  }
]
      `.trim(),
    },
    {
      role: 'user',
      content: `
Pratique de l'utilisateur :
${userPrompt.trim()}

Catalogue des pneus disponibles :
${JSON.stringify(catalog)}
      `.trim(),
    },
  ];
};
