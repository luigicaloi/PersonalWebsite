// Single source of truth for who Luigi is. Everything here feeds the visible
// pages AND the machine-readable outputs (meta tags, JSON-LD, llms.txt).
// Update a fact here once and it changes everywhere.

export const site = {
  url: 'https://www.luigicaloi.com',
  name: 'Luigi Caloi',
  // Shown in search results / AI answers. Keep 70–160 characters.
  description:
    'Luigi Caloi is an Assistant Professor at Insper studying public and development economics: the design of transfer systems and industrial policies.',
  locale: 'en',
};

export const person = {
  name: 'Luigi Caloi',
  alternateName: 'Luigi Beneduci Caloi',
  jobTitle: 'Assistant Professor',
  affiliation: { name: 'Insper', url: 'https://www.insper.edu.br/en/home' },
  phd: { school: 'Columbia University', url: 'https://www.columbia.edu/', date: 'May 2026' },
  fields: ['Public economics', 'Development economics'],
  // Topics used in structured data and llms.txt (not shown on the page).
  knowsAbout: [
    'Public economics',
    'Development economics',
    'Intergovernmental transfers',
    'Performance-based transfers',
    'Tax compliance',
    'Property taxation',
    'Industrial policy',
    'Brazil',
  ],
  email: 'luigicaloi@gmail.com',
  phone: '+55 (11) 99297-6242',
  address: {
    street: 'Quatá street, 300 room 740',
    streetAddress: 'Rua Quatá, 300, sala 740',
    locality: 'São Paulo',
    region: 'SP',
    country: 'Brazil',
    countryCode: 'BR',
  },
  cv: '/files/cv.pdf',
  // Profiles elsewhere (Google Scholar, ORCID, RePEc, LinkedIn, Insper page...).
  // These help search engines and AI tools know they're all the same person.
  sameAs: [] as string[],
};

export const pages = {
  home: {
    path: '/',
    title: 'Luigi Caloi | Economist, Assistant Professor at Insper',
    description: site.description,
  },
  research: {
    path: '/research',
    title: 'Research | Luigi Caloi, Economist at Insper',
    description:
      'Research by Luigi Caloi on tax compliance, intergovernmental and performance-based transfers, firm markups, and firms in Ethiopia and Brazil.',
  },
  teaching: {
    path: '/teaching',
    title: 'Teaching | Luigi Caloi, Economist at Insper',
    description:
      'Teaching by Luigi Caloi: teaching assistant for Principles of Economics, Introduction to Econometrics and Global Economy at Columbia University.',
  },
} as const;

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Research', href: '/research' },
  { label: 'Teaching', href: '/teaching' },
  { label: 'CV', href: person.cv },
];
