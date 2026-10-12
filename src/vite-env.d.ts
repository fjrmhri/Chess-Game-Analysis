/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_URL_PROXY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
