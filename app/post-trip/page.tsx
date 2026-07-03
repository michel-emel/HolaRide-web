"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ChevronLeft,CheckCircle,AlertCircle,Info} from "lucide-react";
import {api,fmt} from "../lib/api";
import {useAuth} from "../lib/context";

interface Loc{id:string;name:string;city_name:string;}
interface Vehicle{id:string;make:string;model:string;plate_number:string;verification_status:string;total_seats:number;}

export default function PostTripPage(){
  const router=useRouter();
  const {user,token,isDriver}=useAuth();
  const [locs,setLocs]=useState<Loc[]>([]);
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);
  const [preview,setPreview]=useState<{price_per_seat:number}|null>(null);
  const [loading,setLoading]=useState(true);
  const [submitting,setSubmitting]=useState(false);
  const [success,setSuccess]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState({vehicle_id:"",departure_location_id:"",destination_location_id:"",departure_date:"",departure_time:"",available_seats:1});

  useEffect(()=>{
    if(!user){router.push("/login?redirect=/post-trip");return;}
    Promise.all([api.get("/locations",token).catch(()=>[]),api.get("/drivers/vehicles",token).catch(()=>[])]).then(([l,v])=>{
      setLocs(Array.isArray(l)?l:l.locations||[]);
      setVehicles((Array.isArray(v)?v:v.vehicles||[]).filter((x:Vehicle)=>x.verification_status==="approved"));
    }).finally(()=>setLoading(false));
  },[user]);

  useEffect(()=>{
    if(form.vehicle_id&&form.departure_location_id&&form.destination_location_id){
      const p=new URLSearchParams({vehicle_id:form.vehicle_id,departure_location_id:form.departure_location_id,destination_location_id:form.destination_location_id});
      api.get(`/trips/price-preview?${p}`,token).then(setPreview).catch(()=>setPreview(null));
    }else setPreview(null);
  },[form.vehicle_id,form.departure_location_id,form.destination_location_id]);

  const set=(k:string,v:string|number)=>setForm(f=>({...f,[k]:v}));
  const selVeh=vehicles.find(v=>v.id===form.vehicle_id);
  const depLoc=locs.find(l=>l.id===form.departure_location_id);
  const destLoc=locs.find(l=>l.id===form.destination_location_id);

  async function submit(e:React.FormEvent){
    e.preventDefault();setError("");setSubmitting(true);
    try{await api.post("/trips",form,token);setSuccess(true);}
    catch(e:unknown){setError(e instanceof Error?e.message:"Failed to create trip");}
    finally{setSubmitting(false);}
  }

  if(loading) return <div style={{textAlign:"center",padding:"80px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>;

  if(!isDriver&&!loading) return(
    <div className="page" style={{textAlign:"center",maxWidth:500,margin:"0 auto",padding:"80px 24px"}}>
      <div style={{fontSize:"3rem",marginBottom:16}}>🚗</div>
      <h2 className="h2 mb-3">Driver account required</h2>
      <p className="lead mb-6">You need a driver account with an approved vehicle to post trips. Contact admin to get your vehicle verified.</p>
      <Link href="/" className="btn btn-primary">Back to home</Link>
    </div>
  );

  if(success) return(
    <div className="page" style={{textAlign:"center",maxWidth:500,margin:"0 auto",padding:"80px 24px"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"var(--green-p)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",color:"var(--green)"}}><CheckCircle size={40}/></div>
      <h2 className="h2 mb-3">Trip published!</h2>
      <p className="lead mb-6">Your trip is now visible to passengers. You'll get notified when someone books a seat.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/my-trips" className="btn btn-primary btn-lg">View my trips</Link>
        <button onClick={()=>setSuccess(false)} className="btn btn-outline btn-lg">Post another trip</button>
      </div>
    </div>
  );

  return(
    <div className="page" style={{maxWidth:800}}>
      <button onClick={()=>router.back()} className="flex items-center gap-2 text-sm text-muted mb-6 btn btn-ghost btn-sm" style={{paddingLeft:0}}>
        <ChevronLeft size={16}/>Back
      </button>
      <div className="page-header">
        <div><h1 className="h2 mb-1">Post a new trip</h1><p className="text-muted text-sm">Fill in the details to publish your trip for passengers</p></div>
      </div>

      {vehicles.length===0&&(
        <div className="alert alert-warn mb-6"><AlertCircle size={16} style={{flexShrink:0}}/><div><strong>No approved vehicle found.</strong> You need an admin-approved vehicle to post trips. Please register your vehicle and wait for approval.</div></div>
      )}

      <form onSubmit={submit}>
        <div className="grid-2" style={{gap:24}}>
          <div>
            {/* Vehicle */}
            <div className="card card-p mb-4">
              <h3 className="h4 mb-4">Vehicle</h3>
              <div className="field" style={{marginBottom:0}}>
                <label className="label">Select your vehicle</label>
                <select required className="select" value={form.vehicle_id} onChange={e=>set("vehicle_id",e.target.value)}>
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map(v=><option key={v.id} value={v.id}>{v.make} {v.model} — {v.plate_number} ({v.total_seats} seats)</option>)}
                </select>
              </div>
            </div>

            {/* Route */}
            <div className="card card-p mb-4">
              <h3 className="h4 mb-4">Route</h3>
              <div className="field">
                <label className="label">🟢 Departure point</label>
                <select required className="select" value={form.departure_location_id} onChange={e=>set("departure_location_id",e.target.value)}>
                  <option value="">Select departure...</option>
                  {locs.map(l=><option key={l.id} value={l.id}>{l.city_name} — {l.name}</option>)}
                </select>
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label className="label">🟡 Destination point</label>
                <select required className="select" value={form.destination_location_id} onChange={e=>set("destination_location_id",e.target.value)}>
                  <option value="">Select destination...</option>
                  {locs.filter(l=>l.id!==form.departure_location_id).map(l=><option key={l.id} value={l.id}>{l.city_name} — {l.name}</option>)}
                </select>
              </div>
              {preview&&(
                <div className="alert alert-success mt-4" style={{fontSize:".85rem"}}>
                  <Info size={15} style={{flexShrink:0}}/>Admin-set price: <strong>{fmt(preview.price_per_seat)} per seat</strong>
                </div>
              )}
            </div>
          </div>

          <div>
            {/* Date & Time */}
            <div className="card card-p mb-4">
              <h3 className="h4 mb-4">Date & time</h3>
              <div className="field">
                <label className="label">Departure date</label>
                <input required type="date" className="input" min={new Date().toISOString().split("T")[0]}
                  value={form.departure_date} onChange={e=>set("departure_date",e.target.value)}/>
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label className="label">Departure time</label>
                <input required type="time" className="input" value={form.departure_time} onChange={e=>set("departure_time",e.target.value)}/>
              </div>
            </div>

            {/* Seats */}
            <div className="card card-p mb-4">
              <h3 className="h4 mb-4">Available seats</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted">Seats for passengers</div>
                  {selVeh&&<div className="text-xs text-muted mt-1">Max: {selVeh.total_seats} (vehicle capacity)</div>}
                </div>
                <div className="stepper">
                  <button type="button" className="step-btn" onClick={()=>set("available_seats",Math.max(1,form.available_seats-1))}>−</button>
                  <span className="step-val">{form.available_seats}</span>
                  <button type="button" className="step-btn" onClick={()=>set("available_seats",Math.min(selVeh?.total_seats||8,form.available_seats+1))}>+</button>
                </div>
              </div>
            </div>

            {/* Summary */}
            {form.departure_date&&form.departure_time&&depLoc&&destLoc&&(
              <div className="card card-p mb-4" style={{border:"2px solid var(--green-p)",background:"var(--green-p)"}}>
                <div className="text-xs text-muted font-bold mb-3" style={{textTransform:"uppercase",letterSpacing:".06em",color:"var(--green)"}}>Trip summary</div>
                <div className="route-wrap">
                  <div className="route-line"><div className="dot-start"/><div className="line-mid"/><div className="dot-end"/></div>
                  <div className="route-text">
                    <div><div style={{fontWeight:700}}>{depLoc.city_name}</div><div className="text-xs text-muted">{depLoc.name}</div></div>
                    <div style={{height:10}}/>
                    <div><div style={{fontWeight:700}}>{destLoc.city_name}</div><div className="text-xs text-muted">{destLoc.name}</div></div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {preview&&<div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,color:"var(--green)",fontSize:"1.1rem"}}>{fmt(preview.price_per_seat)}</div>}
                    <div className="text-xs text-muted">{form.available_seats} seats</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error&&<div className="alert alert-danger mb-4"><AlertCircle size={15}/>{error}</div>}

        <button type="submit" disabled={submitting||vehicles.length===0} className="btn btn-primary btn-lg" style={{marginTop:8}}>
          {submitting?<><div className="spinner"/>Publishing...</>:"Publish trip"}
        </button>
      </form>
    </div>
  );
}