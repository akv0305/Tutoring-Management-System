type PolicySettings = {
    rescheduleWindowHours: number
    rescheduleLateFeePercent: number
    rescheduleHardCutoffHours: number
    cancelFreeWindowHours: number
    cancelLateFeePercent: number
    cancelHardCutoffHours: number
    cancelHardCutoffFeePercent: number
    maxReschedulesPerClass: number
  }
  
  type PolicyResult = {
    allowed: boolean
    reason?: string
    feePercent: number
    tier: "free" | "late_fee" | "hard_cutoff" | "blocked"
    message: string
  }
  
  export function evaluateReschedulePolicy(
    scheduledAt: Date,
    now: Date,
    rescheduleCount: number,
    settings: PolicySettings
  ): PolicyResult {
    const hoursUntilClass = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  
    // Check max reschedules
    if (rescheduleCount >= settings.maxReschedulesPerClass) {
      return {
        allowed: false,
        reason: `This class has already been rescheduled ${rescheduleCount} time(s). Maximum is ${settings.maxReschedulesPerClass}.`,
        feePercent: 0,
        tier: "blocked",
        message: "Maximum reschedule limit reached.",
      }
    }
  
    // Class already passed
    if (hoursUntilClass <= 0) {
      return {
        allowed: false,
        reason: "Cannot reschedule a class that has already started or passed.",
        feePercent: 0,
        tier: "blocked",
        message: "Class has already started.",
      }
    }
  
    // Within hard cutoff — blocked
    if (hoursUntilClass <= settings.rescheduleHardCutoffHours) {
      return {
        allowed: false,
        reason: `Cannot reschedule within ${settings.rescheduleHardCutoffHours} hours of the class. Class starts in ${hoursUntilClass.toFixed(1)} hours.`,
        feePercent: 100,
        tier: "blocked",
        message: `Too late to reschedule (within ${settings.rescheduleHardCutoffHours}hr cutoff).`,
      }
    }
  
    // Within late window (between hard cutoff and free window) — late fee
    if (hoursUntilClass <= settings.rescheduleWindowHours) {
      return {
        allowed: true,
        feePercent: settings.rescheduleLateFeePercent,
        tier: "late_fee",
        message: `Late reschedule — ${settings.rescheduleLateFeePercent}% fee applies (class is in ${hoursUntilClass.toFixed(0)} hours).`,
      }
    }
  
    // Outside window — free
    return {
      allowed: true,
      feePercent: 0,
      tier: "free",
      message: "Free reschedule — class is more than " + settings.rescheduleWindowHours + " hours away.",
    }
  }
  
  export function evaluateCancelPolicy(
    scheduledAt: Date,
    now: Date,
    settings: PolicySettings
  ): PolicyResult {
    const hoursUntilClass = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  
    if (hoursUntilClass <= 0) {
      return {
        allowed: false,
        reason: "Cannot cancel a class that has already started or passed.",
        feePercent: 0,
        tier: "blocked",
        message: "Class has already started.",
      }
    }
  
    if (hoursUntilClass <= settings.cancelHardCutoffHours) {
      return {
        allowed: true,
        feePercent: settings.cancelHardCutoffFeePercent,
        tier: "hard_cutoff",
        message: `Cancellation within ${settings.cancelHardCutoffHours}hr cutoff — ${settings.cancelHardCutoffFeePercent}% fee applies.`,
      }
    }
  
    if (hoursUntilClass <= settings.cancelFreeWindowHours) {
      return {
        allowed: true,
        feePercent: settings.cancelLateFeePercent,
        tier: "late_fee",
        message: `Late cancellation — ${settings.cancelLateFeePercent}% fee applies.`,
      }
    }
  
    return {
      allowed: true,
      feePercent: 0,
      tier: "free",
      message: "Free cancellation — class is more than " + settings.cancelFreeWindowHours + " hours away.",
    }
  }
  