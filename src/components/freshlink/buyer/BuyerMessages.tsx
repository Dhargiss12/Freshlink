'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Send, ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, type Message } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

interface Conversation {
  userId: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  reliabilityScore?: number;
}

export default function BuyerMessages() {
  const { user, viewParams, navigate } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(viewParams?.userId || '');
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchConvos = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?buyerId=${user.id}`);
        const data = await safeJson(res);
        if (!data) return;
        const orders = Array.isArray(data) ? data : [];
        const farmerMap = new Map<string, { name: string; lastMsg: string; lastTime: string; unread: number; reliability?: number }>();
        orders.forEach((o: any) => {
          if (o.farmer && !farmerMap.has(o.farmerId)) {
            farmerMap.set(o.farmerId, {
              name: o.farmer.name,
              lastMsg: `Order for ${o.listing?.crop || 'produce'}`,
              lastTime: o.createdAt,
              unread: 0,
              reliability: o.farmer.reliabilityScore,
            });
          }
        });
        const convos: Conversation[] = Array.from(farmerMap.entries()).map(([id, info]) => ({
          userId: id, name: info.name, lastMessage: info.lastMsg,
          lastTime: info.lastTime, unread: info.unread, reliabilityScore: info.reliability,
        }));
        setConversations(convos.length > 0 ? convos : [
          { userId: 'farmer_ravi', name: 'Ravi Kumar', lastMessage: 'Your order is ready!', lastTime: new Date().toISOString(), unread: 2, reliabilityScore: 92 },
          { userId: 'farmer_anita', name: 'Anita Deshmukh', lastMessage: 'Sure, I can provide fresh spinach.', lastTime: new Date(Date.now() - 3600000).toISOString(), unread: 0, reliabilityScore: 88 },
        ]);
        if (viewParams?.userId && farmerMap.has(viewParams.userId)) {
          setSelectedUser(viewParams.userId);
          setSelectedName(farmerMap.get(viewParams.userId)!.name);
        }
      } catch (e) {
        console.error('Messages fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchConvos();
  }, [user]);

  const fetchMessages = async (farmerId: string, name: string) => {
    setSelectedUser(farmerId);
    setSelectedName(name);
    if (!user) return;
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/messages?userId1=${user.id}&userId2=${farmerId}`);
      const data = await safeJson(res);
      if (!data) { setMessages([]); return; }
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !selectedUser || sending) return;
    const msgContent = input.trim();
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId: selectedUser, content: msgContent }),
      });
      const data = await safeJson(res);
      if (data && data.id) {
        setMessages(prev => [...prev, data]);
      } else {
        setMessages(prev => [...prev, {
          id: `opt-${Date.now()}`, senderId: user.id, receiverId: selectedUser,
          content: msgContent, read: true, createdAt: new Date().toISOString(),
        }]);
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const filteredConvos = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-180px)] min-h-[500px]">
      <div className={selectedUser ? 'hidden md:flex' : 'flex'} style={{ flexDirection: 'column', width: '100%', maxWidth: '320px', borderRight: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div className="p-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h2 className="font-semibold text-gray-900 mb-2">Messages</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-3 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : filteredConvos.length === 0 ? (
            <div className="text-center py-8 px-4"><MessageSquare className="h-8 w-8 mx-auto text-gray-200 mb-2" /><p className="text-sm text-gray-400">No conversations</p></div>
          ) : (
            <div className="p-2">
              {filteredConvos.map(c => (
                <button key={c.userId} onClick={() => fetchMessages(c.userId, c.name)}
                  className={"w-full p-3 rounded-xl text-left transition-colors " + (selectedUser === c.userId ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-1">{formatTime(c.lastTime)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <Badge className="bg-green-600 text-white text-[10px] h-5 min-w-[20px] px-1.5">{c.unread}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className={!selectedUser ? 'hidden md:flex' : 'flex'} style={{ flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {selectedUser ? (
          <>
            <div className="p-3 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => { setSelectedUser(''); setSelectedName(''); }}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">
                {selectedName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{selectedName}</p>
                <p className="text-xs text-green-600">Farmer</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className={"h-12 w-3/4 rounded-xl " + (i % 2 === 0 ? 'ml-auto' : '')} />)}</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400">Say hello to {selectedName}!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id || i} className={isMine ? 'flex justify-end' : 'flex justify-start'}>
                      <div className={"max-w-xs md:max-w-sm px-4 py-2.5 rounded-xl " + (isMine ? 'bg-green-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm')}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={"text-[10px] mt-1 " + (isMine ? 'text-green-200 text-right' : 'text-gray-400')}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Input placeholder={"Message " + selectedName + "..."} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1 h-10" disabled={sending} />
                <Button className="h-10 w-10 p-0 bg-green-600 hover:bg-green-700" onClick={handleSend} disabled={!input.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-gray-200 mb-3" />
              <h3 className="text-lg font-semibold text-gray-500">Select a conversation</h3>
              <p className="text-sm text-gray-400">Choose a farmer to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
