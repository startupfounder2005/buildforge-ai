'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

export default function PredictionsPage() {
    // Mock Data
    const riskData = {
        labels: ['Project A', 'Project B', 'Project C'],
        datasets: [
            {
                label: 'Risk Score (0-100)',
                data: [65, 30, 85],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    }

    const typeData = {
        labels: ['Safety', 'Delay', 'Budget', 'Compliance'],
        datasets: [
            {
                label: '# of Risks',
                data: [12, 19, 3, 5],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                ],
                borderWidth: 1,
            },
        ],
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">AI Predictions</h2>
                <p className="text-muted-foreground">
                    Forecast risks and delays across your portfolio.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Portfolio Risk Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Line options={{ responsive: true }} data={riskData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Risk Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Doughnut data={typeData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
