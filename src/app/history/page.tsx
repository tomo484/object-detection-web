'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OcrResult {
  readingId: string;
  uuid: string;
  imageUrl: string;
  type: 'digital' | 'analog';
  value: string;
  confidence: number;
  createdAt: string;
}

export default function History() {
  const [readings, setReadings] = useState<OcrResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReading, setSelectedReading] = useState<OcrResult | null>(null);

  useEffect(() => {
    fetchReadings();
  }, []);

  const fetchReadings = async () => {
    try {
      const response = await fetch('/api/v1/readings?limit=10');
      if (!response.ok) {
        throw new Error('履歴の取得に失敗しました');
      }
      
      const data = await response.json();
      setReadings(data.data.readings);
    } catch {
      setError('履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">読み取り履歴</h1>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            戻る
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {selectedReading ? (
          // 詳細表示
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">詳細</h2>
              <button
                onClick={() => setSelectedReading(null)}
                className="text-blue-500 hover:text-blue-700 underline"
              >
                一覧に戻る
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {selectedReading.value}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  信頼度: {(selectedReading.confidence * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  タイプ: {selectedReading.type}
                </p>
                <p className="text-sm text-gray-600">
                  日時: {formatDate(selectedReading.createdAt)}
                </p>
              </div>
              
              {selectedReading.imageUrl !== 'https://example.com/images/' + selectedReading.readingId + '.jpg' && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">撮影画像:</p>
                  <img 
                    src={selectedReading.imageUrl} 
                    alt="撮影画像" 
                    className="w-full rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          // 一覧表示
          <div>
            {readings.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>履歴がありません</p>
                <Link
                  href="/"
                  className="text-blue-500 hover:text-blue-700 underline mt-2 inline-block"
                >
                  数値を読み取る
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {readings.map((reading) => (
                  <div
                    key={reading.readingId}
                    onClick={() => setSelectedReading(reading)}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xl font-bold text-blue-600 mb-1">
                          {reading.value}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          {reading.type} | 信頼度: {(reading.confidence * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(reading.createdAt)}
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 