interface CashFlow {
    amount: number; // Negative for buys/investments, positive for sells/current value
    date: Date;
}

/**
 * Calculates XIRR (Internal Rate of Return for irregular cash flows)
 * Using Newton-Raphson method
 */
export function calculateXIRR(cashFlows: CashFlow[]): number {
    if (cashFlows.length < 2) return 0;

    // Check if we have both positive and negative cash flows to solve
    const hasPositive = cashFlows.some(cf => cf.amount > 0);
    const hasNegative = cashFlows.some(cf => cf.amount < 0);
    if (!hasPositive || !hasNegative) return 0;

    // Sort cash flows chronologically
    const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
    const d0 = sorted[0].date.getTime();

    // Convert dates to fractional years from first date
    const t = sorted.map(cf => (cf.date.getTime() - d0) / (365 * 24 * 60 * 60 * 1000));

    let r = 0.1; // Initial guess of 10%
    const maxIterations = 100;
    const tolerance = 1e-6;

    for (let iter = 0; iter < maxIterations; iter++) {
        let f = 0;
        let df = 0;

        for (let i = 0; i < sorted.length; i++) {
            const amount = sorted[i].amount;
            const time = t[i];

            // Protect against rate <= -1 (which causes complex numbers for fractional exponents)
            const base = 1 + r;
            if (base <= 0.05) {
                r = 0.05 - 1; // Bound rate guess
                continue;
            }

            const factor = Math.pow(base, -time);
            f += amount * factor;
            df += -time * amount * Math.pow(base, -time - 1);
        }

        if (Math.abs(df) < 1e-12) {
            break;
        }

        const nextR = r - f / df;
        
        // Stop if delta is within tolerance
        if (Math.abs(nextR - r) < tolerance) {
            // Cap returns at realistic boundary for outlier checks
            if (isNaN(nextR) || !isFinite(nextR)) return 0;
            return nextR * 100; 
        }

        r = nextR;
    }

    if (isNaN(r) || !isFinite(r)) return 0;
    return r * 100;
}

/**
 * Calculates Compound Annual Growth Rate (CAGR)
 */
export function calculateCAGR(initialValue: number, currentValue: number, startDate: Date, endDate: Date): number {
    if (initialValue <= 0 || currentValue <= 0) return 0;
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const years = diffMs / (365 * 24 * 60 * 60 * 1000);
    
    if (years <= 0) return 0;
    
    return (Math.pow(currentValue / initialValue, 1 / years) - 1) * 100;
}
