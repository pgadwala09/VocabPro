import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Pie, Line, Radar } from 'react-chartjs-2';
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  PieChart,
  Pie as RechartsPie,
  Cell,
  LineChart,
  Line as RechartsLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Area,
  AreaChart,
} from 'recharts';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale
);

// Glossy color palettes
const glossyColors = {
  primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
  secondary: ['#a8edea', '#fed6e3', '#d299c2', '#fef9d7', '#667eea', '#764ba2'],
  gradient: [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  ]
};

interface PronunciationScoreData {
  word: string;
  score: number;
  attempts: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface PhonemeAccuracyData {
  phoneme: string;
  accuracy: number;
}

interface ProgressData {
  date: string;
  score: number;
  wordsPerMinute: number;
}

interface CommunicationStyleData {
  category: string;
  score: number;
  fullMark: number;
}

// Glossy Bar Chart for Pronunciation Scores
export const GlossyPronunciationChart: React.FC<{ data: PronunciationScoreData[] }> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.word),
    datasets: [
      {
        label: 'Pronunciation Score',
        data: data.map(d => d.score * 100),
        backgroundColor: data.map((_, index) => glossyColors.primary[index % glossyColors.primary.length]),
        borderColor: data.map((_, index) => glossyColors.primary[index % glossyColors.primary.length]),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
      title: {
        display: true,
        text: 'Pronunciation Accuracy by Word',
        color: '#f1f5f9',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#667eea',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#cbd5e1',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#cbd5e1',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.1)',
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Glossy Pie Chart for Phoneme Accuracy
export const GlossyPhonemeChart: React.FC<{ data: PhonemeAccuracyData[] }> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.phoneme),
    datasets: [
      {
        data: data.map(d => d.accuracy * 100),
        backgroundColor: glossyColors.primary,
        borderColor: glossyColors.secondary,
        borderWidth: 3,
        hoverBorderWidth: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12,
            weight: 'bold',
          },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Phoneme Accuracy Breakdown',
        color: '#f1f5f9',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#667eea',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.toFixed(1)}%`;
          }
        }
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
      <Pie data={chartData} options={options} />
    </div>
  );
};

// Glossy Progress Line Chart
export const GlossyProgressChart: React.FC<{ data: ProgressData[] }> = ({ data }) => {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Pronunciation Score',
        data: data.map(d => d.score * 100),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Words Per Minute',
        data: data.map(d => d.wordsPerMinute),
        borderColor: '#f093fb',
        backgroundColor: 'rgba(240, 147, 251, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f093fb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
      title: {
        display: true,
        text: 'Progress Over Time',
        color: '#f1f5f9',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#667eea',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#cbd5e1',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#cbd5e1',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.1)',
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
      <Line data={chartData} options={options} />
    </div>
  );
};

// Glossy Radar Chart for Communication Style
export const GlossyCommunicationChart: React.FC<{ data: CommunicationStyleData[] }> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.category),
    datasets: [
      {
        label: 'Communication Score',
        data: data.map(d => d.score * 100),
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: '#667eea',
        borderWidth: 3,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
      title: {
        display: true,
        text: 'Communication Style Analysis',
        color: '#f1f5f9',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#667eea',
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(203, 213, 225, 0.3)',
        },
        grid: {
          color: 'rgba(203, 213, 225, 0.3)',
        },
        pointLabels: {
          color: '#e2e8f0',
          font: {
            size: 12,
          },
        },
        ticks: {
          color: '#cbd5e1',
          backdropColor: 'transparent',
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
      <Radar data={chartData} options={options} />
    </div>
  );
};

// Recharts Alternative - Glossy Bar Chart
export const RechartsGlossyBar: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
      <h3 className="text-xl font-bold text-slate-100 mb-4">Word Difficulty Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.1)" />
          <XAxis dataKey="difficulty" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid #667eea',
              borderRadius: '8px',
              color: '#e2e8f0'
            }}
          />
          <RechartsLegend wrapperStyle={{ color: '#e2e8f0' }} />
          <RechartsBar dataKey="count" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#764ba2" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Recharts Glossy Area Chart for Progress
export const RechartsGlossyArea: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
      <h3 className="text-xl font-bold text-slate-100 mb-4">Learning Progress</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.1)" />
          <XAxis dataKey="date" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <RechartsTooltip 
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid #667eea',
              borderRadius: '8px',
              color: '#e2e8f0'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#667eea" 
            fill="url(#areaGradient)" 
            strokeWidth={3}
          />
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#667eea" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// KPI Cards with Glossy Design
export const GlossyKPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: string;
  trend?: 'up' | 'down' | 'stable';
}> = ({ title, value, subtitle, icon, gradient = 'from-blue-500 to-purple-600', trend }) => {
  const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→';
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/80 text-sm font-medium uppercase tracking-wide">
          {title}
        </div>
        {icon && <div className="text-white/60">{icon}</div>}
      </div>
      <div className="text-3xl font-bold text-white mb-2">
        {value}
      </div>
      {subtitle && (
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm">{subtitle}</span>
          {trend && <span className={`${trendColor} text-sm`}>{trendIcon}</span>}
        </div>
      )}
    </div>
  );
};


