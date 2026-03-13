import React, { useState, useEffect } from 'react';
import { IC } from './Icons';

export const T = {
  indigo:"#2A2E7F", purple:"#6C63FF", yellow:"#FFC857",
  bg:"#F8F9FC", white:"#FFFFFF", subtle:"#F1F3F9",
  text:"#1F2933", muted:"#6B7280", faint:"#9CA3AF",
  border:"#E5E7EB", success:"#10B981", danger:"#EF4444", warn:"#F59E0B",
  sh:"0 1px 3px rgba(31,41,51,0.04), 0 4px 16px rgba(31,41,51,0.06)",
  shHov:"0 4px 20px rgba(108,99,255,0.14), 0 1px 4px rgba(31,41,51,0.06)",
  shBtn:"0 2px 12px rgba(108,99,255,0.30)",
};

export const Card = ({ children, style, onClick, className = "" }: any) => {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => onClick && setHov(true)}
      onMouseLeave={() => onClick && setHov(false)}
      className={`si ${className}`}
      style={{
        background: T.white, borderRadius: 16,
        boxShadow: hov ? T.shHov : T.sh,
        padding: 24,
        border: `1px solid ${hov ? "rgba(108,99,255,0.2)" : T.border}`,
        transition: "all 0.22s ease",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        cursor: onClick ? "pointer" : "default",
        position: "relative", overflow: "hidden",
        ...style,
      }}>{children}</div>
  );
};

export const Spin = ({ s = 18, c = T.purple }: any) => (
  <div style={{ width:s, height:s, borderRadius:"50%", border:`2px solid ${c}25`, borderTopColor:c, animation:"spin 0.7s linear infinite", flexShrink:0 }}/>
);

export const Btn = ({ children, onClick, variant = "primary", size = "md", icon, loading, disabled, style, full }: any) => {
  const pad = { sm:"7px 14px", md:"10px 20px", lg:"13px 30px" }[size as 'sm'|'md'|'lg'];
  const fs  = { sm:12, md:13, lg:15 }[size as 'sm'|'md'|'lg'];
  const vs: any = {
    primary:   { background:"var(--grad)", color:"#fff", border:"none", boxShadow:T.shBtn },
    secondary: { background:T.white, color:T.indigo, border:`1.5px solid ${T.border}`, boxShadow:T.sh },
    ghost:     { background:"transparent", color:T.muted, border:"none", boxShadow:"none" },
    yellow:    { background:"var(--grad-y)", color:T.indigo, border:"none", boxShadow:"0 2px 12px rgba(255,200,87,0.35)" },
    danger:    { background:`rgba(239,68,68,0.07)`, color:T.danger, border:`1.5px solid rgba(239,68,68,0.2)` },
    success:   { background:`rgba(16,185,129,0.07)`, color:T.success, border:`1.5px solid rgba(16,185,129,0.2)` },
    outline:   { background:"transparent", color:T.purple, border:`1.5px solid ${T.purple}` },
  };
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled||loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
        padding:pad, borderRadius:12, fontSize:fs, fontWeight:600,
        cursor: disabled||loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition:"all 0.18s ease",
        transform: hov&&!disabled ? "translateY(-1px)" : "translateY(0)",
        width: full ? "100%" : undefined,
        ...vs[variant], ...style,
      }}>
      {loading ? <Spin s={13} c={variant==="primary"||variant==="yellow"?"#fff":T.purple}/> : icon && <IC n={icon} s={13} c={variant==="primary"?"#fff":variant==="yellow"?T.indigo:vs[variant]?.color||"currentColor"}/>}
      {children}
    </button>
  );
};

export const Bar = ({ value, color = T.purple, h = 6, label, sub }: any) => (
  <div style={{ width:"100%" }}>
    {(label||sub!==undefined) && (
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
        {label && <span style={{ color:T.text, fontWeight:500 }}>{label}</span>}
        {sub!==undefined && <span style={{ color:T.muted, fontWeight:600 }}>{sub}%</span>}
      </div>
    )}
    <div style={{ height:h, background:T.subtle, borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(value,100)}%`, background:color, borderRadius:99, animation:"barGrow 0.9s cubic-bezier(0.4,0,0.2,1) both" }}/>
    </div>
  </div>
);

export const Badge = ({ children, color = T.purple }: any) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:99, background:`${color}14`, color, fontSize:12, fontWeight:600, fontFamily:"var(--font-h)", border:`1px solid ${color}22`, whiteSpace:"nowrap" }}>
    {children}
  </span>
);

export const Field = ({ value, onChange, placeholder, onKeyDown, type="text", icon, label, error, autoFocus }: any) => {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ width:"100%" }}>
      {label && <label style={{ display:"block", fontSize:13, fontWeight:600, color:T.text, marginBottom:6 }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {icon && <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><IC n={icon} s={15} c={focused?T.purple:T.faint}/></div>}
        <input
          value={value} onChange={onChange} onKeyDown={onKeyDown}
          placeholder={placeholder} autoFocus={autoFocus}
          type={isPass&&!show?"password":isPass?"text":type}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{
            width:"100%", padding: icon ? "11px 40px 11px 40px" : isPass ? "11px 40px 11px 14px" : "11px 14px",
            borderRadius:12, border:`1.5px solid ${error?T.danger:focused?T.purple:T.border}`,
            background:T.white, color:T.text, fontSize:14, outline:"none",
            transition:"all 0.18s",
            boxShadow: focused ? `0 0 0 3px ${error?"rgba(239,68,68,0.1)":"rgba(108,99,255,0.1)"}` : "none",
          }}
        />
        {isPass && (
          <button type="button" onClick={()=>setShow(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:2 }}>
            <IC n={show?"eyeOff":"eye"} s={15} c={T.faint}/>
          </button>
        )}
      </div>
      {error && <p style={{ fontSize:12, color:T.danger, marginTop:4 }}>{error}</p>}
    </div>
  );
};

export const Empty = ({ icon, title, sub, action }: any) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"64px 24px", textAlign:"center", gap:16 }}>
    <div style={{ width:64, height:64, borderRadius:20, background:"var(--grad-s)", border:`1px solid rgba(108,99,255,0.15)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <IC n={icon} s={26} c={T.purple}/>
    </div>
    <div>
      <p style={{ fontFamily:"var(--font-h)", fontWeight:700, fontSize:17, color:T.text }}>{title}</p>
      <p style={{ fontSize:14, color:T.muted, marginTop:4, maxWidth:320 }}>{sub}</p>
    </div>
    {action}
  </div>
);

export const SectionHead = ({ title, sub, action }: any) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
    <div>
      <h2 style={{ fontFamily:"var(--font-h)", fontSize:20, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>{title}</h2>
      {sub && <p style={{ fontSize:13, color:T.muted, marginTop:3 }}>{sub}</p>}
    </div>
    {action}
  </div>
);

export const Toast = ({ msg, type = "success", onDone }: any) => {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, []);
  const colors: any = { success:T.success, danger:T.danger, warn:T.warn, info:T.purple };
  return (
    <div style={{
      position:"fixed", bottom:28, right:28, zIndex:9999,
      background:T.white, border:`1px solid ${T.border}`,
      borderLeft:`3px solid ${colors[type]}`,
      borderRadius:12, padding:"12px 18px",
      boxShadow:"0 8px 32px rgba(31,41,51,0.12)",
      display:"flex", alignItems:"center", gap:10,
      animation:"fadeUp 0.3s ease",
      maxWidth:340, fontSize:13, fontWeight:500, color:T.text,
    }}>
      <IC n={type==="success"?"check":type==="danger"?"x":"info"} s={15} c={colors[type]}/>
      {msg}
    </div>
  );
};
