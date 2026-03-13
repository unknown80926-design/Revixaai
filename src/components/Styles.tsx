import React from 'react';

export const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --indigo:   #09090B;
      --purple:   #4F46E5;
      --yellow:   #F59E0B;
      --ylite:    #FCD34D;
      --bg:       #FAFAFA;
      --white:    #FFFFFF;
      --subtle:   #F4F4F5;
      --text:     #09090B;
      --muted:    #71717A;
      --faint:    #A1A1AA;
      --border:   #E4E4E7;
      --success:  #10B981;
      --danger:   #EF4444;
      --warn:     #F59E0B;

      --grad:     linear-gradient(135deg, #09090B 0%, #4F46E5 100%);
      --grad-y:   linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%);
      --grad-s:   linear-gradient(135deg, rgba(9,9,11,0.03) 0%, rgba(79,70,229,0.05) 100%);

      --sh:       0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
      --sh-hov:   0 10px 30px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
      --sh-btn:   0 2px 8px rgba(79,70,229,0.25);

      --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 20px; --r-2xl: 24px;

      --font-h: 'Outfit', sans-serif;
      --font-b: 'Inter', sans-serif;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-b);
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    button, input, textarea, select { font-family: var(--font-b); }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #D4D4D8; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: #A1A1AA; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn  { from { opacity:0; transform:scale(0.98); } to { opacity:1; transform:scale(1); } }
    @keyframes spin     { to { transform:rotate(360deg); } }
    @keyframes barGrow  { from { width:0; } }
    @keyframes float    { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
    @keyframes bounce   { 0%,80%,100%{transform:translateY(0);} 40%{transform:translateY(-7px);} }
    @keyframes gradShift{ 0%,100%{background-position:0% 50%;} 50%{background-position:100% 50%;} }
    @keyframes pulseRing{ 0%{box-shadow:0 0 0 0 rgba(79,70,229,0.4);} 70%{box-shadow:0 0 0 10px rgba(79,70,229,0);} 100%{box-shadow:0 0 0 0 rgba(79,70,229,0);} }
    @keyframes shimmer  { 0%{background-position:-600px 0;} 100%{background-position:600px 0;} }
    @keyframes slideRight{ from{opacity:0;transform:translateX(-12px);} to{opacity:1;transform:translateX(0);} }
    @keyframes slideIndeterminate { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }

    .fu  { animation: fadeUp   0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .fi  { animation: fadeIn   0.4s ease both; }
    .si  { animation: scaleIn  0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .sr  { animation: slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

    .skeleton {
      background: linear-gradient(90deg,#F4F4F5 25%,#E4E4E7 50%,#F4F4F5 75%);
      background-size: 600px 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--r-sm);
    }
  `}</style>
);
