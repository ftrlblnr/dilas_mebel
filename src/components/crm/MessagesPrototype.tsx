"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Camera, Globe, Search, Send, StickyNote, Phone, Check, Clock, Plug, Unplug, LinkIcon, Unlink, ExternalLink } from "lucide-react";
import { cn, normalizePhone } from "@/lib/utils";

// This component is an explicit no-backend prototype (see crm-process.md) — its mock
// conversation data uses made-up stage labels decoupled from the real Stage model.
const MOCK_STAGE_LABEL: Record<string, string> = {
  NEW: "Новая сделка",
  NEGOTIATION: "Согласование",
  QUOTE_SENT: "Предложение отправлено",
  WON: "Успешная продажа",
};
const MOCK_STAGE_STYLE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  QUOTE_SENT: "bg-indigo-100 text-indigo-700",
  WON: "bg-green-100 text-green-700",
};

export interface RealLead {
  id: string;
  refNumber: string;
  fullName: string;
  phone: string;
  stageKey: string;
  stageName: string;
  stageColor: string;
  assignedToName: string | null;
  orderAmount: number | null;
  orderRemaining: number | null;
}

type Channel = "WEBSITE" | "WHATSAPP" | "INSTAGRAM";

const CHANNEL_LABEL: Record<Channel, string> = {
  WEBSITE: "Сайт",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
};

const CHANNEL_ICON: Record<Channel, React.ComponentType<{ size?: number; className?: string }>> = {
  WEBSITE: Globe,
  WHATSAPP: MessageCircle,
  INSTAGRAM: Camera,
};

const CHANNEL_STYLE: Record<Channel, string> = {
  WEBSITE: "bg-slate-100 text-slate-700",
  WHATSAPP: "bg-green-100 text-green-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
};

type MsgDirection = "IN" | "OUT" | "NOTE";

interface MockMessage {
  id: string;
  direction: MsgDirection;
  text: string;
  at: string;
}

interface MockConversation {
  id: string;
  channel: Channel;
  contactName: string;
  phone: string;
  stage: string;
  assignedTo: string;
  unread: number;
  orderAmount?: number;
  orderRemaining?: number;
  linkedLeadId: string | null;
  linkSource: "AUTO" | "MANUAL" | null;
  messages: MockMessage[];
}

// WhatsApp/сайт сообщают настоящий номер отправителя — можно сразу найти заявку по
// нормализованному телефону. У Instagram нет номера в самом сообщении (только
// IGSID), поэтому автосвязь недоступна и нужна ручная привязка (один раз — дальше
// система помнит привязку по аккаунту).
function autoLinkConversations(convos: MockConversation[], leads: RealLead[]): MockConversation[] {
  if (leads.length === 0) return convos;
  return convos.map((c) => {
    if (c.channel === "INSTAGRAM" || c.linkedLeadId) return c;
    const matches = leads.filter((l) => l.phone === normalizePhone(c.phone));
    if (matches.length === 0) return c;
    const best = matches.find((l) => l.stageKey !== "DONE" && l.stageKey !== "CANCELED") ?? matches[0];
    return { ...c, linkedLeadId: best.id, linkSource: "AUTO" as const };
  });
}

const INITIAL_CONVERSATIONS: MockConversation[] = [
  {
    id: "c1",
    channel: "WHATSAPP",
    contactName: "Айгерим Сапарова",
    phone: "7057641077",
    stage: "NEGOTIATION",
    assignedTo: "Вы",
    unread: 2,
    orderAmount: 450000,
    orderRemaining: 150000,
    linkedLeadId: null,
    linkSource: null,
    messages: [
      { id: "m1", direction: "IN", text: "Здравствуйте! Подскажите, диван Milano есть в бежевом?", at: "10:02" },
      { id: "m2", direction: "OUT", text: "Добрый день, Айгерим! Да, есть в наличии, пришлю фото.", at: "10:05" },
      { id: "m3", direction: "NOTE", text: "Клиент уже смотрел комплект в шоуруме 3 дня назад", at: "10:06" },
      { id: "m4", direction: "IN", text: "Супер, а со скидкой выйдет дешевле?", at: "10:20" },
    ],
  },
  {
    id: "c2",
    channel: "INSTAGRAM",
    contactName: "dias.almaty",
    phone: "7077654321",
    stage: "NEW",
    assignedTo: "Не назначено",
    unread: 1,
    linkedLeadId: null,
    linkSource: null,
    messages: [
      { id: "m1", direction: "IN", text: "цена на кухонный гарнитур с фото в шапке?", at: "09:40" },
    ],
  },
  {
    id: "c3",
    channel: "WEBSITE",
    contactName: "Марат Ким",
    phone: "7011112233",
    stage: "QUOTE_SENT",
    assignedTo: "Вы",
    unread: 0,
    orderAmount: 320000,
    orderRemaining: 320000,
    linkedLeadId: null,
    linkSource: null,
    messages: [
      { id: "m1", direction: "OUT", text: "Отправил предложение на почту, посмотрите, пожалуйста.", at: "вчера" },
      { id: "m2", direction: "IN", text: "Посмотрел, нужно подумать до выходных.", at: "вчера" },
    ],
  },
  {
    id: "c4",
    channel: "WHATSAPP",
    contactName: "Сания Бекова",
    phone: "7021239876",
    stage: "WON",
    assignedTo: "Жанна",
    unread: 0,
    orderAmount: 890000,
    orderRemaining: 0,
    linkedLeadId: null,
    linkSource: null,
    messages: [
      { id: "m1", direction: "IN", text: "Спасибо, всё привезли вовремя!", at: "пн" },
      { id: "m2", direction: "OUT", text: "Рады были помочь! Будем ждать вас снова 🙂", at: "пн" },
    ],
  },
  {
    id: "c5",
    channel: "INSTAGRAM",
    contactName: "aliya_zh",
    phone: "7051119900",
    stage: "NEW",
    assignedTo: "Не назначено",
    unread: 3,
    linkedLeadId: null,
    linkSource: null,
    messages: [
      { id: "m1", direction: "IN", text: "добрый день", at: "11:01" },
      { id: "m2", direction: "IN", text: "подскажите есть рассрочка?", at: "11:02" },
      { id: "m3", direction: "IN", text: "и сколько по срокам изготовление", at: "11:03" },
    ],
  },
];

type FilterKey = "ALL" | "MINE" | "UNANSWERED" | Channel;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "Все" },
  { key: "MINE", label: "Мои" },
  { key: "UNANSWERED", label: "Без ответа" },
  { key: "WEBSITE", label: "Сайт" },
  { key: "WHATSAPP", label: "WhatsApp" },
  { key: "INSTAGRAM", label: "Instagram" },
];

function MessageBubble({ msg }: { msg: MockMessage }) {
  if (msg.direction === "NOTE") {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2 mx-auto max-w-[80%]">
        <StickyNote size={13} className="shrink-0" />
        <span>{msg.text}</span>
        <span className="text-amber-500 ml-auto shrink-0">{msg.at}</span>
      </div>
    );
  }
  const isOut = msg.direction === "OUT";
  return (
    <div className={cn("flex", isOut ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
          isOut ? "bg-primary text-white rounded-br-sm" : "bg-surface-alt text-text rounded-bl-sm"
        )}
      >
        <p>{msg.text}</p>
        <p className={cn("text-[10px] mt-1", isOut ? "text-blue-200" : "text-text-muted")}>{msg.at}</p>
      </div>
    </div>
  );
}

function ChannelConnectCard({
  channel,
  alwaysOn,
}: {
  channel: Channel;
  alwaysOn?: boolean;
}) {
  const Icon = CHANNEL_ICON[channel];
  const [status, setStatus] = useState<"idle" | "form" | "pending" | "connected">(alwaysOn ? "connected" : "idle");
  const [value, setValue] = useState("");

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", CHANNEL_STYLE[channel])}>
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-text text-sm">{CHANNEL_LABEL[channel]}</p>
          <p className="text-xs text-text-muted">
            {status === "connected" && "Подключено"}
            {status === "pending" && "Ожидает подтверждения"}
            {(status === "idle" || status === "form") && "Не подключено"}
          </p>
        </div>
        {status === "connected" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <Check size={12} /> Активен
          </span>
        )}
        {status === "pending" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            <Clock size={12} /> Проверка
          </span>
        )}
      </div>

      {status === "idle" && !alwaysOn && (
        <button onClick={() => setStatus("form")} className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1.5">
          <Plug size={14} /> Подключить {CHANNEL_LABEL[channel]}
        </button>
      )}

      {status === "form" && (
        <div className="space-y-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={channel === "WHATSAPP" ? "Номер WhatsApp Business, напр. +7 777 000 00 00" : "Логин Instagram-аккаунта"}
            className="input-field text-sm"
          />
          <p className="text-xs text-text-muted">
            {channel === "WHATSAPP"
              ? "Номер должен быть выделен под WhatsApp Business API — обычный личный номер нельзя подключить."
              : "Аккаунт должен быть переведён в Instagram Professional и связан с Meta Business Manager."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => value.trim() && setStatus("pending")}
              disabled={!value.trim()}
              className="btn-primary flex-1 py-2 text-xs disabled:opacity-50"
            >
              Отправить на проверку
            </button>
            <button onClick={() => setStatus("idle")} className="text-xs text-text-muted hover:text-primary px-2">
              Отмена
            </button>
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Meta обычно проверяет аккаунт в течение нескольких часов — до суток. Мы пришлём уведомление, когда канал активируется.
          </p>
          <button onClick={() => setStatus("connected")} className="btn-secondary w-full py-2 text-xs">
            Проверить статус (демо)
          </button>
        </div>
      )}

      {status === "connected" && !alwaysOn && (
        <button
          onClick={() => {
            setStatus("idle");
            setValue("");
          }}
          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 mt-1"
        >
          <Unplug size={13} /> Отключить канал
        </button>
      )}
    </div>
  );
}

export default function MessagesPrototype({ currentUserName, realLeads }: { currentUserName: string; realLeads: RealLead[] }) {
  const [tab, setTab] = useState<"inbox" | "channels">("inbox");
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState(() => autoLinkConversations(INITIAL_CONVERSATIONS, realLeads));
  const [activeId, setActiveId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [draft, setDraft] = useState("");
  const [draftMode, setDraftMode] = useState<"REPLY" | "NOTE">("REPLY");
  const [linkSearchOpen, setLinkSearchOpen] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLinkSearchOpen(false);
    setLinkQuery("");
  }, [activeId]);

  function linkLead(conversationId: string, leadId: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, linkedLeadId: leadId, linkSource: "MANUAL" } : c))
    );
    setLinkSearchOpen(false);
    setLinkQuery("");
  }

  function unlinkLead(conversationId: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, linkedLeadId: null, linkSource: null } : c))
    );
  }

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (search.trim() && !c.contactName.toLowerCase().includes(search.trim().toLowerCase()) && !c.phone.includes(search.trim())) {
        return false;
      }
      if (filter === "ALL") return true;
      if (filter === "MINE") return c.assignedTo === currentUserName || c.assignedTo === "Вы";
      if (filter === "UNANSWERED") return c.unread > 0;
      return c.channel === filter;
    });
  }, [conversations, filter, search, currentUserName]);

  const active = conversations.find((c) => c.id === activeId) ?? filtered[0];
  const linkedLead = active ? realLeads.find((l) => l.id === active.linkedLeadId) ?? null : null;

  const linkCandidates = useMemo(() => {
    const q = linkQuery.trim().toLowerCase();
    if (!q) return realLeads.slice(0, 8);
    return realLeads.filter(
      (l) => l.refNumber.toLowerCase().includes(q) || l.fullName.toLowerCase().includes(q) || l.phone.includes(q)
    );
  }, [realLeads, linkQuery]);

  function selectConversation(id: string) {
    setActiveId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }

  function sendMessage() {
    if (!active || !draft.trim()) return;
    const newMsg: MockMessage = {
      id: crypto.randomUUID(),
      direction: draftMode === "REPLY" ? "OUT" : "NOTE",
      text: draft.trim(),
      at: "сейчас",
    };
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, newMsg] } : c)));
    setDraft("");
    setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
        <StickyNote size={14} className="shrink-0" />
        Это прототип интерфейса для оценки UX. Данные тестовые, реальной интеграции с WhatsApp/Instagram ещё нет.
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab("inbox")}
          className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-colors", tab === "inbox" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-alt")}
        >
          Переписки
        </button>
        <button
          onClick={() => setTab("channels")}
          className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-colors", tab === "channels" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-alt")}
        >
          Каналы
        </button>
      </div>

      {tab === "channels" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <ChannelConnectCard channel="WEBSITE" alwaysOn />
          <ChannelConnectCard channel="WHATSAPP" />
          <ChannelConnectCard channel="INSTAGRAM" />
        </div>
      )}

      {tab === "inbox" && (
        <div className="grid grid-cols-[260px_1fr_280px] gap-4 h-[calc(100vh-260px)] min-h-[500px]">
          {/* Левая колонка: очередь */}
          <div className="card p-3 flex flex-col overflow-hidden">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="input-field text-xs pl-8 py-1.5"
              />
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "text-[11px] px-2 py-1 rounded-full font-semibold transition-colors",
                    filter === f.key ? "bg-primary text-white" : "bg-surface-alt text-text-muted hover:text-text"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 -mx-1">
              {filtered.length === 0 && <p className="text-xs text-text-muted px-2">Ничего не найдено</p>}
              {filtered.map((c) => {
                const Icon = CHANNEL_ICON[c.channel];
                return (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={cn(
                      "w-full text-left px-2 py-2 rounded-lg transition-colors",
                      active?.id === c.id ? "bg-surface-alt" : "hover:bg-surface"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", CHANNEL_STYLE[c.channel])}>
                        <Icon size={11} />
                      </span>
                      <span className="text-sm font-semibold text-text truncate flex-1">{c.contactName}</span>
                      {c.unread > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate pl-6.5">
                      {c.messages[c.messages.length - 1]?.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Средняя колонка: диалог */}
          <div className="card p-0 flex flex-col overflow-hidden">
            {active ? (
              <>
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <span className={cn("w-7 h-7 rounded-full flex items-center justify-center", CHANNEL_STYLE[active.channel])}>
                    {(() => {
                      const Icon = CHANNEL_ICON[active.channel];
                      return <Icon size={14} />;
                    })()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text">{active.contactName}</p>
                    <p className="text-xs text-text-muted">{CHANNEL_LABEL[active.channel]} · {active.assignedTo}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {active.messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                  <div ref={threadEndRef} />
                </div>
                <div className="border-t border-border p-3">
                  <div className="flex items-center gap-1 mb-2">
                    <button
                      onClick={() => setDraftMode("REPLY")}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-full font-semibold",
                        draftMode === "REPLY" ? "bg-primary text-white" : "bg-surface-alt text-text-muted"
                      )}
                    >
                      Ответить клиенту
                    </button>
                    <button
                      onClick={() => setDraftMode("NOTE")}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-full font-semibold",
                        draftMode === "NOTE" ? "bg-amber-500 text-white" : "bg-surface-alt text-text-muted"
                      )}
                    >
                      Внутренняя заметка
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={draftMode === "REPLY" ? "Написать ответ..." : "Заметка для коллег, клиент не увидит..."}
                      rows={2}
                      className={cn(
                        "input-field text-sm resize-none",
                        draftMode === "NOTE" && "border-amber-300 focus:ring-amber-400 focus:border-amber-400"
                      )}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!draft.trim()}
                      className="btn-primary px-4 disabled:opacity-50 flex items-center justify-center"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-muted text-sm">Выберите диалог</div>
            )}
          </div>

          {/* Правая колонка: клиент и сделка */}
          {active && (
            <div className="card p-4 overflow-y-auto space-y-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Клиент</p>
                <p className="font-semibold text-text">{active.contactName}</p>
                <a href={`tel:+${active.phone}`} className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                  <Phone size={11} /> +{active.phone}
                </a>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-text-muted mb-1.5">Заявка</p>
                {linkedLead ? (
                  <div className="bg-surface rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-primary">#{linkedLead.refNumber}</span>
                      <button onClick={() => unlinkLead(active.id)} className="text-text-muted hover:text-red-600" title="Отвязать">
                        <Unlink size={13} />
                      </button>
                    </div>
                    <p className="text-sm text-text truncate">{linkedLead.fullName}</p>
                    {active.linkSource === "AUTO" && (
                      <p className="text-[11px] text-green-700 flex items-center gap-1">
                        <Check size={11} /> Привязано автоматически по номеру телефона
                      </p>
                    )}
                    <Link
                      href={`/crm/leads/${linkedLead.id}`}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={11} /> Открыть заявку
                    </Link>
                  </div>
                ) : linkSearchOpen ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        autoFocus
                        value={linkQuery}
                        onChange={(e) => setLinkQuery(e.target.value)}
                        placeholder="Номер, имя или телефон..."
                        className="input-field text-xs pl-6.5 py-1.5"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                      {linkCandidates.length === 0 && <p className="text-xs text-text-muted px-1 py-1">Не найдено</p>}
                      {linkCandidates.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => linkLead(active.id, l.id)}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-surface text-xs"
                        >
                          <span className="font-bold text-primary">#{l.refNumber}</span> · {l.fullName}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setLinkSearchOpen(false)} className="text-xs text-text-muted hover:text-primary">
                      Отмена
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => setLinkSearchOpen(true)}
                      className="btn-secondary w-full py-1.5 text-xs flex items-center justify-center gap-1.5"
                    >
                      <LinkIcon size={13} /> Привязать к заявке
                    </button>
                    {active.channel === "INSTAGRAM" && (
                      <p className="text-[11px] text-text-muted">
                        Instagram не передаёт номер телефона отправителя — автосвязь недоступна, привяжите вручную один раз.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-text-muted mb-1">Стадия сделки</p>
                {linkedLead ? (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${linkedLead.stageColor}1A`, color: linkedLead.stageColor }}
                  >
                    {linkedLead.stageName}
                  </span>
                ) : (
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", MOCK_STAGE_STYLE[active.stage])}>
                    {MOCK_STAGE_LABEL[active.stage]}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Ответственный</p>
                <p className="text-sm text-text">{linkedLead ? linkedLead.assignedToName ?? "Не назначено" : active.assignedTo}</p>
              </div>
              {(linkedLead ? linkedLead.orderAmount !== null : active.orderAmount !== undefined) && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Заказ</p>
                  <p className="text-sm text-text">
                    {(linkedLead ? linkedLead.orderAmount! : active.orderAmount!).toLocaleString("ru-RU")} ₸
                  </p>
                  <p className="text-xs text-text-muted">
                    Остаток: {(linkedLead ? linkedLead.orderRemaining ?? 0 : active.orderRemaining ?? 0).toLocaleString("ru-RU")} ₸
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-border space-y-1.5">
                {linkedLead ? (
                  <Link href={`/crm/leads/${linkedLead.id}`} className="btn-secondary w-full py-1.5 text-xs block text-center">
                    Открыть сделку
                  </Link>
                ) : (
                  <button disabled className="btn-secondary w-full py-1.5 text-xs opacity-50 cursor-not-allowed">
                    Открыть сделку
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
