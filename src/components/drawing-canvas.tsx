"use client";

import type { FC } from 'react';
import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';

interface DrawingCanvasProps {
  width: number;
  height: number;
  strokeColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  className?: string;
  onModified?: () => void;
}

export interface DrawingCanvasRef {
  captureDrawing: () => string | null;
  clearCanvas: () => void;
}

const DrawingCanvas = React.forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  (
    {
      width,
      height,
      strokeColor = '#000000',
      lineWidth = 5,
      backgroundColor = '#FFFFFF',
      className,
      onModified,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          setContext(ctx);
          // Initialize canvas with background color
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }
      }
    }, [width, height, backgroundColor]);

    useEffect(() => {
      if (context) {
        context.strokeStyle = strokeColor;
        context.lineWidth = lineWidth;
      }
    }, [context, strokeColor, lineWidth]);

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      if (!context) return;
      setIsDrawing(true);
      const { offsetX, offsetY } = getCoordinates(event);
      context.beginPath();
      context.moveTo(offsetX, offsetY);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !context) return;
      const { offsetX, offsetY } = getCoordinates(event);
      context.lineTo(offsetX, offsetY);
      context.stroke();
    };

    const endDrawing = () => {
      if (!isDrawing || !context) return;
      context.closePath();
      setIsDrawing(false);
      if (onModified) {
        onModified();
      }
    };
    
    const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { offsetX: 0, offsetY: 0 };

      let offsetX, offsetY;
      if ('nativeEvent' in event && event.nativeEvent instanceof TouchEvent) {
        const touch = event.nativeEvent.touches[0];
        const rect = canvas.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
      } else if ('clientX' in event) { // MouseEvent
        const rect = canvas.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
      } else { // For React.MouseEvent which might not directly have offsetX/Y on synthetic event
        const nativeEvent = event.nativeEvent as MouseEvent;
        offsetX = nativeEvent.offsetX;
        offsetY = nativeEvent.offsetY;
      }
      return { offsetX, offsetY };
    };


    useImperativeHandle(ref, () => ({
      captureDrawing: () => {
        return canvasRef.current?.toDataURL('image/png') || null;
      },
      clearCanvas: () => {
        if (context && canvasRef.current) {
          context.fillStyle = backgroundColor;
          context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing} // Stop drawing if mouse leaves canvas
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        className={className}
        style={{ touchAction: 'none' }} // Recommended for preventing scrolling while drawing on touch devices
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;
