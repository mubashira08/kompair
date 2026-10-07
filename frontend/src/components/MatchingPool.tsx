import React, { useEffect, useState } from 'react';

export const MatchingPool: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchPool = async () => {
      try {
        const res = await fetch('http://localhost:3000/match-requests/pool');
        const data = await res.json();
        // filter out self
        setUsers(data.filter((u: any) => u.id !== currentUserId));
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchPool();
    const interval = setInterval(fetchPool, 5000); // 5-second polling per spec
    return () => clearInterval(interval);
  }, [currentUserId]);

  const sendRequest = async (receiverId: string) => {
    await fetch('http://localhost:3000/match-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: currentUserId, receiver_id: receiverId })
    });
    // Optimistic UI could remove them, but polling will catch up
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-700 uppercase text-sm tracking-wider">Available Now</h2>
      {users.length === 0 ? (
        <p className="text-gray-500 text-sm">No one is currently active in the pool.</p>
      ) : (
        users.map(u => (
          <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{u.full_name || 'Anonymous'}</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                  Score: {u.score || 100}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{u.department} • {u.graduation_year}</p>
            </div>
            <button 
              onClick={() => sendRequest(u.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              Ask to study
            </button>
          </div>
        ))
      )}
    </div>
  );
};
