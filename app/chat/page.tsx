"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {MessageCircle,Car,MapPin} from "lucide-react";
import {api,fmtDate} from "../lib/api";
import {useAuth} from "../lib/context";

interface ChatEntry{tripId:string;originCity:string;destinationCity:string;lastMessage?:string;lastMessageAt?:string;unreadCount:number;role:string;}

export default function ChatListPage(){
  const {user,token}=useAuth();
  const router=useRouter();
  const [chats,setChats]=useState<ChatEntry[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!user){router.push("/login?redirect=/chat");return;}
    // Load bookings and trips to build chat list
    Promise.all([
      api.get("/bookings/me",token).catch(()=>[]),
      api.get("/drivers/trips",token).catch(()=>[]),
    ]).then(([bookings,trips])=>{
      const entries:ChatEntry[]=[];
      const b=Array.isArray(bookings)?bookings:bookings.bookings||[];
      b.forEach((bk:Record<string,string>)=>{
        if(bk.trip) entries.push({tripId:bk.trip_id,originCity:(bk.trip as unknown as Record<string,string>).origin_city,destinationCity:(bk.trip as unknown as Record<string,string>).destination_city,unreadCount:0,role:"passenger"});
      });
      const t=Array.isArray(trips)?trips:trips.trips||[];
      t.forEach((tr:Record<string,string>)=>{
        if(!entries.find(e=>e.tripId===tr.id)) entries.push({tripId:tr.id,originCity:tr.origin_city,destinationCity:tr.destination_city,unreadCount:0,role:"driver"});
      });
      setChats(entries);
    }).finally(()=>setLoading(false));
  },[user]);

  if(!user) return null;

  return(
    <div className="page">
      <div className="page-header">
        <div><h1 className="h2 mb-1">Chat</h1><p className="text-muted text-sm">Conversations with drivers and passengers</p></div>
      </div>
      {loading?(
        <div style={{textAlign:"center",padding:"60px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>
      ):chats.length===0?(
        <div className="empty">
          <div className="empty-icon"><MessageCircle size={28}/></div>
          <h3 className="h3 mb-2">No conversations yet</h3>
          <p className="text-muted text-sm mb-4">Book a trip or post one as a driver to start chatting.</p>
          <Link href="/search" className="btn btn-primary">Find a trip</Link>
        </div>
      ):(
        <div className="card" style={{overflow:"hidden"}}>
          {chats.map((c,i)=>(
            <Link key={c.tripId} href={`/chat/${c.tripId}`} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderBottom:i<chats.length-1?"1px solid var(--border)":"none",transition:".1s",textDecoration:"none",color:"inherit"}} className="card-pressable">
              <div style={{width:48,height:48,borderRadius:14,background:"var(--green-p)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {c.role==="driver"?<Car size={20} color="var(--green)"/>:<MapPin size={20} color="var(--green)"/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,marginBottom:2}}>{c.originCity} → {c.destinationCity}</div>
                <div className="text-sm text-muted">{c.role==="driver"?"You are the driver":"You are a passenger"}</div>
              </div>
              <span className={`badge ${c.role==="driver"?"badge-green":"badge-info"}`}>{c.role}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}