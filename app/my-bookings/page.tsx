"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {BookOpen,Clock,CheckCircle,XCircle,CreditCard,MessageCircle,Star,ChevronRight} from "lucide-react";
import {api,fmt,fmtDate,fmtTime} from "../lib/api";
import {useAuth} from "../lib/context";

interface Booking{id:string;trip_id:string;status:string;seats_booked:number;price_total:number;amount_paid:number;outstanding_balance:number;payment_type:string;created_at:string;trip?:{origin_city:string;destination_city:string;departure_time:string;driver_name:string;vehicle_label:string;origin_location:string;destination_location:string;};}

const STATUS:Record<string,{label:string;cls:string;icon:typeof CheckCircle}>={
  pending_driver_acceptance:{label:"Awaiting driver",cls:"s-pending",icon:Clock},
  pending_payment:{label:"Payment required",cls:"s-payment",icon:CreditCard},
  paid:{label:"Confirmed",cls:"s-paid",icon:CheckCircle},
  completed:{label:"Completed",cls:"s-completed",icon:CheckCircle},
  rejected:{label:"Rejected",cls:"s-cancelled",icon:XCircle},
  cancelled:{label:"Cancelled",cls:"s-cancelled",icon:XCircle},
};

export default function MyBookingsPage(){
  const {user,token}=useAuth();
  const router=useRouter();
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"upcoming"|"past">("upcoming");
  const [ratingBooking,setRatingBooking]=useState<string|null>(null);
  const [stars,setStars]=useState(0);
  const [ratingSubmitting,setRatingSubmitting]=useState(false);

  useEffect(()=>{
    if(!user){router.push("/login?redirect=/my-bookings");return;}
    api.get("/bookings/me",token).then(d=>setBookings(Array.isArray(d)?d:d.bookings||[])).catch(console.error).finally(()=>setLoading(false));
  },[user]);

  async function submitRating(bookingId:string){
    if(!stars) return;
    setRatingSubmitting(true);
    const b=bookings.find(x=>x.id===bookingId);
    if(!b) return;
    try{
      await api.post(`/trips/${b.trip_id}/reviews`,{rating:stars,role:"passenger"},token);
      setRatingBooking(null);setStars(0);
    }catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
    finally{setRatingSubmitting(false);}
  }

  const isPast=(b:Booking)=>["completed","rejected","cancelled"].includes(b.status);
  const upcoming=bookings.filter(b=>!isPast(b));
  const past=bookings.filter(isPast);
  const shown=tab==="upcoming"?upcoming:past;

  if(!user) return null;

  return(
    <div className="page">
      <div className="page-header">
        <div><h1 className="h2 mb-1">My bookings</h1><p className="text-muted text-sm">All your trip bookings as a passenger</p></div>
        <Link href="/search" className="btn btn-primary flex items-center gap-2">Find a trip</Link>
      </div>

      <div className="tabs mb-6" style={{maxWidth:300}}>
        <button className={`tab${tab==="upcoming"?" active":""}`} onClick={()=>setTab("upcoming")}>Upcoming ({upcoming.length})</button>
        <button className={`tab${tab==="past"?" active":""}`} onClick={()=>setTab("past")}>Past ({past.length})</button>
      </div>

      {loading?(
        <div style={{textAlign:"center",padding:"60px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>
      ):shown.length===0?(
        <div className="empty">
          <div className="empty-icon"><BookOpen size={28}/></div>
          <h3 className="h3 mb-2">No {tab} bookings</h3>
          <p className="text-muted text-sm mb-4">{tab==="upcoming"?"Book a trip to get started.":"Your completed bookings will appear here."}</p>
          {tab==="upcoming"&&<Link href="/search" className="btn btn-primary">Find a trip</Link>}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {shown.map(b=>{
            const s=STATUS[b.status]||STATUS.pending_driver_acceptance;
            const Icon=s.icon;
            return(
              <div key={b.id} className="card">
                <div className="card-p" style={{borderBottom:"1px solid var(--border)"}}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="h4">{b.trip?.origin_city} → {b.trip?.destination_city}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted mt-1">
                        <span>{b.trip&&fmtDate(b.trip.departure_time)} · {b.trip&&fmtTime(b.trip.departure_time)}</span>
                        <span>Driver: {b.trip?.driver_name}</span>
                        <span>{b.trip?.vehicle_label}</span>
                      </div>
                    </div>
                    <span className={`badge ${s.cls} flex items-center gap-1`}><Icon size={11}/>{s.label}</span>
                  </div>
                  <div className="route-wrap">
                    <div className="route-line"><div className="dot-start"/><div className="line-mid"/><div className="dot-end"/></div>
                    <div className="route-text">
                      <div className="text-sm font-bold">{b.trip?.origin_city}<span className="text-muted font-normal"> — {b.trip?.origin_location}</span></div>
                      <div style={{height:8}}/>
                      <div className="text-sm font-bold">{b.trip?.destination_city}<span className="text-muted font-normal"> — {b.trip?.destination_location}</span></div>
                    </div>
                  </div>
                </div>
                <div className="card-p">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex gap-6">
                      <div><div className="text-xs text-muted mb-0.5">Seats</div><div style={{fontWeight:700}}>{b.seats_booked}</div></div>
                      <div><div className="text-xs text-muted mb-0.5">Total</div><div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,color:"var(--green)"}}>{fmt(b.price_total)}</div></div>
                      <div><div className="text-xs text-muted mb-0.5">Paid</div><div style={{fontWeight:700}}>{fmt(b.amount_paid)}</div></div>
                      {b.outstanding_balance>0&&<div><div className="text-xs text-muted mb-0.5">Balance due</div><div style={{fontWeight:700,color:"var(--danger)"}}>{fmt(b.outstanding_balance)}</div></div>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/chat/${b.trip_id}`} className="btn btn-ghost btn-sm flex items-center gap-1"><MessageCircle size={13}/>Chat</Link>
                      {b.status==="pending_payment"&&<button className="btn btn-primary btn-sm flex items-center gap-1"><CreditCard size={13}/>Pay {fmt(b.price_total-b.amount_paid)}</button>}
                      {b.status==="completed"&&!ratingBooking&&<button onClick={()=>{setRatingBooking(b.id);setStars(0);}} className="btn btn-secondary btn-sm flex items-center gap-1"><Star size={13}/>Rate driver</button>}
                    </div>
                  </div>
                  {ratingBooking===b.id&&(
                    <div style={{marginTop:16,padding:"16px",background:"var(--cream)",borderRadius:"var(--r)",border:"1px solid var(--border)"}}>
                      <div style={{fontWeight:600,fontSize:".875rem",marginBottom:12}}>Rate your driver</div>
                      <div className="stars mb-4">
                        {[1,2,3,4,5].map(n=>(
                          <span key={n} className={`star${n<=stars?" filled":""}`} onClick={()=>setStars(n)} style={{fontSize:"1.75rem"}}>★</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>submitRating(b.id)} disabled={!stars||ratingSubmitting} className="btn btn-primary btn-sm">
                          {ratingSubmitting?<><div className="spinner"/>Submitting...</>:"Submit rating"}
                        </button>
                        <button onClick={()=>setRatingBooking(null)} className="btn btn-ghost btn-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}