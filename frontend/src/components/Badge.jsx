import React from "react";
import { HiTrophy, HiStar } from "react-icons/hi2";

const variants = {
  winner: {
    className: "badge-winner",
    icon: <HiTrophy className="w-3 h-3" />,
    label: "Winner",
  },
  runner_up: {
    className: "badge-runner",
    icon: <HiStar className="w-3 h-3" />,
    label: "Runner Up",
  },
  tech: {
    className: "badge-tech",
    icon: null,
    label: "",
  },
  domain: {
    className:
      "inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300 shadow-sm",
    icon: null,
    label: "",
  },
};

export default function Badge({ variant = "tech", label, className = "" }) {
  const config = variants[variant] || variants.tech;
  const displayLabel = label || config.label;

  return (
    <span className={`${config.className} ${className}`}>
      {config.icon}
      {displayLabel}
    </span>
  );
}
