import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  Archive,
  CheckCheck,
  Wifi,
  WifiOff,
  Briefcase,
  ArrowLeft,
  Tag,
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { conversationsApi } from '../../api/conversations.api';
import { messagesApi } from '../../api/messages.api';
import { servicesApi } from '../../api/services.api';
import { Spinner } from '../../components/ui/Spinner';
import { useAuthStore } from '../../store/auth.store';
import { useSocket } from '../../hooks/useSocket';
import type { Conversation, Message, Service, User, ConversationParticipant } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOtherParticipant(conv: Conversation, myId: string): ConversationParticipant | undefined {
  return conv.participants.find((p) => {
    const id = typeof p.userId === 'string' ? p.userId : (p.userId as User)._id;
    return id !== myId;
  });
}

function participantName(p: ConversationParticipant | undefined): string {
  if (!p) return 'Unknown';
  return typeof p.userId === 'object' ? (p.userId as User).name : 'User';
}

function participantInitial(p: ConversationParticipant | undefined): string {
  return participantName(p).charAt(0).toUpperCase();
}

function participantPhoto(p: ConversationParticipant | undefined): string | undefined {
  if (!p || typeof p.userId === 'string') return undefined;
  const u = p.userId as User & { profile?: { photoUrl?: string } };
  return u.profile?.photoUrl;
}

function formatMsgTime(dateStr: string): string {
  return format(new Date(dateStr), 'h:mm a');
}

function formatListTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function groupMessagesByDate(messages: Message[]): Array<{ date: Date; messages: Message[] }> {
  const groups: Array<{ date: Date; messages: Message[] }> = [];
  messages.forEach((msg) => {
    const d = new Date(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.date, d)) {
      last.messages.push(msg);
    } else {
      groups.push({ date: d, messages: [msg] });
    }
  });
  return groups;
}

function dateSeparatorLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  participant,
  size = 'md',
}: {
  participant: ConversationParticipant | undefined;
  size?: 'sm' | 'md';
}) {
  const photo = participantPhoto(participant);
  const initial = participantInitial(participant);
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  return photo ? (
    <img src={photo} alt={initial} className={clsx(cls, 'rounded-full object-cover shrink-0')} />
  ) : (
    <div
      className={clsx(
        cls,
        'rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shrink-0',
      )}
    >
      {initial}
    </div>
  );
}

// ─── Offer card (rendered inside chat for offer-type messages) ────────────────

function OfferCard({
  msg,
  isMine,
  myRole,
  onAccept,
  onDecline,
  accepting,
  declining,
}: {
  msg: Message;
  isMine: boolean;
  myRole: string | undefined;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  accepting: boolean;
  declining: boolean;
}) {
  const offer = msg.offer ?? null;
  if (!offer) return null;

  const isPending = offer.status === 'pending';
  const isAccepted = offer.status === 'accepted';
  const isDeclined = offer.status === 'declined';
  const canAct = !isMine && isPending && myRole === 'client';

  return (
    <div className={clsx(
      'rounded-2xl border p-4 max-w-xs w-full',
      isAccepted ? 'border-green-200 bg-green-50' : isDeclined ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50',
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-blue-700 shrink-0" />
        <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
          {isMine ? 'Your Offer' : 'Offer Received'}
        </span>
        {isAccepted && <span className="ml-auto text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Accepted</span>}
        {isDeclined && <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Declined</span>}
        {isPending && <span className="ml-auto text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>}
      </div>

      <p className="text-sm text-gray-800 mb-3 leading-snug">{offer.description}</p>

      <div className="flex gap-4 text-sm mb-3">
        <div>
          <p className="text-xs text-gray-400">Price</p>
          <p className="font-bold text-gray-900">₦{offer.price.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Delivery</p>
          <p className="font-semibold text-gray-700">{offer.deliveryDays} day{offer.deliveryDays !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {isAccepted && offer.jobId && (
        <a
          href={`/jobs/${offer.jobId}`}
          className="flex items-center gap-1.5 text-xs text-blue-700 hover:underline"
        >
          <ExternalLink className="w-3 h-3" /> View Job
        </a>
      )}

      {canAct && (
        <div className="flex gap-2 mt-1">
          <button
            disabled={accepting || declining}
            onClick={() => onAccept(msg._id)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {accepting ? <div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Accept
          </button>
          <button
            disabled={accepting || declining}
            onClick={() => onDecline(msg._id)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-xl bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {declining ? <div className="w-3 h-3 rounded-full border-2 border-gray-400/40 border-t-gray-400 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ConversationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isConnected, joinConversation, leaveConversation, on } = useSocket();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [localConvs, setLocalConvs] = useState<Conversation[]>([]);
  /** Mobile: show the list or the active chat panel */
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Offer modal state (providers only)
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerDays, setOfferDays] = useState('');
  const [offerServiceId, setOfferServiceId] = useState('');
  const [offerError, setOfferError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevSelectedId = useRef<string | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.listConversations,
  });

  const { data: chatRoom, isLoading: roomLoading } = useQuery({
    queryKey: ['chatRoom', selectedId],
    queryFn: () => conversationsApi.getAChatRoom(selectedId!),
    enabled: !!selectedId,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
    enabled: user?.role === 'provider',
  });

  useEffect(() => { setLocalConvs(conversations); }, [conversations]);
  useEffect(() => { if (chatRoom) setLocalMessages(chatRoom.messages); }, [chatRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // ─── Socket: join / leave rooms ───────────────────────────────────────────

  useEffect(() => {
    if (prevSelectedId.current) leaveConversation(prevSelectedId.current);
    if (selectedId) joinConversation(selectedId);
    prevSelectedId.current = selectedId;
  }, [selectedId, joinConversation, leaveConversation]);

  useEffect(() => {
    return on<{
      conversationId: string;
      message: Message;
      conversationPreview: { text: string; sentAt: string };
    }>('message:new', ({ conversationId, message, conversationPreview }) => {
      if (conversationId === selectedId) {
        setLocalMessages((prev) =>
          prev.find((m) => m._id === message._id) ? prev : [...prev, message],
        );
      }
      setLocalConvs((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? {
                ...c,
                lastMessage: {
                  messageId: message._id,
                  text: conversationPreview.text,
                  sentAt: conversationPreview.sentAt,
                },
                unread: c._id === selectedId ? 0 : (c.unread ?? 0) + 1,
              }
            : c,
        ),
      );
    });
  }, [on, selectedId]);

  useEffect(() => {
    return on<{ messageId: string; readerId: string }>('message:read', ({ messageId, readerId }) => {
      setLocalMessages((prev) =>
        prev.map((m) =>
          m._id === messageId && !m.readBy.includes(readerId)
            ? { ...m, readBy: [...m.readBy, readerId] }
            : m,
        ),
      );
    });
  }, [on]);

  useEffect(() => {
    return on<{ messageId: string; status: string; jobId?: string }>('offer:updated', ({ messageId, status, jobId }) => {
      setLocalMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, offer: { ...(m.offer as any), status, ...(jobId ? { jobId } : {}) } } : m,
        ),
      );
    });
  }, [on]);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: messagesApi.sendMessage,
    onSuccess: ({ message }) => {
      setLocalMessages((prev) =>
        prev.find((m) => m._id === message._id) ? prev : [...prev, message],
      );
      setLocalConvs((prev) =>
        prev.map((c) =>
          c._id === selectedId
            ? {
                ...c,
                lastMessage: { messageId: message._id, text: message.content, sentAt: message.createdAt },
              }
            : c,
        ),
      );
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      conversationsApi.archiveConversation(id, archive),
    onSuccess: (_, { id }) => {
      setLocalConvs((prev) => prev.filter((c) => c._id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setMobileView('list');
      }
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: conversationsApi.markAllAsRead,
    onSuccess: (_, id) => {
      setLocalConvs((prev) => prev.map((c) => (c._id === id ? { ...c, unread: 0 } : c)));
    },
  });

  const sendOfferMutation = useMutation({
    mutationFn: messagesApi.sendOffer,
    onSuccess: ({ message }) => {
      setLocalMessages((prev) => prev.find((m) => m._id === message._id) ? prev : [...prev, message]);
      setShowOfferModal(false);
      setOfferPrice(''); setOfferDesc(''); setOfferDays(''); setOfferServiceId(''); setOfferError('');
    },
    onError: (err: any) => setOfferError(err?.response?.data?.message ?? 'Failed to send offer'),
  });

  const acceptOfferMutation = useMutation({
    mutationFn: messagesApi.acceptOffer,
    onSuccess: ({ job }) => {
      navigate(`/jobs/${job._id}`);
    },
  });

  const declineOfferMutation = useMutation({
    mutationFn: messagesApi.declineOffer,
    onSuccess: (_, messageId) => {
      setLocalMessages((prev) => prev.map((m) =>
        m._id === messageId && m.offer ? { ...m, offer: { ...m.offer, status: 'declined' as const } } : m,
      ));
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (conv: Conversation) => {
      setSelectedId(conv._id);
      setMobileView('chat');            // ← switch to chat panel on mobile
      setInput('');
      setLocalConvs((prev) => prev.map((c) => (c._id === conv._id ? { ...c, unread: 0 } : c)));
      if ((conv.unread ?? 0) > 0) markReadMutation.mutate(conv._id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleBack = () => {
    setMobileView('list');
    // Keep selectedId so desktop sidebar stays highlighted
  };

  const handleSend = () => {
    const content = input.trim();
    if (!content || !selectedId) return;
    setInput('');
    sendMutation.mutate({ conversationId: selectedId, content });
  };

  // ─── Derived values ───────────────────────────────────────────────────────

  const selectedConv = localConvs.find((c) => c._id === selectedId) ?? null;
  const otherParticipant = selectedConv ? getOtherParticipant(selectedConv, user?.sub ?? '') : undefined;
  const messageGroups = groupMessagesByDate(localMessages);
  const totalUnread = localConvs.reduce((sum, c) => sum + (c.unread ?? 0), 0);

  if (convsLoading) return <Spinner fullPage />;

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    /**
     * Mobile:  fill the viewport below the navbar (h-[calc(100dvh-64px)]),
     *          no padding — feels native.
     * Desktop: centered, padded, fixed-height card.
     */
    <div className="flex flex-col h-[calc(100dvh-64px)] md:h-auto md:py-10 md:px-6 lg:px-8 md:max-w-6xl md:mx-auto">

      {/* ── Page header (desktop only) ───────────────────────────────── */}
      <div className="hidden md:flex mb-6 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {localConvs.length} conversation{localConvs.length !== 1 ? 's' : ''}
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {totalUnread} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isConnected ? (
            <><Wifi className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 font-medium">Live</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-400">Offline</span></>
          )}
        </div>
      </div>

      {/**
       * Split container.
       * Mobile:  flex-1 fills remaining height, no border/radius (native feel).
       * Desktop: fixed 640px height with rounded card style.
       */}
      <div className="flex-1 flex overflow-hidden md:h-[640px] md:rounded-2xl md:border md:border-gray-100 md:bg-white md:shadow-sm bg-white">

        {/* ── Conversation list sidebar ─────────────────────────────── */}
        <div
          className={clsx(
            'flex-col border-r border-gray-100 bg-white',
            // Mobile: full width when showing list, hidden when in chat
            mobileView === 'list' ? 'flex w-full' : 'hidden',
            // Desktop: always visible as a fixed-width sidebar
            'md:flex md:w-72 md:shrink-0',
          )}
        >
          {/* Mobile top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Chats
              {totalUnread > 0 && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {totalUnread}
                </span>
              )}
            </p>
            {/* Connection indicator on mobile */}
            <div className="flex md:hidden items-center gap-1 text-xs">
              {isConnected
                ? <><Wifi className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 font-medium">Live</span></>
                : <><WifiOff className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-400">Offline</span></>
              }
            </div>
          </div>

          {localConvs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <MessageSquare className="w-9 h-9 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No conversations yet</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {localConvs.map((conv) => {
                const other = getOtherParticipant(conv, user?.sub ?? '');
                const isActive = selectedId === conv._id;
                const hasUnread = (conv.unread ?? 0) > 0;

                return (
                  <div
                    key={conv._id}
                    className={clsx(
                      'group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 transition-colors',
                      isActive ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'hover:bg-gray-50',
                    )}
                    onClick={() => handleSelect(conv)}
                  >
                    <Avatar participant={other} size="md" />

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={clsx(
                            'text-sm truncate',
                            hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700',
                          )}
                        >
                          {participantName(other)}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {conv.lastMessage && (
                            <span className="text-[10px] text-gray-400">
                              {formatListTime(conv.lastMessage.sentAt)}
                            </span>
                          )}
                          {hasUnread && (
                            <span className="min-w-[16px] h-4 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center px-1">
                              {conv.unread > 9 ? '9+' : conv.unread}
                            </span>
                          )}
                        </div>
                      </div>

                      {conv.lastMessage ? (
                        <p className={clsx('text-xs truncate mt-0.5', hasUnread ? 'text-gray-600' : 'text-gray-400')}>
                          {conv.lastMessage.text}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5 italic">No messages yet</p>
                      )}

                      {conv.jobId && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-600">
                          <Briefcase className="w-2.5 h-2.5" />
                          {typeof conv.jobId === 'object'
                            ? (conv.jobId as { title: string }).title
                            : 'Job context'}
                        </span>
                      )}
                    </div>

                    {/* Archive on hover */}
                    <button
                      className="absolute right-2 top-3 hidden group-hover:flex p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveMutation.mutate({ id: conv._id, archive: true });
                      }}
                      title="Archive"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Chat panel ───────────────────────────────────────────────── */}
        <div
          className={clsx(
            'flex-col min-w-0 bg-white relative',
            // Mobile: full width when showing chat, hidden when showing list
            mobileView === 'chat' ? 'flex flex-1' : 'hidden',
            // Desktop: always flex-1
            'md:flex md:flex-1',
          )}
        >
          {!selectedId ? (
            /* Desktop empty state (never visible on mobile since mobileView starts as 'list') */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-14 h-14 text-gray-100 mb-4" />
              <p className="font-medium text-gray-400">Select a conversation</p>
              <p className="text-sm text-gray-300 mt-1">Choose one from the list to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-3 md:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Back button — mobile only */}
                  <button
                    className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    onClick={handleBack}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <Avatar participant={otherParticipant} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                      {participantName(otherParticipant)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{otherParticipant?.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {(selectedConv?.unread ?? 0) > 0 && (
                    <button
                      onClick={() => markReadMutation.mutate(selectedId)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mark read</span>
                    </button>
                  )}
                  <button
                    onClick={() => archiveMutation.mutate({ id: selectedId, archive: true })}
                    className="p-1.5 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Archive conversation"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 md:px-5 py-4">
                {roomLoading ? (
                  <div className="flex justify-center pt-8"><Spinner /></div>
                ) : messageGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-10 h-10 text-gray-100 mb-3" />
                    <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messageGroups.map(({ date, messages: group }) => (
                      <div key={date.toISOString()}>
                        <div className="flex items-center gap-3 my-5">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-[11px] font-medium text-gray-400 shrink-0">
                            {dateSeparatorLabel(date)}
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {group.map((msg) => {
                          const senderId =
                            typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId as User)._id;
                          const isMine = senderId === user?.sub;
                          const isReadByOther = msg.readBy?.some((id) => id !== user?.sub);

                          return (
                            <div
                              key={msg._id}
                              className={clsx('flex mb-2.5', isMine ? 'justify-end' : 'justify-start')}
                            >
                              {!isMine && (
                                <div className="mr-2 self-end">
                                  <Avatar participant={otherParticipant} size="sm" />
                                </div>
                              )}
                              <div
                                className={clsx(
                                  'flex flex-col max-w-[75%] md:max-w-[65%]',
                                  isMine ? 'items-end' : 'items-start',
                                )}
                              >
                                {(msg as any).type === 'offer' ? (
                                  <>
                                    <OfferCard
                                      msg={msg}
                                      isMine={isMine}
                                      myRole={user?.role}
                                      onAccept={(id) => acceptOfferMutation.mutate(id)}
                                      onDecline={(id) => declineOfferMutation.mutate(id)}
                                      accepting={acceptOfferMutation.isPending}
                                      declining={declineOfferMutation.isPending}
                                    />
                                    <span className="text-[10px] text-gray-400 mt-0.5">{formatMsgTime(msg.createdAt)}</span>
                                  </>
                                ) : (
                                  <>
                                    <div
                                      className={clsx(
                                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
                                        isMine
                                          ? 'bg-blue-700 text-white rounded-tr-sm'
                                          : 'bg-gray-100 text-gray-900 rounded-tl-sm',
                                      )}
                                    >
                                      {msg.content}
                                    </div>
                                    <div
                                      className={clsx(
                                        'flex items-center gap-1 mt-0.5',
                                        isMine ? 'flex-row-reverse' : 'flex-row',
                                      )}
                                    >
                                      <span className="text-[10px] text-gray-400">{formatMsgTime(msg.createdAt)}</span>
                                      {isMine && (
                                        <CheckCheck
                                          className={clsx(
                                            'w-3 h-3',
                                            isReadByOther ? 'text-blue-600' : 'text-gray-300',
                                          )}
                                        />
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-3 md:px-5 py-3 border-t border-gray-100 space-y-2">
                {/* Offer button for providers */}
                {user?.role === 'provider' && (
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Send Offer
                  </button>
                )}
                <div className="flex gap-2 items-end">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors min-h-[42px] max-h-32 overflow-y-auto"
                  />
                  <button
                    disabled={!input.trim() || sendMutation.isPending}
                    onClick={handleSend}
                    className="p-2.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {sendMutation.isPending ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Offer Modal */}
              {showOfferModal && (
                <div className="absolute inset-0 bg-black/40 flex items-end md:items-center justify-center z-20 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-700" />
                        Send an Offer
                      </h3>
                      <button onClick={() => { setShowOfferModal(false); setOfferError(''); }} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {offerError && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{offerError}</div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Description *</label>
                        <textarea
                          rows={3}
                          value={offerDesc}
                          onChange={(e) => setOfferDesc(e.target.value)}
                          placeholder="Describe what you will deliver…"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Price (₦) *</label>
                          <input
                            type="number"
                            min="1"
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Delivery (days) *</label>
                          <input
                            type="number"
                            min="1"
                            value={offerDays}
                            onChange={(e) => setOfferDays(e.target.value)}
                            placeholder="e.g. 7"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Service Category *</label>
                        <select
                          value={offerServiceId}
                          onChange={(e) => setOfferServiceId(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <option value="">Select a service…</option>
                          {services.map((s: Service) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setShowOfferModal(false); setOfferError(''); }}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!offerPrice || !offerDesc || !offerDays || !offerServiceId || sendOfferMutation.isPending}
                        onClick={() => {
                          if (!selectedId) return;
                          sendOfferMutation.mutate({
                            conversationId: selectedId,
                            price: Number(offerPrice),
                            description: offerDesc,
                            deliveryDays: Number(offerDays),
                            serviceId: offerServiceId,
                          });
                        }}
                        className="flex-1 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors"
                      >
                        {sendOfferMutation.isPending ? 'Sending…' : 'Send Offer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
