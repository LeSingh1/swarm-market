// Vite augments ImportMeta.env at build time; declare it for backend tsc.
interface ImportMeta {
  readonly env?: Record<string, string | undefined>
}
