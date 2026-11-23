import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dimHeoi = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dim-heoi');

export async function snapshotFetch(url) {
  const rel = String(url).replace(/^\.\.\/dim-heoi\//, '');
  const text = await readFile(path.join(dimHeoi, rel), 'utf8');
  return { ok: true, json: async () => JSON.parse(text) };
}

export function readFixture(project, name) {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../../${project}/data/fixtures/${name}`);
  return readFile(file, 'utf8').then((text) => JSON.parse(text));
}
