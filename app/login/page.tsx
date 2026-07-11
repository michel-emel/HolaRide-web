"use client";
import {useState,useRef,Suspense} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import {Phone,ArrowRight,ChevronLeft,Lock,User,CheckCircle,Car} from "lucide-react";
import {api} from "../lib/api";
import {useAuth} from "../lib/context";

type Flow = "welcome" | "login" | "register";
type Step = "phone"|"otp"|"name";

function LoginForm(){
  const {login}=useAuth();
  const router=useRouter();
  const params=useSearchParams();
  const redirect=params.get("redirect")||"/";
  const defaultFlow=(params.get("mode")==="register"?"register":"welcome") as Flow;

  const [flow,setFlow]=useState<Flow>(defaultFlow);
  const [step,setStep]=useState<Step>("phone");
  const [phone,setPhone]=useState("+237");
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [otp,setOtp]=useState(["","","","","",""]);
  const [devCode,setDevCode]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [timer,setTimer]=useState(0);
  const [pendingToken,setPendingToken]=useState("");

  const refs=[
    useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),
  ];

  function startTimer(){let t=60;setTimer(60);const iv=setInterval(()=>{t--;setTimer(t);if(t<=0)clearInterval(iv);},1000);}
  function resetOtp(){setOtp(["","","","","",""]);setError("");}

  function switchTo(f:Flow){
    setFlow(f); setStep("phone"); resetOtp();
    setPhone("+237"); setFirstName(""); setLastName(""); setDevCode("");
  }

  async function sendOtp(){
    if(flow==="register"&&!firstName.trim()){setError("Enter your first name");return;}
    if(phone.length<8){setError("Enter a valid phone number");return;}
    setError(""); setLoading(true);
    try{
      const body:Record<string,string>={phone_number:phone};
      if(flow==="register"){body.first_name=firstName.trim();if(lastName.trim())body.last_name=lastName.trim();}
      const res=await api.post("/auth/otp/request",body);
      if(res.dev_otp_code) setDevCode(res.dev_otp_code);
      setStep("otp"); startTimer();
    }catch(e:unknown){setError(e instanceof Error?e.message:"Failed to send code");}
    finally{setLoading(false);}
  }

  async function verifyOtp(){
    const code=otp.join("");
    if(code.length<6){setError("Enter all 6 digits");return;}
    setError(""); setLoading(true);
    try{
      const res=await api.post("/auth/otp/verify",{phone_number:phone,code});
      const me=await api.get("/me",res.access_token);
      if(flow==="login"){
        // Login: always go home directly
        login(res.access_token,me); router.push(redirect);
      } else {
        // Register: if name missing ask for it
        if(!me.first_name){setPendingToken(res.access_token);setStep("name");}
        else{login(res.access_token,me);router.push(redirect);}
      }
    }catch(e:unknown){setError(e instanceof Error?e.message:"Invalid code. Try again.");}
    finally{setLoading(false);}
  }

  async function saveName(){
    if(!firstName.trim()){setError("Enter your first name");return;}
    setError(""); setLoading(true);
    try{
      const updated=await api.patch("/me",{first_name:firstName.trim(),last_name:lastName.trim()||undefined},pendingToken);
      const me=await api.get("/me",pendingToken);
      login(pendingToken,{...updated,...me}); router.push(redirect);
    }catch(e:unknown){setError(e instanceof Error?e.message:"Failed to save name");}
    finally{setLoading(false);}
  }

  function handleOtpChange(i:number,v:string){
    if(!/^\d*$/.test(v)) return;
    const n=[...otp];n[i]=v.slice(-1);setOtp(n);setError("");
    if(v&&i<5) refs[i+1].current?.focus();
  }
  function handleOtpKey(i:number,e:React.KeyboardEvent){
    if(e.key==="Backspace"&&!otp[i]&&i>0) refs[i-1].current?.focus();
  }

  // ════════════════════════════════════════════════════
  // WELCOME SCREEN
  // ════════════════════════════════════════════════════
  if(flow==="welcome") return(
    <div style={{minHeight:"calc(100vh - 64px)",display:"flex",alignItems:"center",
      justifyContent:"center",padding:"24px 16px",background:"var(--cream)"}}>
      <div style={{width:"100%",maxWidth:420}}>

        {/* Hero card */}
        <div style={{
          background:"linear-gradient(135deg,var(--green-d),var(--green))",
          borderRadius:24,padding:"40px 32px",textAlign:"center",marginBottom:20,
          boxShadow:"0 20px 60px rgba(27,107,69,.25)",
        }}>
          <div style={{width:72,height:72,borderRadius:20,
            background:"rgba(255,255,255,.15)",border:"2px solid rgba(255,255,255,.25)",
            display:"flex",alignItems:"center",justifyContent:"center",
            margin:"0 auto 20px",fontSize:"2rem"}}>
            🚗
          </div>
          <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:900,
            fontSize:"2rem",color:"#fff",marginBottom:6,letterSpacing:"-.5px"}}>
            HolaRide
          </div>
          <p style={{color:"rgba(255,255,255,.75)",fontSize:"1rem",lineHeight:1.5,margin:0}}>
            Travel between cities, together.<br/>
            <span style={{fontSize:".85rem",opacity:.7}}>Cameroon's intercity rideshare.</span>
          </p>

          {/* Features */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:24}}>
            {[["🛡️","Verified drivers"],["💰","Best prices"],["📍","Live tracking"],["⭐","Rated trips"]].map(([icon,label])=>(
              <div key={label} style={{background:"rgba(255,255,255,.12)",
                borderRadius:12,padding:"10px 12px",fontSize:".78rem",
                color:"rgba(255,255,255,.85)",fontWeight:600}}>
                {icon} {label}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="card card-p" style={{borderRadius:20}}>
          <button onClick={()=>switchTo("register")}
            className="btn btn-primary btn-block btn-lg"
            style={{marginBottom:12,borderRadius:14}}>
            Create an account
          </button>
          <button onClick={()=>switchTo("login")}
            className="btn btn-block btn-lg"
            style={{background:"var(--cream)",color:"var(--green)",
              border:"1.5px solid var(--green)",borderRadius:14}}>
            Sign in
          </button>
          <p className="text-xs text-muted text-center mt-4">
            🔒 Your data is private and never shared.
          </p>
        </div>

      </div>
    </div>
  );

  // ════════════════════════════════════════════════════
  // LOGIN / REGISTER SCREENS
  // ════════════════════════════════════════════════════
  const isLogin=flow==="login";

  return(
    <div style={{minHeight:"calc(100vh - 64px)",display:"flex",alignItems:"center",
      justifyContent:"center",padding:"24px 16px",background:"var(--cream)"}}>
      <div style={{width:"100%",maxWidth:440}}>

        {/* Back */}
        <button onClick={()=>{
          if(step==="otp") setStep("phone");
          else if(step==="name") setStep("otp");
          else{setFlow("welcome");setStep("phone");}
          resetOtp();
        }} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",
          cursor:"pointer",color:"var(--muted)",fontSize:".875rem",marginBottom:20,padding:0}}>
          <ChevronLeft size={16}/>Back
        </button>

        <div className="card card-p" style={{borderRadius:20}}>

          {/* Header */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:16,background:"var(--green)",
              display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
              {step==="otp"?<Lock size={22} color="#fff"/>:
               step==="name"?<User size={22} color="#fff"/>:
               <Phone size={22} color="#fff"/>}
            </div>
            <h2 style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.3rem",
              marginBottom:4,color:"var(--dark)"}}>
              {step==="phone"&&(isLogin?"Sign in":"Create your account")}
              {step==="otp"&&"Verify your number"}
              {step==="name"&&"What's your name?"}
            </h2>
            <p className="text-muted text-sm">
              {step==="phone"&&(isLogin
                ?"Enter your Cameroon phone number."
                :"Enter your name and phone number.")}
              {step==="otp"&&<>Code sent to <strong>{phone}</strong>. Check your SMS.</>}
              {step==="name"&&"It'll be shown on your profile and trips."}
            </p>
          </div>

          {/* ── PHONE STEP ── */}
          {step==="phone"&&(
            <>
              {/* Register: name fields */}
              {!isLogin&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
                  <div className="field">
                    <label className="label">First name *</label>
                    <input className="input" type="text" placeholder="Michel" autoFocus
                      value={firstName} onChange={e=>{setFirstName(e.target.value);setError("");}}/>
                  </div>
                  <div className="field">
                    <label className="label" style={{display:"flex",gap:4}}>
                      Last name <span className="text-xs text-muted">(optional)</span>
                    </label>
                    <input className="input" type="text" placeholder="Dupont"
                      value={lastName} onChange={e=>setLastName(e.target.value)}/>
                  </div>
                </div>
              )}

              {/* Phone */}
              <div className="field">
                <label className="label">Phone number</label>
                <div className="input-group">
                  <Phone size={15} className="icon"/>
                  <input className="input" type="tel" placeholder="+237 6XX XXX XXX"
                    value={phone} autoFocus={isLogin}
                    onChange={e=>{setPhone(e.target.value);setError("");}}
                    onKeyDown={e=>e.key==="Enter"&&sendOtp()}
                    style={{paddingLeft:38}}/>
                </div>
                <div className="text-xs text-muted mt-1">Cameroon number, e.g. +237 670 000 000</div>
              </div>

              {error&&<div className="alert alert-danger mb-4">{error}</div>}

              <button onClick={sendOtp}
                disabled={loading||phone.length<8||(!isLogin&&!firstName.trim())}
                className="btn btn-primary btn-block btn-lg" style={{marginBottom:16}}>
                {loading?<><div className="spinner"/>Sending code...</>:<>Continue <ArrowRight size={15}/></>}
              </button>

              {/* Switch flow */}
              <div style={{textAlign:"center",padding:"12px 0",borderTop:"1px solid var(--border)"}}>
                {isLogin?(
                  <span className="text-sm text-muted">
                    No account?{" "}
                    <button onClick={()=>switchTo("register")}
                      style={{background:"none",border:"none",cursor:"pointer",
                        color:"var(--green)",fontWeight:700,fontSize:".875rem"}}>
                      Create one
                    </button>
                  </span>
                ):(
                  <span className="text-sm text-muted">
                    Already have an account?{" "}
                    <button onClick={()=>switchTo("login")}
                      style={{background:"none",border:"none",cursor:"pointer",
                        color:"var(--green)",fontWeight:700,fontSize:".875rem"}}>
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </>
          )}

          {/* ── OTP STEP ── */}
          {step==="otp"&&(
            <>
              {devCode&&(
                <div style={{background:"#0F3D26",borderRadius:12,padding:"10px 14px",
                  marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:".7rem",color:"#4ade80",fontWeight:700,
                    textTransform:"uppercase",letterSpacing:".06em",flexShrink:0}}>Dev code</span>
                  <span style={{fontFamily:"monospace",fontWeight:800,
                    fontSize:"1.25rem",color:"#4ade80",letterSpacing:".12em"}}>{devCode}</span>
                </div>
              )}

              <div className="field">
                <label className="label">6-digit verification code</label>
                <div className="otp-grid">
                  {otp.map((v,i)=>(
                    <input key={i} ref={refs[i]} className="otp-box" type="text"
                      inputMode="numeric" maxLength={1} value={v} autoFocus={i===0}
                      onChange={e=>handleOtpChange(i,e.target.value)}
                      onKeyDown={e=>handleOtpKey(i,e)}
                      style={{borderColor:error?"var(--danger)":v?"var(--green)":undefined}}/>
                  ))}
                </div>
              </div>

              {error&&<div className="alert alert-danger mb-4">{error}</div>}

              <button onClick={verifyOtp}
                disabled={loading||otp.join("").length<6}
                className="btn btn-primary btn-block btn-lg" style={{marginBottom:16}}>
                {loading?<><div className="spinner"/>Verifying...</>:
                  isLogin?"Sign in":"Verify & create account"}
              </button>

              <div style={{textAlign:"center",fontSize:".875rem"}}>
                {timer>0
                  ?<span className="text-muted">Resend code in <strong>{timer}s</strong></span>
                  :<button onClick={()=>{setStep("phone");resetOtp();}}
                    style={{background:"none",border:"none",cursor:"pointer",
                      color:"var(--green)",fontWeight:700}}>
                    ← Change details & resend
                  </button>}
              </div>
            </>
          )}

          {/* ── NAME STEP (register fallback) ── */}
          {step==="name"&&(
            <>
              <div style={{background:"var(--green-p)",borderRadius:"var(--r)",
                padding:"11px 14px",marginBottom:20,display:"flex",alignItems:"center",gap:8}}>
                <CheckCircle size={15} color="var(--green)"/>
                <span style={{fontSize:".85rem",color:"var(--green)",fontWeight:600}}>
                  Phone verified! Just your name.
                </span>
              </div>
              <div className="field">
                <label className="label">First name *</label>
                <input className="input" type="text" placeholder="Michel" autoFocus
                  value={firstName} onChange={e=>{setFirstName(e.target.value);setError("");}}
                  onKeyDown={e=>e.key==="Enter"&&saveName()}/>
              </div>
              <div className="field">
                <label className="label" style={{display:"flex",gap:4}}>
                  Last name <span className="text-xs text-muted">(optional)</span>
                </label>
                <input className="input" type="text" placeholder="Dupont"
                  value={lastName} onChange={e=>setLastName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveName()}/>
              </div>
              {error&&<div className="alert alert-danger mb-4">{error}</div>}
              <button onClick={saveName} disabled={loading||!firstName.trim()}
                className="btn btn-primary btn-block btn-lg">
                {loading?<><div className="spinner"/>Saving...</>:<>Get started <ArrowRight size={15}/></>}
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-muted text-center mt-4">
          🔒 Your data is private and never shared with third parties.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage(){
  return(
    <Suspense fallback={<div style={{textAlign:"center",padding:"80px 0"}}>
      <div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>}>
      <LoginForm/>
    </Suspense>
  );
}