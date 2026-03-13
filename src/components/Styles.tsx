import React from 'react';

export const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --indigo:   #2A2E7F;
      --purple:   #6C63FF;
      --yellow:   #FFC857;
      --ylite:    #FFD97D;
      --bg:       #F8F9FC;
      --white:    #FFFFFF;
      --subtle:   #F1F3F9;
      --text:     #1F2933;
      --muted:    #6B7280;
      --faint:    #9CA3AF;
      --border:   #E5E7EB;
      --success:  #10B981;
      --danger:   #EF4444;
      --warn:     #F59E0B;

      --grad:     linear-gradient(135deg, #2A2E7F 0%, #6C63FF 100%);
      --grad-y:   linear-gradient(135deg, #FFC857 0%, #FFD97D 100%);
      --grad-s:   linear-gradient(135deg, rgba(42,46,127,0.05) 0%, rgba(108,99,255,0.05) 100%);

      --sh:       0 1px 3px rgba(31,41,51,0.04), 0 4px 16px rgba(31,41,51,0.06);
      --sh-hov:   0 4px 20px rgba(108,99,255,0.14), 0 1px 4px rgba(31,41,51,0.06);
      --sh-btn:   0 2px 12px rgba(108,99,255,0.30);

      --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 20px; --r-2xl: 24px;

      --font-h: 'Poppins', sans-serif;
      --font-b: 'DM Sans', sans-serif;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-b);
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    button, input, textarea, select { font-family: var(--font-b); }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 99px; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn  { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
    @keyframes spin     { to { transform:rotate(360deg); } }
    @keyframes barGrow  { from { width:0; } }
    @keyframes float    { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
    @keyframes bounce   { 0%,80%,100%{transform:translateY(0);} 40%{transform:translateY(-7px);} }
    @keyframes gradShift{ 0%,100%{background-position:0% 50%;} 50%{background-position:100% 50%;} }
    @keyframes pulseRing{ 0%{box-shadow:0 0 0 0 rgba(108,99,255,0.4);} 70%{box-shadow:0 0 0 10px rgba(108,99,255,0);} 100%{box-shadow:0 0 0 0 rgba(108,99,255,0);} }
    @keyframes shimmer  { 0%{background-position:-600px 0;} 100%{background-position:600px 0;} }
    @keyframes slideRight{ from{opacity:0;transform:translateX(-12px);} to{opacity:1;transform:translateX(0);} }

    .fu  { animation: fadeUp   0.45s ease both; }
    .fi  { animation: fadeIn   0.3s  ease both; }
    .si  { animation: scaleIn  0.3s  ease both; }
    .sr  { animation: slideRight 0.3s ease both; }

    .skeleton {
      background: linear-gradient(90deg,#F3F4F6 25%,#EAECF0 50%,#F3F4F6 75%);
      background-size: 600px 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--r-sm);
    }
  `}</style>
);
