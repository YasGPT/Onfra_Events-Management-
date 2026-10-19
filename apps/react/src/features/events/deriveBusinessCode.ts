// Builds a readable business-code suggestion from the event name.
// The code is still the admin's to edit — the backend requires it and enforces uniqueness.
const STOP_WORDS = new Set(['THE', 'OF', 'AND', 'AN', 'FOR', 'AT', 'IN', 'ON', 'MEET', 'ANNUAL']);

export function deriveBusinessCode(name: string, seed = 0): string {
  const cleaned = (name || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  if (!cleaned) return '';

  const words = cleaned.split(' ').filter((word) => word && !STOP_WORDS.has(word));
  const year = /(20\d{2})/.exec(cleaned)?.[1];
  const lettersOnly = words.filter((word) => !/^20\d{2}$/.test(word));

  let stem = '';
  if (lettersOnly.length >= 2) {
    stem = `${lettersOnly[0].slice(0, 4)}${lettersOnly[1].slice(0, 3)}`;
  } else if (lettersOnly.length === 1) {
    stem = lettersOnly[0].slice(0, 7);
  } else {
    stem = cleaned.replace(/\s+/g, '').slice(0, 7);
  }

  stem = stem.replace(/[^A-Z0-9]/g, '');
  const suffix = year ? year.slice(2) : '';
  const tail = seed > 0 ? String((seed * 37) % 100).padStart(2, '0') : '';
  const base = suffix ? `${stem.slice(0, 6)}${suffix}` : stem.slice(0, 8);

  return (base + tail).slice(0, 20);
}

export default deriveBusinessCode;
