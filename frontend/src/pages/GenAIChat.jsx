import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useChatStore } from "../stores/chatStore";
import { useAuthStore } from "../stores/authStore";
import { useProjectStore } from "../stores/projectStore";
import ChatBubble from "../components/ChatBubble";
import { ChatBubbleSkeleton } from "../components/Skeleton";
import {
  HiOutlineSparkles,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiMiniStop,
  HiOutlineClock,
  HiOutlineChevronLeft,
  HiOutlinePlus,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg animate-pulse">
        <HiOutlineSparkles className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="chat-bubble-ai flex items-center gap-2 py-4 px-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-purple-500"
            style={{
              animation: `typing 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function GenAIChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");
  const {
    messages,
    isStreaming,
    suggestions,
    error,
    sendMessage,
    fetchSuggestions,
    clearChat,
    clearError,
    chatSessions,
    loadingSessions,
    fetchChatSessions,
    loadChatSession,
    deleteChatSession,
    stopStreaming,
    startNewChat,
  } = useChatStore();
  const { currentProject, fetchProjectById } = useProjectStore();
  const { accessToken, isAuthenticated } = useAuthStore();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/chat");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchSuggestions(projectId);
      fetchChatSessions(projectId, accessToken);
    }
    if (projectId) fetchProjectById(projectId).catch(() => {});
  }, [projectId, isAuthenticated, accessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isStreaming) return;
    setInput("");

    let context = null;
    if (currentProject && projectId) {
      context = `Title: ${currentProject.title}\nProblem: ${currentProject.problem_statement}\nSolution: ${currentProject.solution}\nTech: ${currentProject.tech_stack?.join(", ")}`;
    }
    await sendMessage(query, context, projectId, accessToken);

    // Refresh chat sessions after message is sent (delayed to ensure DB is updated)
    setTimeout(() => {
      if (isAuthenticated && accessToken) {
        fetchChatSessions(projectId, accessToken);
      }
    }, 1000);
  };

  const handleStop = () => {
    stopStreaming();
  };

  const handleNewChat = () => {
    startNewChat();
    setShowHistory(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (q) => {
    setInput(q);
    textareaRef.current?.focus();
  };

  const handleLoadSession = async (sessionId) => {
    await loadChatSession(sessionId, accessToken);
    setShowHistory(false);
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (confirm("Delete this chat session?")) {
      await deleteChatSession(sessionId, accessToken);
      // Refresh sessions list after deletion
      await fetchChatSessions(projectId, accessToken);
    }
  };

  if (!isAuthenticated) {
    return null; // Redirecting...
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Chat History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              <HiOutlinePlus className="w-5 h-5" />
              New Chat
            </button>
          </div>
          <div className="flex-1 p-4 space-y-2">
            {loadingSessions && (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading...
              </div>
            )}
            {!loadingSessions && chatSessions.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <HiOutlineChatBubbleLeftRight className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No chat history yet</p>
                <p className="text-xs mt-1">
                  Start a conversation to see it here
                </p>
              </div>
            )}
            {chatSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleLoadSession(session.id)}
                className="group p-3 rounded-xl border border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session.title || session.preview || "Untitled Chat"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.message_count}{" "}
                      {session.message_count === 1 ? "message" : "messages"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <HiOutlineClock className="w-3 h-3" />
                      {new Date(session.updated_at).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-600 transition-all"
                    title="Delete chat"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/98 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl blur opacity-50 animate-pulse-slow"></div>
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <HiOutlineSparkles className="w-5.5 h-5.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  AI Chat Assistant
                </h1>
                <p className="text-xs text-gray-600 font-semibold">
                  {projectId && currentProject
                    ? `💬 ${currentProject.title}`
                    : "✨ RAG-powered · Hackathon Expert"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                title="Chat history"
                className={`p-2.5 rounded-xl transition-all ${
                  showHistory
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                }`}
              >
                <HiOutlineChatBubbleLeftRight className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleNewChat}
                title="New chat"
                className="p-2.5 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <HiOutlinePlus className="w-4.5 h-4.5" />
              </button>
              {projectId && (
                <Link
                  to={`/projects/${projectId}`}
                  className="btn-ghost text-xs hidden sm:flex items-center gap-1"
                >
                  ← Back
                </Link>
              )}
              <button
                onClick={clearChat}
                title="Clear chat"
                className="p-2.5 rounded-xl text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <HiOutlineTrash className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 bg-gradient-to-b from-gray-50/50 to-white">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              /* Empty state with suggestions */
              <div className="animate-fade-in">
                <div className="text-center mb-12 mt-8">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse-slow"></div>
                    <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-100 via-purple-100 to-pink-100 border-2 border-primary-200 flex items-center justify-center shadow-xl">
                      <HiOutlineSparkles className="w-12 h-12 text-primary-600 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                    Let's Chat!
                  </h2>
                  <p className="text-gray-600 text-base max-w-md mx-auto font-medium leading-relaxed">
                    Ask me anything about hackathon projects. I use advanced RAG
                    to provide context-aware, intelligent answers.
                  </p>
                </div>
                {suggestions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
                    {suggestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestion(q)}
                        className="group relative glass-card-hover text-left px-5 py-4 rounded-2xl transition-all font-medium overflow-hidden animate-slide-up"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-start gap-3">
                          <span className="text-primary-600 text-lg font-bold mt-0.5 group-hover:scale-110 transition-transform">
                            💡
                          </span>
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors leading-relaxed">
                            {q}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <ChatBubble message={msg} />
                </div>
              ))
            )}

            {/* Typing indicator — show when streaming AND last message is still empty */}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1]?.content === "" && (
                <TypingIndicator />
              )}

            {/* Error */}
            {error && (
              <div className="animate-slide-down">
                <div className="relative flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-300 text-rose-700 text-sm max-w-lg mx-auto font-semibold shadow-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
                    <span className="text-white text-lg">⚠️</span>
                  </div>
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={clearError}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-rose-200 transition-colors"
                  >
                    <HiOutlineArrowPath className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 bg-white/98 backdrop-blur-xl px-4 sm:px-6 py-5 shadow-lg">
          <div className="max-w-4xl mx-auto">
            {/* Suggestion chips when chat has messages */}
            {messages.length > 0 && suggestions.length > 0 && !isStreaming && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {suggestions.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(q)}
                    className="flex-shrink-0 px-4 py-2 text-xs rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 text-gray-700 hover:text-primary-600 hover:border-primary-400 hover:from-primary-50 hover:to-purple-50 transition-all font-semibold shadow-sm hover:shadow-md"
                  >
                    ✨ {q.length > 50 ? q.slice(0, 50) + "…" : q}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="💭 Ask me anything about hackathon projects..."
                  className="w-full px-5 py-4 bg-white border-2 border-gray-300 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none min-h-[56px] max-h-[160px] leading-relaxed shadow-sm hover:shadow-md font-medium"
                  rows={1}
                  disabled={isStreaming}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 font-medium">
                  {input.length > 0 && `${input.length} chars`}
                </div>
              </div>
              <button
                onClick={isStreaming ? handleStop : handleSend}
                disabled={!isStreaming && !input.trim()}
                id="chat-send"
                title={isStreaming ? "Stop generating" : "Send message"}
                className="relative h-[56px] w-[56px] p-0 flex items-center justify-center flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                {isStreaming ? (
                  <HiMiniStop className="w-6 h-6" />
                ) : (
                  <HiOutlinePaperAirplane className="w-6 h-6" />
                )}
                {!isStreaming && input.trim() && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
