export const enum PlayerLimits {
  Wallet = 2_000_000,
  Bet = 100_000,
  Bank = 5_000_000,
  Star = 1_000,
  Energy = 100,
  Multiplier = 0,
  Level = 500,
  Tier = 100,
  Mastery = 25
}

export const enum PlayerDefaults {
  Wallet = 0,
  Bet = PlayerLimits.Bet,
  Bank = 0,
  Star = PlayerLimits.Star * 0.1,
  Energy = PlayerLimits.Energy * 0.1,
  Multiplier = 0,
  Level = 0,
  Tier = 0,
  Mastery = 0
}

export const enum PlayerEnergy {
  StarRatio = 100, // X Stars = 1 Energy
  DefaultDuration = 60, // X Minutes
  TierAddedDefaultDuration = DefaultDuration * 0.25 // X Minutes
}

export const enum PlayerLevel {
  ExperienceRatio = 100, // X XP = 1 Level
  ExperienceMultiplier = 0,
  TierAddedExperienceMultiplier = 10
}

export const enum PlayerTierRequirements {
  Wallet = PlayerLimits.Wallet * 0.25,
  Star = PlayerLimits.Star * 0.25,
  Level = PlayerLimits.Level / PlayerLimits.Tier * 0.4,
}

export const enum PlayerTierAddedLimits {
  Energy = (500 - PlayerLimits.Energy) / PlayerLimits.Tier,
  Multiplier = (500 - PlayerLimits.Multiplier) / PlayerLimits.Tier
}

export const enum PlayerMasteryRequirements {
  Star = PlayerLimits.Star / PlayerLimits.Mastery,
  Tier = PlayerLimits.Tier / PlayerLimits.Mastery
}

export const enum PlayerMasteryAddedLimits {
  Wallet = (10_000_000 - PlayerLimits.Wallet) / PlayerLimits.Mastery,
  Bet = (500_000 - PlayerLimits.Bet) / PlayerLimits.Mastery,
  Bank = (25_000_000 - PlayerLimits.Bank) / PlayerLimits.Mastery,
  Level = (1_000 - PlayerLimits.Level) / PlayerLimits.Mastery
}