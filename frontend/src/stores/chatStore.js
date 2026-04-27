import { create } from "zustand";
import { useAuthStore } from "./authStore";

const rawBaseURL = (
  import.meta.env.VITE_API_BASE_URL || "https://times-1vx0.onrender.com"
).trim();
const sanitizedBaseURL = rawBaseURL?.replace(/\/+$/, "");
const apiBaseURL = sanitizedBaseURL
  ? sanitizedBaseURL.endsWith("/api")
    ? sanitizedBaseURL
    : `${sanitizedBaseURL}/api`
  : "https://times-1vx0.onrender.com/api";

// Helper to refresh token if needed
async function getValidToken() {
  const authStore = useAuthStore.getState();
  let token = authStore.accessToken;

  if (!token) {
    // Try to refresh first
    try {
      await authStore.refreshToken();
      token = useAuthStore.getState().accessToken;
    } catch {
      return null;
    }
  }

  return token;
}

export const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  suggestions: [],
  error: null,
  currentSessionId: null,
  chatSessions: [],
  loadingSessions: false,
  streamReader: null,

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  updateLastAssistantMessage: (content) => {
    set((state) => {
      const msgs = [...state.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
        msgs[lastIdx] = {
          ...msgs[lastIdx],
          content: msgs[lastIdx].content + content,
        };
      }
      return { messages: msgs };
    });
  },

  setLastAssistantSources: (sources) => {
    set((state) => {
      const msgs = [...state.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
        msgs[lastIdx] = { ...msgs[lastIdx], sources };
      }
      return { messages: msgs };
    });
  },

  sendMessage: async (
    query,
    projectContext = null,
    projectId = null,
    accessToken = null,
  ) => {
    const priorMessages = get().messages;
    const sessionId = get().currentSessionId;

    // Add user message
    get().addMessage({ role: "user", content: query, timestamp: new Date() });

    // Add empty assistant message
    get().addMessage({
      role: "assistant",
      content: "",
      timestamp: new Date(),
      sources: [],
    });

    set({ isStreaming: true, error: null });

    // Get a valid token (refresh if needed)
    let token = accessToken || (await getValidToken());

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let response = await fetch(`${apiBaseURL}/genai/chat`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          query,
          project_context: projectContext,
          project_id: projectId,
          session_id: sessionId,
          history: [...priorMessages, { role: "user", content: query }]
            .filter((m) => m?.role === "user" || m?.role === "assistant")
            .map((m) => ({ role: m.role, content: String(m.content || "") }))
            .slice(-8),
        }),
      });

      // Handle 401 - try to refresh token and retry
      if (response.status === 401) {
        try {
          await useAuthStore.getState().refreshToken();
          token = useAuthStore.getState().accessToken;

          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            response = await fetch(`${apiBaseURL}/genai/chat`, {
              method: "POST",
              headers,
              credentials: "include",
              body: JSON.stringify({
                query,
                project_context: projectContext,
                project_id: projectId,
                session_id: sessionId,
                history: [...priorMessages, { role: "user", content: query }]
                  .filter((m) => m?.role === "user" || m?.role === "assistant")
                  .map((m) => ({
                    role: m.role,
                    content: String(m.content || ""),
                  }))
                  .slice(-8),
              }),
            });
          }
        } catch (refreshErr) {
          throw new Error("Session expired. Please login again.");
        }
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Request failed (${response.status})`,
        );
      }

      // Extract session ID from response header
      const newSessionId = response.headers.get("X-Session-ID");
      if (newSessionId && !sessionId) {
        set({ currentSessionId: newSessionId });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Store reader so we can cancel it
      set({ streamReader: reader });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const payload = JSON.parse(line.slice(6));

              if (payload.type === "chunk") {
                get().updateLastAssistantMessage(payload.content);
              } else if (payload.type === "sources") {
                get().setLastAssistantSources(payload.content);
              } else if (payload.type === "error") {
                set({ error: payload.content });
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } catch (err) {
      set({ error: err.message });
      // Update last assistant message with error indication
      get().updateLastAssistantMessage("\n\n*[Error: Failed to get response]*");
    } finally {
      set({ isStreaming: false, streamReader: null });
    }
  },

  stopStreaming: () => {
    const reader = get().streamReader;
    if (reader) {
      reader.cancel();
      set({ isStreaming: false, streamReader: null });
    }
  },

  startNewChat: () => {
    set({
      messages: [],
      currentSessionId: null,
      error: null,
      isStreaming: false,
      streamReader: null,
    });
  },

  fetchSuggestions: async (projectId = null) => {
    try {
      const params = projectId ? `?project_id=${projectId}` : "";
      const response = await fetch(`${apiBaseURL}/genai/suggestions${params}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        set({ suggestions: data });
      }
    } catch {
      // Silently fail for suggestions
    }
  },

  clearChat: () => {
    const reader = get().streamReader;
    if (reader) {
      reader.cancel();
    }
    set({
      messages: [],
      error: null,
      currentSessionId: null,
      isStreaming: false,
      streamReader: null,
    });
  },
  clearError: () => set({ error: null }),

  // Chat history management
  fetchChatSessions: async (projectId = null, accessToken = null) => {
    set({ loadingSessions: true });
    try {
      const headers = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const params = projectId ? `?project_id=${projectId}` : "";
      const response = await fetch(
        `${apiBaseURL}/genai/chat/sessions${params}`,
        {
          headers,
          credentials: "include",
        },
      );

      if (response.ok) {
        const sessions = await response.json();
        set({ chatSessions: sessions, loadingSessions: false });
      } else {
        set({ loadingSessions: false });
      }
    } catch {
      set({ loadingSessions: false });
    }
  },

  loadChatSession: async (sessionId, accessToken = null) => {
    try {
      const headers = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${apiBaseURL}/genai/chat/sessions/${sessionId}`,
        {
          headers,
          credentials: "include",
        },
      );

      if (response.ok) {
        const session = await response.json();
        set({
          messages: session.messages || [],
          currentSessionId: sessionId,
          error: null,
        });
      }
    } catch (err) {
      set({ error: "Failed to load chat session" });
    }
  },

  deleteChatSession: async (sessionId, accessToken = null) => {
    try {
      const headers = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${apiBaseURL}/genai/chat/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers,
          credentials: "include",
        },
      );

      if (response.ok) {
        // Remove from local state
        set((state) => ({
          chatSessions: state.chatSessions.filter((s) => s.id !== sessionId),
        }));

        // Clear current session if it was deleted
        if (get().currentSessionId === sessionId) {
          set({ messages: [], currentSessionId: null });
        }
      }
    } catch {
      set({ error: "Failed to delete chat session" });
    }
  },
}));
