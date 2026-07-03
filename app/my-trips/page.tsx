"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {Plus,Car,Users,Calendar,ChevronRight,MapPin} from "lucide-react";
import {api,fmt,fmtDate,fmtTime} from "../lib/api";
import {useAuth} from "../lib/context";

interface Trip{id:string;origin_city:string;destination_city:string;origin_location:string;destination_location:string;departure_time:string;price_per_seat:number;available_seats:number;status:string;vehicle_label?:string;}

const STATUS_MAP:Record<string,{label:string;cls:string}>={published:{label:"Active",cls:"s-published"},completed:{label:"Completed",cls:"s-completed"},cancelled:{label:"Cancelled",cls:"s-cancelled"}};

export default function MyTripsPage(){
  const {user,token,isDriver}=useAuth();
  const router=useRouter();
  const [trips,setTrips]=useState<Trip[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"upcoming"|"past">("upcoming");

  useEffect(()=>{
    if(!user){router.push("/login?redirect=/my-trips");return;}
    api.get("/drivers/trips",token).then(d=>setTrips(Array.isArray(d)?d:d.trips||[])).catch(console.error).finally(()=>setLoading(false));
  },[user]);

  const isPast=(t:Trip)=>t.status!=="published"||new Date(t.departure_time)<new Date();
  const upcoming=trips.filter(t=>!isPast(t));
  const past=trips.filter(isPast);
  const shown=tab==="upcoming"?upcoming:past;

  return(
    <div className="page">
      <div className="page-header">
        <div><h1 className="h2 mb-1">My trips</h1><p className="text-muted text-sm">Trips you've posted as a driver</p></div>
        <Link href="/post-trip" className="btn btn-primary flex items-center gap-2"><Plus size={16}/>Post a new trip</Link>
      </div>

      {!isDriver&&(
        <div className="alert alert-warn mb-6">You need a driver account to manage trips. Contact admin to upgrade your account.</div>
      )}

      <div className="tabs mb-6" style={{maxWidth:320}}>
        <button className={`tab${tab==="upcoming"?" active":""}`} onClick={()=>setTab("upcoming")}>Upcoming ({upcoming.length})</button>
        <button className={`tab${tab==="past"?" active":""}`} onClick={()=>setTab("past")}>Past ({past.length})</button>
      </div>

      {loading?(
        <div style={{textAlign:"center",padding:"60px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>
      ):shown.length===0?(
        <div className="empty">
          <div className="empty-icon"><Car size={28}/></div>
          <h3 className="h3 mb-2">No {tab} trips</h3>
          <p className="text-muted text-sm mb-4">{tab==="upcoming"?"Post a trip to get started — passengers are waiting!":"Your past trips will appear here."}</p>
          {tab==="upcoming"&&isDriver&&<Link href="/post-trip" className="btn btn-primary">Post your first trip</Link>}
        </div>
      ):(
        <div className="card" style={{overflow:"hidden"}}>
          <table className="table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Departure</th>
                <th>Seats</th>
                <th>Price / seat</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(t=>{
                const s=STATUS_MAP[t.status]||STATUS_MAP.published;
                return(
                  <tr key={t.id} style={{cursor:"pointer"}} onClick={()=>router.push(`/my-trips/${t.id}`)}>
                    <td>
                      <div style={{fontWeight:700}}>{t.origin_city} → {t.destination_city}</div>
                      <div className="text-xs text-muted">{t.origin_location} → {t.destination_location}</div>
                    </td>
                    <td>
                      <div className="text-sm">{fmtDate(t.departure_time)}</div>
                      <div className="text-xs text-muted">{fmtTime(t.departure_time)}</div>
                    </td>
                    <td><span className="seats-pill"><Users size={11}/>{t.available_seats}</span></td>
                    <td style={{fontFamily:"Plus Jakarta Sans",fontWeight:700,color:"var(--green)"}}>{fmt(t.price_per_seat)}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td><ChevronRight size={16} color="var(--muted)"/></td>
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