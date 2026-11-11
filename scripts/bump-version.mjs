import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'package.json');
const versionPath = path.join(root, 'src', 'version.js');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const match = String(pkg.version || '').match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/);
if (!match) throw new Error(`Invalid semantic version in package.json: ${pkg.version}`);
const nextVersion = `${Number(match[1])}.${Number(match[2])}.${Number(match[3]) + 1}`;
pkg.version = nextVersion;
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
fs.writeFileSync(versionPath, `// Updated automatically by scripts/bump-version.mjs during every GitHub Pages publication.\nexport const APP_VERSION = '${nextVersion}';\n`);
console.log(nextVersion);
