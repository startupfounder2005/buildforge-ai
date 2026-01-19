import { useState, useTransition, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, DollarSign, TrendingUp, MoreVertical, Pencil, Trash, CheckSquare, Loader2 } from 'lucide-react'
import { updateProjectBudget, addExpense, deleteExpense, deleteExpenses, updateExpense } from '@/app/dashboard/projects/actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BudgetManagerProps {
    projectId: string
    initialBudget: number
    initialExpenses: any[]
}

export function BudgetManager({ projectId, initialBudget, initialExpenses }: BudgetManagerProps) {
    const [isBudgetOpen, setIsBudgetOpen] = useState(false)
    const [isExpenseOpen, setIsExpenseOpen] = useState(false)
    const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
    const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()

    // Loading Triggers
    const [isLoadingBudgetTrigger, setIsLoadingBudgetTrigger] = useState(false)
    const [isLoadingExpenseTrigger, setIsLoadingExpenseTrigger] = useState(false)

    // Sync state with props when server revalidates
    useEffect(() => {
        if (initialExpenses) setExpenses(initialExpenses)
    }, [initialExpenses])

    // Budget State
    const [localBudgetInput, setLocalBudgetInput] = useState(initialBudget?.toString() || '')

    // Expense Add State
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'Material',
        date: new Date().toISOString().split('T')[0]
    })

    // Expense Edit State
    const [editingExpense, setEditingExpense] = useState<any>(null)

    // Ensure expenses is a state variable initialized from props
    const [expenses, setExpenses] = useState(initialExpenses || [])



    const totalExpenses = expenses.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
    const budget = initialBudget || 0
    const remaining = budget - totalExpenses
    const usage = budget > 0 ? (totalExpenses / budget) * 100 : 0

    const handleUpdateBudget = async () => {
        if (!localBudgetInput || localBudgetInput.trim() === '') {
            toast.error("Please enter a valid number")
            return
        }

        const amount = Number(localBudgetInput)
        const MIN_BUDGET = 100

        if (isNaN(amount)) {
            toast.error("Please enter a valid number")
            return
        }

        if (amount < MIN_BUDGET) {
            toast.error(`Budget must be at least $${MIN_BUDGET}`)
            return
        }

        startTransition(async () => {
            const res = await updateProjectBudget(projectId, amount)
            if (res.message === 'Success') {
                toast.success('Budget updated')
                setIsBudgetOpen(false)
            } else {
                toast.error(res.message)
            }
        })
    }

    const handleAddExpense = async () => {
        // Validate description
        if (!newExpense.description || newExpense.description.trim() === '') {
            toast.error("Please enter a description")
            return
        }

        // Validate amount
        if (!newExpense.amount || newExpense.amount.toString().trim() === '') {
            toast.error("Please enter a valid amount")
            return
        }

        const amount = parseFloat(newExpense.amount)
        if (isNaN(amount) || amount <= 0) {
            toast.error("Expense amount must be greater than $0")
            return
        }

        if (!newExpense.date) {
            toast.error("Please select a date")
            return
        }

        startTransition(async () => {
            const res = await addExpense(projectId, {
                description: newExpense.description,
                amount: amount,
                category: newExpense.category,
                date: newExpense.date
            })
            if (res.message === 'Success') {
                toast.success('Expense added')
                setIsExpenseOpen(false)
                setNewExpense({ description: '', amount: '', category: 'Material', date: new Date().toISOString().split('T')[0] })
                // No need to manually update state as revalidatePath in action + useEffect sync will handle it
            } else {
                toast.error(res.message)
            }
        })
    }

    const handleEditExpense = async () => {
        if (!editingExpense) return

        if (!editingExpense.description || editingExpense.description.trim() === '') {
            toast.error("Please enter a description")
            return
        }

        if (!editingExpense.amount || editingExpense.amount.toString().trim() === '') {
            toast.error("Please enter a valid amount")
            return
        }

        const amount = parseFloat(editingExpense.amount)
        if (isNaN(amount) || amount <= 0) {
            toast.error("Expense amount must be greater than $0")
            return
        }

        if (!editingExpense.date) {
            toast.error("Please select a date")
            return
        }

        startTransition(async () => {
            const res = await updateExpense(editingExpense.id, {
                description: editingExpense.description,
                amount: amount,
                category: editingExpense.category,
                date: editingExpense.date
            })
            if (res.message === 'Success') {
                toast.success('Expense updated')
                setIsEditExpenseOpen(false)
                setEditingExpense(null)
            } else {
                toast.error(res.message)
            }
        })
    }

    const handleDeleteExpense = (id: string) => {
        setDeleteConfirmId(id)
    }

    const executeDeleteExpense = async () => {
        if (!deleteConfirmId) return
        startTransition(async () => {
            const res = await deleteExpense(deleteConfirmId)
            if (res.message === 'Success') {
                toast.success('Expense deleted')
                setDeleteConfirmId(null)
                const newSelected = new Set(selectedExpenses)
                newSelected.delete(deleteConfirmId)
                setSelectedExpenses(newSelected)
            } else {
                toast.error(res.message)
            }
        })
    }

    // --- Bulk Selection Logic ---
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedExpenses)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedExpenses(newSet)
    }

    const toggleSelectAll = () => {
        if (selectedExpenses.size === expenses.length && expenses.length > 0) {
            setSelectedExpenses(new Set())
        } else {
            const newSet = new Set<string>()
            expenses.forEach((e: any) => newSet.add(e.id))
            setSelectedExpenses(newSet)
        }
    }

    const executeBulkDelete = async () => {
        if (selectedExpenses.size === 0) return
        startTransition(async () => {
            const ids = Array.from(selectedExpenses)
            const res = await deleteExpenses(ids)
            if (res.message === 'Success') {
                toast.success(`${ids.length} expenses deleted`)
                setBulkDeleteConfirmOpen(false)
                setSelectedExpenses(new Set())
            } else {
                toast.error(res.message)
            }
        })
    }

    const openEditDialog = (expense: any) => {
        setEditingExpense({
            ...expense,
            date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]
        })
        setIsEditExpenseOpen(true)
    }

    const handleOpenBudget = () => {
        setIsLoadingBudgetTrigger(true)
        setTimeout(() => {
            setIsBudgetOpen(true)
            setLocalBudgetInput(budget.toString())
            setIsLoadingBudgetTrigger(false)
        }, 500)
    }

    const handleOpenExpense = () => {
        setIsLoadingExpenseTrigger(true)
        setTimeout(() => {
            setIsExpenseOpen(true)
            setIsLoadingExpenseTrigger(false)
        }, 500)
    }

    return (
        <Card className="col-span-1 md:col-span-2 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        Budget & Expenses
                    </CardTitle>
                    <CardDescription>Track project financials.</CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Bulk Delete Button */}
                    {selectedExpenses.size > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 px-3 text-xs"
                            onClick={() => setBulkDeleteConfirmOpen(true)}
                        >
                            <Trash className="h-3.5 w-3.5 mr-1.5" />
                            Delete ({selectedExpenses.size})
                        </Button>
                    )}

                    {/* Replace DialogTrigger with Controlled Button for Budget */}
                    <Button
                        variant="outline"
                        onClick={handleOpenBudget}
                        disabled={isLoadingBudgetTrigger}
                        className="h-9 px-3 text-xs font-medium border-zinc-700 bg-zinc-900/50 hover:bg-[#7C3AED] hover:text-white transition-colors"
                    >
                        {isLoadingBudgetTrigger ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Set Budget"}
                    </Button>

                    <Dialog open={isBudgetOpen} onOpenChange={(open) => {
                        setIsBudgetOpen(open)
                        if (open) setLocalBudgetInput(budget.toString())
                    }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Set Project Budget</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Total Amount ($)</Label>
                                    <Input
                                        type="number"
                                        value={localBudgetInput}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            // Handle leading zeros for better UX
                                            if (val.length > 1 && val.startsWith('0')) {
                                                setLocalBudgetInput(val.replace(/^0+/, ''))
                                            } else {
                                                setLocalBudgetInput(val)
                                            }
                                        }}
                                        placeholder="e.g. 100000"
                                        className="no-spinner"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleUpdateBudget} disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Budget"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {budget > 0 && (
                        <>
                            <Button
                                onClick={handleOpenExpense}
                                disabled={isLoadingExpenseTrigger}
                                className="h-9 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
                            >
                                {isLoadingExpenseTrigger ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                {isLoadingExpenseTrigger ? null : "Expense"}
                            </Button>

                            <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Log Expense</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Input
                                                placeholder="e.g. Concrete mix"
                                                value={newExpense.description}
                                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Amount ($)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={newExpense.amount}
                                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                                    className="no-spinner"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Select
                                                    value={newExpense.category}
                                                    onValueChange={(val) => setNewExpense({ ...newExpense, category: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Material">Material</SelectItem>
                                                        <SelectItem value="Labor">Labor</SelectItem>
                                                        <SelectItem value="Permit">Permit</SelectItem>
                                                        <SelectItem value="Subcontractor">Subcontractor</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={newExpense.date}
                                                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddExpense} disabled={isPending}>
                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Expense"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}

                    <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently remove this expense from the project budget.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => { e.preventDefault(); executeDeleteExpense() }} className="bg-red-600 hover:bg-red-700" disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete {selectedExpenses.size} {selectedExpenses.size === 1 ? 'Expense' : 'Expenses'}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. {selectedExpenses.size === 1 ? 'This expense' : 'These expenses'} will be permanently removed.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => { e.preventDefault(); executeBulkDelete() }} className="bg-red-600 hover:bg-red-700" disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (selectedExpenses.size === 1 ? 'Delete' : 'Delete All')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Expense</DialogTitle>
                            </DialogHeader>
                            {editingExpense && (
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            placeholder="e.g. Concrete mix"
                                            value={editingExpense.description}
                                            onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Amount ($)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={editingExpense.amount}
                                                onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                                                className="no-spinner"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select
                                                value={editingExpense.category}
                                                onValueChange={(val) => setEditingExpense({ ...editingExpense, category: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Material">Material</SelectItem>
                                                    <SelectItem value="Labor">Labor</SelectItem>
                                                    <SelectItem value="Permit">Permit</SelectItem>
                                                    <SelectItem value="Subcontractor">Subcontractor</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={editingExpense.date}
                                            onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button onClick={handleEditExpense} disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Expense"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {budget > 0 ? (
                    <>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Spent</span>
                                <span className="font-medium">${totalExpenses.toLocaleString()} of ${budget.toLocaleString()}</span>
                            </div>
                            <Progress value={usage} className={`h-2 ${usage > 90 ? 'bg-red-900/20' : 'bg-secondary'}`} indicatorClassName={`${usage > 90 ? 'bg-red-500' : 'bg-blue-600'}`} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg bg-zinc-900/50 p-4 border border-zinc-800">
                                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                                <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-white'}`}>${remaining.toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg bg-zinc-900/50 p-4 border border-zinc-800">
                                <p className="text-xs text-muted-foreground mb-1">% Utilized</p>
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                    <p className="text-sm font-medium">{usage.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-lg bg-zinc-900/30 p-6 border border-zinc-800/10 border-dashed text-center">
                        <p className="text-muted-foreground text-sm">No budget set for this project.</p>
                        <Button
                            variant="link"
                            className="text-blue-500 h-auto p-0 text-xs mt-1"
                            onClick={handleOpenBudget}
                        >
                            Set a Budget
                        </Button>
                    </div>
                )}

                {budget > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-between">
                            <div className="flex items-center gap-2">
                                <ClockIcon />
                                <span>Recent Expenses</span>
                            </div>
                            {expenses.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedExpenses.size === expenses.length && expenses.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                    <span className="text-xs">Select All</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-0">
                            {expenses.length === 0 ? (
                                <p className="text-sm text-center py-4 text-muted-foreground">No expenses logged yet.</p>
                            ) : (
                                expenses.slice().reverse().map((expense: any) => (
                                    <div key={expense.id} className={`group flex items-center justify-between py-3 border-b border-white/5 last:border-0 px-2 -mx-2 rounded-md transition-colors ${selectedExpenses.has(expense.id) ? 'bg-blue-900/10' : 'hover:bg-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedExpenses.has(expense.id)}
                                                onCheckedChange={() => toggleSelect(expense.id)}
                                            />
                                            <div>
                                                <p className="font-medium text-sm text-zinc-200">{expense.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{format(new Date(expense.date), 'MMM d')}</span>
                                                    <span>•</span>
                                                    <span>{expense.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-red-400 text-sm font-mono">-${expense.amount.toLocaleString()}</span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity border border-transparent hover:border-white">
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="cursor-pointer border border-transparent hover:border-white transition-all" onClick={() => openEditDialog(expense)}>
                                                        <Pencil className="mr-2 h-3 w-3" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-500 focus:text-white focus:bg-red-600 cursor-pointer border border-transparent hover:border-white transition-all" onClick={() => handleDeleteExpense(expense.id)}>
                                                        <Trash className="mr-2 h-3 w-3" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card >
    )
}

function ClockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" /><path d="M3 3v9" /></svg>
    )
}
