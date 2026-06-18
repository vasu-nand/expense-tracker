'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddExpenseDialog } from './expenses/add-expense-dialog'

export function DesktopFab() {
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)

    return (
        <>
            {/* FAB for Adding Expense (Mobile & Desktop) */}
            <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="fixed bottom-8 right-8 z-45 flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:from-teal-600 hover:via-teal-700 hover:to-indigo-700 text-white shadow-xl shadow-teal-500/25 hover:shadow-indigo-500/35 hover:scale-110 active:scale-95 transition-all duration-300 border border-teal-400/25 group focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                title="Add Expense"
                aria-label="Add new expense"
            >
                <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
            </button>

            {/* Global Add Expense Dialog */}
            {isAddExpenseOpen && (
                <AddExpenseDialog
                    isOpen={isAddExpenseOpen}
                    onClose={() => setIsAddExpenseOpen(false)}
                    onSuccess={() => {
                        window.dispatchEvent(new CustomEvent('expense-added'))
                        setIsAddExpenseOpen(false)
                    }}
                    defaultMonth={new Date().toISOString().slice(0, 7)}
                />
            )}
        </>
    )
}
