// Builders for schema.org JSON-LD. Search engines and AI assistants read this
// structured data to understand who Luigi is and what Luigi has written.
import { site, person } from '../data/site';
import { courses } from '../data/teaching';
import { abstractOf, authorList, toIsoDate, type Paper } from './papers';

export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;
export const PROFILE_IMAGE = `${site.url}/images/luigi-caloi.jpg`;

const abs = (href: string) => (/^https?:\/\//.test(href) ? href : `${site.url}${href}`);

export function personNode() {
  const a = person.address;
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: person.name,
    alternateName: person.alternateName,
    url: `${site.url}/`,
    image: PROFILE_IMAGE,
    jobTitle: person.jobTitleFull,
    description: site.description,
    worksFor: { '@type': 'CollegeOrUniversity', name: person.affiliation.name, url: person.affiliation.url },
    affiliation: { '@type': 'CollegeOrUniversity', name: person.affiliation.name, url: person.affiliation.url },
    alumniOf: { '@type': 'CollegeOrUniversity', name: person.phd.school, url: person.phd.url },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'degree',
      name: 'Ph.D. in Economics',
      recognizedBy: { '@type': 'CollegeOrUniversity', name: person.phd.school },
    },
    knowsAbout: person.knowsAbout,
    email: `mailto:${person.email}`,
    workLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: a.streetAddress,
        addressLocality: a.locality,
        addressRegion: a.region,
        addressCountry: a.countryCode,
      },
    },
    ...(person.sameAs.length ? { sameAs: person.sameAs } : {}),
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${site.url}/`,
    name: site.name,
    description: site.description,
    inLanguage: site.locale,
    publisher: { '@id': PERSON_ID },
  };
}

export function paperNode(p: Paper) {
  const d = p.data;
  const authors = authorList(p, person.name).map((a) =>
    a.self ? { '@id': PERSON_ID } : { '@type': 'Person', name: a.name, ...(a.url ? { url: a.url } : {}) },
  );
  const abstract = abstractOf(p);
  return {
    '@type': 'ScholarlyArticle',
    '@id': `${site.url}/research#${p.id}`,
    headline: d.title,
    name: d.title,
    author: authors,
    ...(abstract ? { abstract } : {}),
    ...(d.link ? { url: abs(d.link) } : {}),
    ...(d.link?.endsWith('.pdf') ? { encoding: { '@type': 'MediaObject', contentUrl: abs(d.link), encodingFormat: 'application/pdf' } } : {}),
    ...(d.journal ? { isPartOf: { '@type': 'Periodical', name: d.journal } } : {}),
    ...(d.datePublished ? { datePublished: toIsoDate(d.datePublished) } : {}),
    ...(d.dateModified ? { dateModified: toIsoDate(d.dateModified) } : {}),
    ...(d.doi ? { sameAs: `https://doi.org/${d.doi}`, identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: d.doi } } : {}),
    ...(d.keywords.length ? { keywords: d.keywords.join(', ') } : {}),
    creativeWorkStatus: d.status === 'published' ? 'Published' : d.status === 'working' ? 'Working paper' : 'Work in progress',
    ...(d.note ? { award: d.note } : {}),
    inLanguage: 'en',
  };
}

export function courseNodes() {
  return courses.map((c) => ({
    '@type': 'Course',
    name: c.name,
    description: `${c.level}, ${c.department}, ${c.institution}. ${c.role}. ${c.terms}.`,
    provider: { '@type': 'CollegeOrUniversity', name: c.institution },
  }));
}

export function pageNode(type: string, path: string, name: string, description: string, extra: Record<string, unknown> = {}) {
  return {
    '@type': type,
    '@id': `${site.url}${path}#webpage`,
    url: `${site.url}${path}`,
    name,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
    inLanguage: site.locale,
    ...extra,
  };
}

export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
