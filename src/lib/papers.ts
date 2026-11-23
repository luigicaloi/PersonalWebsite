import { getCollection, type CollectionEntry } from 'astro:content';

export type Paper = CollectionEntry<'papers'>;

export const sections = [
  { status: 'published', heading: 'Published and Accepted Papers' },
  { status: 'working', heading: 'Working papers' },
  { status: 'wip', heading: 'Work in progress' },
] as const;

export async function getPapers(): Promise<Paper[]> {
  const all = await getCollection('papers');
  const rank = { published: 0, working: 1, wip: 2 } as const;
  return all.sort((a, b) => rank[a.data.status] - rank[b.data.status] || a.data.order - b.data.order);
}

/** Plain-text abstract (markdown body, whitespace collapsed). */
export const abstractOf = (p: Paper) => (p.body ?? '').replace(/\s+/g, ' ').trim();

export const toIsoDate = (d: string | Date | undefined) =>
  d === undefined ? undefined : d instanceof Date ? d.toISOString().slice(0, 10) : String(d);

export interface Author {
  name: string;
  url?: string;
  self: boolean;
}

/**
 * Full author list in publication order. Economics papers list authors
 * alphabetically by surname, so that is the default; a paper can override it
 * with an explicit `authorOrder` (list of names) in its frontmatter.
 */
export function authorList(p: Paper, selfName = 'Luigi Caloi'): Author[] {
  const all: Author[] = [{ name: selfName, self: true }, ...p.data.coauthors.map((c) => ({ ...c, self: false }))];
  const order = p.data.authorOrder;
  if (order?.length) return order.map((n) => all.find((a) => a.name === n) ?? { name: n, self: false });
  const surname = (n: string) => n.trim().split(/\s+/).slice(-1)[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return all.sort((a, b) => surname(a.name).localeCompare(surname(b.name)));
}
