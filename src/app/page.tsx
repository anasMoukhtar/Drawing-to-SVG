
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import DrawingCanvas, { type DrawingCanvasRef } from '@/components/drawing-canvas';
import SVGPreview from '@/components/svg-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Sparkles, Download, LoaderCircle, AlertCircle, Info, KeyRound } from 'lucide-react';
import { handleVectorizeImageAction, type VectorizeResult } from './actions';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;

export default function VectorInkPage() {
  const { toast } = useToast();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [showInitialInfo, setShowInitialInfo] = useState(true);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    try {
      const initialInfoDismissed = localStorage.getItem('vectorInkInitialInfoDismissed');
      if (initialInfoDismissed === 'true') {
        setShowInitialInfo(false);
      }
    } catch (e) {
      console.warn("localStorage not available for initial info persistence.");
    }
  }, []);

  const dismissInitialInfo = () => {
    setShowInitialInfo(false);
    try {
      localStorage.setItem('vectorInkInitialInfoDismissed', 'true');
    } catch (e) {
      // localStorage not available
    }
  };

  const handleCanvasModified = () => {
    setHasDrawing(true);
    setError(null);
    setSvgOutput(null); 
  };

  const handleClearCanvas = () => {
    canvasRef.current?.clearCanvas();
    setSvgOutput(null);
    setError(null);
    setHasDrawing(false);
    toast({ title: "Canvas Cleared", description: "Ready for a new masterpiece!" });
  };

  const handleVectorize = async () => {
    if (!canvasRef.current) return;

    if (!apiKey.trim()) {
      setError("API Key is required to vectorize the image.");
      toast({ variant: "destructive", title: "API Key Missing", description: "Please enter your Google AI API Key." });
      return;
    }

    const drawingDataUri = canvasRef.current.captureDrawing();
    if (!drawingDataUri && hasDrawing) {
        setError("Could not capture drawing. Please try again.");
        toast({ variant: "destructive", title: "Capture Failed", description: "Could not capture drawing. Please try drawing again." });
        return;
    }
    if (!hasDrawing || !drawingDataUri) {
      setError("Please draw something on the canvas before vectorizing.");
      toast({ variant: "destructive", title: "Empty Canvas", description: "Draw something first!" });
      return;
    }

    setIsVectorizing(true);
    setSvgOutput(null);
    setError(null);

    try {
      const result: VectorizeResult = await handleVectorizeImageAction(drawingDataUri, apiKey);
      if (result.svgData) {
        setSvgOutput(result.svgData);
        toast({ title: "Vectorization Complete!", description: "Your drawing has been converted to SVG." });
      } else {
        setError(result.error || "Vectorization failed. Unknown error.");
        toast({ variant: "destructive", title: "Vectorization Failed", description: result.error || "Could not convert drawing to SVG." });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsVectorizing(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgOutput) {
      toast({ variant: "destructive", title: "No SVG to Download", description: "Please vectorize a drawing first." });
      return;
    }
    try {
      const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vectorink_drawing.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "SVG Downloaded", description: "Your vector drawing has been saved." });
    } catch (e) {
      console.error("Failed to download SVG:", e);
      toast({ variant: "destructive", title: "Download Error", description: "Could not download the SVG file." });
    }
  };

  return (
    <>
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {showInitialInfo && (
          <Alert className="mb-6 shadow-md">
            <Info className="h-5 w-5" />
            <AlertTitle className="font-semibold">Welcome to VectorInk!</AlertTitle>
            <AlertDescription>
              Enter your Google AI API Key, draw on the canvas, then click "Vectorize Drawing" to convert it to an SVG.
              You can then preview and download your creation. Your API key is sent to the server for each request and not stored.
            </AlertDescription>
            <Button variant="outline" size="sm" onClick={dismissInitialInfo} className="mt-3">
              Got it!
            </Button>
          </Alert>
        )}

        <div className="mb-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary" />API Key Configuration</CardTitle>
                    <CardDescription>Enter your Google AI API Key. It is required for vectorization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">Google AI API Key</Label>
                        <Input 
                            id="apiKey" 
                            type="password" 
                            placeholder="Enter your API Key here" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Your API key is used solely for processing your requests and is not stored long-term.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl">Draw Here</CardTitle>
              <CardDescription>Unleash your creativity. Your drawing will be converted to SVG.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 p-2 sm:p-4 bg-muted rounded-b-lg">
              <div 
                className="border-2 border-border shadow-inner rounded-md overflow-hidden" 
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, maxWidth: '100%' }}
                data-ai-hint="drawing board"
              >
                <DrawingCanvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  onModified={handleCanvasModified}
                  className="cursor-crosshair bg-white"
                  backgroundColor="#FFFFFF"
                />
              </div>
              <Button onClick={handleClearCanvas} variant="outline" className="w-full sm:w-auto" aria-label="Clear drawing canvas">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Canvas
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl">Vectorize & Preview</CardTitle>
              <CardDescription>Convert your drawing and see the result below.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Button 
                onClick={handleVectorize} 
                disabled={isVectorizing || !hasDrawing || !apiKey.trim()} 
                className="w-full py-3 text-base"
                aria-label="Vectorize drawing"
              >
                {isVectorizing ? (
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                Vectorize Drawing
              </Button>
              
              {error && (
                <Alert variant="destructive" className="shadow-md">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-semibold">Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mt-2 p-4 border-2 border-dashed border-input rounded-lg bg-muted min-h-[250px] sm:min-h-[300px] flex items-center justify-center overflow-auto shadow-inner">
                {isVectorizing && !svgOutput && ( 
                  <div className="text-center text-muted-foreground">
                    <LoaderCircle className="h-10 w-10 animate-spin mx-auto mb-3 text-primary" />
                    <p className="font-medium">Vectorizing your drawing...</p>
                    <p className="text-sm">This might take a moment.</p>
                  </div>
                )}
                {!isVectorizing && svgOutput && (
                  <SVGPreview svgData={svgOutput} className="max-w-full max-h-full w-auto h-auto p-2" data-ai-hint="vector graphic" />
                )}
                {!isVectorizing && !svgOutput && !error && (
                   <p className="text-muted-foreground text-center p-4">
                     {apiKey.trim() ? "Your vectorized SVG will appear here after conversion." : "Please enter your API key to enable vectorization."}
                   </p>
                )}
                 {!isVectorizing && !svgOutput && error && ( 
                   <p className="text-destructive text-center p-4">
                     Could not display SVG. {error.startsWith("API Key") ? "Please check your API Key." : "Please try again."}
                   </p>
                )}
              </div>
              
              <Button 
                onClick={handleDownloadSvg} 
                disabled={!svgOutput || isVectorizing} 
                variant="outline" 
                className="w-full py-3 text-base"
                aria-label="Download SVG file"
              >
                <Download className="mr-2 h-5 w-5" /> Download SVG
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

    