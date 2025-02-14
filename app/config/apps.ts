export enum AppIds {
  POLKADOT = 'polkadot',
  POLYMESH = 'polymesh',
  DOCK = 'dock',
  CENTRIFUGE = 'centrifuge',
  EDGEWARE = 'edgeware',
  EQUILIBRIUM = 'equilibrium',
  STATEMINT = 'statemint',
  STATEMINE = 'statemine',
  NODLE = 'nodle',
  KUSAMA = 'kusama',
  KARURA = 'karura',
  ACALA = 'acala',
  VTB = 'vtb',
  PEER = 'peer',
  GENSHIRO = 'genshiro',
  SORA = 'sora',
  POLKADEX = 'polkadex',
  BIFROST = 'bifrost',
  REEF = 'reef',
  XXNETWORK = 'xxnetwork',
  ALEPHZERO = 'alephzero',
  INTERLAY = 'interlay',
  PARALLEL = 'parallel',
  PICASSO = 'picasso',
  COMPOSABLE = 'composable',
  ASTAR = 'astar',
  ORIGINTRAIL = 'origintrail',
  HYDRADX = 'hydradx',
  STAFI = 'stafi',
  UNIQUE = 'unique',
  BIFROSTKUSAMA = 'bifrostkusama',
  PHALA = 'phala',
  KHALA = 'khala',
  DARWINIA = 'darwinia',
  AJUNA = 'ajuna',
  BITTENSOR = 'bittensor',
  TERNOA = 'ternoa',
  PENDULUM = 'pendulum',
  ZEITGEIST = 'zeitgeist',
  JOYSTREAM = 'joystream',
  ENJIN = 'enjin',
  MATRIXCHAIN = 'matrixchain',
  QUARTZ = 'quartz',
  AVAIL = 'avail',
  ENTROPY = 'entropy',
  PEAQ = 'peaq',
  AVAILRECOVERY = 'availrecovery'
}

export interface AppConfig {
  id: AppIds;
  name: string;
  cla: number;
  bip44Path: string;
  ss58Prefix: number;
  rpcEndpoint?: string;
  ticker: string;
}

// Create the Map with app configs
export const appsConfigs = new Map<AppIds, AppConfig>([
  [
    AppIds.POLKADOT,
    {
      name: 'Polkadot',
      id: AppIds.POLKADOT,
      cla: 0x90,
      bip44Path: "m/44'/354'/0'/0'/0'", // 354 = 0x80000162
      ss58Prefix: 0,
      rpcEndpoint: 'wss://rpc.polkadot.io',
      ticker: 'DOT'
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
      ticker: 'POLYX'
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
      ticker: 'DOCK'
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
      ticker: 'CFG'
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
      ticker: 'EDG'
    }
  ],
  [
    AppIds.EQUILIBRIUM,
    {
      name: 'Equilibrium',
      id: AppIds.EQUILIBRIUM,
      cla: 0x95,
      bip44Path: "m/44'/2242269181'/0'/0'/0'", // 2242269181 = 0x85f5e0fd
      ss58Prefix: 67,
      rpcEndpoint: 'wss://equilibrium.api.onfinality.io/public-ws',
      ticker: 'EQ'
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
      ticker: 'STATEMINT'
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
      ticker: 'STATEMINE'
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
      ticker: 'NODL'
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
      ticker: 'KSM'
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
      ticker: 'KAR'
    }
  ],
  [
    AppIds.ACALA,
    {
      name: 'Acala',
      id: AppIds.ACALA,
      cla: 0x9b,
      bip44Path: "m/44'/787'/0'/0'/0'", // 787 = 0x80000313
      ss58Prefix: 10,
      rpcEndpoint: 'wss://acala-rpc.aca-api.network',
      ticker: 'ACA'
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
      ticker: 'VTB'
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
      ticker: 'PEER'
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
      ticker: 'GENS'
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
      ticker: 'XOR'
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
      ticker: 'PDEX'
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
      ticker: 'BNC'
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
      ticker: 'REEF'
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
      ticker: 'XX'
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
      ticker: 'AZERO'
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
      ticker: 'INTR'
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
      ticker: 'PARA'
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
      ticker: 'PICA'
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
      ticker: 'LAYR'
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
      ticker: 'ASTR'
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
      ticker: 'TRAC'
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
      ticker: 'HDX'
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
      ticker: 'FIS'
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
      ticker: 'UNQ'
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
      ticker: 'BNC'
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
      ticker: 'PHA'
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
      rpcEndpoint: 'wss://khala.api.onfinality.io/public-ws',
      ticker: 'KHA'
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
      ticker: 'RING'
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
      rpcEndpoint: 'wss://ajuna.api.onfinality.io/public-ws',
      ticker: 'AJUN'
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
      ticker: 'TAO'
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
      ticker: 'CAPS'
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
      ticker: 'PEN'
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
      ticker: 'ZTG'
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
      ticker: 'JOY'
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
      ticker: 'ENJ'
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
      ticker: 'MATRIX'
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
      ticker: 'QTZ'
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
      ticker: 'AVAIL'
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
      ticker: 'ENT'
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
      ticker: 'PQT'
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
      ticker: 'AVAIL'
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
