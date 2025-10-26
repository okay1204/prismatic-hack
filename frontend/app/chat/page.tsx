"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowUp, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { sendChatMessageStream, type ChatMessage } from "@/lib/chat-stream";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ChatContent() {
  const searchParams = useSearchParams();
  
  // Get diagnosis from URL params (from image analysis) or default to empty
  const diagnosisFromUrl = searchParams.get("diagnosis") || "";
  
  const [messages, setMessages] = useState<
    {
      user: "user" | "bot";
      text: string;
    }[]
  >([]);
  const [inputMessage, setInputMessage] = useState("");
  const [diagnosis, setDiagnosis] = useState(diagnosisFromUrl);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedInitialMessage = useRef(false);

  useEffect(() => {
    // Scroll the last message into view when messages change
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      return;
    }

    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Automatically send initial message when diagnosis is present
  useEffect(() => {
    if (diagnosisFromUrl && messages.length === 0 && !hasLoadedInitialMessage.current) {
      hasLoadedInitialMessage.current = true;
      
      const sendInitialMessage = async () => {
        setIsLoading(true);
        
        const botMessage = { user: "bot" as const, text: "" };
        setMessages([botMessage]);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/chat";
        
        const success = await sendChatMessageStream(
          "Give me a brief overview of my diagnosis and what I should know.",
          [],
          diagnosisFromUrl,
          (chunk: string) => {
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                text: newMessages[newMessages.length - 1].text + chunk,
              };
              return newMessages;
            });
          },
          apiUrl
        );
        
        if (!success) {
          setMessages((prev) => [
            ...prev,
            {
              user: "bot",
              text: "Sorry, there was an error connecting to the server. Please try again.",
            },
          ]);
        }
        
        setIsLoading(false);
      };
      
      sendInitialMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosisFromUrl]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage || inputMessage.trim() === "" || isLoading) return;

    // Validate diagnosis is provided
    if (!diagnosis || diagnosis.trim() === "") {
      setMessages((prev) => [
        ...prev,
        {
          user: "bot",
          text: "Please enter a diagnosis before chatting. You can upload an image for analysis or manually enter a diagnosis.",
        },
      ]);
      return;
    }

    const userMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    // Add user message to chat
    setMessages((prev) => [...prev, { user: "user", text: userMessage }]);

    // Prepare chat history for API
    const history: ChatMessage[] = messages.map((msg) => ({
      role: msg.user === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    // Add placeholder for bot response
    const botMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { user: "bot", text: "" }]);

    // Get API URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;

    if (!apiUrl) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          user: "bot",
          text: "Error: Chatbot API URL not configured. Please set NEXT_PUBLIC_CHATBOT_API_URL in .env.local",
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      // Stream the response
      const result = await sendChatMessageStream(
        userMessage,
        history,
        diagnosis,
        (chunk) => {
          // Update the bot's message with each chunk
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages[botMessageIndex]) {
              newMessages[botMessageIndex] = {
                user: "bot",
                text: newMessages[botMessageIndex].text + chunk,
              };
            }
            return newMessages;
          });
        },
        apiUrl
      );

      if (!result.success) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            user: "bot",
            text: `Error: ${result.error}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          user: "bot",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center flex-col flex-1 px-4 bg-zinc-100 space-y-4">
      <header className="flex items-center w-full max-w-xl ">
        <Link href="/">
          <Button size="sm" variant="outline">
            <ArrowLeft />
            Back
          </Button>
        </Link>
      </header>
      <Card className="max-w-xl w-full">
        <CardHeader className="text-center">
          <h2 className="text-lg font-semibold">Medical Assistant Chat</h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about your condition
          </p>
        </CardHeader>
        <hr />
        <div ref={containerRef} className="h-96 overflow-y-scroll space-y-0.5">
          {messages.map(({ user, text }, index) => (
            <div
              key={index}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
              className="px-6 flex items-end gap-2 first:pt-6 last:pb-6"
            >
              <div className="bg-zinc-200 rounded-full" />
              <div
                className={cn(
                  "relative w-full transition-transform duration-300 ease-in-out dark:drop-shadow-xs",
                  user === "user" ? " active:translate-x-1" : ""
                )}
              >
                <svg
                  width="11"
                  height="19"
                  viewBox="0 0 11 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={cn(
                    "absolute",
                    user === "user"
                      ? "-right-1.5 bottom-0 fill-sky-500"
                      : "-left-1.5 bottom-0 fill-neutral-200"
                  )}
                >
                  {user === "user" ? (
                    <path d="M10.5854 18.2383C10.5854 18.2383 4.74297 9.90892 4.74297 3.50015C4.74297 -2.90862 0 -0.0955902 0 8.51334C0 17.1223 10.5854 18.2383 10.5854 18.2383Z" />
                  ) : (
                    <path d="M0.207306 19C0.207306 19 6.04972 10.6706 6.04972 4.26187C6.04972 -2.1469 10.7927 0.666129 10.7927 9.27505C10.7927 17.884 0.207306 19 0.207306 19Z" />
                  )}
                </svg>
                <div
                  className={cn(
                    "rounded-2xl w-fit min-h-8 px-3 py-1.5 text-sm text-left prose prose-sm dark:prose-invert max-w-none",
                    user === "user"
                      ? "ml-auto text-white bg-sky-500"
                      : "mr-auto text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-800 animate-message-user",
                    "max-w-96"
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
                      code: ({ className, children }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-neutral-700 dark:bg-neutral-800 px-1 py-0.5 rounded text-xs">{children}</code>
                        ) : (
                          <code className={`block bg-neutral-700 dark:bg-neutral-900 p-2 rounded text-xs overflow-x-auto ${className}`}>{children}</code>
                        );
                      },
                      pre: ({ children }) => <pre className="bg-neutral-700 dark:bg-neutral-900 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
        <hr />
        <CardContent>
          <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
            <Input
              name="message"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} size="icon">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ArrowUp />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Chatpage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
