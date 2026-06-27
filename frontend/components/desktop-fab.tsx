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
                className="fixed bottom-8 right-8 z-45 flex items-center justify-center h-14 w-14 rounded-full bg-custom-btn-gradient text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary/50 hover:opacity-95"
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
