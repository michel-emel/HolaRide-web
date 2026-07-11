"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ChevronLeft,Car,CheckCircle,AlertCircle} from "lucide-react";
import {api} from "../lib/api";
import {useAuth} from "../lib/context";

export default function RegisterVehiclePage(){
  const {user,token}=useAuth();
  const router=useRouter();
  const [submitting,setSubmitting]=useState(false);
  const [success,setSuccess]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState({
    make:"",model:"",year:"",plate_number:"",total_seats:"4",color:""
  });

  useEffect(()=>{if(!user) router.push("/login?redirect=/register-vehicle");},[user]);

  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setError("");setSubmitting(true);
    try{
      await api.post("/drivers/vehicle",{
        make:form.make,model:form.model,
        year:parseInt(form.year),
        plate_number:form.plate_number,
        total_seats:parseInt(form.total_seats),
        color:form.color||undefined,
      },token);
      setSuccess(true);
    }catch(e:unknown){setError(e instanceof Error?e.message:"Failed to submit vehicle");}
    finally{setSubmitting(false);}
  }

  if(success) return(
    <div className="page" style={{textAlign:"center",maxWidth:500,margin:"0 auto",padding:"80px 24px"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"var(--green-p)",
        display:"flex",alignItems:"center",justifyContent:"center",
        margin:"0 auto 24px",color:"var(--green)"}}>
        <CheckCircle size={40}/>
      </div>
      <h2 className="h2 mb-3">Vehicle submitted!</h2>
      <p className="lead mb-2" style={{fontSize:".95rem"}}>
        Your vehicle is now pending admin approval.
      </p>
      <p className="text-muted text-sm mb-8">
        You'll receive a notification once your vehicle is approved. Once approved, you can post trips and switch to driver mode.
      </p>
      <Link href="/profile" className="btn btn-primary btn-lg">Back to profile</Link>
    </div>
  );

  return(
    <div className="page" style={{maxWidth:640}}>
      <button onClick={()=>router.back()}
        className="flex items-center gap-2 text-sm text-muted mb-6 btn btn-ghost btn-sm"
        style={{paddingLeft:0}}>
        <ChevronLeft size={16}/>Back
      </button>

      <div className="page-header">
        <div>
          <h1 className="h2 mb-1">Register your vehicle</h1>
          <p className="text-muted text-sm">Submit your vehicle details for admin review. Once approved, you can start posting trips.</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="alert alert-info mb-6" style={{borderRadius:"var(--r-lg)"}}>
        <AlertCircle size={16} style={{flexShrink:0}}/>
        <div>
          <strong>How it works:</strong> submit your vehicle details → admin reviews and approves →
          your account becomes a driver account → you can post trips and switch to driver mode.
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="card card-p mb-4">
          <h3 className="h4 mb-4">Vehicle details</h3>

          <div className="grid-2" style={{gap:16,marginBottom:16}}>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">Make (brand) *</label>
              <input required className="input" placeholder="e.g. Toyota"
                value={form.make} onChange={e=>set("make",e.target.value)}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">Model *</label>
              <input required className="input" placeholder="e.g. Corolla"
                value={form.model} onChange={e=>set("model",e.target.value)}/>
            </div>
          </div>

          <div className="grid-2" style={{gap:16,marginBottom:16}}>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">Year *</label>
              <input required className="input" type="number" placeholder="e.g. 2019"
                min="2000" max={new Date().getFullYear()}
                value={form.year} onChange={e=>set("year",e.target.value)}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">Color</label>
              <input className="input" placeholder="e.g. Silver"
                value={form.color} onChange={e=>set("color",e.target.value)}/>
            </div>
          </div>

          <div className="grid-2" style={{gap:16}}>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">Plate number *</label>
              <input required className="input" placeholder="e.g. LT 1234 A"
                value={form.plate_number} onChange={e=>set("plate_number",e.target.value.toUpperCase())}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">Total seats *</label>
              <select required className="select"
                value={form.total_seats} onChange={e=>set("total_seats",e.target.value)}>
                {[3,4,5,6,7,8,9,10,12,14,18].map(n=>(
                  <option key={n} value={n}>{n} seats</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error&&(
          <div className="alert alert-danger mb-4">
            <AlertCircle size={15}/>{error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
          {submitting?<><div className="spinner"/>Submitting...</>:<><Car size={16}/>Submit for approval</>}
        </button>
      </form>
    </div>
  );
}