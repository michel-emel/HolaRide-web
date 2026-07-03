"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {Bell,CheckCheck} from "lucide-react";
import {api,timeAgo} from "../lib/api";
import {useAuth} from "../lib/context";

interface Notif{id:string;type:string;title:string;body:string;read_at:string|null;created_at:string;}

const ICONS:Record<string,string>={
  booking_request:"📩",booking_accepted:"✅",booking_rejected:"❌",
  booking_cancelled:"🚫",trip_cancelled:"🚫",payment_success:"💰",
  passenger_paid:"💳",marked_no_show:"⚠️",sos_alert:"🆘",
  rebooked:"🔄",driver_location_shared:"📍",passenger_checkin:"✅",default:"🔔",
};

const NAV:Record<string,string>={
  booking_request:"/my-trips",booking_accepted:"/my-bookings",
  booking_rejected:"/my-bookings",payment_success:"/my-bookings",
  passenger_paid:"/my-trips",default:"/notifications",
};

export default function NotificationsPage(){
  const {user,token}=useAuth();
  const router=useRouter();
  const [notifs,setNotifs]=useState<Notif[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!user){router.push("/login?redirect=/notifications");return;}
    api.get("/me/notifications",token).then(d=>setNotifs(Array.isArray(d)?d:[])).catch(console.error).finally(()=>setLoading(false));
  },[user]);

  async function markAll(){
    await api.patch("/me/notifications/read-all",undefined,token).catch(()=>{});
    setNotifs(n=>n.map(x=>({...x,read_at:new Date().toISOString()})));
  }

  async function markOne(id:string,type:string){
    await api.patch(`/me/notifications/${id}/read`,undefined,token).catch(()=>{});
    setNotifs(n=>n.map(x=>x.id===id?{...x,read_at:new Date().toISOString()}:x));
    const target=NAV[type]||NAV.default;
    router.push(target);
  }

  const unread=notifs.filter(n=>!n.read_at).length;

  return(
    <div className="page">
      <div className="page-header">
        <div><h1 className="h2 mb-1">Notifications</h1><p className="text-muted text-sm">{unread>0?`${unread} unread notification${unread>1?"s":""}`:"All caught up"}</p></div>
        {unread>0&&<button onClick={markAll} className="btn btn-ghost flex items-center gap-2"><CheckCheck size={16}/>Mark all as read</button>}
      </div>

      {loading?(
        <div style={{textAlign:"center",padding:"60px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>
      ):notifs.length===0?(
        <div className="empty">
          <div className="empty-icon"><Bell size={28}/></div>
          <h3 className="h3 mb-2">No notifications</h3>
          <p className="text-muted text-sm">You'll see trip updates, booking confirmations, and more here.</p>
        </div>
      ):(
        <div className="card" style={{overflow:"hidden"}}>
          {notifs.map((n,i)=>(
            <div key={n.id}
              onClick={()=>markOne(n.id,n.type)}
              style={{display:"flex",alignItems:"flex-start",gap:14,padding:"18px 20px",borderBottom:i<notifs.length-1?"1px solid var(--border)":"none",cursor:"pointer",transition:".1s",background:n.read_at?"var(--white)":"rgba(27,107,69,.03)"}}>
              <div style={{width:48,height:48,borderRadius:14,background:n.read_at?"var(--cream-d)":"var(--green-p)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"1.25rem",position:"relative"}}>
                {ICONS[n.type]||ICONS.default}
                {!n.read_at&&<div style={{position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:"var(--green)",border:"2px solid var(--white)"}}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:n.read_at?600:700,fontSize:".9rem",marginBottom:3}}>{n.title}</div>
                <div style={{fontSize:".825rem",color:"var(--muted)",lineHeight:1.45,marginBottom:4}}>{n.body}</div>
                <div style={{fontSize:".72rem",color:"var(--muted)"}}>{timeAgo(n.created_at)}</div>
              </div>
              {!n.read_at&&<div style={{width:8,height:8,borderRadius:"50%",background:"var(--green)",flexShrink:0,marginTop:6}}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}