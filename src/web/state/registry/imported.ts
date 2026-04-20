import { create } from 'zustand';
import type {
  CreateImportedComponentRequest,
  ImportedComponentDefinition,
  ImportedLibraryComponent,
  UpdateImportedComponentRequest,
} from '../../../shared/types.ts';
import {
  createImportedDefinition,
  deleteImportedDefinition,
  fetchImportedDefinitions,
  fetchImportedLibrary,
  revalidateImportedDefinition,
  updateImportedDefinition,
} from '../../lib/api.ts';

type ImportedComponentsStore = {
  definitions: ImportedComponentDefinition[];
  library: ImportedLibraryComponent[];
  isLoaded: boolean;
  load: () => Promise<void>;
  createDefinition: (body: CreateImportedComponentRequest) => Promise<ImportedComponentDefinition>;
  updateDefinition: (
    id: string,
    body: UpdateImportedComponentRequest,
  ) => Promise<ImportedComponentDefinition>;
  revalidateDefinition: (id: string) => Promise<ImportedComponentDefinition>;
  deleteDefinition: (id: string) => Promise<void>;
};

export const useImportedComponentsStore = create<ImportedComponentsStore>((set, get) => ({
  definitions: [],
  library: [],
  isLoaded: false,
  load: async () => {
    if (get().isLoaded) return;
    const [definitions, library] = await Promise.all([fetchImportedDefinitions(), fetchImportedLibrary()]);
    set({ definitions, library, isLoaded: true });
  },
  createDefinition: async (body) => {
    const definition = await createImportedDefinition(body);
    set((state) => ({
      definitions: [...state.definitions, definition],
    }));
    return definition;
  },
  updateDefinition: async (id, body) => {
    const definition = await updateImportedDefinition(id, body);
    set((state) => ({
      definitions: state.definitions.map((current) => (current.id === id ? definition : current)),
    }));
    return definition;
  },
  revalidateDefinition: async (id) => {
    const definition = await revalidateImportedDefinition(id);
    set((state) => ({
      definitions: state.definitions.map((current) => (current.id === id ? definition : current)),
    }));
    return definition;
  },
  deleteDefinition: async (id) => {
    await deleteImportedDefinition(id);
    set((state) => ({
      definitions: state.definitions.filter((definition) => definition.id !== id),
    }));
  },
}));

export function useImportedDefinitions(): ImportedComponentDefinition[] {
  return useImportedComponentsStore((state) => state.definitions);
}

export function useImportedDefinition(id: string | null): ImportedComponentDefinition | null {
  return useImportedComponentsStore((state) =>
    id ? (state.definitions.find((definition) => definition.id === id) ?? null) : null,
  );
}

export function useImportedLibrary(): ImportedLibraryComponent[] {
  return useImportedComponentsStore((state) => state.library);
}
