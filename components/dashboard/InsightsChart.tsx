'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface InsightsChartProps {
    distribution: {
        planning: number
        active: number
        completed: number
    }
}

export function InsightsChart({ distribution }: InsightsChartProps) {
    const data = {
        labels: ['Planning', 'Active', 'Completed'],
        datasets: [
            {
                label: 'Projects',
                data: [distribution.planning, distribution.active, distribution.completed],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                ],
                borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#9ca3af' // tailwind text-gray-400
                }
            },
            title: {
                display: false,
                text: 'Project Status Distribution',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#374151' // tailwind gray-700
                },
                ticks: {
                    color: '#9ca3af'
                }
            },
            x: {
                grid: {
                    color: '#374151'
                },
                ticks: {
                    color: '#9ca3af'
                }
            }
        }
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>AI Insights & Status</CardTitle>
                <CardDescription>Real-time project distribution</CardDescription>
            </CardHeader>
            <CardContent>
                <Bar options={options} data={data} />
            </CardContent>
        </Card>
    )
}
