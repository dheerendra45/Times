import React from "react";
import ReactMarkdown from "react-markdown";
import { HiSparkles, HiUser } from "react-icons/hi2";

export default function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`relative w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${
            isUser
              ? "bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600"
              : "bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600"
          }`}
        >
          {!isUser && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 blur opacity-40 animate-pulse-slow"></div>
          )}
          <div className="relative">
            {isUser ? (
              <HiUser className="w-4.5 h-4.5 text-white" />
            ) : (
              <HiSparkles className="w-4.5 h-4.5 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] sm:max-w-[80%] ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}
      >
        <div
          className={`text-sm leading-relaxed prose prose-sm max-w-none ${isUser ? "text-white" : "text-gray-900"}`}
        >
          {isUser ? (
            <p className="font-medium">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                code: ({ node, inline, className, children, ...props }) => {
                  if (inline) {
                    return (
                      <code
                        className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 border border-primary-200 rounded-md text-primary-700 text-xs font-mono font-bold"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-4 overflow-x-auto my-3 shadow-sm">
                      <code
                        className="text-xs font-mono text-gray-800 font-semibold"
                        {...props}
                      >
                        {children}
                      </code>
                    </pre>
                  );
                },
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-3 space-y-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 mb-3 space-y-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-extrabold text-gray-900">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-700">{children}</em>
                ),
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold text-gray-900 mb-2 mt-3">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold text-gray-900 mb-2 mt-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-bold text-gray-900 mb-2 mt-2">
                    {children}
                  </h3>
                ),
              }}
            >
              {message.content || ""}
            </ReactMarkdown>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
              <span>📚</span> Sources:
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((src, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-primary-50 to-purple-50 text-primary-700 rounded-full border-2 border-primary-200 font-semibold shadow-sm"
                >
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                  Project #{src.project_id.slice(-4)} (
                  {(src.score * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
