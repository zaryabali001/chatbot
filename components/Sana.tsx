/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // ── Config states ──
  const [uniqueId, setUniqueId] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("sana_unique_id") || "" : ""
  );

  const [hospitalName, setHospitalName] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("sana_hospital_name") || "Your Hospital" : "Your Hospital"
  );

  const [logo, setLogo] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("sana_logo") || "/sana.png" : "/sana.png"
  );

  const [buttonImage, setButtonImage] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("sana_button_image") || "/emr.jpg" : "/emr.jpg"
  );

  // ── UI states ──
  const [isOpen, setIsOpen] = useState(false);
  const [showQueries, setShowQueries] = useState(false);
  const [autoPopupIndex, setAutoPopupIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sana_chat_history");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        } catch (e) {
          console.error("Error loading chat history:", e);
        }
      }
    }
    return [];
  });

  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Effects ──
  useEffect(() => {
    return () => {
      if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const serialized = JSON.stringify(
          messages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          }))
        );
        localStorage.setItem("sana_chat_history", serialized);
      } catch (e) {
        console.error("Error saving chat history:", e);
      }
    }
  }, [messages]);

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
    window.parent.postMessage({ type: "SANA_REQUEST_CONFIG" }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto popup sequence
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

  // ── API & Formatting ──
  const getApiEndpoint = () => "/api/sana-chat";

  const formatResponse = (raw: string): string => {
    let text = raw.trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed?.data && typeof parsed.data === "string") text = parsed.data;
    } catch {}

    text = text.replace(/\\n/g, "\n");
    text = text.replace(/\n\s*\n+/g, "\n\n").trim();
    text = text.replace(/^(\d+\.\s+)(.*?)(:|\?)$/gm, "$1**$2$3**");
    text = text.replace(/^(\s*)([-*•—])\s+/gm, "$1- ");

    return text;
  };

  const sendMessageToApi = async (userMessage: string): Promise<string> => {
    if (!uniqueId) {
      return "Error: Hospital configuration (Unique ID) is missing. Please contact your administrator.";
    }

    const endpoint = getApiEndpoint();
    const historyArray = messages.map((msg) =>
      `${msg.type === "user" ? "User" : "Assistant"}: ${msg.content}`
    );

    const payload = {
      unique_id: uniqueId,
      query: userMessage,
      history: historyArray,
      chat_history: historyArray.join("\n"),
      end_user_id: typeof window !== "undefined" ? localStorage.getItem("sana_end_user_id") || "" : "",
      channel: "website",
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

  // ── Handlers ──
  const handleQueryClick = async (type: QueryType) => {
    setIsOpen(true);
    setShowQueries(false);
    if (autoPopupTimeoutRef.current) clearTimeout(autoPopupTimeoutRef.current);

    let content = "";
    switch (type) {
      case "appointment": content = "Book an Appointment"; break;
      case "report":      content = "I need information"; break;
      case "assistant":   content = "Talk to AI Health Assistant"; break;
    }
    if (!content) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
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
      ...(replyingTo && { replyTo: { id: replyingTo.id, content: replyingTo.content } }),
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

  const handleCopyMessage = async (content: string, id: string) => {
    const cleanContent = content.replace(/\*\*(.*?)\*\*/g, "$1").trim();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cleanContent);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = cleanContent;
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
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
    { emoji: "📄", text: "I need information", type: "report" as QueryType },
    { emoji: "💬", text: "Talk to AI Health Assistant", type: "assistant" as QueryType },
  ];

  // ── Render ──
  return (
    <>
      {/* Floating button + quick actions popup */}
      <div className="fixed bottom-3 right-3 xs:bottom-4 xs:right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-[9999] pointer-events-none">
        <div
          ref={containerRef}
          className="relative flex flex-col-reverse xs:flex-row items-center gap-2 xs:gap-3 sm:gap-4 pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {!isOpen && (
            <div className="hidden xs:block absolute right-full mr-2 xs:mr-3 sm:mr-5 whitespace-nowrap pointer-events-none">
              <span className="bg-gradient-to-r from-green-600 to-emerald-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md">
                Chat with Sana AI
              </span>
            </div>
          )}

          {showQueries && !isOpen && (
            <div className="absolute bottom-[3.5rem] xs:bottom-[4.5rem] sm:bottom-20 right-0 flex flex-col gap-1.5 xs:gap-2 sm:gap-3 min-w-[220px] xs:min-w-[240px] sm:min-w-[260px] animate-in fade-in slide-in-from-bottom-5 duration-300 px-2 xs:px-0">
              {queryOptions.map((q, i) => (
                <button
                  key={q.type}
                  onClick={() => handleQueryClick(q.type)}
                  className={cn(
                    "px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-3.5 w-full bg-white/90 backdrop-blur-sm border border-white/30 hover:border-green-400 rounded-full shadow-md hover:shadow-xl transition-all hover:scale-[1.03] active:scale-100 text-left",
                    autoPopupIndex === i && "ring-4 ring-green-300 ring-offset-2"
                  )}
                >
                  <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3">
                    <span className="text-lg xs:text-xl sm:text-2xl">{q.emoji}</span>
                    <span className="text-xs xs:text-sm sm:text-[13px] font-semibold text-gray-800 leading-tight">
                      {q.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center relative group animate-pulse-slow flex-shrink-0"
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

      {/* Main Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 xs:inset-0 sm:inset-auto sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-9999 w-full xs:max-w-[calc(100vw-24px)] sm:w-[380px] md:w-[400px] lg:w-[420px] max-w-[90vw] h-screen xs:h-[calc(100vh-48px)] sm:h-[620px] lg:h-[600px] bg-white sm:rounded-2xl rounded-none shadow-2xl overflow-hidden border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="bg-linear-to-r from-green-600 via-emerald-600 to-teal-600 px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 flex-1">
              <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <img src={logo} alt="Hospital logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm xs:text-base sm:text-lg truncate">{hospitalName}</h3>
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-300 rounded-full animate-pulse shrink-0" />
                  <span className="text-white/90 text-[11px] xs:text-xs sm:text-sm whitespace-nowrap">Sana AI • Online</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 xs:w-8.5 xs:h-8.5 sm:w-9 sm:h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors touch-target"
              >
                <svg className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setMessages([]);
                  setReplyingTo(null);
                }}
                className="w-8 h-8 xs:w-8.5 xs:h-8.5 sm:w-9 sm:h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors touch-target"
              >
                <svg className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 xs:px-4 sm:px-5 py-4 xs:py-5 sm:py-6 bg-gradient-to-b from-gray-50/70 to-white">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-3 xs:px-4 sm:px-6">
                <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-3 xs:mb-4 sm:mb-5 shadow-sm">
                  <img src={logo} alt="Logo" className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 object-contain" />
                </div>
                <h4 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 mb-1.5 xs:mb-2 sm:mb-3">
                  Welcome to {hospitalName}
                </h4>
                <p className="text-xs xs:text-sm text-gray-600 mb-4 xs:mb-6 sm:mb-8 leading-relaxed max-w-xs">
                  Your AI-powered health assistant is here to help.
                </p>
                <div className="w-full space-y-2 xs:space-y-2.5 sm:space-y-3 max-w-sm">
                  {queryOptions.map((q) => (
                    <button
                      key={q.type}
                      onClick={() => handleQueryClick(q.type)}
                      className="w-full py-2.5 xs:py-3 sm:py-3.5 px-3 xs:px-4 sm:px-5 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl text-left flex items-center gap-2 xs:gap-2.5 sm:gap-3 transition-colors shadow-sm active:scale-95"
                    >
                      <span className="text-lg xs:text-xl sm:text-2xl flex-shrink-0">{q.emoji}</span>
                      <span className="text-xs xs:text-sm sm:text-base font-medium text-gray-800 break-words">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 xs:space-y-4 sm:space-y-5">
                <div className="text-[10px] xs:text-xs text-gray-500 text-center mb-2">
                  Chat history loaded ({messages.length} messages)
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className="flex">
                    {msg.replyTo && msg.type === "user" && (
                      <div className="flex justify-end mb-1 w-full">
                        <div className="max-w-[90%] xs:max-w-[85%] sm:max-w-[80%] px-2.5 xs:px-3 py-1.5 xs:py-2 bg-gray-100/80 rounded-lg text-[11px] xs:text-xs text-gray-600 italic border-l-3 border-green-400">
                          ↳ {msg.replyTo.content.substring(0, 50)}
                          {msg.replyTo.content.length > 50 ? "..." : ""}
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex w-full",
                        msg.type === "user" ? "justify-end" : "justify-start"
                      )}
                      onMouseEnter={() => {
                        if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);
                        setHoveredMessage(msg.id);
                      }}
                      onMouseLeave={() => {
                        hoverDelayRef.current = setTimeout(() => setHoveredMessage(null), 800);
                      }}
                    >
                      <div className="max-w-[90%] xs:max-w-[88%] sm:max-w-[85%] relative group">
                        <div
                          className={cn(
                            "px-3 xs:px-3.5 sm:px-4 py-2.5 xs:py-3 sm:py-3 rounded-2xl shadow-sm text-[13px] xs:text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words",
                            msg.type === "user"
                              ? "bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-br-none"
                              : "bg-gradient-to-br from-green-50 to-emerald-50 text-gray-900 border border-green-100 rounded-bl-none"
                          )}
                        >
                          {msg.content.split("\n").map((line, i) => (
                            <div key={i} className={cn(line.trim() === "" ? "h-3 xs:h-4" : "min-h-[1.5em]")}>
                              {line
                                .split(/(\*\*.*?\*\*)/g)
                                .map((part, pi) =>
                                  part.startsWith("**") && part.endsWith("**") ? (
                                    <strong key={pi}>{part.slice(2, -2)}</strong>
                                  ) : (
                                    part
                                  )
                                )}
                            </div>
                          ))}
                        </div>

                        {msg.type === "ai" && hoveredMessage === msg.id && (
                          <div
                            className="absolute -bottom-9 xs:-bottom-10 left-0 xs:left-1 flex gap-1.5 xs:gap-2 bg-white rounded-lg shadow-md border px-1.5 xs:px-2 py-1 text-[11px] xs:text-xs animate-in fade-in slide-in-from-top-3 z-10 pointer-events-auto"
                            onMouseEnter={() => {
                              if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);
                            }}
                            onMouseLeave={() => {
                              hoverDelayRef.current = setTimeout(() => setHoveredMessage(null), 800);
                            }}
                          >
                            <button
                              onClick={() => handleCopyMessage(msg.content, msg.id)}
                              className="flex items-center gap-1 hover:bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors touch-target"
                            >
                              {copiedId === msg.id ? (
                                <span className="text-green-600 font-medium whitespace-nowrap">Copied ✓</span>
                              ) : (
                                <>
                                  <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="hidden xs:inline">Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleReplyToMessage(msg)}
                              className="flex items-center gap-1 hover:bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors touch-target"
                            >
                              <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                />
                              </svg>
                              <span className="hidden xs:inline">Reply</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 xs:px-4.5 sm:px-5 py-2.5 xs:py-3 sm:py-3.5 bg-green-50/60 rounded-2xl rounded-bl-none border border-green-100">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 xs:w-2.5 xs:h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <div className="w-2 h-2 xs:w-2.5 xs:h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:180ms]" />
                        <div className="w-2 h-2 xs:w-2.5 xs:h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:360ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-4 bg-white border-t border-gray-200">
            {replyingTo && (
              <div className="mb-2.5 xs:mb-3 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 bg-green-50 rounded-xl flex items-start justify-between gap-1.5 xs:gap-2 sm:gap-3 border-l-4 border-green-500 animate-in fade-in slide-in-from-bottom-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] xs:text-xs font-medium text-green-700 mb-0.5 sm:mb-1">Replying to:</p>
                  <p className="text-xs xs:text-sm text-gray-700 truncate leading-snug">{replyingTo.content}</p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-0.5 xs:p-1 sm:p-1.5 hover:bg-green-100 rounded-lg transition-colors shrink-0 touch-target"
                >
                  <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-end gap-1.5 xs:gap-2 sm:gap-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32 transition-all placeholder:text-gray-400"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="h-9 xs:h-9.5 sm:h-10 w-9 xs:w-9.5 sm:w-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center shrink-0 touch-target"
              >
                <svg
                  className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-white transform scale-110"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2z"
                  />
                </svg>
              </Button>
            </div>

            <div className="text-[10px] xs:text-xs text-gray-400 mt-1.5 xs:mt-2 sm:mt-3 text-center">
              <a href="https://emrchains.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
                Powered by <span className="text-green-600 font-semibold">EMRChains</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}