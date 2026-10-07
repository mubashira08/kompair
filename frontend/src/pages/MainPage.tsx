import React, { useState } from 'react';
import { MatchingPool } from '../components/MatchingPool';
import { PendingRequests } from '../components/PendingRequests';
import { ScoreBadge } from '../components/ScoreBadge';
import { ActiveChatsList } from '../components/ActiveChatsList';
import { NotificationsList } from '../components/NotificationsList';

export const MainPage: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [userId] = useState('00000000-0000-0000-0000-000000000000'); // Mocked for UI testing

  const toggleActive = async () => {
    const newState = !isActive;
    setIsActive(newState);
    try {
      await fetch('http://localhost:3000/users/me/active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newState, userId })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 max-w-2xl mx-auto w-full shadow-lg min-h-screen">
      <header className="bg-white p-4 shadow flex items-center justify-between z-10">
        <h1 className="text-xl font-bold text-blue-600">StudyMate</h1>
        <div className="flex items-center gap-4">
          <ScoreBadge userId={userId} />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Up for a sesh?</span>
          <button
            onClick={toggleActive}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          </div>
        </div>
      </header>

      <div className="p-4 flex gap-2 overflow-x-auto hide-scrollbar">
        {['Comp Sci', 'Calculus', 'Library', 'Group (2-3)'].map(f => (
          <button key={f} className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm whitespace-nowrap shadow-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition">
            {f}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
        <PendingRequests currentUserId={userId} />
        
        <ActiveChatsList currentUserId={userId} />

        <NotificationsList />

        {isActive ? (
          <MatchingPool currentUserId={userId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8 text-gray-500">
            Flip the switch above to enter the matching pool!
          </div>
        )}
        
        {/* DEBUG BUTTON */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <button 
            onClick={() => window.location.href = '/session/test-session-123'}
            className="w-full py-3 bg-purple-100 text-purple-700 font-bold rounded-xl border border-purple-200 hover:bg-purple-200 transition"
          >
            🧪 Debug: Jump straight into a Session
          </button>
        </div>
      </main>
    </div>
  );
};
