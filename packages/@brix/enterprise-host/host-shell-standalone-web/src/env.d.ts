/// <reference types="@rspack/core/module" />

interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly MODE?: string;
  readonly PROD?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const src: string;
  export default src;
}
