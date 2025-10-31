'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type AppState = 'idle' | 'camera' | 'preview' | 'sending' | 'success' | 'error';

interface OcrResult {
  readingId: string;
  uuid: string;
  imageUrl: string;
  type: 'digital' | 'analog';
  value: string;
  confidence: number;
  processingTime: number;
  preprocessingAttempts: number;
  totalLinesDetected: number;
  numericCandidates: number;
  createdAt: string;
}

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMounted]);

  const startCamera = async () => {
    if (!navigator.mediaDevices) {
      setError('このブラウザはカメラをサポートしていません');
      setState('error');
      return;
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      setError('このブラウザはgetUserMediaをサポートしていません');
      setState('error');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      setState('camera');
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        } else {
          setError('ビデオ要素が見つかりません');
          setState('error');
        }
      }, 10);
      
    } catch (error) {
      let errorMessage = 'カメラにアクセスできません';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'カメラの使用が許可されていません。ブラウザの設定を確認してください。';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'カメラが見つかりません。デバイスにカメラが接続されているか確認してください。';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'カメラが他のアプリケーションで使用中です。';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'カメラの設定に問題があります。';
        } else if (error.name === 'SecurityError') {
          errorMessage = 'セキュリティ上の理由でカメラにアクセスできません。HTTPSを使用してください。';
        }
      }
      
      setError(errorMessage);
      setState('error');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    const imageBase64 = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageBase64);
    setState('preview');

    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const sendToOCR = async () => {
    setState('sending');
    setError('');

    try {
      const uuid = crypto.randomUUID();
      const ocrEndpoint = '/api/v1/ocr';
      
      const response = await fetch(ocrEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: capturedImage, uuid }),
      });

      if (!response.ok) {
        throw new Error('OCR処理に失敗しました');
      }

      const data = await response.json();
      setResult(data.data);
      setState('success');
    } catch {
      setError('エラーが発生しました');
      setState('error');
    }
  };

  const reset = () => {
    setState('idle');
    setCapturedImage('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">デジタル数値読み取り</h1>

        {isMounted && !isOnline && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            オフラインなので処理を行うことができません
          </div>
        )}

        <div className="mb-6">
          {state === 'idle' && (
            <div className="text-center">
              <div className="text-gray-600 mb-4 space-y-2">
                <p>カメラで数値を撮影してください。</p>
                <p className="text-sm">
                  <span className="font-medium text-amber-600">⚠️ 注意:</span>
                  撮影画像に目的以外の数値が含まれると、誤った値を読み取る可能性があります。
                </p>
                <p className="text-sm text-gray-500">
                  撮影したい数値のみが写るよう、フレーミングにご注意ください。
                </p>
              </div>
              <button
                onClick={startCamera}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                disabled={isMounted && !isOnline}
              >
                撮影開始
              </button>
            </div>
          )}

          {state === 'camera' && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded"
              />
              <button
                onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded-full"
              >
                撮影
              </button>
            </div>
          )}

          {state === 'preview' && capturedImage && (
            <div>
              <img src={capturedImage} alt="撮影画像" className="w-full rounded mb-4" />
              <div className="flex gap-2">
                <button
                  onClick={sendToOCR}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex-1"
                  disabled={isMounted && !isOnline}
                >
                  送信
                </button>
                <button
                  onClick={startCamera}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex-1"
                >
                  再撮影
                </button>
              </div>
            </div>
          )}

          {state === 'sending' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-blue-600 font-medium">数値を算出中です...</p>
            </div>
          )}

          {state === 'success' && result && (
            <div className="text-center">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                OCR処理が終了しました
              </div>
              <div className="bg-gray-100 p-4 rounded mb-4">
                <p className="text-2xl font-bold text-blue-600 mb-2">{result.value}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>処理時間: {result.processingTime.toFixed(1)}秒</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                もう一度やる
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error || 'エラーが発生しました'}
              </div>
              <button
                onClick={reset}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                もう一度やる
              </button>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/history"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            履歴を見る
          </Link>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
