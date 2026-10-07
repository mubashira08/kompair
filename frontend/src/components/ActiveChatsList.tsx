import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ActiveChatsList: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const [chats, setChats] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:3000/chat/active?userId=${currentUserId}`);
        const data = await res.json();
        if (Array.isArray(data)) setChats(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchChats();
    const interval = setInterval(fetchChats, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [currentUserId]);

  if (chats.length === 0) return null;

  return (
    <div className="mt-6 mb-4">
      <h2 className="font-semibold text-gray-700 uppercase text-sm tracking-wider mb-3">Kept Connections</h2>
      <div className="space-y-3">
        {chats.map(chat => {
          // Calculate days/hours left
          const msLeft = new Date(chat.expires_at).getTime() - Date.now();
          const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
          const urgent = hoursLeft < 12;

          return (
            <div 
              key={chat.conversation_id} 
              onClick={() => navigate(`/session/${chat.session_id}`)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-blue-300 transition"
            >
              <div>
                <h3 className="font-bold text-gray-900">{chat.partner_name || 'Anonymous'}</h3>
                <p className={`text-xs mt-1 font-semibold ${urgent ? 'text-red-500' : 'text-gray-500'}`}>
                  {hoursLeft > 24 ? `${Math.floor(hoursLeft / 24)}d left` : `${hoursLeft}h left`}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                💬
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
