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
    storageUsed: number // in GB or MB
    storageLimit: number
    plan: string
}

export function UsageTab({ usage }: { usage?: UsageStats }) {
    // Defaults if no data provided
    const stats = usage || {
        docsUsed: 0,
        docsLimit: 5,
        storageUsed: 0.1,
        storageLimit: 1,
        plan: 'free'
    }

    const docsPercentage = Math.round((stats.docsUsed / stats.docsLimit) * 100)

    // Mock data for the chart - in a real app, this would be historical data
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Documents Generated',
                data: [12, 19, 3, 5, 2, stats.docsUsed], // Use current Usage for the last month
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
                    color: '#94a3b8' // text-muted-foreground
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
                    color: '#94a3b8'
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents Generated</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.docsUsed} / {stats.docsLimit}</div>
                        <p className="text-xs text-muted-foreground mb-4">
                            {docsPercentage}% of your monthly limit used
                        </p>
                        <Progress
                            value={docsPercentage}
                            className="h-2"
                            indicatorClassName={docsPercentage > 90 ? "bg-red-500" : docsPercentage > 75 ? "bg-yellow-500" : "bg-green-500"}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.storageUsed} GB</div>
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
                        <div className="text-2xl font-bold">{stats.plan === 'pro' ? '$29.00' : '$0.00'}</div>
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

            <div className="rounded-md bg-blue-500/10 p-4 border border-blue-500/20 flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-400">
                    Need more documents? <span className="font-semibold underline cursor-pointer hover:text-blue-300">Upgrade to Pro</span> for unlimited access and higher storage limits.
                </p>
            </div>
        </div>
    )
}
