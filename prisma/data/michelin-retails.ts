export type RetailSeed = {
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  phoneNumber: string;
  websiteUrl: string;
};

type MichelinRetailSource = {
  region: string;
  country: string;
  name: string;
  websiteUrl: string;
};

/**
 * Revendeurs partenaires Michelin — pneus vélo (e-commerce et magasins spécialisés).
 * Region / Country / Website : données officielles.
 * Adresses, coordonnées et téléphones : données fictives pour le développement.
 */
const michelinRetailSources: MichelinRetailSource[] = [
  {
    region: 'EUN',
    country: 'UK',
    name: 'Tredz',
    websiteUrl: 'https://www.tredz.co.uk',
  },
  {
    region: 'EUN',
    country: 'UK',
    name: 'Biketart',
    websiteUrl: 'https://www.biketart.com',
  },
  {
    region: 'EUN',
    country: 'UK',
    name: 'Evans Cycles',
    websiteUrl: 'https://www.evanscycles.com',
  },
  {
    region: 'EUN',
    country: 'DE',
    name: 'Bike24',
    websiteUrl: 'https://www.bike24.com',
  },
  {
    region: 'EUN',
    country: 'DE',
    name: 'Bike Components',
    websiteUrl: 'https://www.bike-components.de',
  },
  {
    region: 'EUN',
    country: 'DE',
    name: 'Amazon DE — Vélo',
    websiteUrl: 'https://www.amazon.de',
  },
  {
    region: 'EUS',
    country: 'ES',
    name: 'Deporvillage',
    websiteUrl: 'https://www.deporvillage.com',
  },
  {
    region: 'EUS',
    country: 'NL',
    name: 'Futurumshop',
    websiteUrl: 'https://www.futurumshop.nl',
  },
  {
    region: 'EUS',
    country: 'IT',
    name: 'Lordgun Bicycles',
    websiteUrl: 'https://www.lordgunbicycles.com',
  },
  {
    region: 'ECA',
    country: 'PL',
    name: 'Centrum Rowerowe',
    websiteUrl: 'https://www.centrumrowerowe.pl',
  },
  {
    region: 'EUS',
    country: 'ES',
    name: 'Bikeinn',
    websiteUrl: 'https://www.bikeinn.com',
  },
  {
    region: 'EUS',
    country: 'BE',
    name: 'Van Eyck Sports',
    websiteUrl: 'https://www.vaneycksports.be',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Probikeshop',
    websiteUrl: 'https://www.probikeshop.fr',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Alltricks',
    websiteUrl: 'https://www.alltricks.fr',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Matériel Vélo',
    websiteUrl: 'https://www.materiel-velo.com',
  },
];

const fakeLocationByCountry: Record<
  string,
  { address: string; longitude: number; latitude: number; phonePrefix: string }
> = {
  UK: {
    address:
      'Unit 4, Cycle Park, 18 Velodrome Way, London E20 3HB, United Kingdom',
    longitude: -0.1276,
    latitude: 51.5074,
    phonePrefix: '+44 20 7946',
  },
  DE: {
    address: 'Fahrradhaus Berlin, Koppenstraße 8, 10115 Berlin, Germany',
    longitude: 13.405,
    latitude: 52.52,
    phonePrefix: '+49 30 1234',
  },
  ES: {
    address: 'Tienda de Ciclismo, Calle del Pez 12, 28004 Madrid, Spain',
    longitude: -3.7038,
    latitude: 40.4168,
    phonePrefix: '+34 91 123',
  },
  NL: {
    address:
      'Fietsenwinkel Amsterdam, Haarlemmerdijk 89, 1013 KC Amsterdam, Netherlands',
    longitude: 4.9041,
    latitude: 52.3676,
    phonePrefix: '+31 20 123',
  },
  IT: {
    address: 'Negozio Biciclette, Via Solferino 18, 20121 Milano, Italy',
    longitude: 9.19,
    latitude: 45.4642,
    phonePrefix: '+39 02 1234',
  },
  PL: {
    address: 'Sklep Rowerowy, ul. Marszałkowska 84, 00-514 Warszawa, Poland',
    longitude: 21.0122,
    latitude: 52.2297,
    phonePrefix: '+48 22 123',
  },
  BE: {
    address: 'Magasin Vélo, Chaussée de Wavre 128, 1050 Ixelles, Belgium',
    longitude: 4.3517,
    latitude: 50.8503,
    phonePrefix: '+32 2 123',
  },
  FR: {
    address: 'Magasin Vélo, 24 Rue de la Roquette, 75011 Paris, France',
    longitude: 2.3522,
    latitude: 48.8566,
    phonePrefix: '+33 1 42 34',
  },
};

function normalizeWebsiteUrl(url: string): string {
  return url.trim().replace(/\/$/, '').startsWith('http')
    ? url.trim().replace(/\/$/, '')
    : `https://${url.trim().replace(/\/$/, '')}`;
}

function fakePhone(prefix: string, index: number): string {
  const suffix = String(1000 + index * 137).slice(-4);
  return `${prefix} ${suffix}`;
}

function offsetCoordinate(value: number, index: number): number {
  return Number((value + index * 0.012).toFixed(4));
}

export const michelinRetails: RetailSeed[] = michelinRetailSources.map(
  (source, index) => {
    const location = fakeLocationByCountry[source.country];

    return {
      name: source.name,
      address: location.address,
      longitude: offsetCoordinate(location.longitude, index),
      latitude: offsetCoordinate(location.latitude, index),
      phoneNumber: fakePhone(location.phonePrefix, index),
      websiteUrl: normalizeWebsiteUrl(source.websiteUrl),
    };
  },
);
