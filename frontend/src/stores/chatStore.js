import { create } from "zustand";

const rawBaseURL = (
  import.meta.env.VITE_API_BASE_URL || "https://times-1vx0.onrender.com"
).trim();
const sanitizedBaseURL = rawBaseURL?.replace(/\/+$/, "");
const apiBaseURL = sanitizedBaseURL
  ? sanitizedBaseURL.endsWith("/api")
    ? sanitizedBaseURL
    : `${sanitizedBaseURL}/api`
  : "https://times-1vx0.onrender.com/api";

export const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  suggestions: [],
  error: null,

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

  sendMessage: async (query, projectContext = null) => {
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

    try {
      const response = await fetch(`${apiBaseURL}/genai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ query, project_context: projectContext }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Request failed (${response.status})`,
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

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
      set({ isStreaming: false });
    }
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

  clearChat: () => set({ messages: [], error: null }),
  clearError: () => set({ error: null }),
}));
