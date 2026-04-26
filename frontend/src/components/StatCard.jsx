import React from "react";

const StatCard = React.memo(function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "primary",
}) {
  const colorMap = {
    primary:
      "from-blue-50 to-purple-50 text-primary-700 border-primary-200 shadow-sm",
    amber:
      "from-amber-50 to-orange-50 text-amber-700 border-amber-200 shadow-sm",
    emerald:
      "from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm",
    rose: "from-rose-50 to-pink-50 text-rose-700 border-rose-200 shadow-sm",
  };

  const iconColorMap = {
    primary:
      "bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-md",
    amber:
      "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md",
    emerald:
      "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md",
    rose: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md",
  };

  return (
    <div
      className={`stat-card group bg-gradient-to-br border-2 ${colorMap[color]}`}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p
              className={`text-xs mt-2 font-semibold ${trend > 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconColorMap[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {/* Decorative gradient orb - blur removed to prevent flickering */}
      <div
        className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${colorMap[color]}`}
      />
    </div>
  );
});

export default StatCard;
