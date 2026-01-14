"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
// import { Button } from "@/components/ui/button"
import { Bar } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { FileText, HardDrive, Calculator, Info } from "lucide-react"
import Link from "next/link"

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

interface UsageStats {
    docsUsed: number
    docsLimit: number
    storageUsed: number
    storageLimit: number
    projectsUsed: number
    projectsLimit: number
    plan: string
    monthlyHistory?: { month: string; count: number }[]
}

export function UsageTab({ usage }: { usage?: UsageStats }) {
    // Defaults if no data provided
    const stats = usage || {
        docsUsed: 0,
        docsLimit: 5,
        storageUsed: 0.1,
        storageLimit: 1,
        projectsUsed: 0,
        projectsLimit: 1,
        plan: 'free',
        monthlyHistory: []
    }

    // Default empty history if missing
    const history = stats.monthlyHistory || []

    // Chart Data
    const data = {
        labels: history.length > 0 ? history.map(h => h.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Documents Generated',
                data: history.length > 0 ? history.map(h => h.count) : [0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            },
        ],
    }

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#94a3b8'
                }
            },
            title: {
                display: false,
                text: 'Monthly Usage',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#94a3b8',
                    stepSize: 1
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#94a3b8'
                }
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {stats.projectsLimit === -1 ? (
                            <>
                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Unlimited</div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {stats.projectsUsed} active projects
                                </p>
                                <Progress value={100} className="h-2 bg-blue-950" indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-500" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.projectsUsed} / {stats.projectsLimit}</div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {Math.round((stats.projectsUsed / stats.projectsLimit) * 100)}% of your limit used
                                </p>
                                <Progress
                                    value={(stats.projectsUsed / stats.projectsLimit) * 100}
                                    className="h-2"
                                    indicatorClassName={
                                        (stats.projectsUsed >= stats.projectsLimit) ? "bg-red-500" : "bg-green-500"
                                    }
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents Generated</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {stats.docsLimit === -1 ? (
                            <>
                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Unlimited</div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {stats.docsUsed} documents generated this month
                                </p>
                                <Progress value={100} className="h-2 bg-blue-950" indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-500" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.docsUsed} / {stats.docsLimit}</div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {Math.round((stats.docsUsed / stats.docsLimit) * 100)}% of your monthly limit used
                                </p>
                                <Progress
                                    value={(stats.docsUsed / stats.docsLimit) * 100}
                                    className="h-2"
                                    indicatorClassName={
                                        (stats.docsUsed / stats.docsLimit) * 100 > 90 ? "bg-red-500" :
                                            (stats.docsUsed / stats.docsLimit) * 100 > 75 ? "bg-yellow-500" : "bg-green-500"
                                    }
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{typeof stats.storageUsed === 'number' ? Number(stats.storageUsed).toFixed(4) : stats.storageUsed} GB</div>
                        <p className="text-xs text-muted-foreground mb-4">
                            Of {stats.storageLimit} GB total storage
                        </p>
                        <Progress value={(stats.storageUsed / stats.storageLimit) * 100} className="h-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.plan === 'pro' ? '€49.00' : '€0.00'}</div>
                        <p className="text-xs text-muted-foreground">
                            Current billing cycle
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage History</CardTitle>
                    <CardDescription>
                        A summary of your document generation over the last 6 months.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <Bar options={options} data={data} />
                    </div>
                </CardContent>
            </Card>

            {stats.plan !== 'pro' && (
                <div className="rounded-md bg-blue-500/10 p-4 border border-blue-500/20 flex items-center gap-3">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-400">
                        Need more documents? <Link href="/dashboard/account?tab=billing" className="font-semibold underline cursor-pointer hover:text-blue-300">Upgrade to Pro</Link> for unlimited access and higher storage limits.
                    </p>
                </div>
            )}
        </div>
    )
}
