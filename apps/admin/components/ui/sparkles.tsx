"use client";

import React, { useMemo } from "react";
import { Particles } from "@tsparticles/react";

interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}

export function SparklesCore({
  id,
  className,
  background = "transparent",
  minSize = 0.6,
  maxSize = 1.4,
  speed = 1,
  particleColor = "#ffffff",
  particleDensity = 100,
}: SparklesCoreProps) {
  const options = useMemo(
    () => ({
      background: {
        color: background,
      },
      fpsLimit: 60,
      fullScreen: {
        enable: false,
        zIndex: 0,
      },
      particles: {
        color: {
          value: particleColor,
        },
        move: {
          enable: true,
          direction: "none" as const,
          speed: {
            min: 0.1,
            max: 0.3,
          },
        },
        number: {
          value: particleDensity,
        },
        opacity: {
          value: {
            min: 0.4,
            max: 0.9,
          },
          animation: {
            enable: true,
            speed: speed,
            minimumValue: 0.4,
          },
        },
        size: {
          value: {
            min: minSize,
            max: maxSize,
          },
        },
      },
      detectRetina: true,
    }),
    [background, particleColor, particleDensity, minSize, maxSize, speed]
  );

  return (
    <Particles
      id={id}
      className={className}
      options={options}
    />
  );
}
