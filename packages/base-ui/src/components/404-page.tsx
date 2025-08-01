'use client';

import { NotFoundIcon } from "@base-ui/components/global-icon";
import { useEffect, useState, type ReactNode } from "react";

interface NotFoundPageProps {
  siteIcon: ReactNode;
}

export function NotFoundPage({ siteIcon }: NotFoundPageProps) {
  const [glitchText, setGlitchText] = useState("404");

  // glitch effect
  useEffect(() => {
    const glitchChars = ["4", "0", "4", "?", "#", "!", "*", "&", "%", "$"];

    const interval = setInterval(() => {
      // 80% probability to display "404", 20% probability to display random characters
      if (Math.random() < 0.5) {
        setGlitchText("404");
      } else {
        const randomChars = Array.from(
          { length: 3 },
          () => glitchChars[Math.floor(Math.random() * glitchChars.length)]
        ).join("");
        setGlitchText(randomChars);
      }
    }, 600); // every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full px-4 py-8">
      {/* main content area */}
      <div className="text-center space-y-8 max-w-2xl">
        {/* 404 number - glitch effect */}
        <div className="relative flex justify-center">
          <h1
            className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent select-none"
            style={{
              fontFamily: "Montserrat, monospace",
              textShadow: "0 0 30px rgba(172, 98, 253, 0.3)",
              letterSpacing: "0.1em",
            }}
          >
            {glitchText}
          </h1>
          {/* scan line effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full w-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent animate-pulse" />
          </div>
        </div>

        {/* error message */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            The page you&#39;re looking for doesn&#39;t exist
          </p>
        </div>

        {/* decorative elements */}
        <div className="flex justify-center items-center gap-8 pt-8 opacity-60">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {siteIcon}
            <span>Woops!</span>
          </div>
          <div className="w-1 h-1 bg-purple-500 rounded-full animate-ping" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <NotFoundIcon />
            <span>Error Code: 404</span>
          </div>
        </div>
      </div>

      {/* background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* grid background */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
                linear-gradient(rgba(172, 98, 253, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(172, 98, 253, 0.1) 1px, transparent 1px)
              `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* floating particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-500/20 rounded-full animate-bounce"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}