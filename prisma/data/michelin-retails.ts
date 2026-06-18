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
  city?: 'Paris' | 'Lyon' | 'Clermont-Ferrand';
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
    name: 'Probikeshop Paris',
    websiteUrl: 'https://www.probikeshop.fr',
    city: 'Paris',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Cycles Michel',
    websiteUrl: 'https://www.cyclesmichel.fr',
    city: 'Paris',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Vélo Station Bastille',
    websiteUrl: 'https://www.velostation.fr',
    city: 'Paris',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Alltricks Lyon',
    websiteUrl: 'https://www.alltricks.fr',
    city: 'Lyon',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Vélo & Co Presqu\'île',
    websiteUrl: 'https://www.velocolyon.fr',
    city: 'Lyon',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Bike Shop Lyon',
    websiteUrl: 'https://www.bikeshoplyon.fr',
    city: 'Lyon',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Matériel Vélo Auvergne',
    websiteUrl: 'https://www.materiel-velo.com',
    city: 'Clermont-Ferrand',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Auvergne Cycles',
    websiteUrl: 'https://www.auvergnecycles.fr',
    city: 'Clermont-Ferrand',
  },
  {
    region: 'EUS',
    country: 'FR',
    name: 'Vélo Passion Clermont',
    websiteUrl: 'https://www.velopassion63.fr',
    city: 'Clermont-Ferrand',
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

const fakeLocationByFrenchCity: Record<
  NonNullable<MichelinRetailSource['city']>,
  {
    addresses: string[];
    longitude: number;
    latitude: number;
    phonePrefix: string;
  }
> = {
  Paris: {
    addresses: [
      '24 Rue de la Roquette, 75011 Paris, France',
      '15 Rue Oberkampf, 75011 Paris, France',
      '8 Boulevard Beaumarchais, 75011 Paris, France',
    ],
    longitude: 2.3794,
    latitude: 48.8534,
    phonePrefix: '+33 1 43 55',
  },
  Lyon: {
    addresses: [
      '12 Rue de la République, 69002 Lyon, France',
      '45 Avenue Jean Jaurès, 69007 Lyon, France',
      '3 Quai Saint-Antoine, 69002 Lyon, France',
    ],
    longitude: 4.8361,
    latitude: 45.7626,
    phonePrefix: '+33 4 78 42',
  },
  'Clermont-Ferrand': {
    addresses: [
      '8 Place de Jaude, 63000 Clermont-Ferrand, France',
      '22 Avenue Julien, 63000 Clermont-Ferrand, France',
      '5 Rue Blatin, 63000 Clermont-Ferrand, France',
    ],
    longitude: 3.0828,
    latitude: 45.7751,
    phonePrefix: '+33 4 73 93',
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

const cityRetailIndex: Record<
  NonNullable<MichelinRetailSource['city']>,
  number
> = {
  Paris: 0,
  Lyon: 0,
  'Clermont-Ferrand': 0,
};

export const michelinRetails: RetailSeed[] = michelinRetailSources.map(
  (source, index) => {
    const location =
      source.city != null
        ? fakeLocationByFrenchCity[source.city]
        : fakeLocationByCountry[source.country];

    const coordinateIndex =
      source.city != null ? cityRetailIndex[source.city]++ : index;

    let address: string;
    if (source.city != null) {
      const cityLocation = fakeLocationByFrenchCity[source.city];
      address =
        cityLocation.addresses[coordinateIndex % cityLocation.addresses.length];
    } else {
      address = fakeLocationByCountry[source.country].address;
    }

    return {
      name: source.name,
      address,
      longitude: offsetCoordinate(location.longitude, coordinateIndex),
      latitude: offsetCoordinate(location.latitude, coordinateIndex),
      phoneNumber: fakePhone(location.phonePrefix, coordinateIndex),
      websiteUrl: normalizeWebsiteUrl(source.websiteUrl),
    };
  },
);
