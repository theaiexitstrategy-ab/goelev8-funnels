// app/f/[slug]/book/page.tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';

export const revalidate = 60;

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createServiceClient();
  const { data: funnel } = await supabase
    .from('funnels').select('business_name, offer')
    .eq('slug', params.slug).eq('is_active', true).single();

  return {
    title: funnel ? `Book — ${funnel.business_name}` : 'Book Appointment',
    description: funnel?.offer || 'Schedule your appointment',
  };
}

export default async function BookingPage({ params }: Props) {
  const supabase = createServiceClient();
  const { data: funnel } = await supabase
    .from('funnels').select('*').eq('slug', params.slug).eq('is_active', true).single();

  if (!funnel) notFound();

  // Check for external calendar redirect
  const { data: calIntegration } = await supabase
    .from('calendar_integrations')
    .select('platform, external_booking_url')
    .eq('user_id', funnel.user_id)
    .eq('is_primary', true)
    .single();

  if (calIntegration?.external_booking_url) {
    // Calendly/Acuity — redirect to their hosted page
    return (
      <meta httpEquiv="refresh" content={`0;url=${calIntegration.external_booking_url}`} />
    );
  }

  const accent = funnel.accent_color || '#00CFFF';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#050a12', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: accent, margin: '0 0 8px' }}>
            {funnel.business_name}
          </h1>
          <p style={{ opacity: 0.7, margin: '0 0 32px' }}>Select a date and time for your appointment</p>

          <div id="booking-widget" data-slug={params.slug} data-accent={accent}></div>

          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              var slug = '${params.slug.replace(/'/g, "\\'")}';
              var accent = '${accent}';
              var widget = document.getElementById('booking-widget');

              // Date picker
              var dateInput = document.createElement('input');
              dateInput.type = 'date';
              dateInput.min = new Date().toISOString().split('T')[0];
              dateInput.style.cssText = 'width:100%;padding:14px;background:#111;border:1px solid #333;color:#fff;border-radius:2px;font-size:16px;margin-bottom:16px;';
              widget.appendChild(dateInput);

              var slotsDiv = document.createElement('div');
              slotsDiv.id = 'slots';
              widget.appendChild(slotsDiv);

              var formDiv = document.createElement('div');
              formDiv.id = 'book-form';
              formDiv.style.display = 'none';
              widget.appendChild(formDiv);

              var selectedSlot = null;

              dateInput.addEventListener('change', function() {
                slotsDiv.innerHTML = '<p style="opacity:0.5">Loading...</p>';
                fetch('/api/calendar/availability?funnel_slug=' + slug + '&date=' + dateInput.value)
                  .then(function(r) { return r.json(); })
                  .then(function(data) {
                    slotsDiv.innerHTML = '';
                    if (!data.slots || !data.slots.length) {
                      slotsDiv.innerHTML = '<p style="opacity:0.5">No available slots on this date</p>';
                      return;
                    }
                    data.slots.forEach(function(s) {
                      var btn = document.createElement('button');
                      var t = new Date(s);
                      btn.textContent = t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
                      btn.style.cssText = 'padding:12px 20px;margin:4px;background:#111;border:1px solid #333;color:#fff;border-radius:2px;cursor:pointer;font-size:14px;';
                      btn.addEventListener('click', function() {
                        selectedSlot = s;
                        document.querySelectorAll('#slots button').forEach(function(b) { b.style.borderColor = '#333'; });
                        btn.style.borderColor = accent;
                        showForm();
                      });
                      slotsDiv.appendChild(btn);
                    });
                  });
              });

              function showForm() {
                formDiv.style.display = 'block';
                formDiv.innerHTML = '<input id="bk-name" placeholder="Your Name" style="width:100%;padding:14px;background:#111;border:1px solid #333;color:#fff;border-radius:2px;margin:8px 0;font-size:16px;box-sizing:border-box;">'
                  + '<input id="bk-phone" type="tel" placeholder="Your Phone" style="width:100%;padding:14px;background:#111;border:1px solid #333;color:#fff;border-radius:2px;margin:8px 0;font-size:16px;box-sizing:border-box;">'
                  + '<button id="bk-submit" style="width:100%;padding:16px;background:' + accent + ';color:#000;border:none;border-radius:2px;font-family:Bebas Neue,sans-serif;font-size:1.3rem;cursor:pointer;margin-top:8px;">CONFIRM BOOKING</button>'
                  + '<p id="bk-msg" style="margin-top:12px;text-align:center;"></p>';

                document.getElementById('bk-submit').addEventListener('click', function() {
                  var name = document.getElementById('bk-name').value.trim();
                  var phone = document.getElementById('bk-phone').value.trim();
                  if (!name || name.length < 2) { document.getElementById('bk-msg').textContent = 'Please enter your name'; return; }
                  if (!/^\\+?[\\d\\s\\-().]{7,15}$/.test(phone)) { document.getElementById('bk-msg').textContent = 'Please enter a valid phone number'; return; }
                  var btn = document.getElementById('bk-submit');
                  btn.disabled = true; btn.textContent = 'Booking...';
                  fetch('/api/calendar/book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ funnel_slug: slug, start_at: selectedSlot, full_name: name, phone: phone })
                  }).then(function(r) { return r.json(); })
                    .then(function(data) {
                      if (data.success) {
                        formDiv.innerHTML = '<div style="text-align:center;padding:32px 0"><p style="font-size:1.5rem;color:' + accent + '">Confirmed!</p><p>Confirmation code: <strong>' + (data.confirmation_code || '') + '</strong></p><p style="opacity:0.7">Check your phone for a confirmation text.</p></div>';
                        slotsDiv.innerHTML = '';
                      } else {
                        document.getElementById('bk-msg').textContent = data.error || 'Could not book. Try another slot.';
                        btn.disabled = false; btn.textContent = 'CONFIRM BOOKING';
                      }
                    }).catch(function() {
                      document.getElementById('bk-msg').textContent = 'Something went wrong. Please try again.';
                      btn.disabled = false; btn.textContent = 'CONFIRM BOOKING';
                    });
                });
              }
            })();
          `}} />
        </div>

        {/* GoElev8.ai badge */}
        <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 999 }}>
          <a href="https://goelev8.ai/powered-by" target="_blank" rel="noopener"
             style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.8)',
                      border: '1px solid rgba(0,207,255,.3)', borderRadius: 2, padding: '5px 10px',
                      textDecoration: 'none', fontFamily: 'monospace', fontSize: 10, color: '#00CFFF' }}>
            Powered by GoElev8.ai
          </a>
        </div>
      </body>
    </html>
  );
}
