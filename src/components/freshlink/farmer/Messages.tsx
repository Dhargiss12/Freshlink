'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send, MessageSquare, Search, ArrowLeft, User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore, type Message } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

interface Conversation {
  userId: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

const DEMO_CONVERSATIONS: Conversation[] = [
  { userId: 'u1', name: 'Rajesh Kumar', lastMessage: 'Can you deliver 50kg tomatoes by tomorrow?', lastTime: '10:30 AM', unread: 2 },
  { userId: 'u2', name: 'Fresh Mart', lastMessage: 'We have confirmed the order. Thank you!', lastTime: 'Yesterday', unread: 0 },
  { userId: 'u3', name: 'Green Basket', lastMessage: 'What is the best price for bulk onion?', lastTime: 'Yesterday', unread: 1 },
  { userId: 'u4', name: 'Hotel Valley', lastMessage: 'Please send photos of the produce', lastTime: '2 days ago', unread: 0 },
  { userId: 'u5', name: 'Farm Connect', lastMessage: 'Looking forward to a long-term partnership', lastTime: '3 days ago', unread: 0 },
];

const DEMO_MESSAGES: Record<string, { senderId: string; content: string; createdAt: string }[]> = {
  u1: [
    { senderId: 'u1', content: 'Hello! I am interested in your tomato listing.', createdAt: '2025-01-15T10:00:00' },
    { senderId: 'me', content: 'Hi Rajesh! Thank you for your interest. How much quantity do you need?', createdAt: '2025-01-15T10:05:00' },
    { senderId: 'u1', content: 'I need about 50kg. Can you deliver by tomorrow morning?', createdAt: '2025-01-15T10:30:00' },
  ],
};

export default function Messages() {
  const { user, showToast } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages?senderId=${user?.id}`);
        const data = await safeJson(res);
        if (!data) throw new Error();
        const unwrapped = data.messages || data;
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Group messages by the other user
          const convMap = new Map<string, Conversation>();
          unwrapped.forEach((m: Message) => {
            const otherId = m.senderId === user?.id ? m.receiverId : m.senderId;
            if (!convMap.has(otherId)) {
              convMap.set(otherId, {
                userId: otherId, name: otherId.slice(0, 8) + '...', lastMessage: m.content,
                lastTime: new Date(m.createdAt).toLocaleDateString(), unread: 0,
              });
            }
          });
          setConversations(Array.from(convMap.values()));
        } else {
          setConversations(DEMO_CONVERSATIONS);
        }
      } catch {
        setConversations(DEMO_CONVERSATIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv.userId);
    try {
      const res = await fetch(`/api/messages?senderId=${user?.id}&receiverId=${conv.userId}`);
      const data = await safeJson(res);
      if (!data) throw new Error();
      const unwrapped = data.messages || data;
      if (Array.isArray(unwrapped) && unwrapped.length > 0) {
        setMessages(unwrapped);
      } else {
        // Use demo messages
        const demo = DEMO_MESSAGES[conv.userId] || [];
        setMessages(demo.map((d, i) => ({
          id: `demo-${i}`,
          senderId: d.senderId === 'me' ? (user?.id || '') : d.senderId,
          receiverId: d.senderId === 'me' ? d.senderId : (user?.id || ''),
          content: d.content, createdAt: d.createdAt, read: true,
        })));
      }
    } catch {
      const demo = DEMO_MESSAGES[conv.userId] || [];
      setMessages(demo.map((d, i) => ({
        id: `demo-${i}`,
        senderId: d.senderId === 'me' ? (user?.id || '') : d.senderId,
        receiverId: d.senderId === 'me' ? d.senderId : (user?.id || ''),
        content: d.content, createdAt: d.createdAt, read: true,
      })));
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !user) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id, receiverId: selectedConv,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        const msg = await safeJson(res);
        if (msg) {
          setMessages((prev) => [...prev, msg]);
          setNewMessage('');
        } else {
          // Still add locally for demo
          setMessages((prev) => [...prev, {
            id: `local-${Date.now()}`, senderId: user.id, receiverId: selectedConv,
            content: newMessage.trim(), createdAt: new Date().toISOString(), read: true,
          }]);
          setNewMessage('');
        }
      } else {
        // Still add locally for demo
        setMessages((prev) => [...prev, {
          id: `local-${Date.now()}`, senderId: user.id, receiverId: selectedConv,
          content: newMessage.trim(), createdAt: new Date().toISOString(), read: true,
        }]);
        setNewMessage('');
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: `local-${Date.now()}`, senderId: user.id, receiverId: selectedConv,
        content: newMessage.trim(), createdAt: new Date().toISOString(), read: true,
      }]);
      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  const selectedName = conversations.find((c) => c.userId === selectedConv)?.name;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Communicate with buyers and partners</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[400px]">
        {/* Conversation List */}
        <Card className="border-0 shadow-sm md:col-span-1 flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search conversations..." className="pl-9 h-9 text-sm" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-3 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : conversations.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.userId}
                  className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-green-50 transition-colors border-b border-gray-50 ${selectedConv === conv.userId ? 'bg-green-50 border-l-2 border-l-green-500' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-green-100 text-green-700"><User className="h-4 w-4" /></AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{conv.name}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">{conv.lastTime}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{conv.unread}</span>}
                </div>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Message Thread */}
        <Card className="border-0 shadow-sm md:col-span-2 flex flex-col">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center"><MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" /><p className="text-sm">Select a conversation to start messaging</p></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-3 border-b flex items-center gap-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedConv(null)}><ArrowLeft className="h-4 w-4" /></Button>
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-green-100 text-green-700 text-xs"><User className="h-3 w-3" /></AvatarFallback></Avatar>
                <h3 className="font-semibold text-gray-900">{selectedName}</h3>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-green-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-3 border-t flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1"
                />
                <Button className="bg-green-600 hover:bg-green-700 p-2.5" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
