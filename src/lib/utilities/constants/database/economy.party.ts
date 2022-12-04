export const enum PartyLimits {
  Size = 5,
  Coins = 100_000_000,
  Multiplier = 100,
  Keys = 100_000,
  Prestige = 10
}

export const enum PartyDefaults {
  Coins = PartyLimits.Coins * (PartyLimits.Size / 100),
  Multiplier = PartyLimits.Multiplier * (PartyLimits.Size / 100),
  Prestige = 0
}

export const enum PartyMemberLimits {
  Coins = PartyLimits.Coins / PartyLimits.Size,
  Multiplier = PartyLimits.Multiplier / PartyLimits.Size,
  Keys = PartyLimits.Keys / PartyLimits.Size
}

export const enum PartyMemberDefaults {
  Coins = PartyLimits.Coins / 100,
  Multiplier = 0,
}

export const enum PartyKeys {
  CoinsRatio = PartyMemberLimits.Coins * 0.25, // Coins to 1 Key
  MultiplierRatio = PartyMemberLimits.Multiplier * 0.1 // Keys to 1 Multiplier
}

export const enum PartyPrestige {
  RequiredCoins = PartyLimits.Coins * 0.18,
  RequiredKeys = PartyLimits.Keys * 0.09,
  AddedCoinsLimit = (500_000_000 - PartyLimits.Coins) / PartyLimits.Prestige,
  AddedMultiplierLimit = PartyLimits.Multiplier / PartyLimits.Prestige,
  AddedKeysLimit = PartyLimits.Keys / PartyLimits.Prestige
}

// and i woke up in love, anti fragile