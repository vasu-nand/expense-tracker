import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getLocalMonth(date: Date = new Date()): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
}

export function getDaysInMonth(monthStr: string): number {
    if (!monthStr) return 31;
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
}