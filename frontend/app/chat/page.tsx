"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowUp } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useActionState } from "react";

export default function Chatpage() {
  const [messages, setMessages] = React.useState<
    {
      user: "user" | "bot";
      text: string;
    }[]
  >([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

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

  const [, action, pending] = useActionState(
    (prev: unknown, formData: FormData) => {
      const message = formData.get("message") as string;
      if (!message || message.trim() === "") return;
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "user", text: message },
      ]);
    },
    undefined
  );
  return (
    <div className="flex items-center justify-center flex-col min-h-screen px-4 bg-zinc-100 space-y-4">
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
          <h2 className="text-lg font-semibold">Chat</h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about your image
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
                    "rounded-2xl w-fit min-h-8 px-3 py-1.5 text-sm flex items-center text-left",
                    user === "user"
                      ? "ml-auto text-white bg-sky-500"
                      : "mr-auto text-neutral-800 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-800 animate-message-user",
                    "max-w-96"
                  )}
                >
                  {text}
                </div>
              </div>
            </div>
          ))}
        </div>
        <hr />
        <CardContent>
          <form action={action} className="w-full flex items-center gap-2">
            <Input name="message" placeholder="Type your message..." />
            <Button type="submit" disabled={pending} size="icon">
              <ArrowUp />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
