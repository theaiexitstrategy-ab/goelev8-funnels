// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Source of truth: reference/roqdemo/roqbody-homepage-v2.jsx. This file is
// that component with only the three Next.js adaptations from the spec:
//   1. 'use client' + next/font/google for Bebas Neue + Inter
//   2. useEffect CSS injection moved to roq.css (imported at the top)
//   3. LeadSection handleSubmit POSTs to /api/leads/roqbody
// Nothing else in the layout, sections, or styling has been rewritten.

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bebas_Neue, Inter } from 'next/font/google';
import './roq.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const BRAND_ARMS = [
  { id: "training", icon: "🏋🏾", label: "Training", title: "ROQ Body Academy", desc: "Personal training, online programs, and natural bodybuilding coaching from an IPE pro. Simple. Challenging. Efficient.", badge: "Book Now", featured: true },
  { id: "apparel", icon: "👕", label: "Apparel", title: "ROQ Apparel", desc: "Wear the brand. Live the lifestyle. Premium fitness apparel built for the work.", badge: "Shop" },
  { id: "supplements", icon: "⚡", label: "Supplements", title: "ROQ Supplements", desc: "Pre-workouts, BCAAs, and aminos built for results. Fueled by the ROQ Body standard.", badge: "Shop" },
  { id: "roquizine", icon: "🍽️", label: "ROQuizine", title: "ROQuizine", desc: "Custom meal prep powered by Calculated Nutrition. Eat right. Train harder.", badge: "Order" },
  { id: "jr", icon: "🧒🏾", label: "ROQ Jr", title: "ROQ Body Jr Academy", desc: "Youth fitness program building the next generation of athletes — ages 8 to 17.", badge: "Enroll" },
  { id: "events", icon: "🏆", label: "Events", title: "ROQ Solid Events", desc: "Community events, bodybuilding showcases, and brand activations across STL.", badge: "View" },
];

const PROGRAMS = [
  { num: "01", name: "Personal Training", sub: "1-on-1 · In-Person · St. Louis, MO", badge: "Book Now" },
  { num: "02", name: "Online Training", sub: "Remote · Custom Programs · Any Level", badge: "Enroll" },
  { num: "03", name: "Natural Bodybuilding", sub: "Competition Prep · Stage Ready", badge: "Apply" },
  { num: "04", name: "ROQ Body Jr", sub: "Youth Fitness · Ages 8–17", badge: "Learn More" },
];

const STORE_ITEMS = [
  { icon: "👟", cat: "Apparel", name: "High Top Canvas", price: "$69.99" },
  { icon: "⚡", cat: "Supplements", name: "ROQ Pre-Worq Out", price: "$42.99" },
  { icon: "👕", cat: "Apparel", name: "ROQ Body Shorts", price: "$44.99" },
  { icon: "💪🏾", cat: "Supplements", name: "ROQ BCAAs", price: "$42.99" },
  { icon: "🧢", cat: "Apparel", name: "Foam Trucker Hat", price: "$29.99" },
  { icon: "🥛", cat: "Supplements", name: "Energized Aminos", price: "$42.99" },
];

const REVIEWS = [
  { text: "Best trainer in STL. My whole physique changed in 90 days. Coach Q meets you where you are and pushes you further than you thought possible.", author: "Marcus T." },
  { text: "Train, Excel, Succeed is not just a motto. Coach Q lives it every session. I came in with zero experience and left competition-ready.", author: "Deja W." },
  { text: "ROQ Body isn't a gym — it's a whole lifestyle. The supplements, the meal prep, the training. Everything works together perfectly.", author: "J. Robinson" },
];

// ── SPLASH ──
function Splash({ done }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 1900);
    const t3 = setTimeout(done, 2500);
    return () => [t1,t2,t3].forEach(clearTimeout);
  }, []);
  return (
    <div style={{
      position:"fixed",inset:0,background:"#080808",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:9999,flexDirection:"column",gap:18,
      opacity: phase===2 ? 0 : 1,
      transition: phase===2 ? "opacity 0.6s ease" : "none",
      pointerEvents: phase===2 ? "none" : "all",
    }}>
      <div style={{
        width:96,height:96,borderRadius:"50%",
        background:"#FF4500",
        display:"flex",alignItems:"center",justifyContent:"center",
        transform: phase>=1 ? "scale(1)" : "scale(0.5)",
        opacity: phase>=1 ? 1 : 0,
        transition:"transform 0.8s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease",
        boxShadow:"0 0 80px rgba(255,69,0,0.35)",
        flexDirection:"column",gap:0,
      }}>
        <div style={{
          fontFamily:"'Bebas Neue','Arial Black',sans-serif",
          fontSize:30,color:"#fff",letterSpacing:3,lineHeight:1,
        }}>ROQ</div>
        <div style={{
          fontFamily:"'Bebas Neue','Arial Black',sans-serif",
          fontSize:11,color:"rgba(255,255,255,0.7)",letterSpacing:4,lineHeight:1,
        }}>BODY</div>
      </div>
      <div style={{
        fontFamily:"'Bebas Neue','Arial Black',sans-serif",
        fontSize:38,letterSpacing:8,color:"#F2EDE6",
        opacity: phase>=1?1:0,
        transform: phase>=1?"translateY(0)":"translateY(12px)",
        transition:"all 0.6s ease 0.25s",
      }}>ROQ BODY</div>
      <div style={{
        fontFamily:"monospace",fontSize:10,
        letterSpacing:5,color:"#444",textTransform:"uppercase",
        opacity: phase>=1?1:0,
        transition:"opacity 0.6s ease 0.4s",
      }}>Train · Excel · Succeed</div>
    </div>
  );
}

// ── TICKER ──
function Ticker() {
  const text = "TRAIN · EXCEL · SUCCEED · ROQ BODY ACADEMY · STL BASED · PERSONAL TRAINING · SUPPLEMENTS · APPAREL · ROQUIZINE · ROQ BODY JR · ROQ SOLID EVENTS · ";
  return (
    <div style={{background:"#FF4500",overflow:"hidden",padding:"8px 0"}}>
      <div style={{
        display:"flex",whiteSpace:"nowrap",
        animation:"ticker 24s linear infinite",
      }}>
        {[0,1,2,3].map(i=>(
          <span key={i} style={{
            fontFamily:"'Bebas Neue','Arial Black',sans-serif",
            fontSize:12,letterSpacing:4,color:"#fff",paddingRight:48,
          }}>{text}</span>
        ))}
      </div>
    </div>
  );
}

// ── REVENUE STREAM BANNER ──
function StreamBanner({ onSelect }) {
  const ref = useRef(null);
  const [active, setActive] = useState(null);
  return (
    <div style={{
      background:"#0D0D0D",
      borderBottom:"1px solid #1A1A1A",
      position:"relative",
    }}>
      <div style={{
        position:"absolute",right:0,top:0,bottom:0,
        width:40,background:"linear-gradient(90deg,transparent,#0D0D0D)",
        zIndex:2,pointerEvents:"none",
      }}/>
      <div
        ref={ref}
        style={{
          display:"flex",overflowX:"auto",gap:0,
          scrollbarWidth:"none",msOverflowStyle:"none",
          WebkitOverflowScrolling:"touch",
        }}
      >
        {BRAND_ARMS.map((arm) => (
          <button
            key={arm.id}
            onClick={() => {
              setActive(arm.id);
              onSelect(arm.id);
              document.getElementById(arm.id)?.scrollIntoView({behavior:"smooth",block:"start"});
            }}
            style={{
              background: active===arm.id ? "rgba(255,69,0,0.1)" : "transparent",
              border:"none",
              borderBottom: active===arm.id ? "2px solid #FF4500" : "2px solid transparent",
              padding:"14px 20px",
              display:"flex",flexDirection:"column",
              alignItems:"center",gap:5,
              cursor:"pointer",
              flexShrink:0,
              transition:"all 0.2s",
              minWidth:80,
            }}
          >
            <span style={{fontSize:22}}>{arm.icon}</span>
            <span style={{
              fontFamily:"'Bebas Neue','Arial Black',sans-serif",
              fontSize:12,letterSpacing:1.5,
              color: active===arm.id ? "#FF4500" : "#555",
              textTransform:"uppercase",
              whiteSpace:"nowrap",
              transition:"color 0.2s",
            }}>{arm.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── NAV ──
function Nav({ onCTA }) {
  return (
    <div style={{
      position:"sticky",top:0,zIndex:100,
      background:"rgba(8,8,8,0.96)",
      backdropFilter:"blur(14px)",
      borderBottom:"1px solid #161616",
      padding:"0 16px",
      display:"flex",alignItems:"center",
      justifyContent:"space-between",
      height:54,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{
          width:36,height:36,borderRadius:"50%",
          background:"#FF4500",
          display:"flex",alignItems:"center",justifyContent:"center",
          flexShrink:0,flexDirection:"column",
        }}>
          <div style={{
            fontFamily:"'Bebas Neue','Arial Black',sans-serif",
            fontSize:12,color:"#fff",letterSpacing:2,lineHeight:1,
          }}>ROQ</div>
          <div style={{
            fontFamily:"'Bebas Neue','Arial Black',sans-serif",
            fontSize:6,color:"rgba(255,255,255,0.75)",letterSpacing:2,lineHeight:1,
          }}>BODY</div>
        </div>
        <div style={{
          fontFamily:"'Bebas Neue','Arial Black',sans-serif",
          fontSize:19,letterSpacing:3,color:"#F2EDE6",
        }}>ROQ BODY</div>
      </div>
      <button
        onClick={onCTA}
        style={{
          background:"#FF4500",color:"#fff",
          border:"none",borderRadius:4,
          padding:"8px 18px",
          fontSize:11,fontWeight:700,
          letterSpacing:1,textTransform:"uppercase",
          cursor:"pointer",fontFamily:"Inter,sans-serif",
        }}>Start Training</button>
    </div>
  );
}

// ── HERO ──
function Hero({ onCTA }) {
  return (
    <div style={{
      minHeight:"88vh",
      background:"linear-gradient(180deg,#080808 0%,#0f0a06 65%,#180d05 100%)",
      padding:"52px 16px 56px",
      display:"flex",flexDirection:"column",
      justifyContent:"flex-end",
      position:"relative",overflow:"hidden",
    }}>
      <div style={{
        position:"absolute",top:"50%",left:"50%",
        transform:"translate(-50%,-54%)",
        fontFamily:"'Bebas Neue','Arial Black',sans-serif",
        fontSize:"55vw",color:"rgba(255,69,0,0.032)",
        letterSpacing:-4,lineHeight:1,
        userSelect:"none",pointerEvents:"none",
        whiteSpace:"nowrap",
      }}>ROQ</div>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{
          fontFamily:"monospace",fontSize:10,
          letterSpacing:4,color:"#FF4500",
          textTransform:"uppercase",marginBottom:20,
        }}>ROQ Body Academy · St. Louis, MO</div>
        <div style={{
          fontFamily:"'Bebas Neue','Arial Black',sans-serif",
          fontSize:"clamp(58px,17vw,88px)",
          lineHeight:0.9,letterSpacing:2,
          color:"#F2EDE6",marginBottom:22,
        }}>
          CHANGE<br/>
          YOUR<br/>
          <span style={{color:"#FF4500"}}>PHYSIQUE.</span><br/>
          GROW YOUR<br/>
          CONFIDENCE.
        </div>
        <p style={{fontSize:13,color:"#666",lineHeight:1.8,marginBottom:30,maxWidth:340}}>
          STL&apos;s premier fitness ecosystem. Personal training, online programs,
          natural bodybuilding, supplements, apparel, and custom meal prep —
          all under one brand.
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={onCTA} style={{
            background:"#FF4500",color:"#fff",
            border:"none",borderRadius:4,
            padding:"14px 28px",fontSize:12,fontWeight:700,
            letterSpacing:1.5,textTransform:"uppercase",
            cursor:"pointer",fontFamily:"Inter,sans-serif",
          }}>Book a Free Consult</button>
          <button style={{
            background:"transparent",color:"#F2EDE6",
            border:"1px solid #252525",borderRadius:4,
            padding:"14px 24px",fontSize:12,fontWeight:700,
            letterSpacing:1.5,textTransform:"uppercase",
            cursor:"pointer",fontFamily:"Inter,sans-serif",
          }}>Shop the Brand →</button>
        </div>
        <div style={{
          display:"flex",gap:28,marginTop:40,
          paddingTop:28,borderTop:"1px solid #1A1A1A",
        }}>
          {[{val:"6+",label:"Brand Arms"},{val:"IPE",label:"Pro Bodybuilder"},{val:"ISSA",label:"Certified Trainer"}].map(s=>(
            <div key={s.val}>
              <div style={{
                fontFamily:"'Bebas Neue','Arial Black',sans-serif",
                fontSize:32,color:"#F2EDE6",letterSpacing:1,
              }}>{s.val}</div>
              <div style={{
                fontSize:9,color:"#444",
                letterSpacing:2,textTransform:"uppercase",marginTop:2,
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── BRAND ARMS SECTION ──
function BrandSection() {
  return (
    <div style={{padding:"56px 16px"}}>
      <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:4,color:"#FF4500",textTransform:"uppercase",marginBottom:10}}>The ROQ Brand Family</div>
      <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:48,letterSpacing:2,color:"#F2EDE6",lineHeight:1,marginBottom:10}}>Six Arms.{"\n"}One Brand.</div>
      <div style={{fontSize:13,color:"#666",lineHeight:1.75,marginBottom:28,maxWidth:400}}>
        ROQ Body isn&apos;t just a gym. It&apos;s a complete fitness lifestyle ecosystem built around one mission: Train. Excel. Succeed.
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        {BRAND_ARMS.map(arm=>(
          <div
            id={arm.id}
            key={arm.id}
            style={{
              background: arm.featured
                ? "linear-gradient(135deg,#1c0e06,#111)"
                : "#141414",
              border: arm.featured ? "1px solid rgba(255,69,0,0.2)" : "none",
              padding:"22px 18px",
              display:"flex",alignItems:"center",
              justifyContent:"space-between",
              cursor:"pointer",
            }}
          >
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontSize:30,flexShrink:0}}>{arm.icon}</div>
              <div>
                <div style={{
                  fontFamily:"'Bebas Neue','Arial Black',sans-serif",
                  fontSize: arm.featured ? 24 : 20,
                  letterSpacing:1.5,color:"#F2EDE6",marginBottom:4,
                }}>{arm.title}</div>
                <div style={{fontSize:12,color:"#555",lineHeight:1.6,maxWidth:260}}>{arm.desc}</div>
              </div>
            </div>
            <div style={{
              background:"rgba(255,69,0,0.08)",
              border:"1px solid rgba(255,69,0,0.18)",
              borderRadius:4,padding:"5px 12px",
              fontSize:10,fontWeight:700,
              letterSpacing:1,color:"#FF4500",
              textTransform:"uppercase",flexShrink:0,marginLeft:12,
            }}>{arm.badge}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COACH Q ──
function CoachSection() {
  return (
    <div id="brand" style={{background:"#0D0D0D",padding:"56px 16px"}}>
      <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:4,color:"#FF4500",textTransform:"uppercase",marginBottom:14}}>The Coach</div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{
          display:"inline-flex",alignItems:"center",gap:8,
          background:"rgba(34,197,94,0.06)",
          border:"1px solid rgba(34,197,94,0.18)",
          borderRadius:4,padding:"6px 14px",width:"fit-content",
        }}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",animation:"blink 2s infinite"}}/>
          <span style={{fontFamily:"monospace",fontSize:10,letterSpacing:2,color:"#22c55e",textTransform:"uppercase"}}>Now Accepting New Clients</span>
        </div>
        <div>
          <div style={{
            fontFamily:"'Bebas Neue','Arial Black',sans-serif",
            fontSize:44,letterSpacing:2,color:"#F2EDE6",lineHeight:1,
          }}>Quantarrius{"\n"}&quot;Coach Q&quot; Wilson</div>
          <div style={{fontSize:11,color:"#FF4500",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginTop:8}}>
            IPE Pro Bodybuilder · ISSA Certified Trainer
          </div>
        </div>
        <p style={{fontSize:13,color:"#666",lineHeight:1.8}}>
          Based in St. Louis, Coach Q has trained professional and amateur athletes,
          working professionals, and complete beginners. He approaches fitness as a
          lifelong behavior modification — simple, challenging, and efficient, with
          an emphasis on proper form and mobility.
        </p>
        <p style={{fontSize:13,color:"#444",lineHeight:1.8,fontStyle:"italic",borderLeft:"3px solid #FF4500",paddingLeft:14}}>
          &quot;My favorite client is anyone with a goal and a willingness to work toward it.&quot;
        </p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {["IPE Pro Bodybuilder","ISSA Certified","STL Based","In-Person + Online"].map(c=>(
            <div key={c} style={{
              background:"#161616",border:"1px solid #222",
              borderRadius:4,padding:"6px 12px",
              fontSize:11,color:"#555",
            }}>{c}</div>
          ))}
        </div>
        <button style={{
          background:"#FF4500",color:"#fff",border:"none",borderRadius:4,
          padding:"13px 24px",alignSelf:"flex-start",
          fontSize:12,fontWeight:700,letterSpacing:1.5,
          textTransform:"uppercase",cursor:"pointer",fontFamily:"Inter,sans-serif",
        }}>Train With Coach Q →</button>
      </div>
    </div>
  );
}

// ── TRAINING ──
function TrainingSection() {
  const [hovered, setHovered] = useState(null);
  return (
    <div id="training" style={{padding:"56px 16px"}}>
      <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:4,color:"#FF4500",textTransform:"uppercase",marginBottom:10}}>Training Programs</div>
      <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:48,letterSpacing:2,color:"#F2EDE6",lineHeight:1,marginBottom:10}}>We Got Worq{"\n"}to Do.</div>
      <div style={{fontSize:13,color:"#666",lineHeight:1.75,marginBottom:28}}>Choose your path. Every program is built around your goal.</div>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        {PROGRAMS.map(p=>(
          <div
            key={p.num}
            onMouseEnter={()=>setHovered(p.num)}
            onMouseLeave={()=>setHovered(null)}
            style={{
              background: hovered===p.num ? "#181818" : "#141414",
              padding:"18px 16px",
              display:"flex",alignItems:"center",
              justifyContent:"space-between",
              borderLeft:`3px solid ${hovered===p.num ? "#FF4500" : "transparent"}`,
              cursor:"pointer",transition:"all 0.18s",
            }}
          >
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontFamily:"monospace",fontSize:10,color:"#2A2A2A",minWidth:22}}>{p.num}</div>
              <div>
                <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:20,letterSpacing:1.5,color:"#F2EDE6"}}>{p.name}</div>
                <div style={{fontSize:11,color:"#555",marginTop:2}}>{p.sub}</div>
              </div>
            </div>
            <div style={{
              background:"rgba(255,69,0,0.08)",border:"1px solid rgba(255,69,0,0.18)",
              borderRadius:4,padding:"5px 11px",
              fontSize:10,fontWeight:700,letterSpacing:1,
              color:"#FF4500",textTransform:"uppercase",flexShrink:0,
            }}>{p.badge}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── STORE ──
function StoreSection() {
  return (
    <div id="apparel" style={{background:"#0D0D0D",padding:"56px 16px"}}>
      <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:4,color:"#FF4500",textTransform:"uppercase",marginBottom:10}}>The Store</div>
      <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:48,letterSpacing:2,color:"#F2EDE6",lineHeight:1,marginBottom:10}}>Shop the{"\n"}Lifestyle.</div>
      <div style={{fontSize:13,color:"#666",lineHeight:1.75,marginBottom:24}}>Apparel, supplements, and gear. Wear the brand. Fuel the work.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,marginBottom:16}}>
        {STORE_ITEMS.map(item=>(
          <div key={item.name} style={{background:"#141414",padding:"16px 14px",cursor:"pointer"}}>
            <div style={{
              fontSize:34,textAlign:"center",
              background:"#0D0D0D",borderRadius:4,
              padding:"18px 0",marginBottom:10,
            }}>{item.icon}</div>
            <div style={{fontFamily:"monospace",fontSize:9,letterSpacing:2,color:"#FF4500",textTransform:"uppercase",marginBottom:4}}>{item.cat}</div>
            <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:17,letterSpacing:1,color:"#F2EDE6",marginBottom:3}}>{item.name}</div>
            <div style={{fontSize:12,color:"#555"}}>{item.price}</div>
          </div>
        ))}
      </div>
      <button style={{
        width:"100%",background:"#FF4500",color:"#fff",
        border:"none",borderRadius:4,padding:14,
        fontSize:12,fontWeight:700,letterSpacing:1.5,
        textTransform:"uppercase",cursor:"pointer",fontFamily:"Inter,sans-serif",
      }}>Shop All Products →</button>
    </div>
  );
}

// ── ROQUIZINE ──
function ROQuizineSection() {
  return (
    <div id="roquizine" style={{
      padding:"56px 16px",
      background:"linear-gradient(135deg,#080808,#0d0a05)",
      borderTop:"1px solid rgba(255,69,0,0.1)",
    }}>
      <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:4,color:"#FF4500",textTransform:"uppercase",marginBottom:10}}>Meal Prep</div>
      <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:48,letterSpacing:2,color:"#F2EDE6",lineHeight:1,marginBottom:10}}>ROQuizine.</div>
      <div style={{fontSize:13,color:"#666",lineHeight:1.8,marginBottom:24,maxWidth:380}}>
        Custom meal prep powered by Calculated Nutrition. Eat right. Train harder. Let your food work as hard as you do.
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {["Custom macros tailored to your training goals","Fresh prep delivered or ready for pickup","Works with your personal training program","Powered by Calculated Nutrition science"].map(f=>(
          <div key={f} style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{color:"#FF4500",flexShrink:0,marginTop:1}}>✓</div>
            <div style={{fontSize:13,color:"#666"}}>{f}</div>
          </div>
        ))}
      </div>
      <button style={{
        background:"transparent",color:"#FF4500",
        border:"1px solid rgba(255,69,0,0.4)",borderRadius:4,
        padding:"13px 24px",fontSize:12,fontWeight:700,
        letterSpacing:1.5,textTransform:"uppercase",
        cursor:"pointer",fontFamily:"Inter,sans-serif",
      }}>Order Meal Prep →</button>
    </div>
  );
}

// ── REVIEWS ──
function ReviewsSection() {
  return (
    <div style={{background:"#0D0D0D",padding:"56px 16px"}}>
      <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:4,color:"#FF4500",textTransform:"uppercase",marginBottom:10}}>What They&apos;re Saying</div>
      <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:48,letterSpacing:2,color:"#F2EDE6",lineHeight:1,marginBottom:24}}>Real People.{"\n"}Real Results.</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {REVIEWS.map((r,i)=>(
          <div key={i} style={{
            background:"#141414",border:"1px solid #1A1A1A",
            borderRadius:4,padding:"18px 16px",
          }}>
            <div style={{color:"#D4A017",fontSize:12,marginBottom:10,letterSpacing:2}}>★★★★★</div>
            <div style={{fontSize:13,color:"#666",lineHeight:1.8,marginBottom:10,fontStyle:"italic"}}>&quot;{r.text}&quot;</div>
            <div style={{fontSize:10,color:"#333",letterSpacing:2,textTransform:"uppercase"}}>— {r.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LEAD CAPTURE ──
function LeadSection() {
  const [form, setForm] = useState({name:"",phone:"",goal:""});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      await fetch('/api/leads/roqbody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          goal: form.goal,
          source: 'roqbody-site',
          client_slug: 'roqbody',
          created_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Silent — the form always confirms, per spec.
      console.error('[roq/lead] submit failed:', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div id="lead-section" style={{
      background:"linear-gradient(135deg,#0f0a06,#180d05)",
      borderTop:"1px solid rgba(255,69,0,0.12)",
      padding:"64px 16px",textAlign:"center",
    }}>
      <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:52,letterSpacing:3,color:"#F2EDE6",lineHeight:1,marginBottom:10}}>
        Ready to<br/><span style={{color:"#FF4500"}}>Start?</span>
      </div>
      <p style={{fontSize:13,color:"#666",lineHeight:1.8,maxWidth:320,margin:"0 auto 28px"}}>
        Drop your info and Coach Q&apos;s team will reach out within 24 hours. No pressure. Just results.
      </p>
      {submitted ? (
        <div style={{
          background:"rgba(34,197,94,0.07)",
          border:"1px solid rgba(34,197,94,0.2)",
          borderRadius:8,padding:"28px 20px",
          maxWidth:320,margin:"0 auto",
        }}>
          <div style={{fontSize:36,marginBottom:10}}>💪🏾</div>
          <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:28,color:"#22c55e",letterSpacing:1,marginBottom:8}}>YOU&apos;RE IN</div>
          <div style={{fontSize:13,color:"#555",lineHeight:1.7}}>Coach Q&apos;s team will reach out within 24 hours. Get ready to put in the Worq.</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:340,margin:"0 auto"}}>
          {[
            {key:"name",placeholder:"Your name",type:"text"},
            {key:"phone",placeholder:"Phone number",type:"tel"},
            {key:"goal",placeholder:"What's your goal?",type:"text"},
          ].map(f=>(
            <input
              key={f.key} type={f.type}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e=>setForm({...form,[f.key]:e.target.value})}
              style={{
                background:"rgba(255,255,255,0.04)",
                border:"1px solid #222",borderRadius:4,
                padding:"13px 16px",color:"#F2EDE6",
                fontSize:14,fontFamily:"Inter,sans-serif",outline:"none",
              }}
            />
          ))}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? "#c03500" : "#FF4500",
              color:"#fff",border:"none",borderRadius:4,
              padding:14,fontSize:12,fontWeight:700,
              letterSpacing:1.5,textTransform:"uppercase",
              cursor:"pointer",fontFamily:"Inter,sans-serif",
              transition:"background 0.2s",
            }}>{loading ? "Sending..." : "Get Started — It's Free →"}</button>
          <div style={{fontSize:10,color:"#2A2A2A",letterSpacing:1}}>No spam. No pressure. Just results.</div>
        </div>
      )}
    </div>
  );
}

// ── FOOTER ──
function Footer() {
  return (
    <div style={{background:"#0A0A0A",borderTop:"1px solid #161616",padding:"40px 16px 100px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <div style={{
          width:36,height:36,borderRadius:"50%",background:"#FF4500",
          display:"flex",alignItems:"center",justifyContent:"center",
          flexDirection:"column",flexShrink:0,
        }}>
          <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:12,color:"#fff",letterSpacing:2,lineHeight:1}}>ROQ</div>
          <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:6,color:"rgba(255,255,255,0.7)",letterSpacing:2,lineHeight:1}}>BODY</div>
        </div>
        <div style={{fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:24,letterSpacing:4,color:"#F2EDE6"}}>ROQ BODY</div>
      </div>
      <div style={{fontFamily:"monospace",fontSize:9,letterSpacing:3,color:"#2A2A2A",textTransform:"uppercase",marginBottom:24}}>
        St. Louis, MO · info@roqbody.com · Train · Excel · Succeed
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:16,marginBottom:24}}>
        {["Personal Training","Online Programs","Supplements","Apparel","ROQuizine","ROQ Body Jr","The Brand","Contact"].map(l=>(
          <span key={l} style={{fontSize:11,color:"#333",letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>{l}</span>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:32}}>
        {["Instagram","Facebook","YouTube"].map(s=>(
          <div key={s} style={{
            background:"#141414",border:"1px solid #1E1E1E",
            borderRadius:4,padding:"8px 14px",
            fontSize:11,color:"#444",letterSpacing:1,
            textTransform:"uppercase",cursor:"pointer",
          }}>{s}</div>
        ))}
      </div>
      <div style={{paddingTop:20,borderTop:"1px solid #141414",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:10,color:"#252525",letterSpacing:1}}>© 2026 ROQ Body LLC. All Rights Reserved.</div>
        <div style={{fontSize:10,color:"#252525",letterSpacing:1}}>Powered by <span style={{color:"#FF4500"}}>GoElev8.ai</span></div>
      </div>
    </div>
  );
}

// ── BOTTOM PILL NAV ──
function BottomNav() {
  const [active, setActive] = useState("Home");
  const tabs = [
    {label:"Home",id:"hero"},
    {label:"Train",id:"training"},
    {label:"Shop",id:"apparel"},
    {label:"Eats",id:"roquizine"},
    {label:"Book",id:"lead-section"},
  ];
  const go = (tab) => {
    setActive(tab.label);
    document.getElementById(tab.id)?.scrollIntoView({behavior:"smooth",block:"start"});
  };
  return (
    <div style={{
      position:"fixed",bottom:20,left:"50%",
      transform:"translateX(-50%)",
      background:"rgba(14,14,14,0.97)",
      border:"1px solid #1E1E1E",
      borderRadius:50,padding:"10px 22px",
      display:"flex",gap:20,zIndex:200,
      boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
    }}>
      {tabs.map(t=>(
        <button
          key={t.label}
          onClick={()=>go(t)}
          style={{
            background:"none",border:"none",
            fontSize:10,fontWeight:700,
            letterSpacing:1,textTransform:"uppercase",
            color: active===t.label ? "#FF4500" : "#3A3A3A",
            cursor:"pointer",fontFamily:"Inter,sans-serif",
            padding:0,transition:"color 0.2s",
            whiteSpace:"nowrap",
          }}>{t.label}</button>
      ))}
    </div>
  );
}

// ── ROOT ──
export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  const scrollToLead = () => {
    document.getElementById("lead-section")?.scrollIntoView({behavior:"smooth"});
  };

  return (
    <div
      className={`roq-root ${bebasNeue.variable} ${inter.variable} ${bebasNeue.className} ${inter.className}`}
      style={{background:"#080808",minHeight:"100vh",color:"#F2EDE6",fontFamily:"Inter,sans-serif"}}
    >
      {!splashDone && <Splash done={()=>setSplashDone(true)} />}
      <div style={{opacity:splashDone?1:0,transition:"opacity 0.5s ease"}}>
        <Nav onCTA={scrollToLead} />
        <Ticker />
        <StreamBanner onSelect={()=>{}} />
        <div id="hero"><Hero onCTA={scrollToLead} /></div>
        <BrandSection />
        <CoachSection />
        <TrainingSection />
        <StoreSection />
        <ROQuizineSection />
        <ReviewsSection />
        <LeadSection />
        <Footer />
        <BottomNav />
      </div>
    </div>
  );
}
