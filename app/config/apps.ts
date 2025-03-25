export enum AppIds {
  ACALA = 'acala',
  AJUNA = 'ajuna',
  ALEPHZERO = 'alephzero',
  ASTAR = 'astar',
  AVAIL = 'avail',
  AVAILRECOVERY = 'availrecovery',
  BIFROST = 'bifrost',
  BIFROSTKUSAMA = 'bifrostkusama',
  BITTENSOR = 'bittensor',
  CENTRIFUGE = 'centrifuge',
  COMPOSABLE = 'composable',
  DARWINIA = 'darwinia',
  DOCK = 'dock',
  EDGEWARE = 'edgeware',
  ENJIN = 'enjin',
  ENTROPY = 'entropy',
  EQUILIBRIUM = 'equilibrium',
  GENSHIRO = 'genshiro',
  HYDRADX = 'hydradx',
  INTERLAY = 'interlay',
  JOYSTREAM = 'joystream',
  KARURA = 'karura',
  KHALA = 'khala',
  KUSAMA = 'kusama',
  MATRIXCHAIN = 'matrixchain',
  NODLE = 'nodle',
  ORIGINTRAIL = 'origintrail',
  PARALLEL = 'parallel',
  PEAQ = 'peaq',
  PEER = 'peer',
  PENDULUM = 'pendulum',
  PHALA = 'phala',
  PICASSO = 'picasso',
  POLKADEX = 'polkadex',
  POLKADOT = 'polkadot',
  POLYMESH = 'polymesh',
  QUARTZ = 'quartz',
  REEF = 'reef',
  SORA = 'sora',
  STAFI = 'stafi',
  STATEMINE = 'statemine',
  STATEMINT = 'statemint',
  TERNOA = 'ternoa',
  UNIQUE = 'unique',
  VTB = 'vtb',
  XXNETWORK = 'xxnetwork',
  ZEITGEIST = 'zeitgeist'
}

export interface AppConfig {
  id: AppIds;
  name: string;
  cla: number;
  bip44Path: string;
  ss58Prefix: number;
  rpcEndpoint?: string;
  ticker: string;
  decimals: number;
}

// Polkadot app config
export const polkadotAppConfig: AppConfig = {
  name: 'Polkadot',
  id: AppIds.POLKADOT,
  cla: 0x90,
  bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
  ss58Prefix: 0,
  rpcEndpoint: 'wss://rpc.polkadot.io',
  ticker: 'DOT',
  decimals: 10
};

// Create the Map with app configs
export const appsConfigs = new Map<AppIds, AppConfig>([
  [
    AppIds.ACALA,
    {
      name: 'Acala',
      id: AppIds.ACALA,
      cla: 0x9b,
      bip44Path: "m/44'/787'/0'/0'/0'", // 787 = 0x80000313
      ss58Prefix: 10,
      rpcEndpoint: 'wss://acala-rpc.aca-api.network',
      ticker: 'ACA',
      decimals: 12
    }
  ],
  [
    AppIds.AJUNA,
    {
      name: 'Ajuna',
      id: AppIds.AJUNA,
      cla: 0xb3,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 1328,
      // rpcEndpoint: 'wss://ajuna.api.onfinality.io/public-ws',
      ticker: 'AJUN',
      decimals: 12
    }
  ],
  [
    AppIds.ALEPHZERO,
    {
      name: 'AlephZero',
      id: AppIds.ALEPHZERO,
      cla: 0xa4,
      bip44Path: "m/44'/643'/0'/0'/0'", // 643 = 0x80000283
      ss58Prefix: 42,
      rpcEndpoint: 'wss://aleph-zero.api.onfinality.io/public-ws',
      ticker: 'AZERO',
      decimals: 12
    }
  ],
  [
    AppIds.ASTAR,
    {
      name: 'Astar',
      id: AppIds.ASTAR,
      cla: 0xa9,
      bip44Path: "m/44'/810'/0'/0'/0'", // 810 = 0x8000032a
      ss58Prefix: 5,
      rpcEndpoint: 'wss://astar.api.onfinality.io/public-ws',
      ticker: 'ASTR',
      decimals: 18
    }
  ],
  [
    AppIds.AVAIL,
    {
      name: 'Avail',
      id: AppIds.AVAIL,
      cla: 0xbc,
      bip44Path: "m/44'/709'/0'/0'/0'", // 709 = 0x800002c5
      ss58Prefix: 42,
      rpcEndpoint: 'wss://avail.api.onfinality.io/public-ws',
      ticker: 'AVAIL',
      decimals: 18
    }
  ],
  [
    AppIds.AVAILRECOVERY,
    {
      name: 'AvailRecovery',
      id: AppIds.AVAILRECOVERY,
      cla: 0xbe,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 42,
      ticker: 'AVAIL',
      decimals: 18
    }
  ],
  [
    AppIds.BIFROST,
    {
      name: 'Bifrost',
      id: AppIds.BIFROST,
      cla: 0xa1,
      bip44Path: "m/44'/788'/0'/0'/0'", // 788 = 0x80000314
      ss58Prefix: 6,
      ticker: 'BNC',
      decimals: 12
      // rpcEndpoint: 'wss://bifrost-polkadot.api.onfinality.io/public-ws',
    }
  ],
  [
    AppIds.BIFROSTKUSAMA,
    {
      name: 'BifrostKusama',
      id: AppIds.BIFROSTKUSAMA,
      cla: 0xae,
      bip44Path: "m/44'/788'/0'/0'/0'", // 788 = 0x80000314
      ss58Prefix: 6,
      ticker: 'BNC',
      decimals: 12
    }
  ],
  [
    AppIds.BITTENSOR,
    {
      name: 'Bittensor',
      id: AppIds.BITTENSOR,
      cla: 0xb4,
      bip44Path: "m/44'/1005'/0'/0'/0'", // 1005 = 0x800003ed
      ss58Prefix: 42,
      rpcEndpoint: 'wss://bittensor-finney.api.onfinality.io/public-ws',
      ticker: 'TAO',
      decimals: 9
    }
  ],
  [
    AppIds.CENTRIFUGE,
    {
      name: 'Centrifuge',
      id: AppIds.CENTRIFUGE,
      cla: 0x93,
      bip44Path: "m/44'/747'/0'/0'/0'", // 747 = 0x800002eb
      ss58Prefix: 36,
      ticker: 'CFG',
      decimals: 18
    }
  ],
  [
    AppIds.COMPOSABLE,
    {
      name: 'Composable',
      id: AppIds.COMPOSABLE,
      cla: 0xa8,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 49,
      ticker: 'LAYR',
      decimals: 12
    }
  ],
  [
    AppIds.DARWINIA,
    {
      name: 'Darwinia',
      id: AppIds.DARWINIA,
      cla: 0xb2,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 18,
      ticker: 'RING',
      decimals: 9
    }
  ],
  [
    AppIds.DOCK,
    {
      name: 'Dock',
      id: AppIds.DOCK,
      cla: 0x92,
      bip44Path: "m/44'/594'/0'/0'/0'", // 594 = 0x80000252
      ss58Prefix: 22,
      ticker: 'DOCK',
      decimals: 6
    }
  ],
  [
    AppIds.EDGEWARE,
    {
      name: 'Edgeware',
      id: AppIds.EDGEWARE,
      cla: 0x94,
      bip44Path: "m/44'/523'/0'/0'/0'", // 523 = 0x8000020b
      ss58Prefix: 7,
      ticker: 'EDG',
      decimals: 18
    }
  ],
  [
    AppIds.ENJIN,
    {
      name: 'Enjin',
      id: AppIds.ENJIN,
      cla: 0xb9,
      bip44Path: "m/44'/1155'/0'/0'/0'", // 1155 = 0x80000483
      ss58Prefix: 2135,
      ticker: 'ENJ',
      decimals: 18
    }
  ],
  [
    AppIds.ENTROPY,
    {
      name: 'Entropy',
      id: AppIds.ENTROPY,
      cla: 0xbd,
      bip44Path: "m/44'/1312'/0'/0'/0'", // 1312 = 0x80000520
      ss58Prefix: 42,
      ticker: 'ENT',
      decimals: 12
    }
  ],
  [
    AppIds.EQUILIBRIUM,
    {
      name: 'Equilibrium',
      id: AppIds.EQUILIBRIUM,
      cla: 0x95,
      bip44Path: "m/44'/57597'/0'/0'/0'", // 2242269181 = 0x85f5e0fd
      ss58Prefix: 67,
      rpcEndpoint: 'wss://equilibrium.api.onfinality.io/public-ws',
      ticker: 'EQ',
      decimals: 9
    }
  ],
  [
    AppIds.GENSHIRO,
    {
      name: 'Genshiro',
      id: AppIds.GENSHIRO,
      cla: 0x9e,
      bip44Path: "m/44'/2242269180'/0'/0'/0'", // 2242269180 = 0x85f5e0fc
      ss58Prefix: 67,
      ticker: 'GENS',
      decimals: 9
    }
  ],
  [
    AppIds.HYDRADX,
    {
      name: 'HydraDX',
      id: AppIds.HYDRADX,
      cla: 0xab,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 63,
      ticker: 'HDX',
      decimals: 12
    }
  ],
  [
    AppIds.INTERLAY,
    {
      name: 'Interlay',
      id: AppIds.INTERLAY,
      cla: 0xa5,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 2032,
      ticker: 'INTR',
      decimals: 10
    }
  ],
  [
    AppIds.JOYSTREAM,
    {
      name: 'Joystream',
      id: AppIds.JOYSTREAM,
      cla: 0xb8,
      bip44Path: "m/44'/537'/0'/0'/0'", // 537 = 0x80000219
      ss58Prefix: 126,
      ticker: 'JOY',
      decimals: 10
    }
  ],
  [
    AppIds.KARURA,
    {
      name: 'Karura',
      id: AppIds.KARURA,
      cla: 0x9a,
      bip44Path: "m/44'/686'/0'/0'/0'", // 686 = 0x800002ae
      ss58Prefix: 8,
      rpcEndpoint: 'wss://karura-rpc-0.aca-api.network',
      ticker: 'KAR',
      decimals: 12
    }
  ],
  [
    AppIds.KHALA,
    {
      name: 'Khala',
      id: AppIds.KHALA,
      cla: 0xb1,
      bip44Path: "m/44'/434'/0'/0'/0'", // 434 = 0x800001b2
      ss58Prefix: 30,
      // rpcEndpoint: 'wss://khala.api.onfinality.io/public-ws',
      ticker: 'KHA',
      decimals: 12
    }
  ],
  [
    AppIds.KUSAMA,
    {
      name: 'Kusama',
      id: AppIds.KUSAMA,
      cla: 0x99,
      bip44Path: "m/44'/434'/0'/0'/0'", // 434 = 0x800001b2
      ss58Prefix: 2,
      rpcEndpoint: 'wss://kusama-rpc.polkadot.io',
      ticker: 'KSM',
      decimals: 12
    }
  ],
  [
    AppIds.MATRIXCHAIN,
    {
      name: 'Matrixchain',
      id: AppIds.MATRIXCHAIN,
      cla: 0xba,
      bip44Path: "m/44'/1155'/0'/0'/0'", // 1155 = 0x80000483
      ss58Prefix: 1110,
      ticker: 'MATRIX',
      decimals: 18
    }
  ],
  [
    AppIds.NODLE,
    {
      name: 'Nodle',
      id: AppIds.NODLE,
      cla: 0x98,
      bip44Path: "m/44'/1003'/0'/0'/0'", // 1003 = 0x800003eb
      ss58Prefix: 37,
      rpcEndpoint: 'wss://nodle-parachain.api.onfinality.io/public-ws',
      ticker: 'NODL',
      decimals: 11
    }
  ],
  [
    AppIds.ORIGINTRAIL,
    {
      name: 'OriginTrail',
      id: AppIds.ORIGINTRAIL,
      cla: 0xaa,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 101,
      ticker: 'TRAC',
      decimals: 18
    }
  ],
  [
    AppIds.PARALLEL,
    {
      name: 'Parallel',
      id: AppIds.PARALLEL,
      cla: 0xa6,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 172,
      ticker: 'PARA',
      decimals: 12
    }
  ],
  [
    AppIds.PEAQ,
    {
      name: 'Peaq',
      id: AppIds.PEAQ,
      cla: 0x61,
      bip44Path: "m/44'/60'/0'/0'/0'", // 60 = 0x8000003c
      ss58Prefix: 42,
      rpcEndpoint: 'wss://peaq.api.onfinality.io/public-ws',
      ticker: 'PQT',
      decimals: 18
    }
  ],
  [
    AppIds.PEER,
    {
      name: 'Peer',
      id: AppIds.PEER,
      cla: 0x9d,
      bip44Path: "m/44'/718'/0'/0'/0'", // 718 = 0x800002ce
      ss58Prefix: 42,
      ticker: 'PEER',
      decimals: 10
    }
  ],
  [
    AppIds.PENDULUM,
    {
      name: 'Pendulum',
      id: AppIds.PENDULUM,
      cla: 0xb6,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 56,
      ticker: 'PEN',
      decimals: 12
    }
  ],
  [
    AppIds.PHALA,
    {
      name: 'Phala',
      id: AppIds.PHALA,
      cla: 0xaf,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 30,
      rpcEndpoint: 'wss://phala.api.onfinality.io/public-ws',
      ticker: 'PHA',
      decimals: 12
    }
  ],
  [
    AppIds.PICASSO,
    {
      name: 'Picasso',
      id: AppIds.PICASSO,
      cla: 0xa7,
      bip44Path: "m/44'/434'/0'/0'/0'", // 434 = 0x800001b2
      ss58Prefix: 49,
      ticker: 'PICA',
      decimals: 12
    }
  ],
  [
    AppIds.POLKADEX,
    {
      name: 'Polkadex',
      id: AppIds.POLKADEX,
      cla: 0xa0,
      bip44Path: "m/44'/799'/0'/0'/0'", // 799 = 0x8000031f
      ss58Prefix: 88,
      rpcEndpoint: 'wss://polkadex.api.onfinality.io/public-ws',
      ticker: 'PDEX',
      decimals: 12
    }
  ],
  [
    AppIds.POLYMESH,
    {
      name: 'Polymesh',
      id: AppIds.POLYMESH,
      cla: 0x91,
      bip44Path: "m/44'/595'/0'/0'/0'", // 595 = 0x80000253
      ss58Prefix: 12,
      ticker: 'POLYX',
      decimals: 6
    }
  ],
  [
    AppIds.QUARTZ,
    {
      name: 'Quartz',
      id: AppIds.QUARTZ,
      cla: 0xbb,
      bip44Path: "m/44'/631'/0'/0'/0'", // 631 = 0x80000277
      ss58Prefix: 255,
      ticker: 'QTZ',
      decimals: 18
    }
  ],
  [
    AppIds.REEF,
    {
      name: 'Reef',
      id: AppIds.REEF,
      cla: 0xa2,
      bip44Path: "m/44'/819'/0'/0'/0'", // 819 = 0x80000333
      ss58Prefix: 42,
      ticker: 'REEF',
      decimals: 18
    }
  ],
  [
    AppIds.SORA,
    {
      name: 'Sora',
      id: AppIds.SORA,
      cla: 0x9f,
      bip44Path: "m/44'/617'/0'/0'/0'", // 617 = 0x80000269
      ss58Prefix: 69,
      rpcEndpoint: 'wss://sora.api.onfinality.io/public-ws',
      ticker: 'XOR',
      decimals: 18
    }
  ],
  [
    AppIds.STAFI,
    {
      name: 'Stafi',
      id: AppIds.STAFI,
      cla: 0xac,
      bip44Path: "m/44'/907'/0'/0'/0'", // 907 = 0x8000038b
      ss58Prefix: 20,
      ticker: 'FIS',
      decimals: 12
    }
  ],
  [
    AppIds.STATEMINE,
    {
      name: 'Statemine',
      id: AppIds.STATEMINE,
      cla: 0x97,
      bip44Path: "m/44'/434'/0'/0'/0'", // 434 = 0x800001b2
      ss58Prefix: 2,
      ticker: 'STATEMINE',
      decimals: 12 // Assuming 12 as it's a common asset hub
    }
  ],
  [
    AppIds.STATEMINT,
    {
      name: 'Statemint',
      id: AppIds.STATEMINT,
      cla: 0x96,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 0,
      ticker: 'STATEMINT',
      decimals: 12 //Assuming 12 as it's a common asset hub
    }
  ],
  [
    AppIds.TERNOA,
    {
      name: 'Ternoa',
      id: AppIds.TERNOA,
      cla: 0xb5,
      bip44Path: "m/44'/995'/0'/0'/0'", // 995 = 0x800003e3
      ss58Prefix: 42,
      ticker: 'CAPS',
      decimals: 18
    }
  ],
  [
    AppIds.UNIQUE,
    {
      name: 'Unique',
      id: AppIds.UNIQUE,
      cla: 0xad,
      bip44Path: "m/44'/661'/0'/0'/0'", // 661 = 0x80000295
      ss58Prefix: 7391,
      ticker: 'UNQ',
      decimals: 18
    }
  ],
  [
    AppIds.VTB,
    {
      name: 'VTB',
      id: AppIds.VTB,
      cla: 0x9c,
      bip44Path: "m/44'/694'/0'/0'/0'", // 694 = 0x800002b6
      ss58Prefix: 42,
      ticker: 'VTB',
      decimals: 12
    }
  ],
  [
    AppIds.XXNETWORK,
    {
      name: 'XXNetwork',
      id: AppIds.XXNETWORK,
      cla: 0xa3,
      bip44Path: "m/44'/1955'/0'/0'/0'", // 1955 = 0x800007a3
      ss58Prefix: 55,
      ticker: 'XX',
      decimals: 9
    }
  ],
  [
    AppIds.ZEITGEIST,
    {
      name: 'Zeitgeist',
      id: AppIds.ZEITGEIST,
      cla: 0xb7,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 73,
      rpcEndpoint: 'wss://zeitgeist.api.onfinality.io/public-ws',
      ticker: 'ZTG',
      decimals: 10
    }
  ]
]);

// Helper object to help with type inference
const appsConfigsObj = Object.fromEntries(appsConfigs);

// Helper function to get BIP44 path for a chain
export const getChainPath = (appId: AppIds): string | undefined => {
  const appConfig = appsConfigs.get(appId);
  return appConfig ? appConfig.bip44Path : undefined;
};

// Helper function to get SS58 prefix for a chain
export const getChainPrefix = (appId: AppIds): number | undefined => {
  const appConfig = appsConfigs.get(appId);
  return appConfig ? appConfig.ss58Prefix : undefined;
};
