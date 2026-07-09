// Ambient shim for Leaflet.
//
// Leaflet ships no type declarations and we intentionally avoid the
// @types/leaflet dev-dependency (keeping the dependency tree lean). This file
// is a non-module (no imports/exports), so it is a global ambient declaration
// — declaring the module as `any`. It must live in a standalone .d.ts; placing
// `declare module "leaflet"` inside a .tsx is read as a module *augmentation*,
// which TypeScript rejects for an untyped module (TS2665).
declare module "leaflet";
declare module "leaflet/dist/leaflet.css";
