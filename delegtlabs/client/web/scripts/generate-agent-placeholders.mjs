/**
 * Regenerates the placeholder artwork under `public/agents/`.
 * These stand in until real images are served from S3 URLs stored with each agent.
 *
 *   node scripts/generate-agent-placeholders.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "agents");

const variants = [
  { slug: "linkedin-growth-agent", label: "LinkedIn Growth", glyph: "in", from: "#dbeafe", to: "#c7d2fe", ink: "#2563eb" },
  { slug: "content-writer-agent", label: "Content Writer", glyph: "✎", from: "#fef3c7", to: "#fed7aa", ink: "#d97706" },
  { slug: "lead-gen-agent", label: "Lead Gen", glyph: "◎", from: "#d1fae5", to: "#ccfbf1", ink: "#059669" },
  { slug: "support-reply-agent", label: "Support Reply", glyph: "◆", from: "#ffe4e6", to: "#fce7f3", ink: "#e11d48" },
];

const svg = ({ label, glyph, from, to, ink }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img" aria-label="${label} agent artwork">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>

  <rect width="800" height="600" fill="url(#bg)"/>
  <circle cx="120" cy="110" r="90" fill="#ffffff" opacity="0.45" filter="url(#soft)"/>
  <circle cx="690" cy="500" r="110" fill="${ink}" opacity="0.12" filter="url(#soft)"/>

  <g transform="translate(140 130)">
    <rect width="520" height="340" rx="22" fill="#ffffff" opacity="0.92"/>
    <rect y="0" width="520" height="46" rx="22" fill="#ffffff"/>
    <rect y="24" width="520" height="22" fill="#ffffff"/>
    <circle cx="30" cy="23" r="6" fill="#ef4444" opacity="0.7"/>
    <circle cx="52" cy="23" r="6" fill="#eab308" opacity="0.7"/>
    <circle cx="74" cy="23" r="6" fill="#10b981" opacity="0.7"/>
    <line x1="0" y1="46" x2="520" y2="46" stroke="#e2e8f0" stroke-width="2"/>

    <rect x="36" y="86" width="86" height="86" rx="22" fill="${ink}"/>
    <text x="79" y="141" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="38" font-weight="700" fill="#ffffff" text-anchor="middle">${glyph}</text>

    <rect x="146" y="92" width="250" height="18" rx="9" fill="#0f172a" opacity="0.82"/>
    <rect x="146" y="124" width="180" height="14" rx="7" fill="#94a3b8" opacity="0.6"/>
    <rect x="146" y="150" width="120" height="14" rx="7" fill="#94a3b8" opacity="0.4"/>

    <rect x="36" y="208" width="448" height="12" rx="6" fill="#e2e8f0"/>
    <rect x="36" y="234" width="392" height="12" rx="6" fill="#e2e8f0"/>
    <rect x="36" y="260" width="300" height="12" rx="6" fill="#e2e8f0"/>

    <rect x="36" y="296" width="112" height="30" rx="15" fill="${ink}" opacity="0.14"/>
    <rect x="160" y="296" width="88" height="30" rx="15" fill="${ink}" opacity="0.1"/>
  </g>

  <text x="400" y="536" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="24" font-weight="600" fill="${ink}" opacity="0.75" text-anchor="middle">${label} Agent</text>
</svg>
`;

await mkdir(outDir, { recursive: true });
for (const variant of variants) {
  await writeFile(join(outDir, `${variant.slug}.svg`), svg(variant), "utf8");
}
console.log(`Wrote ${variants.length} placeholders to public/agents/`);
