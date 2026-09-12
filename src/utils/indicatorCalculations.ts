import type { Indicator, Year } from '../types';

export function indicatorValue(indicator: Indicator, year: Year) {
  return indicator.yearlyValues.find((item) => item.year === year) ?? indicator.yearlyValues[0];
}

export function isIndicatorFilled(indicator: Indicator, year: Year) {
  const value = indicatorValue(indicator, year);
  return value?.target != null && value?.actual != null;
}

export function isIndicatorAchieved(indicator: Indicator, year: Year) {
  const value = indicatorValue(indicator, year);
  return value?.target != null && value?.actual != null && value.actual >= value.target;
}
