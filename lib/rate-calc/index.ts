export interface RateCalcInputs {
  desiredYearlyIncome: number
  workingDaysPerYear: number
  billableHoursPerDay: number
  businessExpenses: number
  taxRatePercent: number
}

export interface RateCalcResult {
  hourlyRate: number
  dayRate: number
  totalTargetRevenue: number
  totalBillableHoursPerYear: number
  breakdown: {
    income: number
    expenses: number
    taxAmount: number
    totalRevenueNeeded: number
    yearlyHours: number
  }
}

export function calculateHourlyRate(inputs: RateCalcInputs): RateCalcResult {
  const income = Math.max(0, inputs.desiredYearlyIncome || 0)
  const days = Math.max(1, inputs.workingDaysPerYear || 220)
  const hoursPerDay = Math.max(0.1, inputs.billableHoursPerDay || 5)
  const expenses = Math.max(0, inputs.businessExpenses || 0)
  const taxPercent = Math.min(90, Math.max(0, inputs.taxRatePercent || 0))

  // Total billable hours in a year
  const yearlyHours = days * hoursPerDay

  // Total income after expenses needed
  const grossBeforeTaxNeeded = (income + expenses) / (1 - taxPercent / 100)
  const taxAmount = grossBeforeTaxNeeded - (income + expenses)
  const totalRevenueNeeded = grossBeforeTaxNeeded

  const hourlyRate = yearlyHours > 0 ? totalRevenueNeeded / yearlyHours : 0
  const dayRate = hourlyRate * hoursPerDay

  return {
    hourlyRate: Math.round(hourlyRate * 100) / 100,
    dayRate: Math.round(dayRate * 100) / 100,
    totalTargetRevenue: Math.round(totalRevenueNeeded * 100) / 100,
    totalBillableHoursPerYear: Math.round(yearlyHours),
    breakdown: {
      income,
      expenses,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalRevenueNeeded: Math.round(totalRevenueNeeded * 100) / 100,
      yearlyHours: Math.round(yearlyHours),
    },
  }
}
