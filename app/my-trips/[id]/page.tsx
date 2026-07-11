"use client";
import {useState,useEffect} from "react";
import {useParams,useRouter} from "next/navigation";
import Link from "next/link";
import {ChevronLeft,CheckCircle,XCircle,Phone,Star,Users,MapPin,Calendar,Car,MessageCircle} from "lucide-react";
import {api,fmt} from "../../lib/api";
import {useAuth} from "../../lib/context";

// Matches DriverBookingOut
interface Booking{
  id:string;trip_id:string;seats_booked:number;status:string;
  price_total:number;amount_paid:number;outstanding_balance:number;
  created_at:string;passenger_id:string;
  passenger_first_name?:string;passenger_last_name?:string;
  passenger_phone:string;
  passenger_rating_average?:number;passenger_rating_count:number;
}
// Matches TripOut
interface Trip{
  id:string;departure_city:string;destination_city:string;
  departure_location:string;destination_location:string;
  departure_date:string;departure_time:string;
  price_per_seat:number;available_seats:number;status:string;
  vehicle_brand?:string;vehicle_model?:string;vehicle_category:string;
}

const BS:Record<string,{label:string;cls:string}>={
  pending_driver_acceptance:{label:"Pending",cls:"s-pending"},
  pending_payment:{label:"Awaiting payment",cls:"s-payment"},
  paid:{label:"Paid",cls:"s-paid"},
  completed:{label:"Completed",cls:"s-completed"},
  rejected:{label:"Rejected",cls:"s-cancelled"},
  cancelled:{label:"Cancelled",cls:"s-cancelled"},
};

export default function TripMgmtPage(){
  const {id}=useParams<{id:string}>();
  const router=useRouter();
  const {token}=useAuth();
  const [trip,setTrip]=useState<Trip|null>(null);
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"requests"|"confirmed">("requests");
  const [acting,setActing]=useState("");
  const [ratingPassenger,setRatingPassenger]=useState<string|null>(null);
  const [stars,setStars]=useState(0);

  function fmtDate(date:string){return new Date(date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});}
  function fmtTime(time:string){return time?.slice(0,5)||"";}

  async function load(){
    try{
      const [t,b]=await Promise.all([
        api.get(`/trips/${id}`,token),
        api.get(`/trips/${id}/bookings`,token).catch(()=>[]),
      ]);
      setTrip(t);
      setBookings(Array.isArray(b)?b:b.bookings||[]);
    }catch{router.push("/my-trips");}
    finally{setLoading(false);}
  }

  useEffect(()=>{load();},[]);

  async function bookingAction(bookingId:string,action:"accept"|"reject"){
    if(action==="reject"&&!confirm("Reject this request?")) return;
    setActing(bookingId+action);
    try{await api.patch(`/bookings/${bookingId}/${action}`,undefined,token);await load();}
    catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
    finally{setActing("");}
  }

  async function tripAction(action:"complete"|"cancel"){
    if(!confirm(action==="complete"?"Mark trip as completed?":"Cancel this trip? All passengers will be notified.")) return;
    setActing(action);
    try{await api.patch(`/trips/${id}/${action}`,undefined,token);await load();}
    catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
    finally{setActing("");}
  }

  async function submitRating(passengerId:string){
    if(!stars) return;
    try{
      await api.post(`/trips/${id}/reviews`,{stars,reviewee_id:passengerId},token);
      setRatingPassenger(null);setStars(0);
    }
    catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
  }

  if(loading) return <div style={{textAlign:"center",padding:"80px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>;
  if(!trip) return null;

  const vehicleLabel=[trip.vehicle_brand,trip.vehicle_model].filter(Boolean).join(" ")||trip.vehicle_category;
  const pending=bookings.filter(b=>b.status==="pending_driver_acceptance");
  const confirmed=bookings.filter(b=>!["pending_driver_acceptance","rejected","cancelled"].includes(b.status));

  return(
    <div className="page">
      <button onClick={()=>router.push("/my-trips")}
        className="flex items-center gap-2 text-sm text-muted mb-6 btn btn-ghost btn-sm" style={{paddingLeft:0}}>
        <ChevronLeft size={16}/>My trips
      </button>

      {/* Trip summary */}
      <div className="card card-p mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="h2 mb-1">{trip.departure_city} → {trip.destination_city}</h1>
            <div className="flex items-center gap-4 text-sm text-muted flex-wrap">
              <span className="flex items-center gap-1"><Calendar size={13}/>{fmtDate(trip.departure_date)} · {fmtTime(trip.departure_time)}</span>
              <span className="flex items-center gap-1"><MapPin size={13}/>{trip.departure_location} → {trip.destination_location}</span>
              <span className="flex items-center gap-1"><Users size={13}/>{trip.available_seats} seats left</span>
              <span className="flex items-center gap-1"><Car size={13}/>{vehicleLabel}</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
            <span className={`badge ${trip.status==="published"?"s-paid":trip.status==="completed"?"s-completed":"s-cancelled"}`}>
              {trip.status==="published"?"Active":trip.status.charAt(0).toUpperCase()+trip.status.slice(1)}
            </span>
            <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.25rem",color:"var(--green)"}}>
              {fmt(trip.price_per_seat)}<span className="text-muted text-sm font-normal">/seat</span>
            </div>
          </div>
        </div>
        {trip.status==="published"&&(
          <div className="flex gap-3 flex-wrap" style={{paddingTop:16,borderTop:"1px solid var(--border)"}}>
            <button onClick={()=>tripAction("complete")} disabled={!!acting} className="btn btn-secondary flex items-center gap-2">
              {acting==="complete"?<div className="spinner spinner-g"/>:<CheckCircle size={15}/>}Mark as completed
            </button>
            <button onClick={()=>tripAction("cancel")} disabled={!!acting} className="btn btn-danger flex items-center gap-2">
              {acting==="cancel"?<div className="spinner"/>:<XCircle size={15}/>}Cancel trip
            </button>
            <Link href={`/chat/${trip.id}`} className="btn btn-ghost flex items-center gap-2">
              <MessageCircle size={15}/>Open chat
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-4 mb-6">
        {[
          ["Total bookings",bookings.length],
          ["Pending",pending.length],
          ["Confirmed",confirmed.filter(b=>b.status==="paid").length],
          ["Revenue",fmt(confirmed.reduce((s,b)=>s+b.amount_paid,0))],
        ].map(([l,v])=>(
          <div key={String(l)} className="card stat-card">
            <div className="stat-val">{v}</div>
            <div className="stat-lbl">{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs mb-4" style={{maxWidth:380}}>
        <button className={`tab${tab==="requests"?" active":""}`} onClick={()=>setTab("requests")}>
          Requests
          {pending.length>0&&<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
            width:20,height:20,borderRadius:"50%",background:"var(--danger)",color:"#fff",
            fontSize:".7rem",fontWeight:800,marginLeft:6}}>{pending.length}</span>}
        </button>
        <button className={`tab${tab==="confirmed"?" active":""}`} onClick={()=>setTab("confirmed")}>
          Bookings ({confirmed.length})
        </button>
      </div>

      {(tab==="requests"?pending:confirmed).length===0?(
        <div className="empty">
          <div className="empty-icon"><Users size={28}/></div>
          <p className="text-muted">{tab==="requests"?"No pending requests.":"No confirmed bookings yet."}</p>
        </div>
      ):(
        <div className="card" style={{overflow:"hidden"}}>
          <table className="table">
            <thead>
              <tr><th>Passenger</th><th>Seats</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(tab==="requests"?pending:confirmed).map(b=>{
                const passengerName=[b.passenger_first_name,b.passenger_last_name].filter(Boolean).join(" ")||"Passenger";
                const s=BS[b.status]||BS.pending_driver_acceptance;
                return(
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{width:36,height:36,fontSize:".875rem",flexShrink:0}}>
                          {passengerName[0]?.toUpperCase()||"?"}
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:".875rem"}}>{passengerName}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <a href={`tel:${b.passenger_phone}`} className="flex items-center gap-1 text-green">
                              <Phone size={11}/>{b.passenger_phone}
                            </a>
                            {b.passenger_rating_average&&(
                              <span className="flex items-center gap-1 text-muted">
                                <Star size={10} fill="var(--gold)" color="var(--gold)"/>
                                {b.passenger_rating_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><strong>{b.seats_booked}</strong></td>
                    <td style={{fontFamily:"Plus Jakarta Sans",fontWeight:700,color:"var(--green)"}}>{fmt(b.price_total)}</td>
                    <td>{fmt(b.amount_paid)}</td>
                    <td>
                      {b.outstanding_balance>0
                        ?<span style={{color:"var(--danger)",fontWeight:600}}>{fmt(b.outstanding_balance)}</span>
                        :<span style={{color:"var(--green)"}}>—</span>}
                    </td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td>
                      {b.status==="pending_driver_acceptance"&&(
                        <div className="flex gap-2">
                          <button onClick={()=>bookingAction(b.id,"accept")} disabled={!!acting} className="btn btn-primary btn-sm">
                            {acting===b.id+"accept"?<div className="spinner"/>:<CheckCircle size={13}/>}Accept
                          </button>
                          <button onClick={()=>bookingAction(b.id,"reject")} disabled={!!acting} className="btn btn-danger btn-sm">
                            {acting===b.id+"reject"?<div className="spinner"/>:<XCircle size={13}/>}Reject
                          </button>
                        </div>
                      )}
                      {["paid","completed"].includes(b.status)&&(
                        <div className="flex gap-2">
                          <Link href={`/chat/${trip.id}`} className="btn btn-ghost btn-sm"><MessageCircle size={13}/></Link>
                          {ratingPassenger!==b.passenger_id&&(
                            <button onClick={()=>{setRatingPassenger(b.passenger_id);setStars(0);}} className="btn btn-secondary btn-sm">
                              <Star size={13}/>Rate
                            </button>
                          )}
                        </div>
                      )}
                      {ratingPassenger===b.passenger_id&&(
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <div className="stars">
                            {[1,2,3,4,5].map(n=>(
                              <span key={n} className={`star${n<=stars?" filled":""}`}
                                onClick={()=>setStars(n)} style={{cursor:"pointer"}}>★</span>
                            ))}
                          </div>
                          <button onClick={()=>submitRating(b.passenger_id)} disabled={!stars} className="btn btn-primary btn-sm">Save</button>
                          <button onClick={()=>setRatingPassenger(null)} className="btn btn-ghost btn-sm">✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}