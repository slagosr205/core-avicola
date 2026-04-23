type MoneyFormatOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

// Moneda: Lempira hondureno
export function formatHnl(amount: number, opts: MoneyFormatOptions = {}): string {
  const fmt = new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: opts.minimumFractionDigits,
    maximumFractionDigits: opts.maximumFractionDigits,
  })
  return fmt.format(amount)
}
