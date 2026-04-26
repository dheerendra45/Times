import React, { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import Badge from "../components/Badge";
import {
  HiOutlineArrowLeft,
  HiOutlineGlobeAlt,
  HiOutlineCodeBracket,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineUsers,
} from "react-icons/hi2";

function Section({ title, children }) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        {title}
      </h2>
      <div className="text-gray-700 leading-relaxed text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentProject: project,
    isLoading,
    fetchProjectById,
  } = useProjectStore();

  useEffect(() => {
    fetchProjectById(id).catch(() => navigate("/projects"));
  }, [id]);

  if (isLoading || !project) {
    return (
      <div className="page-container">
        <div className="skeleton h-8 w-48 mb-6 rounded-lg" />
        <div className="skeleton h-64 w-full rounded-2xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group text-sm transition-colors font-semibold"
      >
        <HiOutlineArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Projects
      </button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6 h-56 sm:h-72 shadow-lg">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 flex items-center justify-center">
            <span className="text-8xl font-black text-primary-400/40 select-none">
              {project.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="domain" label={project.domain} />
            {project.award !== "none" && <Badge variant={project.award} />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
            {project.title}
          </h1>
          <p className="text-sm text-gray-200 mt-1 font-medium">
            Submitted{" "}
            {project.created_at
              ? new Date(project.created_at).toLocaleDateString()
              : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Section
            title={
              <>
                <HiOutlineDocumentText className="w-5 h-5 text-rose-600" />{" "}
                Problem Statement
              </>
            }
          >
            <p className="whitespace-pre-wrap">{project.problem_statement}</p>
          </Section>

          <Section
            title={
              <>
                <HiOutlineSparkles className="w-5 h-5 text-emerald-600" /> Our
                Solution
              </>
            }
          >
            <p className="whitespace-pre-wrap">{project.solution}</p>
          </Section>

          {/* PPT Viewer */}
          {project.presentation_url && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />{" "}
                Presentation
              </h2>
              <div className="rounded-xl overflow-hidden border-2 border-gray-300 aspect-video bg-gray-100 shadow-md">
                {project.presentation_url.includes("docs.google.com") ||
                project.presentation_url.includes("slides.google.com") ? (
                  <iframe
                    src={project.presentation_url.replace("/edit", "/embed")}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title="Presentation"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <HiOutlineDocumentText className="w-12 h-12 text-gray-400" />
                    <a
                      href={project.presentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm"
                    >
                      Open Presentation
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tech stack */}
          <Section
            title={
              <>
                <HiOutlineCodeBracket className="w-5 h-5 text-primary-600" />{" "}
                Tech Stack
              </>
            }
          >
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((t) => (
                <Badge key={t} variant="tech" label={t} />
              ))}
            </div>
          </Section>

          {/* Team */}
          <Section
            title={
              <>
                <HiOutlineUsers className="w-5 h-5 text-amber-600" /> Team (
                {project.team_members.length})
              </>
            }
          >
            <div className="space-y-3">
              {project.team_members.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-purple-200 border-2 border-primary-400 flex items-center justify-center text-sm font-bold text-primary-700 flex-shrink-0 shadow-md">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-600 font-medium">
                      {m.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Links */}
          {(project.demo_url || project.repo_url) && (
            <Section
              title={
                <>
                  <HiOutlineGlobeAlt className="w-5 h-5 text-emerald-600" />{" "}
                  Links
                </>
              }
            >
              <div className="space-y-2">
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm transition-colors font-semibold"
                  >
                    <HiOutlineGlobeAlt className="w-4 h-4" /> Live Demo
                  </a>
                )}
                {project.repo_url && (
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm transition-colors font-semibold"
                  >
                    <HiOutlineCodeBracket className="w-4 h-4" /> Repository
                  </a>
                )}
              </div>
            </Section>
          )}

          {/* Ask AI button */}
          <Link
            to={`/chat?project=${id}`}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <HiOutlineSparkles className="w-5 h-5" />
            Ask AI About This Project
          </Link>
        </div>
      </div>
    </div>
  );
}
