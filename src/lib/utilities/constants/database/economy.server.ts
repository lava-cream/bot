export const enum ServerLimits {
  Vault = 100_000_000,
  Keys = 1_000,
  Multiplier = 100,
  Shop = 100,
  Tax = 20
}

export const enum ServerShopLimits {
  Role = ServerLimits.Shop * 0.5,
  TextChannel = ServerLimits.Shop * 0.3,
  VoiceChannel = ServerLimits.Shop * 0.2
}
