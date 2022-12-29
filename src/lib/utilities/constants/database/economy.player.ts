export const enum PlayerLimits {
  Wallet = 100_000_000,
  Bet = 100_000,
  Bank = 250_000_000,
  Star = 100_000,
  Multiplier = 0,
  Level = 1_000,
  Tier = 100,
  Mastery = 25
}

export const enum PlayerDefaults {
  Wallet = PlayerLimits.Bet * 0.1,
  Bet = Wallet,
  Bank = 0,
  Star = PlayerLimits.Star / 100,
  Multiplier = 0,
  Level = 0,
  Tier = 0,
  Mastery = 0
}

export const enum PlayerBet {
  Default = PlayerDefaults.Bet,
  MinLimit = PlayerLimits.Bet / 100,
  MaxLimit = PlayerLimits.Bet,
}

export const enum PlayerBank {
  Default = PlayerDefaults.Bank,
  MaxLimit = PlayerLimits.Bank,
  DefaultSpaceMultiplier = 1,
  MinSpaceMultiplier = 1,
  MaxSpaceMultiplier = 75,
}

export const enum PlayerEnergy {
  StarRatio = 100, // StarRatio = 1 Energy
  StarGain = 10, // StarGain added Per Win
  DefaultDuration = 10, // X Minutes
  TierAddedDefaultDuration = DefaultDuration * 0.2 // X Minutes
}

export const enum PlayerLevel {
  Limit = PlayerLimits.Level,
  MinMultiplier = 1,
  MaxMultiplier = 500
}

export const enum PlayerTierRequirements {
  Wallet = PlayerLimits.Bet * 25,
  Star = PlayerLimits.Star * 0.1,
  Level = (PlayerLimits.Level / PlayerLimits.Tier) * 0.4
}

export const enum PlayerTierAddedLimits {
  Energy = (5_000 - (PlayerLimits.Star / PlayerEnergy.StarRatio)) / PlayerLimits.Tier,
  Multiplier = (500 - PlayerLimits.Multiplier) / PlayerLimits.Tier
}

export const enum PlayerMasteryRequirements {
  Star = PlayerLimits.Star / PlayerLimits.Mastery,
  Tier = PlayerLimits.Tier / PlayerLimits.Mastery
}

export const enum PlayerMasteryAddedLimits {
  Wallet = (500_000_000 - PlayerLimits.Wallet) / PlayerLimits.Mastery,
  Bet = (500_000 - PlayerLimits.Bet) / PlayerLimits.Mastery,
  Bank = (1_000_000_000 - PlayerLimits.Bank) / PlayerLimits.Mastery
}
