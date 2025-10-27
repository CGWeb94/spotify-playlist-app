import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PasswordGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | ok | login
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    axios.get("/api/verify").then((r) => {
      if (!mounted) return;
      if (r.data && r.data.ok) setStatus("ok");
      else setStatus("login");
    }).catch(() => {
      if (!mounted) return;
      setStatus("login");
    });
    return () => (mounted = false);
  }, []);

  const submit = async (e) => {
    e?.preventDefault();
    setErr("");
    try {
      const res = await axios.post("/api/login", { password });
      if (res.data && res.data.ok) setStatus("ok");
      else setErr("Ungültiges Passwort");
    } catch (e) {
      setErr("Ungültiges Passwort");
    }
  };

  if (status === "checking") {
    return (
      <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>
        Prüfe Zugang…
      </div>
    );
  }
  if (status === "ok") return children;

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:420,background:"#121212",padding:24,borderRadius:10,color:"#fff",boxShadow:"0 8px 30px rgba(0,0,0,0.6)"}}>
        <h3>Passwort</h3>
        <p style={{color:"#ccc"}}>Bitte Passwort eingeben, um die App zu sehen.</p>
        <form onSubmit={submit}>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Passwort" style={{width:"100%",padding:8,borderRadius:6,marginBottom:8}} />
          <div style={{display:"flex",gap:8}}>
            <button type="submit" className="btn btn-primary">Anmelden</button>
            <button type="button" className="btn" onClick={()=>{setPassword(""); setErr("");}}>Zurücksetzen</button>
          </div>
        </form>
        {err && <div style={{color:"#f66",marginTop:8}}>{err}</div>}
      </div>
    </div>
  );
}