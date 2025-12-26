"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QueryType = "appointment" | "report" | "assistant" | null

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  replyTo?: {
    id: string
    content: string
  }
}

interface HospitalChatbotProps {
  uniqueId?: string
}

export default function HospitalChatbot({ uniqueId }: HospitalChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showQueries, setShowQueries] = useState(false)
  const [autoPopupIndex, setAutoPopupIndex] = useState(0) // Tracks which popup to highlight in sequence
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoPopupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-show all three queries one by one (highlighting effect) every few seconds when chat is closed
  useEffect(() => {
    if (isOpen || showQueries) return

    let index = 0

    const showNext = () => {
      if (index < 3) {
        setAutoPopupIndex(index)
        setShowQueries(true)

        autoPopupTimeoutRef.current = setTimeout(() => {
          setShowQueries(false)
          index++
          setTimeout(() => {
            if (index < 3) showNext()
          }, 500) // Delay before next highlight
        }, 2000) // Each highlight visible for ~2s
      }
    }

    autoPopupTimeoutRef.current = setTimeout(showNext, 1000)

    return () => {
      if (autoPopupTimeoutRef.current) clearTimeout(autoPopupTimeoutRef.current)
    }
  }, [isOpen])

  // Handle mouse enter on main button or popup area
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (autoPopupTimeoutRef.current) {
      clearTimeout(autoPopupTimeoutRef.current)
    }
    setShowQueries(true)
    setAutoPopupIndex(-1) // Remove any auto-highlight when manually hovering
  }

  // Handle mouse leave from the entire container
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowQueries(false)
    }, 300)
  }

  const handleQueryClick = (type: QueryType) => {
    setIsOpen(true)
    setShowQueries(false)
    if (autoPopupTimeoutRef.current) clearTimeout(autoPopupTimeoutRef.current)

    let userContent = ""
    switch (type) {
      case "appointment":
        userContent = "Book an Appointment"
        break
      case "report":
        userContent = "Upload Medical Report"
        break
      case "assistant":
        userContent = "Talk to AI Health Assistant"
        break
    }

    if (userContent) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: userContent,
        timestamp: new Date(),
      }
      setMessages([userMessage])

      setTimeout(() => {
        const aiResponses: Record<string, string> = {
          appointment: "Great! I can help you book an appointment. Which department would you like to visit? (e.g., Cardiology, Pediatrics, etc.)",
          report: "You can upload your medical report here for analysis. Please share the report or describe your concern.",
          assistant: "Hello! I'm your AI Health Assistant. How can I help you today? Feel free to describe symptoms, ask about conditions, or get general health advice.",
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: aiResponses[type!],
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      }, 800)
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
      ...(replyingTo && {
        replyTo: {
          id: replyingTo.id,
          content: replyingTo.content,
        },
      }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setReplyingTo(null)

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "I understand your concern. Our medical team will review this shortly. In the meantime, would you like to schedule a consultation?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    }, 1000)
  }

  const handleCopyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const queryOptions = [
    { emoji: "🩺", text: "Book an Appointment", type: "appointment" as QueryType },
    { emoji: "📄", text: "Upload Medical Report", type: "report" as QueryType },
    { emoji: "💬", text: "Talk to AI Health Assistant", type: "assistant" as QueryType },
  ]

  return (
    <>
      {/* Floating Chatbot Icon with Left Label */}
      <div className="max-w-[calc(100vw-3rem)] fixed bottom-6 right-6 pointer-events-none z-9999">
        <div
          ref={containerRef}
          className="relative flex items-center gap-4 pointer-events-auto "
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Persistent Label on the Left */}
          {!isOpen && (
            <div className="absolute right-full mr-4 whitespace-nowrap pointer-events-none">
              <span className="bg-linear-to-r from-green-600 to-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                Chat with SANA AI
              </span>
            </div>
          )}

          {/* Smart Popup Queries - All three on hover or auto sequence */}
          {showQueries && !isOpen && (
            <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {queryOptions.map((query, index) => (
                <button
                  key={query.type}
                  onClick={() => handleQueryClick(query.type)}
                  className={cn(
                    " px-5 py-2.5 backdrop-blur-xl border border-white/30 hover:border-green-500 rounded-full transition-all duration-300 hover:scale-105",
                    autoPopupIndex === index && "ring-4 ring-green-400 ring-offset-2" // Optional highlight during auto sequence  
                  )}
                >
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <span className="text-xl">{query.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                      {query.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Main Chatbot Icon */}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-linear-to-br from-green-500 to-emerald-600 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group relative animate-in fade-in zoom-in"
            >
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-green-500 to-emerald-600 opacity-75 group-hover:opacity-100 transition-opacity" />

              {/* <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg> */}

             

            </button>
          )}
        </div>
      </div>

      {/* Chat Window - completely unchanged */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-100 h-160 max-w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-linear-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  {/* <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg> */}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">MediCare Hospital</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                    <p className="text-white/90 text-xs">Sana AI Assistant • Online</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setMessages([])
                    setReplyingTo(null)
                  }}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-112.5 overflow-y-auto px-6 py-4 bg-linear-to-b from-gray-50 to-white">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Welcome to SanaAi</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your AI health assistant is ready to help. Choose a quick action or type your message below.
                  </p>

                  <div className="mt-6 flex flex-col gap-2 w-full">
                    <button
                      onClick={() => handleQueryClick("appointment")}
                      className="px-4 py-3 bg-transparent hover:bg-green-50 rounded-xl text-sm font-medium text-green-700 transition-colors text-left flex items-center gap-2"
                    >
                      <span>🩺</span>
                      <span>Book an Appointment</span>
                    </button>
                    <button
                      onClick={() => handleQueryClick("report")}
                      className="px-4 py-3 bg-transparent hover:bg-green-50 rounded-xl text-sm font-medium text-emerald-700 transition-colors text-left flex items-center gap-2"
                    >
                      <span>📄</span>
                      <span>Upload Medical Report</span>
                    </button>
                    <button
                      onClick={() => handleQueryClick("assistant")}
                      className="px-4 py-3 bg-transparent hover:bg-green-50 rounded-xl text-sm font-medium text-teal-700 transition-colors text-left flex items-center gap-2"
                    >
                      <span>💬</span>
                      <span>Talk to AI Health Assistant</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.replyTo && message.type === "user" && (
                        <div className="flex justify-end mb-1">
                          <div className="max-w-[80%] px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 italic border-l-2 border-green-500">
                            Replying to: {message.replyTo.content.substring(0, 50)}
                            {message.replyTo.content.length > 50 ? "..." : ""}
                          </div>
                        </div>
                      )}
                      <div
                        className={cn("flex", message.type === "user" ? "justify-end" : "justify-start")}
                        onMouseEnter={() => setHoveredMessage(message.id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        <div className={cn("max-w-[80%] relative group")}>
                          <div
                            className={cn(
                              "px-4 py-3 rounded-2xl shadow-sm transition-all duration-300",
                              message.type === "user"
                                ? "bg-linear-to-br from-green-500 via-emerald-500 to-green-600 text-white rounded-br-sm"
                                : "bg-linear-to-br from-green-50 to-emerald-50 text-gray-800 border border-green-100 rounded-bl-sm",
                            )}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          </div>

                          {message.type === "ai" && hoveredMessage === message.id && (
                            <div className="absolute -bottom-8 left-0 flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                              <button
                                onClick={() => handleCopyMessage(message.content, message.id)}
                                className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded transition-all duration-200"
                                title="Copy message"
                              >
                                {copiedId === message.id ? (
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                                <span className={cn("text-xs transition-colors", copiedId === message.id ? "text-green-600" : "text-gray-600")}>
                                  {copiedId === message.id ? "Copied!" : "Copy"}
                                </span>
                              </button>
                              <div className="w-px h-4 bg-gray-300" />
                              <button
                                onClick={() => handleReplyToMessage(message)}
                                className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                                title="Reply to message"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                <span className="text-xs text-gray-600">Reply</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 bg-white border-t border-gray-100">
              {replyingTo && (
                <div className="mb-3 px-3 py-2 bg-green-50 rounded-lg flex items-start justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 border-l-2 border-green-500">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-700 mb-1">Replying to:</p>
                    <p className="text-xs text-gray-600 truncate">{replyingTo.content}</p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-green-100 rounded transition-colors shrink-0"
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
                  rows={1}
                  placeholder="Type your health concern… "
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-none max-h-32 overflow-y-auto"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center p-0 mb-0.5"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
               <div className="text-xs text-gray-400 mt-2 text-center">
            Powered by &nbsp;
            <span className="text-green-600 font-bold">
              EMRCHains
            </span>
          </div>
            </div>
          </div>
        </div>
      )}
    
   
    </>
  )
}