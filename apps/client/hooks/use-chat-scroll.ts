"use client";

import type { ChatMessage } from "@/components/project/editor/types";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Owns every scroll concern for the chat column: the "scroll to latest" button
 * affordance, the one-shot jump-to-bottom when an email's history first paints,
 * and snapping a just-sent user message to the top of the viewport.
 *
 * The page wires `messagesRef`/`latestUserRef` into the DOM and calls
 * `requestUserScroll()` right after appending a user message.
 */
export function useChatScroll(
  currentEmailId: string | null,
  messages: ChatMessage[],
) {
  const messagesRef = useRef<HTMLDivElement>(null);
  // The just-sent user message — scrolled to the top of the chat on send.
  const latestUserRef = useRef<HTMLDivElement>(null);
  const pendingUserScrollRef = useRef(false);
  const autoScrollEmailRef = useRef<string | null>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = messagesRef.current;
    if (!node) return;
    setCanScrollDown(node.scrollTop + node.clientHeight < node.scrollHeight - 24);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // Flag a send so the effect below pins the new user message to the top.
  const requestUserScroll = useCallback(() => {
    pendingUserScrollRef.current = true;
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  useEffect(() => {
    autoScrollEmailRef.current = currentEmailId;
  }, [currentEmailId]);

  useEffect(() => {
    if (!currentEmailId || !messages.length) return;
    const hasCurrentEmailMessages = messages.some(
      (message) => message.emailId === currentEmailId,
    );
    if (!hasCurrentEmailMessages) return;
    if (autoScrollEmailRef.current !== currentEmailId) return;
    if (!messagesRef.current) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (autoScrollEmailRef.current !== currentEmailId) return;
        messagesRef.current?.scrollTo({
          top: messagesRef.current.scrollHeight,
          behavior: "auto",
        });
        updateScrollState();
        autoScrollEmailRef.current = null;
      });
    });
  }, [currentEmailId, messages, updateScrollState]);

  // After a send, snap the new user message to the top of the chat. Runs only
  // on send (flag set via requestUserScroll), never on load or project swap.
  useEffect(() => {
    if (!pendingUserScrollRef.current) return;
    pendingUserScrollRef.current = false;
    requestAnimationFrame(() => {
      latestUserRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });
  }, [messages]);

  return {
    messagesRef,
    latestUserRef,
    canScrollDown,
    updateScrollState,
    scrollToBottom,
    requestUserScroll,
  };
}
