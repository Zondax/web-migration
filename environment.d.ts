// noinspection JSUnusedGlobalSymbols

export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_LOCATIONIQ_TOKEN: string
    }
  }
}
