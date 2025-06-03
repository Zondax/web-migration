import appsConfigData from './appsConfig.json'

export interface Token {
  symbol: string
  decimals: number
  logoId?: string
}

// Extract app IDs dynamically from the JSON data
export type AppId = (typeof appsConfigData)[number]['id'] | 'polkadot'

export interface AppConfig {
  id: AppId
  name: string
  cla: number
  bip44Path: string
  ss58Prefix: number
  rpcEndpoint?: string
  peopleRpcEndpoint?: string
  token: Token
}

// Polkadot app config
export const polkadotAppConfig: AppConfig = {
  name: 'Polkadot',
  id: 'polkadot' as AppId,
  cla: 144, // 0x90
  bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
  ss58Prefix: 0,
  rpcEndpoint: 'wss://rpc.polkadot.io',
  token: {
    symbol: 'DOT',
    decimals: 10,
    logoId: 'polkadot',
  },
}

/**
 * Load app configurations from JSON data
 * @returns A Map with app configurations indexed by AppId
 */
export function loadAppConfigs(): Map<AppId, AppConfig> {
  const appsConfigs = new Map<AppId, AppConfig>()

  // Convert JSON data to AppConfig objects and add to the map
  for (const config of appsConfigData) {
    appsConfigs.set(config.id as AppId, {
      ...config,
      id: config.id as AppId,
      // Add token field for compatibility
      token: {
        symbol: config.token.symbol,
        decimals: config.token.decimals,
        logoId: config.token.logoId || config.id,
      },
    })
  }

  return appsConfigs
}

// Create the Map with app configs
export const appsConfigs = loadAppConfigs()

// Helper object to help with type inference
export const appsConfigsObj = Object.fromEntries(appsConfigs)

// Helper function to get BIP44 path for a chain
export const getChainPath = (appId: AppId): string | undefined => {
  const appConfig = appsConfigs.get(appId)
  return appConfig ? appConfig.bip44Path : undefined
}

// Helper function to get SS58 prefix for a chain
export const getChainPrefix = (appId: AppId): number | undefined => {
  const appConfig = appsConfigs.get(appId)
  return appConfig ? appConfig.ss58Prefix : undefined
}

// Helper function to get SS58 prefix for a chain
export const getChainName = (appId: AppId): string | undefined => {
  const appConfig = appsConfigs.get(appId)
  return appConfig ? appConfig.name : undefined
}
