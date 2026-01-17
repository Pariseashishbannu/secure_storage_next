"use client";

import React, { useEffect, useRef } from 'react';

interface Star {
    x: number;
    y: number;
    radius: number;
    alpha: number;
    speed: number;
    offset: number;
}

export const SpaceBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = {
                x: e.clientX,
                y: e.clientY
            };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let stars: Star[] = [];
        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;

        const initStars = () => {
            stars = [];
            const starCount = Math.floor((width * height) / 3000); // Increased Density

            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1.5 + 0.1,
                    alpha: Math.random(),
                    speed: Math.random() * 0.2 + 0.05, // Increased speed range
                    offset: Math.random() * Math.PI * 2
                });
            }
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initStars();
        };

        const animate = (time: number) => {
            ctx.clearRect(0, 0, width, height);

            // Calculate parallax target (center based)
            const targetX = (mouseRef.current.x - width / 2) * 0.05;
            const targetY = (mouseRef.current.y - height / 2) * 0.05;

            // Draw Stars
            stars.forEach(star => {
                ctx.beginPath();
                // Twinkle effect
                const opacity = star.alpha + Math.sin(time * 0.001 + star.offset) * 0.3;
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, opacity))})`;
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                // Move upwards
                star.y -= star.speed;

                // Mouse Parallax drift
                star.x += (targetX - (star.x - width / 2) * 0.02) * 0.002 * star.speed; // Subtle drift
                star.y += (targetY - (star.y - height / 2) * 0.02) * 0.002 * star.speed;

                // Reset loops
                if (star.y < 0) {
                    star.y = height;
                    star.x = Math.random() * width;
                }
                if (star.x > width) star.x = 0;
                if (star.x < 0) star.x = width;
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 bg-black pointer-events-none hidden dark:block"
            style={{ background: 'radial-gradient(circle at 50% 10%, #1a1a1a 0%, #000 100%)' }}
        />
    );
};
