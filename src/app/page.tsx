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
  const [isMounted, setIsMounted] = useState<boolean>(false); // クライアントサイドマウント状態
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // クライアントサイドマウント状態の管理
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // オンライン状態の管理
  useEffect(() => {
    if (!isMounted) return;
    
    // 初期状態を設定
    setIsOnline(navigator.onLine);
    
    // オンライン/オフラインイベントリスナーを追加
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMounted]);

  // 初期化時のログ
  useEffect(() => {
    console.log('🎥 [Camera Debug] Component mounted');
    console.log('🎥 [Camera Debug] Initial state:', state);
    console.log('🎥 [Camera Debug] User agent:', navigator.userAgent);
    console.log('🎥 [Camera Debug] Is HTTPS:', window.location.protocol === 'https:');
    console.log('🎥 [Camera Debug] Current URL:', window.location.href);
    console.log('🎥 [Camera Debug] Navigator online:', navigator.onLine);
    
    // MediaDevices サポート確認
    console.log('🎥 [Camera Debug] navigator.mediaDevices exists:', !!navigator.mediaDevices);
    console.log('🎥 [Camera Debug] getUserMedia exists:', !!(navigator.mediaDevices?.getUserMedia));
    
    // 利用可能なデバイス一覧取得
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          console.log('🎥 [Camera Debug] Available devices:', devices);
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          console.log('🎥 [Camera Debug] Video input devices:', videoDevices);
        })
        .catch(err => {
          console.error('🎥 [Camera Debug] Failed to enumerate devices:', err);
        });
    }
  }, []);

  const startCamera = async () => {
    console.log('🎥 [Camera Debug] startCamera function called');
    console.log('🎥 [Camera Debug] Current state:', state);
    console.log('🎥 [Camera Debug] isOnline:', isOnline);
    
    // ブラウザサポート確認
    if (!navigator.mediaDevices) {
      console.error('🎥 [Camera Debug] navigator.mediaDevices is not supported');
      setError('このブラウザはカメラをサポートしていません');
      setState('error');
      return;
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      console.error('🎥 [Camera Debug] getUserMedia is not supported');
      setError('このブラウザはgetUserMediaをサポートしていません');
      setState('error');
      return;
    }
    
    console.log('🎥 [Camera Debug] MediaDevices API is supported');
    
    // 権限状態確認
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('🎥 [Camera Debug] Camera permission state:', permission.state);
        
        permission.addEventListener('change', () => {
          console.log('🎥 [Camera Debug] Camera permission changed to:', permission.state);
        });
      } else {
        console.log('🎥 [Camera Debug] Permissions API not supported');
      }
    } catch (permError) {
      console.warn('🎥 [Camera Debug] Could not check camera permissions:', permError);
    }
    
    // video要素の状態確認
    console.log('🎥 [Camera Debug] videoRef.current:', videoRef.current);
    console.log('🎥 [Camera Debug] videoRef.current exists:', !!videoRef.current);
    
    try {
      console.log('🎥 [Camera Debug] Requesting camera access...');
      console.log('🎥 [Camera Debug] Constraints:', { video: { facingMode: 'environment' } });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      console.log('🎥 [Camera Debug] Camera access granted successfully');
      console.log('🎥 [Camera Debug] Stream:', stream);
      console.log('🎥 [Camera Debug] Stream active:', stream.active);
      console.log('🎥 [Camera Debug] Stream tracks:', stream.getTracks());
      
      if (stream.getTracks().length > 0) {
        const videoTrack = stream.getVideoTracks()[0];
        console.log('🎥 [Camera Debug] Video track:', videoTrack);
        console.log('🎥 [Camera Debug] Video track settings:', videoTrack.getSettings());
        console.log('🎥 [Camera Debug] Video track constraints:', videoTrack.getConstraints());
      }
      
      // カメラ状態に変更してvideo要素をレンダリング
      console.log('🎥 [Camera Debug] Changing state to camera');
      setState('camera');
      
      // 次のレンダリングサイクルでvideo要素が利用可能になるまで待機
      setTimeout(() => {
        console.log('🎥 [Camera Debug] Checking video element after state change');
        console.log('🎥 [Camera Debug] videoRef.current after timeout:', videoRef.current);
        
        if (videoRef.current) {
          console.log('🎥 [Camera Debug] Setting stream to video element');
          videoRef.current.srcObject = stream;
          
          // video要素のイベントリスナー追加
          videoRef.current.onloadedmetadata = () => {
            console.log('🎥 [Camera Debug] Video metadata loaded');
            console.log('🎥 [Camera Debug] Video dimensions:', {
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight
            });
          };
          
          videoRef.current.oncanplay = () => {
            console.log('🎥 [Camera Debug] Video can start playing');
          };
          
          videoRef.current.onplay = () => {
            console.log('🎥 [Camera Debug] Video started playing');
          };
          
          videoRef.current.onerror = (e) => {
            console.error('🎥 [Camera Debug] Video element error:', e);
          };
          
          console.log('🎥 [Camera Debug] Stream successfully assigned to video element');
        } else {
          console.error('🎥 [Camera Debug] videoRef.current is still null after timeout');
          setError('ビデオ要素が見つかりません');
          setState('error');
        }
      }, 10);
      
      
    } catch (error) {
      console.error('🎥 [Camera Debug] Camera access failed:', error);
      
      let errorMessage = 'カメラにアクセスできません';
      
      if (error instanceof Error) {
        console.error('🎥 [Camera Debug] Error name:', error.name);
        console.error('🎥 [Camera Debug] Error message:', error.message);
        
        if (error.name === 'NotAllowedError') {
          errorMessage = 'カメラの使用が許可されていません。ブラウザの設定を確認してください。';
          console.error('🎥 [Camera Debug] Camera permission denied by user');
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'カメラが見つかりません。デバイスにカメラが接続されているか確認してください。';
          console.error('🎥 [Camera Debug] No camera device found');
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'カメラが他のアプリケーションで使用中です。';
          console.error('🎥 [Camera Debug] Camera is being used by another application');
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'カメラの設定に問題があります。';
          console.error('🎥 [Camera Debug] Camera constraints cannot be satisfied');
        } else if (error.name === 'SecurityError') {
          errorMessage = 'セキュリティ上の理由でカメラにアクセスできません。HTTPSを使用してください。';
          console.error('🎥 [Camera Debug] Security error - HTTPS required');
        }
      } else {
        console.error('🎥 [Camera Debug] Unknown error type:', typeof error);
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

    // カメラ停止
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const sendToOCR = async () => {
    setState('sending');
    setError('');

    try {
      const uuid = crypto.randomUUID();
      // 常に本番API（/api/v1/ocr）を使用
      const ocrEndpoint = '/api/v1/ocr';
      
      console.log(`Using OCR endpoint: ${ocrEndpoint} (mock: false)`);
      
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
    } catch (error) {
      setError('エラーが発生しました');
      setState('error');
    }
  };

  const reset = () => {
    console.log('🎥 [Camera Debug] Resetting to idle state');
    setState('idle');
    setCapturedImage('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">デジタル数値読み取り</h1>

        {/* オフライン表示 - クライアントサイドでのみ表示 */}
        {isMounted && !isOnline && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            オフラインなので処理を行うことができません
          </div>
        )}

        {/* メイン表示エリア */}
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
                onClick={() => {
                  console.log('🎥 [Camera Debug] 撮影開始ボタンがクリックされました');
                  console.log('🎥 [Camera Debug] Button disabled state:', !isOnline);
                  startCamera();
                }}
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
                  onClick={() => {
                    console.log('🎥 [Camera Debug] 再撮影ボタンがクリックされました');
                    startCamera();
                  }}
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

        {/* 履歴リンク */}
        <div className="text-center">
          <Link
            href="/history"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            履歴を見る
          </Link>
        </div>

        {/* 非表示のcanvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
