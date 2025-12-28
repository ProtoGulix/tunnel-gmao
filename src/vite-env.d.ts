/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_PROVIDER?: string;
  readonly VITE_DATA_API_URL?: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
