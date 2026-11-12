// Types for regions.mjs (plain ESM shared with resources/build_static.mjs).
/** The main.js tables the renderers read (see tables.mjs TABLE_NAMES). */
export type Tables = Record<string, any>;
export const ORIGIN: string;
export const LANG: string;
export const STAMP: string;
export function servicesBlock(T: Tables): string;
export function bandBlock(T: Tables): string;
export function archiveBlock(T: Tables): string;
export function reviewsLD(T: Tables): object;
export function projectsLD(T: Tables): object;
export function ldScript(obj: object): string;
export function regionInner(body: string): string;
export function fill(html: string, name: string, body: string, file: string): string;
export function pageRegions(T: Tables): Record<string, Record<string, string>>;
