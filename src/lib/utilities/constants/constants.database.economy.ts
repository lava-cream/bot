export const enum PlayerLimits {
  Wallet = 1_000_000_000,
  Bet = 250_000,
  Bank = 4_000_000_000,
  Star = 100_000,
  Energy = 1_000,
  Multiplier = 100,
  Level = 1_000,
  Tier = 1_000,
  Mastery = 25
}

export const enum PlayerDefaults {
  Wallet = PlayerLimits.Wallet / 400,
  Bet = PlayerLimits.Bet / 2.5,
  Bank = PlayerLimits.Bank / 1_000,
  Star = PlayerLimits.Star / 100,
  Energy = PlayerLimits.Energy / 10,
  Multiplier = 0,
  Level = 0,
  Tier = 0,
  Mastery = 0
}

export const enum PlayerEnergy {
  StarRatio = 100, // X Stars = 1 Energy
  DefaultDuration = 30, // X Minutes
  TierAddedDefaultDuration = 6 // X Minutes
}

export const enum PlayerLevel {
  ExperienceRatio = 100, // X XP = 1 Level
  ExperienceMultiplier = 0,
  TierAddedExperienceMultiplier = 50
}

export const enum PlayerTierRequirements {
  Wallet = (PlayerLimits.Wallet / 1_000) * 5.5,
  Level = (PlayerLevel.ExperienceRatio / PlayerLevel.ExperienceRatio) * 25
}

export const enum PlayerTierAddedValues {
  Energy = PlayerLimits.Energy / 100,
  Multiplier = PlayerLimits.Multiplier / 10
}

export const enum PlayerMasteryRequirements {
  Star = 1_000,
  Tier = 5
}

export const enum PlayerMasteryAddedLimits {
  Wallet = PlayerLimits.Wallet * 0.25,
  Bet = PlayerLimits.Bet * 0.12,
  Bank = PlayerLimits.Bank * 0.25,
  Multiplier = PlayerLimits.Multiplier * 0.25,
  Level = PlayerLimits.Level * 0.25
}
