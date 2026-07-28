import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = join(root, 'dist', 'ngbootstrap');
const sourcePkgPath = join(root, 'package.json');
const distPkgPath = join(distDir, 'package.json');
const expectedPackageName = '@angular-bootstrap/ngbootstrap';
const requiredOptionalPeers = ['chart.js'];
const requiredAngularPeers = ['@angular/common', '@angular/core', '@angular/forms'];
const forbiddenPeerNames = ['x' + 'lsx', 'jspdf', 'jspdf-autotable'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(existsSync(sourcePkgPath), 'Source package.json is missing.');
assert(existsSync(distPkgPath), 'Built dist/ngbootstrap/package.json is missing. Run pnpm build first.');

const sourcePkg = readJson(sourcePkgPath);
const distPkg = readJson(distPkgPath);

assert(sourcePkg.name === expectedPackageName, `Expected source package name ${expectedPackageName}, received ${sourcePkg.name}.`);
assert(distPkg.name === expectedPackageName, `Expected dist package name ${expectedPackageName}, received ${distPkg.name}.`);
assert(sourcePkg.version === distPkg.version, `Source version ${sourcePkg.version} does not match dist version ${distPkg.version}.`);
assert(sourcePkg.private === false, 'Source package must be publishable with private: false.');
assert(distPkg.private !== true, 'Dist package must not be private.');
assert(sourcePkg.publishConfig?.access === 'public', 'publishConfig.access must be public.');
assert(sourcePkg.license === 'MIT', 'Package license must be MIT.');
assert(sourcePkg.repository?.url?.includes('github.com/angular-bootstrap/ngbootstrap'), 'Repository must point to angular-bootstrap/ngbootstrap.');
assert(sourcePkg.sideEffects === false, 'sideEffects must remain false for tree-shaking.');
for (const peerName of forbiddenPeerNames) {
  assert(!sourcePkg.peerDependencies?.[peerName], `${peerName} must not be published as a supported optional peer.`);
}
assert(existsSync(join(distDir, 'README.md')), 'Dist package README.md is missing.');
assert(existsSync(join(distDir, 'fesm2022')), 'Dist package fesm2022 output is missing.');
assert(existsSync(join(distDir, 'types')), 'Dist package type declarations are missing.');

for (const peerName of requiredAngularPeers) {
  assert(sourcePkg.peerDependencies?.[peerName] === '>=21.0.0 <23.0.0', `${peerName} peer range must remain >=21.0.0 <23.0.0.`);
}

for (const peerName of requiredOptionalPeers) {
  assert(sourcePkg.peerDependencies?.[peerName], `${peerName} must remain declared as a peer dependency.`);
  assert(sourcePkg.peerDependenciesMeta?.[peerName]?.optional === true, `${peerName} must remain an optional peer dependency.`);
}

// Load the partial-compiled bundle with the JIT compiler available to catch
// top-level circular references that source-level tests cannot reproduce.
await import('@angular/compiler');
const bundle = await import(pathToFileURL(join(distDir, distPkg.module)).href);
assert(typeof bundle.Datagrid === 'function', 'Built package must export Datagrid.');
assert(typeof bundle.NgbGridHighlightDirective === 'function', 'Built package must export NgbGridHighlightDirective.');

console.log(`Release package verified: ${distPkg.name}@${distPkg.version}`);
