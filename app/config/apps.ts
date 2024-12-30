interface AppConfig {
  name: string;
  cla: number;
  bip44Path: string;
  ss58Prefix: number;
  rpcEndpoint?: string;
}

// the key and the name must be the same.
export const appsConfigs: Record<string, AppConfig> = {
  POLKADOT: {
    name: 'Polkadot',
    cla: 0x90,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 0,
    rpcEndpoint: 'wss://rpc.polkadot.io'
  },
  POLYMESH: {
    name: 'Polymesh',
    cla: 0x91,
    bip44Path: "m/44'/595'/0'/0'/0'", // 595 = 0x80000253
    ss58Prefix: 12
  },
  DOCK: {
    name: 'Dock',
    cla: 0x92,
    bip44Path: "m/44'/594'/0'/0'/0'", // 594 = 0x80000252
    ss58Prefix: 22
  },
  CENTRIFUGE: {
    name: 'Centrifuge',
    cla: 0x93,
    bip44Path: "m/44'/747'/0'/0'/0'", // 747 = 0x800002eb
    ss58Prefix: 36
  },
  EDGEWARE: {
    name: 'Edgeware',
    cla: 0x94,
    bip44Path: "m/44'/523'/0'/0'/0'", // 523 = 0x8000020b
    ss58Prefix: 7
  },
  EQUILIBRIUM: {
    name: 'Equilibrium',
    cla: 0x95,
    bip44Path: "m/44'/2242269181'/0'/0'/0'", // 2242269181 = 0x85f5e0fd
    ss58Prefix: 67,
    rpcEndpoint: 'wss://equilibrium.api.onfinality.io/public-ws'
  },
  STATEMINT: {
    name: 'Statemint',
    cla: 0x96,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 0
  },
  STATEMINE: {
    name: 'Statemine',
    cla: 0x97,
    bip44Path: "m/44'/434'/0'/0'/0'", // 434 = 0x800001b2
    ss58Prefix: 2
  },
  NODLE: {
    name: 'Nodle',
    cla: 0x98,
    bip44Path: "m/44'/1003'/0'/0'/0'", // 1003 = 0x800003eb
    ss58Prefix: 37,
    rpcEndpoint: 'wss://nodle-parachain.api.onfinality.io/public-ws'
  },
  KUSAMA: {
    name: 'Kusama',
    cla: 0x99,
    bip44Path: "m/44'/434'/0'/0'/0'", // 434 = 0x800001b2
    ss58Prefix: 2,
    rpcEndpoint: 'wss://kusama-rpc.polkadot.io'
  },
  KARURA: {
    name: 'Karura',
    cla: 0x9a,
    bip44Path: "m/44'/686'/0'/0'/0'", // 686 = 0x800002ae
    ss58Prefix: 8,
    rpcEndpoint: 'wss://karura-rpc-0.aca-api.network'
  },
  ACALA: {
    name: 'Acala',
    cla: 0x9b,
    bip44Path: "m/44'/787'/0'/0'/0'", // 787 = 0x80000313
    ss58Prefix: 10,
    rpcEndpoint: 'wss://acala-rpc.aca-api.network'
  },
  VTB: {
    name: 'VTB',
    cla: 0x9c,
    bip44Path: "m/44'/694'/0'/0'/0'", // 694 = 0x800002b6
    ss58Prefix: 42
  },
  PEER: {
    name: 'Peer',
    cla: 0x9d,
    bip44Path: "m/44'/718'/0'/0'/0'", // 718 = 0x800002ce
    ss58Prefix: 42
  },
  GENSHIRO: {
    name: 'Genshiro',
    cla: 0x9e,
    bip44Path: "m/44'/2242269180'/0'/0'/0'", // 2242269180 = 0x85f5e0fc
    ss58Prefix: 67
  },
  SORA: {
    name: 'Sora',
    cla: 0x9f,
    bip44Path: "m/44'/617'/0'/0'/0'", // 617 = 0x80000269
    ss58Prefix: 69,
    rpcEndpoint: 'wss://sora.api.onfinality.io/public-ws'
  },
  POLKADEX: {
    name: 'Polkadex',
    cla: 0xa0,
    bip44Path: "m/44'/799'/0'/0'/0'", // 799 = 0x8000031f
    ss58Prefix: 88,
    rpcEndpoint: 'wss://polkadex.api.onfinality.io/public-ws'
  },
  BIFROST: {
    name: 'Bifrost',
    cla: 0xa1,
    bip44Path: "m/44'/788'/0'/0'/0'", // 788 = 0x80000314
    ss58Prefix: 6
  },
  REEF: {
    name: 'Reef',
    cla: 0xa2,
    bip44Path: "m/44'/819'/0'/0'/0'", // 819 = 0x80000333
    ss58Prefix: 42
  },
  XXNETWORK: {
    name: 'XXNetwork',
    cla: 0xa3,
    bip44Path: "m/44'/1955'/0'/0'/0'", // 1955 = 0x800007a3
    ss58Prefix: 55
  },
  ALEPHZERO: {
    name: 'AlephZero',
    cla: 0xa4,
    bip44Path: "m/44'/643'/0'/0'/0'", // 643 = 0x80000283
    ss58Prefix: 42,
    rpcEndpoint: 'wss://aleph-zero.api.onfinality.io/public-ws'
  },
  INTERLAY: {
    name: 'Interlay',
    cla: 0xa5,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 2032
  },
  PARALLEL: {
    name: 'Parallel',
    cla: 0xa6,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 172
  },
  PICASSO: {
    name: 'Picasso',
    cla: 0xa7,
    bip44Path: "m/44'/434'/0'/0'/0'", // 434 = 0x800001b2
    ss58Prefix: 49
  },
  COMPOSABLE: {
    name: 'Composable',
    cla: 0xa8,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 49
  },
  ASTAR: {
    name: 'Astar',
    cla: 0xa9,
    bip44Path: "m/44'/810'/0'/0'/0'", // 810 = 0x8000032a
    ss58Prefix: 5,
    rpcEndpoint: 'wss://astar.api.onfinality.io/public-ws'
  },
  ORIGINTRAIL: {
    name: 'OriginTrail',
    cla: 0xaa,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 101
  },
  HYDRADX: {
    name: 'HydraDX',
    cla: 0xab,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 63
  },
  STAFI: {
    name: 'Stafi',
    cla: 0xac,
    bip44Path: "m/44'/907'/0'/0'/0'", // 907 = 0x8000038b
    ss58Prefix: 20
  },
  UNIQUE: {
    name: 'Unique',
    cla: 0xad,
    bip44Path: "m/44'/661'/0'/0'/0'", // 661 = 0x80000295
    ss58Prefix: 7391
  },
  BIFROSTKUSAMA: {
    name: 'BifrostKusama',
    cla: 0xae,
    bip44Path: "m/44'/788'/0'/0'/0'", // 788 = 0x80000314
    ss58Prefix: 6
  },
  PHALA: {
    name: 'Phala',
    cla: 0xaf,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 30,
    rpcEndpoint: 'wss://phala.api.onfinality.io/public-ws'
  },
  KHALA: {
    name: 'Khala',
    cla: 0xb1,
    bip44Path: "m/44'/434'/0'/0'/0'", // 434 = 0x800001b2
    ss58Prefix: 30,
    rpcEndpoint: 'wss://khala.api.onfinality.io/public-ws'
  },
  DARWINIA: {
    name: 'Darwinia',
    cla: 0xb2,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 18
  },
  AJUNA: {
    name: 'Ajuna',
    cla: 0xb3,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 1328,
    rpcEndpoint: 'wss://ajuna.api.onfinality.io/public-ws'
  },
  BITTENSOR: {
    name: 'Bittensor',
    cla: 0xb4,
    bip44Path: "m/44'/1005'/0'/0'/0'", // 1005 = 0x800003ed
    ss58Prefix: 42,
    rpcEndpoint: 'wss://bittensor-finney.api.onfinality.io/public-ws'
  },
  TERNOA: {
    name: 'Ternoa',
    cla: 0xb5,
    bip44Path: "m/44'/995'/0'/0'/0'", // 995 = 0x800003e3
    ss58Prefix: 42
  },
  PENDULUM: {
    name: 'Pendulum',
    cla: 0xb6,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 56
  },
  ZEITGEIST: {
    name: 'Zeitgeist',
    cla: 0xb7,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 73,
    rpcEndpoint: 'wss://zeitgeist.api.onfinality.io/public-ws'
  },
  JOYSTREAM: {
    name: 'Joystream',
    cla: 0xb8,
    bip44Path: "m/44'/537'/0'/0'/0'", // 537 = 0x80000219
    ss58Prefix: 126
  },
  ENJIN: {
    name: 'Enjin',
    cla: 0xb9,
    bip44Path: "m/44'/1155'/0'/0'/0'", // 1155 = 0x80000483
    ss58Prefix: 2135
  },
  MATRIXCHAIN: {
    name: 'Matrixchain',
    cla: 0xba,
    bip44Path: "m/44'/1155'/0'/0'/0'", // 1155 = 0x80000483
    ss58Prefix: 1110
  },
  QUARTZ: {
    name: 'Quartz',
    cla: 0xbb,
    bip44Path: "m/44'/631'/0'/0'/0'", // 631 = 0x80000277
    ss58Prefix: 255
  },
  AVAIL: {
    name: 'Avail',
    cla: 0xbc,
    bip44Path: "m/44'/709'/0'/0'/0'", // 709 = 0x800002c5
    ss58Prefix: 42,
    rpcEndpoint: 'wss://avail.api.onfinality.io/public-ws'
  },
  ENTROPY: {
    name: 'Entropy',
    cla: 0xbd,
    bip44Path: "m/44'/1312'/0'/0'/0'", // 1312 = 0x80000520
    ss58Prefix: 42
  },
  PEAQ: {
    name: 'Peaq',
    cla: 0x61,
    bip44Path: "m/44'/60'/0'/0'/0'", // 60 = 0x8000003c
    ss58Prefix: 42,
    rpcEndpoint: 'wss://peaq.api.onfinality.io/public-ws'
  },
  AVAILRECOVERY: {
    name: 'AvailRecovery',
    cla: 0xbe,
    bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
    ss58Prefix: 42
  }
} as const;

// Helper type for type safety
export type AppsId = keyof typeof appsConfigs;

// Helper function to get BIP44 path for a chain
export const getChainPath = (appId: AppsId) => appsConfigs[appId].bip44Path;

// Helper function to get SS58 prefix for a chain
export const getChainPrefix = (appId: AppsId) => appsConfigs[appId].ss58Prefix;
