import React from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend
);

export default function ChartsDemo() {
	const lineData = {
		labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
		datasets: [
			{
				label: 'Words Learned',
				data: [12, 18, 25, 34, 47],
				borderColor: 'rgb(99, 102, 241)',
				backgroundColor: 'rgba(99, 102, 241, 0.2)',
				tension: 0.3,
				fill: true,
			},
		],
	};

	const barData = {
		labels: ['Pronunciation', 'Pace', 'Confidence', 'Clarity'],
		datasets: [
			{
				label: 'Scores',
				data: [82, 74, 88, 91],
				backgroundColor: ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa'],
			},
		],
	};

	const commonOptions = {
		responsive: true,
		plugins: {
			legend: { position: 'top' as const },
			title: { display: true, text: 'Learning Insights' },
		},
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-8">
			<h2 className="text-2xl font-bold">Charts Demo</h2>
			<div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4">
				<Line options={commonOptions} data={lineData} />
			</div>
			<div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4">
				<Bar options={commonOptions} data={barData} />
			</div>
		</div>
	);
}










