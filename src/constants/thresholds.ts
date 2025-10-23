// Thresholds centralizados do Dashboard
export interface SeverityThresholds {
  warning: number;
  critical: number;
  inverse?: boolean;
}

export const MEMORY_USAGE_THRESHOLDS: SeverityThresholds = {
  warning: 80,
  critical: 90,
};

export const FRAGMENTATION_THRESHOLDS: SeverityThresholds = {
  warning: 1.4,
  critical: 1.5,
};

export const HIT_RATE_THRESHOLDS: SeverityThresholds = {
  warning: 80,
  critical: 60,
  inverse: true,
};

export const EVICTIONS_RATE_THRESHOLDS: SeverityThresholds = {
  warning: 0.1,
  critical: 1,
};

export const EXPIRED_RATE_THRESHOLDS: SeverityThresholds = {
  warning: 10,
  critical: 100,
};

export const REJECTED_RATE_THRESHOLDS: SeverityThresholds = {
  warning: 0.5,
  critical: 2,
};
