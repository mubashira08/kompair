import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatBox } from '../components/ChatBox';

export const Session: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userId] = useState('00000000-0000-0000-0000-000000000000'); // Mocked
  
  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleBlockComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleBlockComplete = async () => {
    setIsActive(false);
    await recordBlock(true);
    if (mode === 'focus') {
      setMode('break');
      setTimeLeft(BREAK_TIME);
    } else {
      setMode('focus');
      setTimeLeft(FOCUS_TIME);
    }
  };

  const recordBlock = async (completed: boolean) => {
    if (!startedAt) return;
    try {
      await fetch('http://localhost:3000/sessions/focus-timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: id,
          userId,
          type: mode,
          duration_min: mode === 'focus' ? 25 : 5,
          completed,
          started_at: startedAt.toISOString()
        })
      });
    } catch (e) {}
  };

  const toggleTimer = () => {
    if (!isActive) {
      if (timeLeft === (mode === 'focus' ? FOCUS_TIME : BREAK_TIME)) {
        setStartedAt(new Date());
      }
    }
    setIsActive(!isActive);
  };

  const abandonBlock = async () => {
    setIsActive(false);
    await recordBlock(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
    setStartedAt(null);
  };

  const completeSession = async () => {
    if (isActive) await recordBlock(false); 
    
    await fetch(`http://localhost:3000/sessions/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    // Trigger feedback modal instead of navigating
    setShowFeedback(true);
  };

  const handleFeedback = async (action: 'keep' | 'expire') => {
    await fetch('http://localhost:3000/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id, action })
    });
    navigate('/main');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (showFeedback) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-4">Session Complete! 🎉</h2>
        <p className="mb-8 text-gray-300">You earned +10 accountability points.</p>
        <div className="bg-gray-800 p-6 rounded-2xl max-w-sm w-full text-center shadow-xl">
          <h3 className="text-xl font-semibold mb-2">How was your partner?</h3>
          <p className="text-sm text-gray-400 mb-6">Do you want to keep this chat open for 2 days to coordinate future sessions, or expire it now?</p>
          
          <div className="flex gap-4">
            <button onClick={() => handleFeedback('keep')} className="flex-1 bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-700">Keep Chat</button>
            <button onClick={() => handleFeedback('expire')} className="flex-1 bg-red-600 py-3 rounded-lg font-bold hover:bg-red-700">Expire Now</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors duration-500 ${mode === 'focus' ? 'bg-red-50' : 'bg-green-50'}`}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {mode === 'focus' ? 'Focus Time' : 'Break Time'}
        </h2>
        
        <div className="text-6xl font-bold tracking-tighter text-gray-900 my-6 tabular-nums">
          {formatTime(timeLeft)}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={toggleTimer} className={`w-full py-3 rounded-xl text-lg font-bold transition-colors ${isActive ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-600 text-white'}`}>
            {isActive ? 'Pause' : 'Start'}
          </button>
          
          <button onClick={abandonBlock} disabled={!isActive && timeLeft === (mode === 'focus' ? FOCUS_TIME : BREAK_TIME)} className="w-full py-2 rounded-xl font-semibold text-gray-600 bg-gray-100 disabled:opacity-50">
            Reset / Abandon Block
          </button>

          <button onClick={completeSession} className="w-full py-2 mt-2 rounded-xl font-bold text-white bg-gray-900 shadow-md">
            Finish Study Session
          </button>
        </div>

        <ChatBox sessionId={id as string} currentUserId={userId} />
      </div>
    </div>
  );
};
