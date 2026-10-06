/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_PROVIDER?: string;
  readonly VITE_DATA_API_URL?: string;
  readonly VITE_TUNNEL_BACKEND_URL?: string;
  readonly VITE_API_URL?: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
