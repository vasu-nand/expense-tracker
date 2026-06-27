'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Coins, Calendar, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, Home, Zap, Receipt } from 'lucide-react'

interface SpendingPredictorProps {
    data: {
        totalExpense: number;
        totalDays: number;
        averageDailyExpense: number;
        categoryBreakdown: Record<string, number>;
    };
    selectedMonth: string;
}

export function SpendingPredictor({ data, selectedMonth }: SpendingPredictorProps) {
    const { totalExpense, averageDailyExpense, categoryBreakdown = {} } = data;

    // Parse the selected month (YYYY-MM)
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr) || new Date().getFullYear();
    const monthIndex = (parseInt(monthStr) || (new Date().getMonth() + 1)) - 1;

    // Get number of days in the selected month
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Calculate elapsed and remaining days based on current date vs selected month
    const [daysElapsed, setDaysElapsed] = useState(0);
    const [daysRemaining, setDaysRemaining] = useState(totalDaysInMonth);

    useEffect(() => {
        const today = new Date();
        const curYear = today.getFullYear();
        const curMonthIndex = today.getMonth();

        if (year === curYear && monthIndex === curMonthIndex) {
            const elapsed = today.getDate();
            setDaysElapsed(elapsed);
            setDaysRemaining(Math.max(0, totalDaysInMonth - elapsed));
        } else if (year < curYear || (year === curYear && monthIndex < curMonthIndex)) {
            setDaysElapsed(totalDaysInMonth);
            setDaysRemaining(0);
        } else {
            setDaysElapsed(0);
            setDaysRemaining(totalDaysInMonth);
        }
    }, [selectedMonth, totalDaysInMonth, year, monthIndex]);

    // Check if Rent and Bills have already been logged/paid in actual expenses
    const rentPaidVal = categoryBreakdown['Rent'] || 0;
    const billsPaidVal = categoryBreakdown['Bills'] || 0;

    const isRentAlreadyPaid = rentPaidVal > 0;
    const isBillsAlreadyPaid = billsPaidVal > 0;

    // Fixed cost states (user adjustable)
    const [rentAmount, setRentAmount] = useState(15000);
    const [electricityAmount, setElectricityAmount] = useState(2500);

    const [includeRent, setIncludeRent] = useState(true);
    const [includeElectricity, setIncludeElectricity] = useState(true);

    // Initial budget and daily spend guesses
    const defaultBudget = Math.ceil(((averageDailyExpense * totalDaysInMonth) + 17500) / 1000) * 1000 || 45000;
    const defaultDaily = Math.round(averageDailyExpense) || 500;

    const [budget, setBudget] = useState(defaultBudget);
    const [customDaily, setCustomDaily] = useState(defaultDaily);

    // Reset default values when active month or data changes
    useEffect(() => {
        setBudget(defaultBudget);
        setCustomDaily(defaultDaily);
        // If they were already paid, sync the inputs with actual paid values for convenience
        if (isRentAlreadyPaid) {
            setRentAmount(rentPaidVal);
        } else {
            setRentAmount(15000);
        }
        if (isBillsAlreadyPaid) {
            setElectricityAmount(billsPaidVal);
        } else {
            setElectricityAmount(2500);
        }
    }, [selectedMonth, averageDailyExpense, totalDaysInMonth, rentPaidVal, billsPaidVal, isRentAlreadyPaid, isBillsAlreadyPaid]);

    // Predictions logic
    const actualSpent = totalExpense;
    
    // Remaining variable spend projection
    const projectedRemainingVariable = customDaily * daysRemaining;

    // Remaining fixed spend projection (only add if included by user AND not already paid/logged in actual spent)
    const projectedRent = (includeRent && !isRentAlreadyPaid) ? rentAmount : 0;
    const projectedElectricity = (includeElectricity && !isBillsAlreadyPaid) ? electricityAmount : 0;
    const projectedRemainingFixed = projectedRent + projectedElectricity;

    // Total Projected = Actual Spent + Remaining Variable + Remaining Fixed
    const totalProjected = actualSpent + projectedRemainingVariable + projectedRemainingFixed;

    // Difference with budget
    const diff = budget - totalProjected;
    const isOverBudget = diff < 0;
    const absDiff = Math.abs(diff);

    // Progress bar calculations
    const maxValue = Math.max(budget, totalProjected, 1);
    const actualPercent = Math.min(100, (actualSpent / maxValue) * 100);
    const projectedVariablePercent = Math.min(100, (projectedRemainingVariable / maxValue) * 100);
    const projectedFixedPercent = Math.min(100, (projectedRemainingFixed / maxValue) * 100);
    const budgetPercent = (budget / maxValue) * 100;

    return (
        <Card className="border border-border/60 bg-card/50 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 hover:border-border/80">
            <CardHeader className="border-b border-border/10 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 pb-4">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-teal-400" />
                    <CardTitle className="text-xl font-bold">Interactive Spending Predictor & Fixed Costs Planner</CardTitle>
                </div>
                <CardDescription>
                    Plan your expenses for {new Date(year, monthIndex).toLocaleString('default', { month: 'long', year: 'numeric' })}. This tool automatically accounts for fixed costs like Rent and Electricity Bills.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Variable daily spend */}
                    <div className="space-y-4 border-r border-border/10 pr-0 lg:pr-6">
                        <h4 className="text-sm font-semibold text-teal-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Coins className="h-4 w-4" /> Variable Expenses
                        </h4>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground font-medium">
                                Expected Daily Spend for Remaining Days
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                                <input
                                    type="number"
                                    value={customDaily || ''}
                                    onChange={(e) => setCustomDaily(Number(e.target.value))}
                                    className="w-full border rounded-md pl-7 pr-3 py-2 bg-background/50 border-border/40 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-foreground font-semibold"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Current variable/daily average is <span className="font-semibold text-foreground">₹{Math.round(averageDailyExpense)}</span>
                            </p>
                        </div>
                    </div>

                    {/* Column 2: Fixed cost inputs */}
                    <div className="space-y-4 border-r border-border/10 pr-0 lg:pr-6">
                        <h4 className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Receipt className="h-4 w-4" /> Fixed Monthly Costs
                        </h4>
                        
                        {/* Rent Input & Paid Status */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <label className="text-muted-foreground font-medium flex items-center gap-1">
                                    <Home className="h-3 w-3 text-indigo-400" /> Rent Amount
                                </label>
                                {isRentAlreadyPaid ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/10">
                                        Paid (₹{rentPaidVal})
                                    </span>
                                ) : (
                                    <label className="flex items-center gap-1 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={includeRent}
                                            onChange={(e) => setIncludeRent(e.target.checked)}
                                            className="rounded border-border text-primary focus:ring-primary/30 h-3 w-3"
                                        />
                                        <span className="text-[10px] text-muted-foreground">Project it</span>
                                    </label>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-muted-foreground text-xs font-semibold">₹</span>
                                <input
                                    type="number"
                                    value={rentAmount || ''}
                                    onChange={(e) => setRentAmount(Number(e.target.value))}
                                    disabled={isRentAlreadyPaid}
                                    className="w-full border rounded-md pl-7 pr-3 py-1.5 bg-background/50 border-border/40 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-foreground text-sm font-semibold disabled:opacity-60"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Electricity Bill Input & Paid Status */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <label className="text-muted-foreground font-medium flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-amber-400" /> Electricity / Bills
                                </label>
                                {isBillsAlreadyPaid ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/10">
                                        Paid (₹{billsPaidVal})
                                    </span>
                                ) : (
                                    <label className="flex items-center gap-1 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={includeElectricity}
                                            onChange={(e) => setIncludeElectricity(e.target.checked)}
                                            className="rounded border-border text-primary focus:ring-primary/30 h-3 w-3"
                                        />
                                        <span className="text-[10px] text-muted-foreground">Project it</span>
                                    </label>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-muted-foreground text-xs font-semibold">₹</span>
                                <input
                                    type="number"
                                    value={electricityAmount || ''}
                                    onChange={(e) => setElectricityAmount(Number(e.target.value))}
                                    disabled={isBillsAlreadyPaid}
                                    className="w-full border rounded-md pl-7 pr-3 py-1.5 bg-background/50 border-border/40 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-foreground text-sm font-semibold disabled:opacity-60"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Budget Setting */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Calendar className="h-4 w-4" /> Goal & Budget
                        </h4>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground font-medium">
                                Monthly Budget Target
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                                <input
                                    type="number"
                                    value={budget || ''}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    className="w-full border rounded-md pl-7 pr-3 py-2 bg-background/50 border-border/40 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-foreground font-semibold"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Adjust budget limit to see status notifications
                            </p>
                        </div>
                    </div>
                </div>

                {/* Days Info Bar */}
                <div className="flex justify-between items-center text-xs p-3 rounded-lg bg-background/30 border border-border/10">
                    <div>
                        Selected Month: <span className="font-semibold text-foreground">{new Date(year, monthIndex).toLocaleString('default', { month: 'short', year: 'numeric' })} ({totalDaysInMonth} days)</span>
                    </div>
                    <div>
                        Elapsed: <span className="font-semibold text-teal-400">{daysElapsed} days</span>
                    </div>
                    <div>
                        Remaining: <span className="font-semibold text-indigo-400">{daysRemaining} days</span>
                    </div>
                </div>

                {/* Progress Bar Visualization */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>Spending Progress & Projections Visualizer</span>
                        <span>Max Scale: ₹{Math.round(maxValue).toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="relative h-6 w-full bg-muted/40 rounded-full overflow-hidden flex border border-border/20 shadow-inner">
                        {/* Actual Spent */}
                        {actualSpent > 0 && (
                            <div 
                                style={{ width: `${actualPercent}%` }}
                                className="h-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                                title={`Actual: ₹${actualSpent}`}
                            >
                                {actualPercent > 12 && `Spent: ₹${Math.round(actualSpent)}`}
                            </div>
                        )}
                        {/* Projected Remaining Variable */}
                        {projectedRemainingVariable > 0 && (
                            <div 
                                style={{ width: `${projectedVariablePercent}%` }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold border-l border-white/20"
                                title={`Projected Daily: ₹${projectedRemainingVariable}`}
                            >
                                {projectedVariablePercent > 12 && `Proj. Daily: ₹${Math.round(projectedRemainingVariable)}`}
                            </div>
                        )}
                        {/* Projected Fixed (Rent / Electricity) */}
                        {projectedRemainingFixed > 0 && (
                            <div 
                                style={{ width: `${projectedFixedPercent}%` }}
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold border-l border-white/20"
                                title={`Projected Bills: ₹${projectedRemainingFixed}`}
                            >
                                {projectedFixedPercent > 12 && `Proj. Fixed: ₹${Math.round(projectedRemainingFixed)}`}
                            </div>
                        )}

                        {/* Budget Limit Overlay Marker */}
                        {budgetPercent > 0 && budgetPercent < 100 && (
                            <div 
                                style={{ left: `${budgetPercent}%` }}
                                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                                title={`Budget: ₹${budget}`}
                            >
                                <span className="absolute -top-4 -translate-x-1/2 text-[9px] text-rose-500 font-extrabold whitespace-nowrap bg-background px-1 rounded border border-rose-500/20">
                                    Budget
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-between text-xs text-muted-foreground pt-1 gap-y-2">
                        <div className="flex items-center space-x-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                            <span>Actual Spent: <strong className="text-foreground">₹{actualSpent.toLocaleString('en-IN')}</strong></span>
                        </div>
                        {daysRemaining > 0 && (
                            <div className="flex items-center space-x-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                                <span>Projected Variable: <strong className="text-foreground">₹{projectedRemainingVariable.toLocaleString('en-IN')}</strong></span>
                            </div>
                        )}
                        {projectedRemainingFixed > 0 && (
                            <div className="flex items-center space-x-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <span>Projected Fixed: <strong className="text-foreground">₹{projectedRemainingFixed.toLocaleString('en-IN')}</strong></span>
                            </div>
                        )}
                        <div className="flex items-center space-x-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span>Budget Limit: <strong className="text-foreground">₹{budget.toLocaleString('en-IN')}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Outcome Display Card */}
                <div className={`p-4 rounded-xl border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isOverBudget 
                        ? 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]' 
                        : 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                }`}>
                    <div className="flex items-center space-x-3">
                        {isOverBudget ? (
                            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                        ) : (
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                        )}
                        <div>
                            <h4 className="font-bold text-base text-foreground">
                                {isOverBudget ? 'Budget Limit Exceeded' : 'Under Budget Projection'}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isOverBudget 
                                    ? `Based on your settings, you will exceed your target budget by ₹${absDiff.toLocaleString('en-IN')}` 
                                    : `Great! You are projected to finish the month ₹${absDiff.toLocaleString('en-IN')} under budget`
                                }
                            </p>
                            {/* Detailed breakdown info */}
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Breakdown: ₹{actualSpent.toLocaleString('en-IN')} actual + ₹{projectedRemainingVariable.toLocaleString('en-IN')} variable + ₹{projectedRemainingFixed.toLocaleString('en-IN')} fixed.
                            </p>
                        </div>
                    </div>

                    <div className="text-right w-full md:w-auto">
                        <div className="text-xs text-muted-foreground">Total Projected Spending</div>
                        <div className={`text-2xl font-black ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                            ₹{totalProjected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
