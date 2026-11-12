// Types for tables.mjs. NODE ONLY at runtime: evalTables uses `new Function`.
export const TABLE_NAMES: string[];
export function sliceConst(mainSrc: string, name: string): string;
export function evalTables(mainSrc: string, names?: string[]): Record<string, any>;
