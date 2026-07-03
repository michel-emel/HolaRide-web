"use client";
import {useState,useRef} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {Suspense} from "react";
import {Phone,ArrowRight,ChevronLeft,Lock} from "lucide-react";
import {api} from "../lib/api";
import {useAuth} from "../lib/context";

function LoginForm(){
  const {login}=useAuth();
  const router=useRouter();
  const params=useSearchParams();
  const redirect=params.get("redirect")||"/";
  const [step,setStep]=useState<"phone"|"otp">("phone");
  const [phone,setPhone]=useState("+237");
  const [otp,setOtp]=useState(["","","","","",""]);
  const [devCode,setDevCode]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [timer,setTimer]=useState(0);
  const refs=[useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null)];

  async function requestOtp(){
    setError("");setLoading(true);
    try{
      const res=await api.post("/auth/otp/request",{phone_number:phone});
      if(res.dev_otp_code) setDevCode(res.dev_otp_code);
      setStep("otp");
      let t=60;setTimer(60);
      const iv=setInterval(()=>{t--;setTimer(t);if(t<=0)clearInterval(iv);},1000);
    }catch(e:unknown){setError(e instanceof Error?e.message:"Failed to send code");}
    finally{setLoading(false);}
  }

  async function verifyOtp(){
    const code=otp.join("");
    if(code.length<6){setError("Enter all 6 digits");return;}
    setError("");setLoading(true);
    try{
      const res=await api.post("/auth/otp/verify",{phone_number:phone,code});
      const me=await api.get("/me",res.access_token);
      login(res.access_token,me);
      router.push(redirect);
    }catch(e:unknown){setError(e instanceof Error?e.message:"Invalid code. Try again.");}
    finally{setLoading(false);}
  }

  function handleOtpKey(i:number,e:React.KeyboardEvent<HTMLInputElement>){
    if(e.key==="Backspace"&&!otp[i]&&i>0) refs[i-1].current?.focus();
  }
  function handleOtpChange(i:number,v:string){
    if(!/^\d*$/.test(v)) return;
    const n=[...otp];n[i]=v.slice(-1);setOtp(n);setError("");
    if(v&&i<5) refs[i+1].current?.focus();
  }

  return(
    <div style={{minHeight:"calc(100vh - 64px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px",background:"var(--cream)"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div className="card card-p">
          {/* Header */}
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{width:64,height:64,borderRadius:20,background:"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              {step==="phone"?<Phone size={28} color="#fff"/>:<Lock size={28} color="#fff"/>}
            </div>
            <h1 className="h2 mb-2">{step==="phone"?"Sign in to HolaRide":"Enter your code"}</h1>
            <p className="text-muted text-sm">
              {step==="phone"?"We\'ll send a 6-digit verification code to your phone.":`Code sent to ${phone}`}
            </p>
          </div>

          {step==="phone"?(
            <>
              <div className="field">
                <label className="label">Phone number</label>
                <div className="input-group">
                  <Phone size={16} className="icon"/>
                  <input className="input" type="tel" placeholder="+237 6XX XXX XXX"
                    value={phone} onChange={e=>setPhone(e.target.value)} autoFocus
                    onKeyDown={e=>e.key==="Enter"&&requestOtp()}
                    style={{paddingLeft:40}}/>
                </div>
              </div>
              {error&&<div className="alert alert-danger mb-4">{error}</div>}
              <button onClick={requestOtp} disabled={loading||phone.length<8} className="btn btn-primary btn-block btn-lg">
                {loading?<><div className="spinner"/>Sending...</>:<>Continue <ArrowRight size={16}/></>}
              </button>
              <p className="text-xs text-muted text-center mt-4">By continuing, you agree to HolaRide's Terms of Service. Your data is kept private and never shared.</p>
            </>
          ):(
            <>
              <button onClick={()=>setStep("phone")} className="flex items-center gap-2 text-sm text-muted mb-4" style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                <ChevronLeft size={16}/>Change number
              </button>
              {devCode&&(
                <div style={{background:"#0F3D26",borderRadius:12,padding:"10px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:".75rem",color:"#4ade80",fontWeight:700,flexShrink:0}}>DEV CODE</span>
                  <span style={{fontFamily:"monospace",fontWeight:800,fontSize:"1.2rem",color:"#4ade80",letterSpacing:".1em"}}>{devCode}</span>
                </div>
              )}
              <div className="field">
                <label className="label">6-digit code</label>
                <div className="otp-grid">
                  {otp.map((v,i)=>(
                    <input key={i} ref={refs[i]} className="otp-box" type="text" inputMode="numeric" maxLength={1} value={v}
                      onChange={e=>handleOtpChange(i,e.target.value)}
                      onKeyDown={e=>handleOtpKey(i,e)}
                      style={{borderColor:error?"var(--danger)":v?"var(--green)":undefined}}
                    />
                  ))}
                </div>
              </div>
              {error&&<div className="alert alert-danger mb-4">{error}</div>}
              <button onClick={verifyOtp} disabled={loading||otp.join("").length<6} className="btn btn-primary btn-block btn-lg mb-4">
                {loading?<><div className="spinner"/>Verifying...</>:"Verify & sign in"}
              </button>
              <div style={{textAlign:"center"}}>
                {timer>0?(
                  <span className="text-sm text-muted">Resend in {timer}s</span>
                ):(
                  <button onClick={requestOtp} className="text-sm font-bold" style={{background:"none",border:"none",cursor:"pointer",color:"var(--green)"}}>Resend code</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage(){
  return <Suspense><LoginForm/></Suspense>;
}