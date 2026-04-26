import React from "react";
import { Link } from "react-router-dom";
import { HiUsers, HiArrowRight } from "react-icons/hi2";
import Badge from "./Badge";

export default function ProjectCard({ project }) {
  const {
    id,
    title,
    problem_statement,
    domain,
    tech_stack = [],
    team_members = [],
    award,
    thumbnail_url,
  } = project;

  return (
    <Link to={`/projects/${id}`} id={`project-card-${id}`}>
      <div className="glass-card-hover group h-full flex flex-col overflow-hidden">
        {/* Thumbnail / Gradient placeholder */}
        <div className="relative h-48 overflow-hidden">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
              <span className="text-6xl font-black text-primary-300 select-none">
                {title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Award badge overlay */}
          {award && award !== "none" && (
            <div className="absolute top-3 right-3">
              <Badge variant={award} />
            </div>
          )}

          {/* Domain badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="domain" label={domain} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1 leading-relaxed">
            {problem_statement}
          </p>

          {/* Tech stack badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tech_stack.slice(0, 3).map((tech) => (
              <Badge key={tech} variant="tech" label={tech} />
            ))}
            {tech_stack.length > 3 && (
              <span className="text-xs text-gray-500 self-center ml-1 font-medium">
                +{tech_stack.length - 3} more
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
              <HiUsers className="w-4 h-4" />
              <span>
                {team_members.length} member
                {team_members.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-primary-600 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View <HiArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
