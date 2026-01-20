/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QueryType = "appointment" | "report" | "assistant" | null;

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  replyTo?: {
    id: string;
    content: string;
  };
}

export default function Sana() {
  // ── Config states (loaded from localStorage + postMessage) ──
  const [uniqueId, setUniqueId] = useState<string>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("sana_unique_id") || ""
      : "";
  });

  const [hospitalName, setHospitalName] = useState<string>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("sana_hospital_name") || "Your Hospital"
      : "Your Hospital";
  });

  const [logo, setLogo] = useState<string>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("sana_logo") || "/sana.png"
      : "/sana.png";
  });

  const [buttonImage, setButtonImage] = useState<string>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("sana_button_image") || "/emr.jpg"
      : "/emr.jpg";
  });

  // ── UI / Chat states ──
  const [isOpen, setIsOpen] = useState(false);
  const [showQueries, setShowQueries] = useState(false);
  const [autoPopupIndex, setAutoPopupIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPopupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Config sync via postMessage ──
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "SANA_CONFIG_UPDATE") {
        const { unique_id, hospital_name, logo, buttonImage } = event.data;

        if (unique_id) {
          setUniqueId(unique_id);
          localStorage.setItem("sana_unique_id", unique_id);
        }

        if (hospital_name) {
          setHospitalName(hospital_name);
          localStorage.setItem("sana_hospital_name", hospital_name);
        }

        if (logo) {
          setLogo(logo);
          localStorage.setItem("sana_logo", logo);
        }

        if (buttonImage) {
          setButtonImage(buttonImage);
          localStorage.setItem("sana_button_image", buttonImage);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Request initial config from parent
    window.parent.postMessage({ type: "SANA_REQUEST_CONFIG" }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-popup sequence (quick actions)
  useEffect(() => {
    if (isOpen || showQueries) return;

    let index = 0;
    const showNext = () => {
      if (index >= 3) return;
      setAutoPopupIndex(index);
      setShowQueries(true);

      autoPopupTimeoutRef.current = setTimeout(() => {
        setShowQueries(false);
        index++;
        setTimeout(() => {
          if (index < 3) showNext();
        }, 500);
      }, 2200);
    };

    autoPopupTimeoutRef.current = setTimeout(showNext, 1400);

    return () => {
      if (autoPopupTimeoutRef.current) clearTimeout(autoPopupTimeoutRef.current);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (autoPopupTimeoutRef.current) clearTimeout(autoPopupTimeoutRef.current);
    setShowQueries(true);
    setAutoPopupIndex(-1);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowQueries(false);
    }, 400);
  };

  const getApiEndpoint = () => "/api/sana-chat";

  const formatResponse = (text: string): string => {
    let formatted = text;

    // Bold headings
    formatted = formatted.replace(/^([A-Z][^:\n]*:?)$/gm, (m) =>
      m.length > 3 ? `**${m}**` : m
    );

    // Normalize bullets
    formatted = formatted.replace(/^([\s]*)([-*•])\s+/gm, "$1• ");

    return formatted;
  };

  const sendMessageToApi = async (userMessage: string): Promise<string> => {
    if (!uniqueId) {
      return "Error: Hospital configuration (Unique ID) is missing. Please contact your administrator.";
    }

    const endpoint = getApiEndpoint();
    const payload = {
      unique_id: uniqueId,
      query: userMessage,
      history: [], // you can extend later with real history
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain; charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return `Server error (${res.status}): ${errText || "No details"}`;
      }

      const text = await res.text();
      return formatResponse(text || "Thank you for your message.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Connection failed: ${msg}. Check network or API endpoint.`;
    }
  };

  const handleQueryClick = async (type: QueryType) => {
    setIsOpen(true);
    setShowQueries(false);
    if (autoPopupTimeoutRef.current) clearTimeout(autoPopupTimeoutRef.current);

    let content = "";
    switch (type) {
      case "appointment":
        content = "Book an Appointment";
        break;
      case "report":
        content = "Upload Medical Report";
        break;
      case "assistant":
        content = "Talk to AI Health Assistant";
        break;
    }

    if (!content) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages([userMsg]);
    setIsTyping(true);

    const aiText = await sendMessageToApi(content);
    setIsTyping(false);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      type: "ai",
      content: aiText.replace(/\{hospital_name\}/g, hospitalName),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
      ...(replyingTo && {
        replyTo: { id: replyingTo.id, content: replyingTo.content },
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setReplyingTo(null);
    setIsTyping(true);

    const aiText = await sendMessageToApi(inputValue);

    setIsTyping(false);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      type: "ai",
      content: aiText.replace(/\{hospital_name\}/g, hospitalName),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleReplyToMessage = (msg: Message) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const queryOptions = [
    { emoji: "🩺", text: "Book an Appointment", type: "appointment" as QueryType },
    { emoji: "📄", text: "Upload Medical Report", type: "report" as QueryType },
    { emoji: "💬", text: "Talk to AI Health Assistant", type: "assistant" as QueryType },
  ];

  return (
    <>
      {/* Floating button + quick actions popup */}
      <div className="fixed bg-transparent bottom-2 right-6 z-9999 max-w-[calc(100vw-3rem)] pointer-events-none shadow-none">
        <div
          ref={containerRef}
          className="relative flex items-center gap-4 pointer-events-auto shadow-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {!isOpen && (
            <div className="absolute right-full mr-5 whitespace-nowrap pointer-events-none">
              <span className="bg-gradient-to-r from-green-600 to-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                Chat with Sana AI
              </span>
            </div>
          )}

          {showQueries && !isOpen && (
            <div className="absolute bottom-20 right-0 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-5 duration-300">
              {queryOptions.map((q, i) => (
                <button
                  key={q.type}
                  onClick={() => handleQueryClick(q.type)}
                  className={cn(
                    "px-6 py-3  w-60    bg-white/80 border border-white/40 hover:border-green-400 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105",
                    autoPopupIndex === i && "ring-4 ring-green-300 ring-offset-2"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{q.emoji}</span>
                    <span className="text-[12px] font-semibold text-gray-800">{q.text}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center relative group animate-pulse-slow"
            >
              <div className="absolute inset-0 rounded-full bg-green-400 opacity-25 animate-ping" />
              <img
                src={buttonImage}
                alt="Sana Chat"
                className="rounded-full w-full h-full object-cover border-2 border-white/30"
              />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Chat Window ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[380px] h-[620px] max-h-[calc(100vh-5rem)] max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-400">
          <div className="h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <img src={logo} alt="Hospital logo" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{hospitalName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                    <span className="text-white/90 text-xs">Sana AI • Online</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setMessages([]);
                    setReplyingTo(null);
                  }}
                  className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-gradient-to-b from-gray-50/70 to-white">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5 shadow-sm">
                    <img src={logo} alt="Logo" className="w-14 h-14 object-contain" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">Welcome to {hospitalName}</h4>
                  <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                    Your AI-powered health assistant is here to help.
                  </p>
                  <div className="w-full space-y-1">
                    {queryOptions.map((q) => (
                      <button
                        key={q.type}
                        onClick={() => handleQueryClick(q.type)}
                        className="w-full py-3.5 px-5 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl text-left flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <span className="text-xl">{q.emoji}</span>
                        <span className="text-sm font-medium text-gray-800">{q.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      {msg.replyTo && msg.type === "user" && (
                        <div className="flex justify-end mb-1.5">
                          <div className="max-w-[78%] px-3 py-2 bg-gray-100/80 rounded-lg text-xs text-gray-600 italic border-l-3 border-green-400">
                            ↳ {msg.replyTo.content.substring(0, 60)}
                            {msg.replyTo.content.length > 60 ? "..." : ""}
                          </div>
                        </div>
                      )}

                      <div
                        className={cn("flex", msg.type === "user" ? "justify-end" : "justify-start")}
                        onMouseEnter={() => setHoveredMessage(msg.id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        <div className="max-w-[82%] relative group">
                          <div
                            className={cn(
                              "px-4 py-3 rounded-2xl shadow-sm",
                              msg.type === "user"
                                ? "bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-br-none"
                                : "bg-gradient-to-br from-green-50 to-emerald-50 text-gray-900 border border-green-100 rounded-bl-none"
                            )}
                          >
                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content.split("\n").map((line, i) => (
                                <div key={i}>
                                  {line.split(/(\*\*.*?\*\*)/g).map((part, pi) =>
                                    part.startsWith("**") && part.endsWith("**") ? (
                                      <strong key={pi}>{part.slice(2, -2)}</strong>
                                    ) : (
                                      part
                                    )
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {msg.type === "ai" && hoveredMessage === msg.id && (
                            <div className="absolute -bottom-10 left-2 flex gap-2 bg-white rounded-lg shadow-md border px-2 py-1.5 text-xs animate-in fade-in slide-in-from-top-3">
                              <button
                                onClick={() => handleCopyMessage(msg.content, msg.id)}
                                className="flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                              >
                                {copiedId === msg.id ? (
                                  <span className="text-green-600">Copied ✓</span>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleReplyToMessage(msg)}
                                className="flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Reply
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="px-5 py-3.5 bg-green-50/60 rounded-2xl rounded-bl-none border border-green-100">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:180ms]" />
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:360ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="shrink-0 px-5 py-4 bg-white border-t border-gray-200">
              {replyingTo && (
                <div className="mb-3 px-4 py-2.5 bg-green-50 rounded-xl flex items-start justify-between gap-3 border-l-4 border-green-500 animate-in fade-in slide-in-from-bottom-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-700 mb-1">Replying to:</p>
                    <p className="text-sm text-gray-700 truncate leading-snug">{replyingTo.content}</p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1.5 hover:bg-green-100 rounded-lg transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32 transition-all placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2z" />
                  </svg>
                </Button>
              </div>

              <div className="text-xs text-gray-400 mt-3 text-center">
                Powered by <span className="text-green-600 font-semibold">EMRChains</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}