"use client";

import { useRef, useEffect } from "react";

export function ChatScrollAnchor({ messages }) {
  const scrollAnchorRef = useRef(null);

  useEffect(() => {
    if (scrollAnchorRef.current) {
        scrollAnchorRef.current.scrollIntoView({
            block: "start",
            behavior: "smooth",
      });
    }
  }, [messages]); // Trigger scroll whenever messages array changes

  return <div ref={scrollAnchorRef} className="h-px w-full" />;
}