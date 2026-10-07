import React, { useEffect, useState, useRef } from 'react';

export const ChatBox: React.FC<{ sessionId: string; currentUserId: string }> = ({ sessionId, currentUserId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`http://localhost:3000/chat/messages?sessionId=${sessionId}`);
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await fetch('http://localhost:3000/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, senderId: currentUserId, content: text })
      });
      setText('');
      // Optimistic refresh not strictly needed with 3s polling, but can be added
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-64 w-full bg-white rounded-xl shadow-inner border border-gray-100 overflow-hidden mt-6">
      <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50 text-sm">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-1.5 rounded-xl max-w-[80%] ${m.sender_id === currentUserId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="border-t flex bg-white p-2">
        <input 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Say hi..." 
          className="flex-1 outline-none px-2"
        />
        <button type="submit" className="text-blue-600 font-bold px-3">Send</button>
      </form>
    </div>
  );
};
