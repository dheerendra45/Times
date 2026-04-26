import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { StatCardSkeleton, TableRowSkeleton } from "../components/Skeleton";
import {
  HiOutlineRocketLaunch,
  HiOutlineUserGroup,
  HiOutlineTrophy,
  HiOutlineDocumentText,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "#6366f1",
  "#818cf8",
  "#a5b4fc",
  "#4f46e5",
  "#4338ca",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#38bdf8",
  "#a78bfa",
  "#fb923c",
  "#2dd4bf",
  "#e879f9",
  "#22d3ee",
  "#facc15",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-primary-200 rounded-xl px-5 py-3 shadow-xl">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-lg font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          {payload[0].value} projects
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-primary-200 rounded-xl px-5 py-3 shadow-xl">
        <p className="text-sm font-bold text-gray-700 mb-1">
          {payload[0].name}
        </p>
        <p className="text-lg font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          {payload[0].value} projects
        </p>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axiosClient.get("/analytics/dashboard");
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Add variety to domain data with empty categories
  const getEnhancedDomainData = () => {
    if (!stats?.domain_breakdown) return [];

    const allDomains = [
      "AI/ML",
      "Blockchain",
      "Web Development",
      "Mobile App",
      "IoT",
      "Healthcare",
      "FinTech",
      "EdTech",
      "Gaming",
      "AR/VR",
    ];

    const existingDomains = stats.domain_breakdown.map((d) => d.domain);
    const enhancedData = [...stats.domain_breakdown];

    // Add empty categories for variety
    allDomains.forEach((domain) => {
      if (!existingDomains.includes(domain)) {
        enhancedData.push({ domain, count: 0 });
      }
    });

    return enhancedData;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <div className="skeleton h-10 w-64 mb-2 rounded-lg" />
          <div className="skeleton h-5 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 h-80 skeleton" />
          <div className="glass-card p-6 h-80 skeleton" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Submissions",
      value: stats?.total_submissions || 0,
      icon: HiOutlineDocumentText,
      color: "primary",
    },
    {
      title: "Participants",
      value: stats?.total_participants || 0,
      icon: HiOutlineUserGroup,
      color: "emerald",
    },
    {
      title: "Winners",
      value: stats?.total_winners || 0,
      icon: HiOutlineTrophy,
      color: "amber",
    },
    {
      title: "Runner Ups",
      value: stats?.total_runners_up || 0,
      icon: HiOutlineRocketLaunch,
      color: "rose",
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-2">Dashboard</h1>
        <p className="text-gray-600 font-medium">
          Overview of hackathon submissions, participants, and performance
          metrics.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.title}>
            <StatCard {...card} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Domain Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Projects by Domain
          </h2>
          {stats?.domain_breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={getEnhancedDomainData()}
                margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="domain"
                  tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  stroke="#d1d5db"
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }}
                  stroke="#d1d5db"
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                  animationDuration={1000}
                >
                  {getEnhancedDomainData().map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.count === 0
                          ? "#e5e7eb"
                          : CHART_COLORS[i % CHART_COLORS.length]
                      }
                      opacity={entry.count === 0 ? 0.5 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 font-medium">
              No domain data yet
            </div>
          )}
        </div>

        {/* Tech Stack Pie Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Tech Stack Distribution
          </h2>
          {stats?.tech_breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.tech_breakdown.map((item, i) => ({
                    ...item,
                    total: stats.tech_breakdown.reduce(
                      (sum, t) => sum + t.count,
                      0,
                    ),
                  }))}
                  dataKey="count"
                  nameKey="tech"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ tech, percent }) =>
                    `${tech} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={{ stroke: "#9ca3af", strokeWidth: 1.5 }}
                  animationDuration={1000}
                >
                  {stats.tech_breakdown.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 font-medium">
              No tech data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Recent Submissions
          </h2>
          <Link
            to="/projects"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors font-semibold"
          >
            View all <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" id="recent-submissions-table">
            <thead>
              <tr className="border-t border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Team Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Award
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {stats?.recent_submissions?.length > 0 ? (
                stats.recent_submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/projects/${sub.id}`)
                    }
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {sub.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="domain" label={sub.domain} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {sub.team_size}
                    </td>
                    <td className="px-6 py-4">
                      {sub.award !== "none" ? (
                        <Badge variant={sub.award} />
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {sub.created_at
                        ? new Date(sub.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 font-medium"
                  >
                    No submissions yet. Be the first to submit a project!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
