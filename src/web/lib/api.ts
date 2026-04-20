import type {
  CreateImportedComponentRequest,
  ImportedComponentDefinition,
  ImportedLibraryComponent,
  ThemeConfig,
  UpdateImportedComponentRequest,
} from '../../shared/types.ts';

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchTheme(): Promise<ThemeConfig> {
  return readJson<ThemeConfig>('/api/theme');
}

export async function fetchImportedLibrary(): Promise<ImportedLibraryComponent[]> {
  const body = await readJson<{ components: ImportedLibraryComponent[] }>('/api/imported-components/library');
  return body.components;
}

export async function fetchImportedDefinitions(): Promise<ImportedComponentDefinition[]> {
  const body = await readJson<{ definitions: ImportedComponentDefinition[] }>('/api/imported-components');
  return body.definitions;
}

export async function createImportedDefinition(
  body: CreateImportedComponentRequest,
): Promise<ImportedComponentDefinition> {
  return readJson('/api/imported-components', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateImportedDefinition(
  id: string,
  body: UpdateImportedComponentRequest,
): Promise<ImportedComponentDefinition> {
  return readJson(`/api/imported-components/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function revalidateImportedDefinition(id: string): Promise<ImportedComponentDefinition> {
  return readJson(`/api/imported-components/${id}/revalidate`, {
    method: 'POST',
  });
}

export async function deleteImportedDefinition(id: string): Promise<void> {
  await readJson(`/api/imported-components/${id}`, {
    method: 'DELETE',
  });
}
