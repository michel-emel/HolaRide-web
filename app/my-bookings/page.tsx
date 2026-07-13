"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {BookOpen,Clock,CheckCircle,XCircle,CreditCard,MessageCircle,Star,MapPin,Calendar} from "lucide-react";
import {api,fmt} from "../lib/api";
import {useAuth} from "../lib/context";

// Matches backend MyBookingOut — trip info is flattened, no nested trip object
interface Booking{
  id:string;trip_id:string;status:string;seats_booked:number;
  price_total:number;amount_paid:number;outstanding_balance:number;
  payment_type:string;created_at:string;
  departure_city:string;departure_location:string;
  destination_city:string;destination_location:string;
  departure_date:string;departure_time:string;
}

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
  const [payingId,setPayingId]=useState<string|null>(null);
  const [payModal,setPayModal]=useState<Booking|null>(null);
  const [payStep,setPayStep]=useState<"confirm"|"processing"|"pending"|"success"|"failed">("confirm");
  const [payError,setPayError]=useState<string|null>(null);
  const [payCountdown,setPayCountdown]=useState(300);

  useEffect(()=>{
    if(!user){router.push("/login?redirect=/my-bookings");return;}
    api.get("/me/bookings",token)
      .then(d=>setBookings(Array.isArray(d)?d:d.bookings||[]))
      .catch(console.error)
      .finally(()=>setLoading(false));
  },[user]);

  async function submitRating(bookingId:string){
    if(!stars) return;
    setRatingSubmitting(true);
    const b=bookings.find(x=>x.id===bookingId);
    if(!b) return;
    try{
      await api.post(`/trips/${b.trip_id}/reviews`,{stars,comment:""},token);
      setRatingBooking(null);setStars(0);
    }catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
    finally{setRatingSubmitting(false);}
  }

  function fmtDate(date:string){
    const d=new Date(date);
    return d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  }
  function fmtTime(time:string){return time?.slice(0,5)||"";}

  async function startPayment(simulate=false){
    if(!payModal) return;
    setPayStep("processing"); setPayError(null);
    try{
      if(simulate){
        await new Promise(r=>setTimeout(r,2000));
        await api.post(`/bookings/${payModal.id}/dev-force-paid`,{},token);
        setPayStep("success");
      } else {
        await api.post(`/bookings/${payModal.id}/initiate-payment`,{},token);
        setPayStep("pending");
        setPayCountdown(300);
        // countdown
        const iv=setInterval(()=>setPayCountdown(p=>p>0?p-1:0),1000);
        // poll status
        let polls=0;
        const poll=setInterval(async()=>{
          polls++;
          try{
            const r=await api.get(`/bookings/${payModal.id}/payment-status`,token);
            const status=r.payment_status;
            if(status==="success"||status==="paid"){
              clearInterval(poll);clearInterval(iv);
              setPayStep("success");
            } else if(status==="failed"){
              clearInterval(poll);clearInterval(iv);
              const reason=r.failure_reason;
              if(reason==="insufficient_balance"){
                setPayError("insufficient_balance");
              } else {
                setPayError(r.error_message||"Payment failed. Please try again.");
              }
              setPayStep("failed");
            } else if(polls>=60){
              clearInterval(poll);clearInterval(iv);
              setPayError("Payment timed out. Please try again.");
              setPayStep("failed");
            }
          }catch(_){}
        },5000);
      }
      // reload on success
      if(simulate){
        setTimeout(async()=>{
          const d=await api.get("/me/bookings",token);
          setBookings(Array.isArray(d)?d:d.bookings||[]);
          setPayModal(null); setPayStep("confirm");
        },2000);
      }
    }catch(e:unknown){
      setPayError(e instanceof Error?e.message:"Failed to initiate payment");
      setPayStep("failed");
    }
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
        <Link href="/search" className="btn btn-primary">Find a trip</Link>
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
                {/* Trip info */}
                <div className="card-p" style={{borderBottom:"1px solid var(--border)"}}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="h4">{b.departure_city} → {b.destination_city}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar size={13}/>{fmtDate(b.departure_date)} · {fmtTime(b.departure_time)}</span>
                      </div>
                    </div>
                    <span className={`badge ${s.cls} flex items-center gap-1`}><Icon size={11}/>{s.label}</span>
                  </div>

                  {/* Route */}
                  <div className="route-wrap">
                    <div className="route-line"><div className="dot-start"/><div className="line-mid"/><div className="dot-end"/></div>
                    <div className="route-text">
                      <div className="text-sm"><strong>{b.departure_city}</strong><span className="text-muted"> — {b.departure_location}</span></div>
                      <div style={{height:8}}/>
                      <div className="text-sm"><strong>{b.destination_city}</strong><span className="text-muted"> — {b.destination_location}</span></div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="card-p">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex gap-6">
                      <div><div className="text-xs text-muted mb-1">Seats</div><div style={{fontWeight:700}}>{b.seats_booked}</div></div>
                      <div><div className="text-xs text-muted mb-1">Total</div><div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,color:"var(--green)"}}>{fmt(b.price_total)}</div></div>
                      <div><div className="text-xs text-muted mb-1">Paid</div><div style={{fontWeight:700}}>{fmt(b.amount_paid)}</div></div>
                      {b.outstanding_balance>0&&<div><div className="text-xs text-muted mb-1">Balance due</div><div style={{fontWeight:700,color:"var(--danger)"}}>{fmt(b.outstanding_balance)}</div></div>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/chat/${b.trip_id}`} className="btn btn-ghost btn-sm flex items-center gap-1"><MessageCircle size={13}/>Chat</Link>
                      {b.status==="pending_payment"&&(
                        <button
                          onClick={()=>{setPayModal(b);setPayStep("confirm");setPayError(null);}}
                          className="btn btn-primary btn-sm flex items-center gap-1">
                          <CreditCard size={13}/>Pay {fmt(b.outstanding_balance||b.price_total)}
                        </button>
                      )}
                      {b.status==="completed"&&ratingBooking!==b.id&&(
                        <button onClick={()=>{setRatingBooking(b.id);setStars(0);}} className="btn btn-secondary btn-sm flex items-center gap-1">
                          <Star size={13}/>Rate driver
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rating form */}
                  {ratingBooking===b.id&&(
                    <div style={{marginTop:16,padding:16,background:"var(--cream)",borderRadius:"var(--r)",border:"1px solid var(--border)"}}>
                      <div style={{fontWeight:600,fontSize:".875rem",marginBottom:12}}>Rate your driver</div>
                      <div className="stars mb-4">
                        {[1,2,3,4,5].map(n=>(
                          <span key={n} className={`star${n<=stars?" filled":""}`}
                            onClick={()=>setStars(n)} style={{fontSize:"1.75rem",cursor:"pointer"}}>★</span>
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

      {/* Payment modal */}
      {payModal&&(
        <div onClick={e=>{if(e.target===e.currentTarget&&(payStep==="confirm"||payStep==="failed")){setPayModal(null);setPayStep("confirm");}}}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:500,
            display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:24,padding:28,maxWidth:420,width:"100%",
            boxShadow:"0 24px 64px rgba(0,0,0,.2)",textAlign:"center"}}>

            {/* CONFIRM */}
            {payStep==="confirm"&&(<>
              <div style={{fontSize:"2.5rem",marginBottom:12}}>💳</div>
              <h3 style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.25rem",marginBottom:4}}>
                Confirm payment
              </h3>
              <p className="text-muted text-sm mb-4">{payModal.departure_city} → {payModal.destination_city}</p>
              <div style={{background:"var(--cream)",borderRadius:16,padding:"20px",marginBottom:20}}>
                <div className="text-xs text-muted mb-1">Amount due</div>
                <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:900,fontSize:"2rem",color:"var(--green)"}}>
                  {fmt(payModal.outstanding_balance||payModal.price_total)}
                </div>
                <div className="text-xs text-muted mt-1">{payModal.seats_booked} seat{payModal.seats_booked>1?"s":""} · Mobile Money</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={()=>startPayment(false)}
                  style={{padding:"14px",borderRadius:14,border:"none",background:"var(--green)",
                    color:"#fff",cursor:"pointer",fontWeight:700,fontSize:"1rem",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  📱 Pay via Mobile Money
                </button>
                <button onClick={()=>startPayment(true)}
                  style={{padding:"11px",borderRadius:12,border:"1.5px solid #FFD580",
                    background:"#FFFBEB",cursor:"pointer",fontWeight:600,fontSize:".875rem",color:"#92400E"}}>
                  🧪 Simulate payment (dev)
                </button>
                <button onClick={()=>setPayModal(null)}
                  style={{padding:"10px",borderRadius:12,border:"1.5px solid var(--border)",
                    background:"none",cursor:"pointer",fontWeight:600,color:"var(--muted)",fontSize:".875rem"}}>
                  Cancel
                </button>
              </div>
            </>)}

            {/* PROCESSING */}
            {payStep==="processing"&&(<>
              <div className="spinner spinner-g" style={{width:48,height:48,margin:"0 auto 20px"}}/>
              <h3 style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.1rem",marginBottom:8}}>
                Connecting to Mobile Money...
              </h3>
              <p className="text-muted text-sm">Please wait.</p>
            </>)}

            {/* PENDING */}
            {payStep==="pending"&&(<>
              <div style={{fontSize:"3rem",marginBottom:12,animation:"pulse 2s infinite"}}>📱</div>
              <h3 style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.2rem",marginBottom:8}}>
                Check your phone
              </h3>
              <p className="text-muted text-sm mb-4">
                A Mobile Money payment request was sent to your phone.<br/>
                Confirm it to complete the booking.
              </p>
              <div style={{background:"var(--cream)",borderRadius:12,padding:"14px",marginBottom:16}}>
                <div style={{fontFamily:"monospace",fontWeight:800,fontSize:"1.5rem",color:"var(--green)"}}>
                  {String(Math.floor(payCountdown/60)).padStart(2,"0")}:{String(payCountdown%60).padStart(2,"0")}
                </div>
                <div className="text-xs text-muted">remaining to confirm</div>
              </div>
              <p className="text-xs text-muted">Checking automatically every 5s...</p>
            </>)}

            {/* SUCCESS */}
            {payStep==="success"&&(<>
              <div style={{width:80,height:80,borderRadius:"50%",background:"var(--green-p)",
                display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:"2.5rem"}}>✅</div>
              <h3 style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.3rem",
                color:"var(--green)",marginBottom:8}}>Payment confirmed!</h3>
              <p className="text-muted text-sm mb-6">Your seat is secured. The driver has been notified.</p>
              <button onClick={()=>{setPayModal(null);setPayStep("confirm");}}
                className="btn btn-primary btn-block">Done</button>
            </>)}

            {/* FAILED */}
            {payStep==="failed"&&(<>
              {payError==="insufficient_balance"?(<>
                <div style={{fontSize:"3rem",marginBottom:12}}>💰</div>
                <h3 style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.2rem",color:"var(--danger)",marginBottom:8}}>
                  Insufficient Balance
                </h3>
                <p className="text-muted text-sm mb-4">
                  Your Mobile Money balance is too low for {fmt(payModal.outstanding_balance||payModal.price_total)}.
                </p>
                <div style={{background:"var(--cream)",borderRadius:12,padding:14,marginBottom:20,textAlign:"left"}}>
                  <div style={{fontWeight:700,fontSize:".875rem",marginBottom:6}}>How to top up:</div>
                  <div className="text-sm text-muted">• MTN MoMo: Dial <strong>*126#</strong></div>
                  <div className="text-sm text-muted">• Orange Money: Dial <strong>#150#</strong></div>
                </div>
              </>):(<>
                <div style={{width:64,height:64,borderRadius:"50%",background:"var(--danger-bg)",
                  display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:"1.75rem"}}>❌</div>
                <h3 style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.2rem",color:"var(--danger)",marginBottom:8}}>
                  Payment failed
                </h3>
                <p className="text-muted text-sm mb-6">{payError||"Something went wrong. Please try again."}</p>
              </>)}
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setPayModal(null)}
                  style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid var(--border)",
                    background:"none",cursor:"pointer",fontWeight:600,color:"var(--muted)"}}>
                  Cancel
                </button>
                <button onClick={()=>{setPayStep("confirm");setPayError(null);}}
                  style={{flex:2,padding:"12px",borderRadius:12,border:"none",
                    background:"var(--green)",color:"#fff",cursor:"pointer",fontWeight:700}}>
                  Try again
                </button>
              </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
