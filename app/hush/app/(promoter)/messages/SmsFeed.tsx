// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// SMS feed for the promoter Messages tab. Renders inbound + outbound
// messages from hush_messages as a chat-bubble timeline. Inbound from
// guests sits on the left in dark cards; outbound AI replies sit on
// the right in gold-tinted bubbles.

type Msg = {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  fromPhone: string;
  toPhone: string;
  matched: boolean;
  createdAt: string;
  keyword: string | null;
};

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const last4 = digits.slice(-4);
  const area = digits.length === 11 ? digits.slice(1, 4) : digits.slice(0, 3);
  return `(${area}) •• ${last4}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function SmsFeed({ messages }: { messages: Msg[] }) {
  if (messages.length === 0) {
    return (
      <section className="mt-5">
        <div className="rounded-xl border border-hush-gline bg-hush-card px-5 py-12 text-center">
          <p className="font-cormorant text-[16px] italic text-hush-white">
            No messages yet.
          </p>
          <p className="mt-2 font-outfit text-[12px] leading-snug text-hush-muted2">
            Inbound texts to the Hush demo number will land here in real time once a guest texts your keyword.
          </p>
        </div>
      </section>
    );
  }

  // Reverse so oldest at top, newest at bottom (chronological reading).
  const ordered = [...messages].reverse();

  return (
    <section className="mt-5 flex flex-col gap-2 pb-6">
      {ordered.map((m) => {
        const isInbound = m.direction === 'inbound';
        return (
          <div
            key={m.id}
            className={`flex w-full flex-col ${isInbound ? 'items-start' : 'items-end'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 ${
                isInbound
                  ? 'rounded-tl-md border border-hush-gline bg-hush-card2'
                  : 'rounded-tr-md border border-hush-gline bg-hush-gdim'
              }`}
            >
              <p
                className={`whitespace-pre-wrap font-outfit text-[13px] leading-snug ${
                  isInbound ? 'text-hush-white' : 'text-hush-gold4'
                }`}
              >
                {m.body}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1.5 px-2 font-outfit text-[10px] tracking-wide text-hush-muted">
              <span>{isInbound ? maskPhone(m.fromPhone) : 'Hush AI'}</span>
              <span className="text-hush-muted/50">•</span>
              <span>{fmtTime(m.createdAt)}</span>
              {m.keyword && (
                <>
                  <span className="text-hush-muted/50">•</span>
                  <span className="font-bebas tracking-[0.15em] text-hush-gold">
                    {m.keyword}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
