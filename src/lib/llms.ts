// Builds /llms.txt (short) and /llms-full.txt (with abstracts): plain-text
// summaries that AI assistants can read in one request.
import { site, person, pages } from '../data/site';
import { courses } from '../data/teaching';
import { getPapers, abstractOf, authorList, sections, toIsoDate, type Paper } from './papers';

const abs = (href: string) => (/^https?:\/\//.test(href) ? href : `${site.url}${href}`);
const authors = (p: Paper) => authorList(p, person.name).map((a) => a.name).join(', ');

export async function buildLlms(full: boolean): Promise<string> {
  const papers = await getPapers();
  const a = person.address;
  const out: string[] = [
    `# ${person.name}`,
    '',
    `> ${site.description}`,
    '',
    `${person.name} is an ${person.jobTitle} at ${person.affiliation.name} (São Paulo, Brazil), with a Ph.D. in Economics from ${person.phd.school} (${person.phd.date}). Research areas: ${person.fields.join(' and ').toLowerCase()}, studying the design of transfer systems (including intergovernmental and performance-based transfers) and industrial policies, with work on tax compliance and firms in Brazil and Ethiopia.`,
    '',
    `- Website: ${site.url}`,
    `- CV: ${abs(person.cv)}`,
    `- Email: ${person.email}`,
    `- Office: ${a.street}, ${a.locality}, ${a.region}, ${a.country}`,
    ...person.sameAs.map((u) => `- Profile: ${u}`),
    '',
    '## Pages',
    '',
    `- [Home](${site.url}/): ${pages.home.description}`,
    `- [Research](${site.url}${pages.research.path}): ${pages.research.description}`,
    `- [Teaching](${site.url}${pages.teaching.path}): ${pages.teaching.description}`,
    `- [Full text for AI tools](${site.url}/llms-full.txt): every page's content, including all paper abstracts`,
    '',
  ];

  for (const s of sections) {
    const items = papers.filter((p) => p.data.status === s.status);
    if (!items.length) continue;
    out.push(`## ${s.heading}`, '');
    for (const p of items) {
      const d = p.data;
      const year = toIsoDate(d.datePublished)?.slice(0, 4);
      const where = [d.journal, year, d.dateText].filter(Boolean).join(', ');
      const link = d.link ? ` (${abs(d.link)})` : '';
      out.push(`- **${d.title}**${link}. Authors: ${authors(p)}.${where ? ` ${where}.` : ''}${d.note ? ` ${d.note}.` : ''}`);
      const abstract = abstractOf(p);
      if (full && abstract) out.push(`  Abstract: ${abstract}`);
    }
    out.push('');
  }

  out.push('## Teaching', '');
  for (const c of courses) out.push(`- ${c.name} (${c.level}, ${c.institution}). ${c.role}. ${c.terms}.`);
  out.push('');
  return out.join('\n');
}
