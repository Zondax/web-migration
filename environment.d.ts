// noinspection JSUnusedGlobalSymbols

export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SOME_SECRET: string
    }
  }
}
