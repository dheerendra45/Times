import React, { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "../stores/projectStore";
import ProjectCard from "../components/ProjectCard";
import { ProjectCardSkeleton } from "../components/Skeleton";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineFunnel,
} from "react-icons/hi2";

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const awardOptions = [
  {
    value: "winner",
    label: "🏆 Winner",
    activeClass:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400 shadow-md",
  },
  {
    value: "runner_up",
    label: "⭐ Runner Up",
    activeClass:
      "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400 shadow-md",
  },
];

export default function ProjectsList() {
  const {
    projects,
    filters,
    total,
    totalPages,
    isLoading,
    domains,
    techStacks,
    setFilters,
    fetchProjects,
    fetchDomains,
    fetchTechStacks,
  } = useProjectStore();
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(searchInput);

  useEffect(() => {
    fetchDomains();
    fetchTechStacks();
  }, []);
  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch]);
  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ [key]: updated });
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilters({ search: "", domain: [], tech_stack: [], award: [], page: 1 });
  };

  const hasActiveFilters =
    filters.domain.length > 0 ||
    filters.tech_stack.length > 0 ||
    filters.award.length > 0 ||
    filters.search;

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title mb-2">Projects</h1>
        <p className="text-gray-600 font-medium">
          Browse {total} hackathon project{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search projects..."
            className="input-field pl-12"
            id="search-projects"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? "border-primary-500" : ""}`}
          id="toggle-filters"
        >
          <HiOutlineFunnel className="w-4 h-4" /> Filters{" "}
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-600" />
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn-ghost text-sm text-rose-600 hover:text-rose-700 font-semibold"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter panels */}
      {showFilters && (
        <div className="glass-card p-6 mb-6 space-y-5">
          {/* Award pills */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Award</p>
            <div className="flex flex-wrap gap-2">
              {awardOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayFilter("award", opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${filters.award.includes(opt.value) ? opt.activeClass : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Domain multi-select */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Domain</p>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleArrayFilter("domain", d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${filters.domain.includes(d) ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-400" : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"}`}
                >
                  {d}
                </button>
              ))}
              {domains.length === 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  No domains available
                </span>
              )}
            </div>
          </div>
          {/* Tech stack multi-select */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {techStacks.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleArrayFilter("tech_stack", t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${filters.tech_stack.includes(t) ? "bg-gradient-to-r from-blue-100 to-purple-100 text-primary-700 border-primary-400" : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"}`}
                >
                  {t}
                </button>
              ))}
              {techStacks.length === 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  No tech stacks available
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div key={p.id}>
                <ProjectCard project={p} />
              </div>
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() =>
                  setFilters({ page: Math.max(1, filters.page - 1) })
                }
                disabled={filters.page === 1}
                className="btn-secondary text-sm px-4 py-2"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setFilters({ page })}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${filters.page === page ? "bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg" : "text-gray-700 hover:bg-gray-200 bg-white border-2 border-gray-300"}`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setFilters({ page: Math.min(totalPages, filters.page + 1) })
                }
                disabled={filters.page === totalPages}
                className="btn-secondary text-sm px-4 py-2"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-md">
            <HiOutlineMagnifyingGlass className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No projects found
          </h3>
          <p className="text-sm text-gray-600 font-medium">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}
