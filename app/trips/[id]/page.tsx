"use client";
import {useState,useEffect} from "react";
import {useParams,useRouter} from "next/navigation";
import Link from "next/link";
import {Star,Users,Calendar,MapPin,Car,ChevronLeft,CheckCircle,MessageCircle} from "lucide-react";
import {api,fmt,fmtDate,fmtTime} from "../../lib/api";
import {useAuth} from "../../lib/context";

interface Trip{id:string;origin_city:string;destination_city:string;origin_location:string;destination_location:string;departure_time:string;price_per_seat:number;available_seats:number;driver_name:string;driver_rating_average?:number|null;driver_rating_count:number;vehicle_label:string;status:string;}

export default function TripDetailPage(){
  const {id}=useParams<{id:string}>();
  const router=useRouter();
  const {user,token}=useAuth();
  const [trip,setTrip]=useState<Trip|null>(null);
  const [loading,setLoading]=useState(true);
  const [seats,setSeats]=useState(1);
  const [payOpt,setPayOpt]=useState<"full"|"partial">("full");
  const [booking,setBooking]=useState(false);
  const [success,setSuccess]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    api.get(`/trips/${id}`).then(setTrip).catch(()=>router.push("/search")).finally(()=>setLoading(false));
  },[id]);

  async function book(){
    if(!user){router.push(`/login?redirect=/trips/${id}`);return;}
    setError("");setBooking(true);
    try{
      await api.post("/bookings",{trip_id:id,seats_booked:seats,payment_type:payOpt==="partial"?"partial_80":"full"},token);
      setSuccess(true);
    }catch(e:unknown){setError(e instanceof Error?e.message:"Booking failed. Please try again.");}
    finally{setBooking(false);}
  }

  if(loading) return <div style={{display:"flex",justifyContent:"center",padding:"80px 0"}}><div className="spinner spinner-g"/></div>;
  if(!trip) return null;

  const total=trip.price_per_seat*seats;
  const dueNow=payOpt==="partial"?Math.round(total*.8):total;
  const remaining=total-dueNow;

  if(success) return(
    <div className="page" style={{textAlign:"center",padding:"80px 24px"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"var(--green-p)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",color:"var(--green)"}}><CheckCircle size={40}/></div>
      <h2 className="h2 mb-3">Booking request sent!</h2>
      <p className="lead mb-2">Your request was sent to <strong>{trip.driver_name}</strong>.</p>
      <p className="text-muted text-sm mb-8">You'll be notified once the driver responds. Payment is collected only after acceptance.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/my-bookings" className="btn btn-primary btn-lg">View my bookings</Link>
        <Link href={`/chat/${trip.id}`} className="btn btn-secondary btn-lg flex items-center gap-2"><MessageCircle size={16}/>Open chat</Link>
        <Link href="/search" className="btn btn-ghost btn-lg">Find more trips</Link>
      </div>
    </div>
  );

  return(
    <div className="page">
      <button onClick={()=>router.back()} className="flex items-center gap-2 text-sm text-muted mb-6 btn btn-ghost btn-sm" style={{paddingLeft:0}}>
        <ChevronLeft size={16}/>Back to search
      </button>

      <div className="sidebar-layout">
        {/* Left: trip info */}
        <div style={{order:1}}>
          {/* Driver */}
          <div className="card card-p mb-4">
            <h3 className="h4 mb-4" style={{paddingBottom:12,borderBottom:"1px solid var(--border)"}}>Driver</h3>
            <div className="flex items-center gap-3">
              <div className="avatar" style={{width:56,height:56,fontSize:"1.25rem"}}>{trip.driver_name[0]?.toUpperCase()||"?"}</div>
              <div>
                <div style={{fontWeight:700,fontSize:"1rem"}}>{trip.driver_name}</div>
                {trip.driver_rating_count>0&&(
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="flex items-center gap-1"><Star size={14} fill="var(--gold)" color="var(--gold)"/><strong>{trip.driver_rating_average?.toFixed(1)}</strong></span>
                    <span className="text-muted">({trip.driver_rating_count} rating{trip.driver_rating_count!==1?"s":""})</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-muted mt-1"><Car size={13}/>{trip.vehicle_label}</div>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="card card-p mb-4">
            <h3 className="h4 mb-4" style={{paddingBottom:12,borderBottom:"1px solid var(--border)"}}>Trip details</h3>
            <div className="route-wrap mb-4">
              <div className="route-line"><div className="dot-start"/><div className="line-mid"/><div className="dot-end"/></div>
              <div className="route-text">
                <div style={{marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:"1.05rem"}}>{trip.origin_city}</div>
                  <div className="flex items-center gap-1 text-sm text-muted mt-1"><MapPin size={13}/>{trip.origin_location}</div>
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:"1.05rem"}}>{trip.destination_city}</div>
                  <div className="flex items-center gap-1 text-sm text-muted mt-1"><MapPin size={13}/>{trip.destination_location}</div>
                </div>
              </div>
            </div>
            <div className="grid-2" style={{gap:12}}>
              <div style={{background:"var(--cream)",borderRadius:"var(--r)",padding:"12px 14px"}}>
                <div className="text-xs text-muted mb-1 flex items-center gap-1"><Calendar size={11}/>Departure</div>
                <div style={{fontWeight:700,fontSize:".9rem"}}>{fmtDate(trip.departure_time)}</div>
                <div style={{color:"var(--green)",fontWeight:600,fontSize:".875rem"}}>{fmtTime(trip.departure_time)}</div>
              </div>
              <div style={{background:"var(--cream)",borderRadius:"var(--r)",padding:"12px 14px"}}>
                <div className="text-xs text-muted mb-1 flex items-center gap-1"><Users size={11}/>Seats available</div>
                <div style={{fontWeight:700,fontSize:"1.25rem",color:"var(--green)"}}>{trip.available_seats}</div>
                <div className="text-xs text-muted">seats left</div>
              </div>
            </div>
          </div>

          {/* Price info */}
          <div className="card card-p">
            <h3 className="h4 mb-3">Price</h3>
            <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:900,fontSize:"2rem",color:"var(--green)",marginBottom:4}}>{fmt(trip.price_per_seat)}</div>
            <div className="text-sm text-muted">per seat · set by admin based on route</div>
          </div>
        </div>

        {/* Right: booking widget */}
        <div style={{order:2}}>
          <div className="card card-p sticky-sidebar">
            <h3 className="h4 mb-4">Book this trip</h3>

            {/* Seats */}
            <div className="field">
              <label className="label">Number of seats</label>
              <div className="flex items-center gap-3">
                <div className="stepper">
                  <button type="button" className="step-btn" onClick={()=>setSeats(s=>Math.max(1,s-1))}>−</button>
                  <span className="step-val">{seats}</span>
                  <button type="button" className="step-btn" onClick={()=>setSeats(s=>Math.min(trip.available_seats,s+1))}>+</button>
                </div>
                <span className="text-sm text-muted">Max {trip.available_seats}</span>
              </div>
            </div>

            {/* Payment option */}
            <div className="field">
              <label className="label">Payment option</label>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {([["full","Pay in full",`${fmt(total)} now — no balance remaining`,false],["partial","Pay 80% deposit",`${fmt(dueNow)} now · ${fmt(remaining)} before departure`,true]] as [string,string,string,boolean][]).map(([val,title,sub,highlight])=>(
                  <div key={val} className={`pay-opt${payOpt===val?" sel":""}`} onClick={()=>setPayOpt(val as "full"|"partial")}>
                    <div className="radio">{payOpt===val&&<div className="radio-dot"/>}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:".875rem"}}>{title}</div>
                      <div style={{fontSize:".78rem",color:"var(--muted)",marginTop:2}}>{sub}</div>
                    </div>
                    {highlight&&<span className="badge badge-green" style={{flexShrink:0}}>Popular</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{background:"var(--cream)",borderRadius:"var(--r)",padding:"14px 16px",marginBottom:20}}>
              {[["Price per seat",fmt(trip.price_per_seat)],["× "+seats+" seat"+(seats>1?"s":""),""],[payOpt==="partial"?"Remaining before trip":null,payOpt==="partial"?fmt(remaining):null]].filter(([k])=>k).map(([k,v])=>(
                k&&<div key={k} className="flex justify-between text-sm mb-1" style={{color:"var(--muted)"}}><span>{k}</span>{v&&<span>{v}</span>}</div>
              ))}
              <div className="divider"/>
              <div className="flex justify-between items-center">
                <span style={{fontWeight:700}}>{payOpt==="partial"?"Due now":"Total"}</span>
                <span style={{fontFamily:"Plus Jakarta Sans",fontWeight:900,fontSize:"1.25rem",color:"var(--green)"}}>{fmt(dueNow)}</span>
              </div>
            </div>

            {error&&<div className="alert alert-danger mb-4">{error}</div>}

            {!user?(
              <Link href={`/login?redirect=/trips/${id}`} className="btn btn-primary btn-block btn-lg" style={{justifyContent:"center"}}>Sign in to book</Link>
            ):(
              <button onClick={book} disabled={booking} className="btn btn-primary btn-block btn-lg" style={{justifyContent:"center"}}>
                {booking?<><div className="spinner"/>Booking...</>:`Request ${seats} seat${seats>1?"s":""} · ${fmt(dueNow)}`}
              </button>
            )}
            <p className="text-xs text-muted text-center mt-3">No charge until the driver accepts your request</p>
          </div>
        </div>
      </div>
    </div>
  );
}