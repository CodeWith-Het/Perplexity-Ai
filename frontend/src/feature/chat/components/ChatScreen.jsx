import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../../auth/hook/useAuth";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import GlobalSearchModal from "./GlobalSearchModal";
import ThemeToggle from "./../../../app/components/ThemeToggle";

// Helper function: Array of objects ko string mein badalne ke liye
const formatMessage = (content) => {
  if (typeof content === "string") return content;
  return Array.isArray(content)
    ? content.map((block) => block.text || "").join("")
    : JSON.stringify(content);
};

// Helper function: [1], [2] jaise citation markers ko clickable badges mein badalne ke liye
const renderWithCitations = (text, citations = []) => {
  if (!citations.length) return text;

  return text.split(/(\[\d+\])/g).map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) return part;

    const citation = citations.find((c) => c.id === Number(match[1]));
    if (!citation) return part;

    return (
      <a
        key={i}
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        title={citation.title}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold mx-0.5 align-middle hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors no-underline"
      >
        {match[1]}
      </a>
    );
  });
};

const ChatScreen = () => {
  const [chatInput, setChatInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { isLoading, chats, isActiveChatId, messages } = useSelector(
    (state) => state.chat,
  );

  const { id } = useParams();
  const navigate = useNavigate();

  const { newChats, loadMessages, sendMessage, deleteChat } = useChat();
  const { logoutUser } = useAuth();

  const userInitial = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "U";

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatInput("");
    await sendMessage(text, isActiveChatId);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (id && id !== isActiveChatId) {
      loadMessages(id);
    }
  }, [id]);

  return (
    // Background changes based on theme
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans overflow-hidden relative transition-colors duration-300">
      {/* MOBILE DRAWER OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* ⬅️ SIDEBAR */}
      <aside
        className={`fixed md:relative z-50 h-full w-72 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-neutral-800 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:flex`}
      >
        {/* Mobile Close Button */}
        <div className="flex justify-end p-3 md:hidden border-b border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        {/* Brand */}
        <div
          className="flex items-center gap-2 mb-4 mt-5 ml-5 text-xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors"
        >
          <div className="w-8 h-8 bg-white text-black flex justify-center items-center rounded-sm">
            K
          </div>
          KNOW <span className="text-emerald-500">AI</span>
        </div>
        {/* 🎯 ACTION BUTTONS */}
        <div className="p-4 pt-3 space-y-3">
          <button
            onClick={() => {
              newChats();
              navigate("/");
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all font-semibold text-sm cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            New Chat
          </button>

          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl transition-all font-medium text-sm cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            Search Chats
          </button>
        </div>
        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 mt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-2 font-semibold">
            Recent
          </p>

          {chats && chats.length > 0 ? (
            chats.map((c, index) => (
              <div
                key={index}
                onClick={() => {
                  loadMessages(c._id);
                  navigate(`/chat/${c._id}`);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${
                  isActiveChatId === c._id
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-500 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 border-l-2 border-transparent"
                }`}
              >
                <span className="truncate w-4/5">
                  {c.title || "New Conversation"}
                </span>
                <svg
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(c._id, isActiveChatId);
                  }}
                  className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-2">
              No recent chats
            </p>
          )}
        </div>
        {/* Bottom: User Profile & Theme Toggle */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-800 space-y-4 bg-gray-50/50 dark:bg-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-800/50">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* 🌟 Theme Toggle Injected Here */}
            <ThemeToggle className="shrink-0" />
          </div>

          <button
            onClick={async () => {
              try {
                await logoutUser();
                navigate("/login");
              } catch (logoutError) {
                console.error(logoutError);
              }
            }}
            className="w-full rounded-lg bg-white dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 border border-gray-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/30 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* 🎯 MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative w-full h-full">
        {/* Header for mobile */}
        <header className="h-14 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4 shadow-sm md:hidden shrink-0 transition-colors">
          <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 dark:bg-white text-white dark:text-black flex justify-center items-center rounded-sm text-xs">
              K
            </div>
            KNOW{" "}
            <span className="text-emerald-600 dark:text-emerald-500">AI</span>
          </span>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </header>

        {/* Chat Messages Display */}
        <div className="flex-1 overflow-y-scroll scroll-smooth p-4 md:p-8 max-w-4xl mx-auto w-full h-[calc(100vh-120px)] overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {!messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-10 animate-fade-up">
              <span className="font-mono text-xs tracking-[0.2em] text-emerald-600 dark:text-emerald-500 uppercase font-semibold">
                Ask anything
              </span>
              <h1 className="text-3xl md:text-5xl text-gray-900 dark:text-white font-extrabold tracking-tight">
                What do you want to{" "}
                <span className="italic text-emerald-600 dark:text-emerald-500">
                  know?
                </span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-md">
                Ask anything to search, synthesize, and get direct, sourced
                answers from live data.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-20">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
                >
                  {msg.role === "user" ? (
                    <div className="p-4 max-w-[85%] md:max-w-[80%] rounded-2xl rounded-br-sm bg-gray-900 dark:bg-emerald-600 text-white shadow-lg shadow-gray-900/10 dark:shadow-emerald-900/20">
                      {formatMessage(msg.content)}
                    </div>
                  ) : (
                    <div className="p-5 max-w-[85%] md:max-w-[80%] rounded-2xl rounded-bl-sm bg-white dark:bg-[#121212] border border-gray-200 dark:border-neutral-800 border-l-4 border-l-emerald-500 shadow-md overflow-hidden transition-colors">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 overflow-x-auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="leading-relaxed">
                                {React.Children.map(children, (child) =>
                                  typeof child === "string"
                                    ? renderWithCitations(child, msg.citations)
                                    : child,
                                )}
                              </p>
                            ),
                          }}
                        >
                          {formatMessage(msg.content)}
                        </ReactMarkdown>
                      </div>

                      {msg.streaming && (
                        <div className="mt-3 flex items-center gap-1.5 text-gray-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      )}

                      {/* 📚 Sources list */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-2">
                          <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
                            Sources
                          </p>
                          {msg.citations.map((c) => (
                            <a
                              key={c.id}
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors bg-gray-50 dark:bg-neutral-900 p-2 rounded-lg border border-gray-100 dark:border-neutral-800"
                            >
                              <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold flex items-center justify-center">
                                {c.id}
                              </span>
                              <span className="truncate leading-tight mt-0.5">
                                {c.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#121212] border border-gray-200 dark:border-neutral-800 border-l-4 border-l-emerald-500 rounded-2xl rounded-bl-sm shadow-md text-gray-600 dark:text-gray-400 transition-colors">
                    <div className="w-5 h-5 border-2 border-emerald-200 dark:border-emerald-900 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      Synthesizing real-time data…
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ⌨️ INPUT AREA */}
        <div className="p-4 md:p-6 w-full max-w-4xl mx-auto sticky bottom-0 bg-gray-50/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md z-30 shrink-0 transition-colors">
          <div className="relative border border-gray-300 dark:border-neutral-700 rounded-2xl shadow-lg bg-white dark:bg-[#121212] focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <textarea
              id="chat-input"
              name="chatInput"
              className="w-full bg-transparent p-4 pr-16 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none font-medium [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              rows="2"
              placeholder="Ask anything…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            ></textarea>
            <button
              onClick={handleSend}
              disabled={isLoading || !chatInput.trim()}
              className="absolute right-3 bottom-3 p-2.5 bg-gray-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl transition-colors shadow-md cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
              </svg>
            </button>
          </div>
          <div className="relative flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-gray-400 font-mono px-2 hidden md:flex">
            <span className="absolute right-0">Shift + Enter for new line</span>
          </div>
        </div>
      </main>

      {/* 🎯 GLOBAL SEARCH MODAL */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />
    </div>
  );
};

export default ChatScreen;
