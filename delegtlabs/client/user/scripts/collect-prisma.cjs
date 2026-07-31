// Collects lib/db/schema.prisma + each domains/<domain>/schema/<table>.prisma
// into .prisma-build/ (Prisma multi-file requires a single folder).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, ".prisma-build");
const dbSchema = path.join(root, "src/lib/db/schema.prisma");
const domainsRoot = path.join(root, "src/lib/domains");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(dbSchema)) {
  throw new Error(`Missing ${dbSchema}`);
}
fs.copyFileSync(dbSchema, path.join(outDir, "schema.prisma"));

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "prisma") continue;
      walk(full);
      continue;
    }
    if (!entry.name.endsWith(".prisma")) continue;
    const rel = path.relative(domainsRoot, full);
    const parts = rel.split(path.sep);
    if (parts.length === 3 && parts[1] === "schema") {
      fs.copyFileSync(full, path.join(outDir, entry.name));
    }
  }
}

walk(domainsRoot);

const files = fs.readdirSync(outDir);
if (files.length < 2) {
  throw new Error("No domain table prisma files found under src/lib/domains");
}
console.log(`Collected Prisma schemas -> .prisma-build/ (${files.join(", ")})`);
