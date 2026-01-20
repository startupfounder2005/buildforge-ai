'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProjectStatsProps {
    projects: any[]
}

export function ProjectStats({ projects }: ProjectStatsProps) {
    const planning = projects.filter(p => p.status === 'planning').length
    const active = projects.filter(p => p.status === 'active').length
    const completed = projects.filter(p => p.status === 'completed').length

    const data = {
        labels: ['Planning', 'Active', 'Completed'],
        datasets: [
            {
                label: '# of Projects',
                data: [planning, active, completed],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center h-[200px]">
                <Doughnut data={data} options={{ maintainAspectRatio: false }} />
            </CardContent>
        </Card>
    )
}
