const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

/** All dependency keys from a parsed package.json (workspace + peer deps included). */
export function dependencyNames(pkg: Record<string, unknown>): string[] {
  const names: string[] = [];
  for (const field of DEP_FIELDS) {
    const value = pkg[field];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      names.push(...Object.keys(value as Record<string, unknown>));
    }
  }
  return names;
}
