const STORAGE_KEY = 'lid_jid_map';

function readMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function resolveJid(jid: string): string {
  const map = readMap();
  return map[jid] || jid;
}

export function saveJidMapping(lid: string, jid: string): void {
  const map = readMap();
  if (map[lid] === jid) return;
  map[lid] = jid;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event('jid_lid_updated'));
}

export function getJidMapping(): Record<string, string> {
  return readMap();
}

export function findJidByLid(lid: string): string | undefined {
  const map = readMap();
  return map[lid];
}