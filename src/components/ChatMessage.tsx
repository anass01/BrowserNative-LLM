/**
 * components/ChatMessage.tsx
 * Renders a single chat message with markdown and code highlighting.
 */
"use client";

import { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check, User, Sparkles } from "lucide-react";
import type { Message } from "@/hooks/useChat";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy message"
      className="opacity-0 group-hover:opacity-100 absolute top-2 right-2
        p-1.5 rounded-md bg-[#27272a] hover:bg-[#3f3f46]
        text-[#71717a] hover:text-[#f0f0f2]
        transition-all duration-150"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`fade-slide-up flex gap-3 ${isUser ? "flex-row-reverse" : ""} group w-full`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5
        ${isUser
          ? "bg-gradient-to-br from-[#6366f1] to-[#818cf8]"
          : "bg-[#1a1a1e] border border-[#27272a]"
        }`}
      >
        {isUser
          ? <User size={14} className="text-white" />
          : <Sparkles size={14} className="text-[#6366f1]" />
        }
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`
            relative px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? "bg-gradient-to-br from-[#1d4ed8] to-[#3730a3] text-white rounded-tr-sm"
              : "bg-[#1a1a1e] border border-[#27272a] text-[#e4e4e7] rounded-tl-sm"
            }
          `}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className={`prose ${isStreaming && !message.content ? "min-h-[1.5rem]" : ""}`}>
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Code block with copy button
                    pre: ({ children, ...props }) => {
                      // Extract raw text from children for the copy button
                      let rawText = "";
                      try {
                        const codeElement = (children as any);
                        if (codeElement?.props?.children) {
                          rawText = codeElement.props.children;
                        }
                      } catch { /* ignore */ }

                      return (
                        <div className="relative group/code">
                          <pre {...props}>{children}</pre>
                          {rawText && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(rawText).catch(() => { /* ignore */ });
                              }}
                              className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100
                                px-2 py-1 rounded bg-[#27272a] text-[#a1a1aa] text-xs
                                hover:text-white transition-all duration-150"
                            >
                              Copy
                            </button>
                          )}
                        </div>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : null}
              {isStreaming && <span className="cursor-blink" />}
            </div>
          )}

          {/* Copy button for user messages */}
          {isUser && <CopyButton text={message.content} />}
        </div>

        {/* Copy button for assistant messages */}
        {!isUser && message.content && !isStreaming && (
          <div className="mt-1 ml-1">
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
});
