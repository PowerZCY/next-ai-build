'use client';
import React from 'react';

const NUM_ROWS = 15;
const NUM_COLS = 15;
const DOT_SIZE = 6; // px, dot diameter
const SPACING = 12; // px, space between dot centers
const ANIMATION_DURATION = 1.8; // seconds
const STAGGER_DELAY_FACTOR = 0.08; // seconds, delay per unit of distance from center

// Expanded palette for more "dazzling" effect
const COLORS = [
  '#AC62FD', // Base Purple
  '#C364FA', 
  '#DD59F7',
  '#FF4FF2', // Bright Pink/Magenta
  '#F067DD',
  '#E26AF8',
  '#DA70D6', // Orchid
  '#BA55D3', // Medium Orchid
  '#9370DB', // Medium Purple
  '#8A2BE2'  // Blue Violet
];

export default function Loading() {
  const dots = [];
  const centerX = (NUM_COLS - 1) / 2;
  const centerY = (NUM_ROWS - 1) / 2;

  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      // Calculate distance from the center of the grid
      const distance = Math.sqrt(Math.pow(i - centerY, 2) + Math.pow(j - centerX, 2));
      dots.push({
        id: `${i}-${j}`,
        row: i,
        col: j,
        // Animation delay based on distance, creating a ripple effect
        delay: distance * STAGGER_DELAY_FACTOR,
        // Color selection based on distance rings
        color: COLORS[Math.floor(distance) % COLORS.length],
      });
    }
  }

  // Calculate the total width and height of the dot container
  const containerWidth = (NUM_COLS - 1) * SPACING + DOT_SIZE;
  const containerHeight = (NUM_ROWS - 1) * SPACING + DOT_SIZE;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
      <div
        style={{
          width: containerWidth,
          height: containerHeight,
          position: 'relative',
          borderRadius: '50%', // Make the container circular
          overflow: 'hidden',   // Clip dots outside the circle
        }}
      >
        {dots.map(dot => (
          <div
            key={dot.id}
            style={{
              position: 'absolute',
              left: dot.col * SPACING,
              top: dot.row * SPACING,
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: dot.color,
              borderRadius: '50%',
              animationName: 'dotPulseAnimation',
              animationDuration: `${ANIMATION_DURATION}s`,
              animationTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)', // Smoother easing
              animationIterationCount: 'infinite',
              animationDelay: `${dot.delay}s`,
              opacity: 0, // Start fully transparent, animation will fade it in
              transform: 'scale(0)', // Start scaled down
            }}
          />
        ))}
        {/* Centered Loading Text */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none' }} // So text doesn't interfere with potential mouse events on dots if any
        >
          <p className="text-xl font-semibold text-white">
            Loading...
          </p>
        </div>
      </div>
      {/* 
        The <style jsx global> tag allows for defining global CSS, including @keyframes.
        These styles will apply to this component and its children.
      */}
      <style jsx global>{`
        @keyframes dotPulseAnimation {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          25% { /* Peak of the pulse, more prominent */
            transform: scale(1.2);
            opacity: 1;
          }
          50% { /* Start to fade and shrink */
             transform: scale(0.8);
             opacity: 0.7;
          }
          100% { /* Fully faded and shrunk back */
            transform: scale(0.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}