// Deterministic "poster" art generated from a movie's id/title instead of
// hotlinked stock images — keeps the UI visually rich without broken links
// or licensing questions, and reads as a deliberate design choice.

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const PALETTES: [string, string][] = [
  ["#3c2a1e", "#e2ac54"],
  ["#1f2f2c", "#4f9d94"],
  ["#331b1b", "#c4693f"],
  ["#241f33", "#8d78c9"],
  ["#2c2410", "#f0c07a"],
  ["#1a2733", "#6fa8d1"],
  ["#301c26", "#c9698f"],
  ["#233318", "#8fb35a"],
];

export function posterStyle(seed: string) {
  const h = hashString(seed);
  const [from, to] = PALETTES[h % PALETTES.length];
  const angle = 25 + (h % 130);
  return {
    background: `linear-gradient(${angle}deg, ${from} 0%, ${to} 130%)`,
  };
}

export function initials(title: string): string {
  const words = title.replace(/^(The|A|An)\s+/i, "").split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }
  return (words[0] ?? title).slice(0, 3).toUpperCase();
}
