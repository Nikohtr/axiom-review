"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PHRASES = [
  "in seconds",
  "you can act on",
  "that ships faster",
  "before users complain",
];

const TYPE_SPEED = 55; // ms per character
const DELETE_SPEED = 35; // ms per character (faster delete)
const PAUSE_AFTER_TYPE = 2200;
const PAUSE_AFTER_DELETE = 300;

export default function RotatingText() {
  const [displayed, setDisplayed] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Blinking cursor
  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  const tick = useCallback(() => {
    const currentPhrase = PHRASES[phraseIndex];

    if (!isDeleting) {
      // Typing
      const next = currentPhrase.slice(0, displayed.length + 1);
      setDisplayed(next);

      if (next === currentPhrase) {
        // Finished typing — pause then start deleting
        timeoutRef.current = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPE);
        return;
      }
      timeoutRef.current = setTimeout(tick, TYPE_SPEED + Math.random() * 40);
    } else {
      // Deleting
      const next = currentPhrase.slice(0, displayed.length - 1);
      setDisplayed(next);

      if (next === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
        timeoutRef.current = setTimeout(tick, PAUSE_AFTER_DELETE);
        return;
      }
      timeoutRef.current = setTimeout(tick, DELETE_SPEED);
    }
  }, [displayed, phraseIndex, isDeleting]);

  useEffect(() => {
    timeoutRef.current = setTimeout(tick, TYPE_SPEED);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [tick]);

  return (
    <span className="italic text-[var(--accent)]">
      {displayed}
      <span
        className="inline-block w-[2px] translate-y-[1px] align-baseline"
        style={{
          height: "1.05em",
          background: "var(--accent)",
          opacity: showCursor ? 1 : 0,
          marginLeft: "2px",
        }}
      />
    </span>
  );
}
