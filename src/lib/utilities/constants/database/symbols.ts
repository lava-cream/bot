export const PlayerSymbols = {
  wallet: Symbol('wallet'),
  bank: Symbol('bank')
} as const; 

export const Symbols = {
  player: PlayerSymbols
} as const;