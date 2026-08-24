'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Sparkles, Clock, TrendingUp, IndianRupee,
  AlertTriangle, Package, User, ChevronDown, ChevronUp,
  Brain, Check, Gavel, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore, type Listing, type Negotiation, type NegotiationMessage } from '@/lib/store';
import { safeJson } from '@/lib/safeFetch';

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Potato: '🥔', Spinach: '🥬',
  Cabbage: '🥗', Cauliflower: '🥦', BellPepper: '🫑', Eggplant: '🍆', Cucumber: '🥒',
  GreenChilli: '🌶️', Coriander: '🌿', Methi: '🌱',
  Apple: '🍎', Banana: '🍌', Mango: '🥭', Orange: '🍊', Grapes: '🍇',
};

export default function BuyerNegotiation() {
  const { viewParams, user, navigate, showToast, setSelectedListing } = useAppStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [listing, setListing] = useState<Listing | null>(null);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (viewParams.negotiationId) {
          // Load existing negotiation
          const negRes = await fetch(`/api/negotiate/${viewParams.negotiationId}`);
          const negData = await safeJson(negRes);
          if (!negData) return;
          if (negData.id) {
            setNegotiation(negData);
            setMessages(negData.messages || []);
            // Fetch listing too
            if (negData.listingId) {
              const listRes = await fetch(`/api/listings/${negData.listingId}`);
              const listData = await safeJson(listRes);
              if (listData && listData.id) { setListing(listData); setSelectedListing(listData); }
            }
          }
        } else if (viewParams.listingId) {
          // New negotiation - load listing
          const res = await fetch(`/api/listings/${viewParams.listingId}`);
          const data = await safeJson(res);
          if (!data) return;
          if (data.id) { setListing(data); setSelectedListing(data); }
        }
      } catch (e) {
        console.error('Negotiation load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [viewParams.negotiationId, viewParams.listingId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmitOffer = async () => {
    if (!listing || !user || !offerPrice || !offerQty) return;
    setSubmittingOffer(true);
    try {
      const res = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id, buyerId: user.id, farmerId: listing.farmerId,
          offerPrice: parseFloat(offerPrice), quantity: parseFloat(offerQty),
        }),
      });
      const data = await safeJson(res);
      if (data && data.id) {
        setNegotiation(data);
        setMessages(data.messages || []);
        showToast('Offer submitted! AI analysis is ready.', 'success');
      } else {
        showToast('Failed to submit offer', 'error');
      }
    } catch {
      showToast('Error submitting offer', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleSendMessage = async () => {
    if (!negotiation || !chatInput.trim() || !user) return;
    setSendingMsg(true);
    const msgContent = chatInput.trim();
    setChatInput('');
    try {
      const res = await fetch(`/api/negotiate/${negotiation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'message', buyerId: user.id, content: msgContent }),
      });
      const data = await safeJson(res);
      if (data && data.messages) {
        setMessages(data.messages);
      } else {
        // Optimistic add
        setMessages(prev => [...prev, {
          id: `opt-${Date.now()}`, negotiationId: negotiation.id,
          senderRole: 'buyer', senderName: user.name, content: msgContent, createdAt: new Date().toISOString(),
        }]);
      }
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!negotiation || !counterPrice || !user) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/negotiate/${negotiation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'counter', buyerId: user.id, offerPrice: parseFloat(counterPrice) }),
      });
      const data = await safeJson(res);
      if (data && data.messages) {
        setMessages(data.messages);
        setNegotiation(prev => prev ? { ...prev, ...data } : prev);
      }
      setCounterPrice('');
      setShowCounter(false);
    } catch {
      showToast('Failed to send counter-offer', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAccept = async (price: number) => {
    if (!negotiation || !user) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/negotiate/${negotiation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', buyerId: user.id, agreedPrice: price }),
      });
      const data = await safeJson(res);
      if (data && data.order) {
        showToast('Deal accepted! Order created.', 'success');
        navigate('buyer-orders', { orderId: data.order.id, showPayment: true });
      } else {
        showToast('Failed to accept offer', 'error');
        if (data.messages) setMessages(data.messages);
      }
    } catch {
      showToast('Error accepting offer', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const lastPriceSuggestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].priceSuggested) return messages[i].priceSuggested;
    }
    return null;
  }, [messages]);

  const urgencyPct = negotiation ? Math.min(100, (negotiation.urgency || 30)) : 30;

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-60 w-full rounded-xl" /><Skeleton className="h-96 w-full rounded-xl" /></div>;
  }

  if (!listing && !negotiation) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-600">No listing found</h3>
        <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => navigate('buyer-discover')}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Back */}
      <Button variant="ghost" className="text-gray-500 -ml-2" onClick={() => navigate('buyer-discover')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Listing Summary - NO floorPrice */}
      {listing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{CROP_EMOJIS[listing.crop] || '🌱'}</span>
                  <div>
                    <h2 className="font-semibold text-gray-900">{listing.crop}</h2>
                    <p className="text-sm text-gray-500">{listing.quantity} {listing.unit} · by {listing.farmerName || 'Farmer'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Expected Price</p>
                  <p className="text-xl font-bold text-green-700">₹{listing.expectedPrice}/kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Offer Form (when no negotiation exists) */}
      {!negotiation && listing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Gavel className="h-5 w-5 text-green-600" /> Make Your Opening Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Price per kg (₹)</label>
                  <Input type="number" placeholder="e.g. 22" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)}
                    className="h-11 border-green-200 focus:border-green-500" />
                  <p className="text-xs text-gray-400 mt-1">Farmer expects: ₹{listing.expectedPrice}/kg</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Quantity needed (kg)</label>
                  <Input type="number" placeholder={`Max ${listing.quantity}`} value={offerQty} onChange={(e) => setOfferQty(e.target.value)}
                    className="h-11 border-green-200 focus:border-green-500" />
                </div>
              </div>
              <Button className="w-full h-11 bg-green-600 hover:bg-green-700" onClick={handleSubmitOffer} disabled={submittingOffer || !offerPrice || !offerQty}>
                {submittingOffer ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Offer
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Analysis Panel (after negotiation created) */}
      {negotiation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" /> AI Price Analysis
              </CardTitle>
              <Badge variant="outline" className="w-fit text-[10px] border-green-200 text-green-600 bg-green-50">
                Demo Mode · Rule-based Analysis
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Suggested Price Range */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-gray-500">Suggested Price Range</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  ₹{negotiation.aiSuggestedMin}–₹{negotiation.aiSuggestedMax}<span className="text-sm font-normal text-gray-500">/kg</span>
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>Local market average: ₹{Math.round((negotiation.aiSuggestedMin + negotiation.aiSuggestedMax) / 2 + 2)}/kg</span>
                </div>
              </div>

              {/* AI Explanation */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">AI Explanation</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{negotiation.aiExplanation || 'Price suggestion based on current freshness, market demand, and urgency factors. Higher urgency and lower freshness suggest room for negotiation.'}</p>
                  </div>
                </div>
              </div>

              {/* Urgency Indicator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Time Pressure</p>
                  <p className={`text-xs font-medium ${urgencyPct > 70 ? 'text-red-600' : urgencyPct > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {urgencyPct > 70 ? 'High urgency — act fast!' : urgencyPct > 40 ? 'Moderate — some room' : 'Low — no rush'}
                  </p>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${urgencyPct > 70 ? 'bg-red-500' : urgencyPct > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    initial={{ width: 0 }} animate={{ width: `${urgencyPct}%` }} transition={{ duration: 1 }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Higher urgency means the farmer may accept lower prices</p>
              </div>

              {/* Why this recommendation? */}
              <button onClick={() => setShowWhy(!showWhy)} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 w-full">
                {showWhy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Why this recommendation?
              </button>
              <AnimatePresence>
                {showWhy && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bg-emerald-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed border border-green-100">
                      <p className="mb-2"><strong>Factors considered:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Freshness: {listing ? `${Math.round(((listing.shelfLife - (Date.now() - new Date(listing.harvestDate).getTime()) / (1000*60*60)) / listing.shelfLife) * 100)}% remaining shelf life` : 'N/A'}</li>
                        <li>Market demand for {listing?.crop || 'this crop'} in your region</li>
                        <li>Farmer&apos;s reliability score: {listing?.farmerReliability || 85}%</li>
                        <li>Available supply vs. typical buyer demand</li>
                        <li>Urgency factor: {urgencyPct}% — {urgencyPct > 70 ? 'Farmer needs to sell soon' : 'Normal selling window'}</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Demo note */}
              <p className="text-[10px] text-gray-400 italic flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Using rule-based analysis (demo mode) — recommendations are based on market data and freshness metrics
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Negotiation Chat */}
      {negotiation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm flex flex-col" style={{ minHeight: '400px' }}>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-green-600" /> Negotiation Chat
                {negotiation.status !== 'active' && (
                  <Badge variant="outline" className={`text-xs ${negotiation.status === 'agreed' ? 'border-green-200 text-green-600 bg-green-50' : 'border-red-200 text-red-600 bg-red-50'}`}>
                    {negotiation.status === 'agreed' ? '✓ Agreed' : negotiation.status === 'rejected' ? '✕ Rejected' : negotiation.status}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '400px' }}>
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Send className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isBuyer = msg.senderRole === 'buyer';
                  const isAI = msg.senderRole === 'ai';
                  return (
                    <motion.div key={msg.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isBuyer ? 'justify-end' : isAI ? 'justify-center' : 'justify-start'}`}>
                      {/* AI Message - Centered */}
                      {isAI && (
                        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 max-w-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="h-3 w-3 text-green-600" />
                            <span className="text-[10px] font-medium text-green-600">FreshLink AI</span>
                          </div>
                          <p className="text-sm text-gray-700">{msg.content}</p>
                          {msg.priceSuggested && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm font-bold text-green-700">₹{msg.priceSuggested}/kg</span>
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => handleAccept(msg.priceSuggested!)}>
                                <Check className="h-3 w-3 mr-1" /> Accept
                              </Button>
                            </div>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )}

                      {/* Buyer Message - Right aligned, green */}
                      {isBuyer && (
                        <div className="bg-green-600 text-white rounded-xl rounded-br-sm px-4 py-2.5 max-w-xs">
                          <p className="text-sm">{msg.content}</p>
                          {msg.priceSuggested && (
                            <p className="text-sm font-bold mt-1">₹{msg.priceSuggested}/kg offered</p>
                          )}
                          <p className="text-[10px] text-green-200 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )}

                      {/* Farmer Message - Left aligned, white */}
                      {!isBuyer && !isAI && (
                        <div className="bg-white border border-gray-100 rounded-xl rounded-bl-sm px-4 py-2.5 max-w-xs shadow-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-500">{msg.senderName}</span>
                          </div>
                          <p className="text-sm text-gray-800">{msg.content}</p>
                          {msg.priceSuggested && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900">₹{msg.priceSuggested}/kg</span>
                              <div className="flex gap-1">
                                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAccept(msg.priceSuggested!)}>
                                  <Check className="h-3 w-3 mr-1" /> Accept
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                  onClick={() => { setShowCounter(true); setCounterPrice(''); }}>
                                  Counter
                                </Button>
                              </div>
                            </div>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Counter Offer Input */}
            <AnimatePresence>
              {showCounter && negotiation.status === 'active' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 overflow-hidden">
                  <div className="flex items-center gap-2 py-2 border-t bg-amber-50 rounded-b-xl">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <Input type="number" placeholder="Your counter price" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)}
                      className="h-9 flex-1 text-sm border-amber-200 focus:border-amber-400" />
                    <Button size="sm" className="h-9 bg-green-600 hover:bg-green-700" onClick={handleCounterOffer} disabled={!counterPrice || sendingMsg}>
                      Send Counter
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9" onClick={() => setShowCounter(false)}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Input */}
            {negotiation.status === 'active' && (
              <div className="p-4 border-t bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Input placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    className="flex-1 h-10" disabled={sendingMsg} />
                  <Button className="h-10 w-10 p-0 bg-green-600 hover:bg-green-700" onClick={handleSendMessage} disabled={!chatInput.trim() || sendingMsg}>
                    {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {/* Quick accept if last price suggested */}
                {lastPriceSuggestion && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">Accept suggested price?</span>
                    <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                      onClick={() => handleAccept(lastPriceSuggestion)}>
                      <Check className="h-3 w-3 mr-1" /> Accept ₹{lastPriceSuggestion}/kg
                    </Button>
                  </div>
                )}
              </div>
            )}

            {negotiation.status !== 'active' && (
              <div className="p-4 border-t text-center">
                <p className="text-sm text-gray-500">This negotiation has ended.</p>
                <Button className="mt-2 bg-green-600 hover:bg-green-700 text-sm" onClick={() => navigate('buyer-orders')}>View Orders</Button>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
