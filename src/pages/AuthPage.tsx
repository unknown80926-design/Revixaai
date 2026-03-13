import React, { useState } from 'react';
import { Card, Btn, Field, T } from '../components/UI';
import { IC } from '../components/Icons';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { store } from '../lib/db';

export const AuthPage = ({ onAuth }: any) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userData = {
        name: user.displayName || 'User',
        email: user.email || '',
        createdAt: Date.now()
      };
      
      await store.setUser(user.uid, userData);
      onAuth({ id: user.uid, ...userData });
    } catch (e: any) {
      setErr(e.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        {/* LOGO */}
        <div style={{ textAlign:"center", marginBottom:40 }} className="fu">
          <div style={{ width:52, height:52, borderRadius:16, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:T.shBtn }}>
            <IC n="brain" s={24} c="#fff"/>
          </div>
          <h1 style={{ fontFamily:"var(--font-h)", fontSize:24, fontWeight:800, color:T.indigo }}>
            Revixa <span style={{ color:T.purple }}>AI</span>
          </h1>
          <p style={{ fontSize:14, color:T.muted, marginTop:4 }}>Turn any study material into mastery.</p>
        </div>

        <Card style={{ padding:36 }} className="fu">
          <h2 style={{ fontFamily:"var(--font-h)", fontSize:18, fontWeight:700, color:T.text, marginBottom:6 }}>
            Welcome
          </h2>
          <p style={{ fontSize:13, color:T.muted, marginBottom:28 }}>
            Sign in to continue your learning journey.
          </p>

          {err && <p style={{ fontSize:12, color:T.danger, marginBottom:16 }}>{err}</p>}

          <Btn variant="primary" onClick={submit} loading={loading} full style={{ marginTop:24 }}>
            Sign In with Google
          </Btn>
        </Card>
      </div>
    </div>
  );
};
