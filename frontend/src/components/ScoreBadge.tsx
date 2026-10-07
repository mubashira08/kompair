import React, { useEffect, useState } from 'react';

export const ScoreBadge: React.FC<{ userId: string }> = ({ userId }) => {
  const [scoreData, setScoreData] = useState<{ score: number; reliability: number } | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch(`http://localhost:3000/score/me?userId=${userId}`);
        const data = await res.json();
        setScoreData(data);
      } catch (e) {
        console.error('Failed to fetch score', e);
      }
    };
    fetchScore();
  }, [userId]);

  if (!scoreData) return null;

  return (
    <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
      <span className="text-sm font-bold text-indigo-900">Score: {scoreData.score}</span>
    </div>
  );
};
