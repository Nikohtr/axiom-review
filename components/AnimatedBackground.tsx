"use client";

import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let animId: number;
    let mouseX = 0.5;
    let mouseY = 0.3;
    let currentX = 0.5;
    let currentY = 0.3;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    };

    const animate = () => {
      currentX += (mouseX - currentX) * 0.03;
      currentY += (mouseY - currentY) * 0.03;
      glow.style.background = `radial-gradient(700px circle at ${currentX * 100}% ${currentY * 100}%, rgba(196, 93, 62, 0.15) 0%, rgba(196, 138, 62, 0.06) 40%, transparent 70%)`;
      animId = requestAnimationFrame(animate);
    };

    // Listen on window so pointer-events:none doesn't block it
    window.addEventListener("mousemove", onMouseMove);
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Mouse-following warm glow */}
      <div ref={glowRef} className="absolute inset-0" />

      {/* Floating orbs */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 600,
          height: 600,
          top: "5%",
          left: "10%",
          background: "radial-gradient(circle, rgba(196, 93, 62, 0.13), transparent 70%)",
          animation: "orb-drift-1 25s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 500,
          height: 500,
          top: "30%",
          right: "5%",
          background: "radial-gradient(circle, rgba(196, 138, 62, 0.11), transparent 70%)",
          animation: "orb-drift-2 30s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 450,
          height: 450,
          bottom: "10%",
          left: "35%",
          background: "radial-gradient(circle, rgba(138, 109, 94, 0.10), transparent 70%)",
          animation: "orb-drift-3 20s ease-in-out infinite",
          willChange: "transform",
        }}
      />
    </div>
  );
}
