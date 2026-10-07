import React, { useEffect, useState } from 'react';

export const PendingRequests: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`http://localhost:3000/match-requests/pending?userId=${currentUserId}`);
        const data = await res.json();
        if (data.incoming) setIncoming(data.incoming);
        if (data.outgoing) setOutgoing(data.outgoing);
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [currentUserId]);

  const respond = async (id: string, action: 'accept' | 'decline') => {
    await fetch(`http://localhost:3000/match-requests/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: currentUserId })
    });
  };

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <div className="space-y-3">
      {outgoing.map(req => (
        <div key={req.id} className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex justify-between items-center text-sm shadow-sm">
          <span className="text-orange-800 font-medium animate-pulse">Waiting for them to accept...</span>
          <span className="text-orange-600 font-bold tabular-nums">2:00</span>
        </div>
      ))}
      {incoming.map(req => (
        <div key={req.id} className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
          <p className="text-blue-900 font-medium mb-3">Someone wants to study with you!</p>
          <div className="flex gap-2">
            <button onClick={() => respond(req.id, 'accept')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm">Accept</button>
            <button onClick={() => respond(req.id, 'decline')} className="flex-1 bg-white text-gray-700 py-2 rounded-lg font-bold border border-gray-300 hover:bg-gray-50 shadow-sm">Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
};
