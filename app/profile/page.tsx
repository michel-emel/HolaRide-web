"use client";
import {useState,useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {User,Phone,BookOpen,Car,MessageCircle,Bell,LogOut,Shield,Star,Edit3} from "lucide-react";
import {api,fmt} from "../lib/api";
import {useAuth} from "../lib/context";

export default function ProfilePage(){
  const {user,token,logout,isDriver}=useAuth();
  const router=useRouter();
  const [stats,setStats]=useState({trips:0,bookings:0,rating:null as number|null,ratingCount:0});

  useEffect(()=>{
    if(!user) return;
    api.get("/me",token).catch(()=>{});
    Promise.all([
      api.get("/bookings/me",token).catch(()=>[]),
      api.get("/drivers/trips",token).catch(()=>[]),
    ]).then(([b,t])=>{
      const bookings=Array.isArray(b)?b:b.bookings||[];
      const trips=Array.isArray(t)?t:t.trips||[];
      setStats(s=>({...s,bookings:bookings.length,trips:trips.length}));
    });
  },[user]);

  if(!user) return(
    <div className="page" style={{textAlign:"center",maxWidth:480,margin:"0 auto",padding:"80px 24px"}}>
      <div style={{fontSize:"3rem",marginBottom:16}}>👋</div>
      <h2 className="h2 mb-3">Welcome to HolaRide</h2>
      <p className="lead mb-8">Sign in to book trips, post rides, and manage your journeys.</p>
      <Link href="/login" className="btn btn-primary btn-lg">Sign in with phone number</Link>
    </div>
  );

  const initial=user.first_name?.[0]?.toUpperCase()||"?";
  const name=[user.first_name,user.last_name].filter(Boolean).join(" ")||"HolaRide user";

  return(
    <div className="page">
      <div className="page-header">
        <h1 className="h2">Profile</h1>
      </div>

      <div className="grid-2" style={{gap:24,alignItems:"start"}}>
        {/* Left */}
        <div>
          {/* Profile card */}
          <div className="card mb-4" style={{background:"linear-gradient(135deg,var(--green-d),var(--green))",border:"none",padding:"32px 24px",textAlign:"center"}}>
            <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.2)",border:"3px solid rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontFamily:"Plus Jakarta Sans",fontWeight:900,fontSize:"2rem",color:"#fff"}}>{initial}</div>
            <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.25rem",color:"#fff",marginBottom:4}}>{name}</div>
            <div style={{fontSize:".875rem",color:"rgba(255,255,255,.75)",marginBottom:12}}>{user.phone_number}</div>
            {isDriver&&(
              <span style={{background:"rgba(255,255,255,.2)",borderRadius:100,padding:"4px 12px",fontSize:".78rem",color:"rgba(255,255,255,.9)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:5}}>
                <Shield size={12}/>Verified driver
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="card card-p mb-4">
            <h3 className="h4 mb-4">Activity</h3>
            <div className="grid-2" style={{gap:12}}>
              {[["Bookings",stats.bookings,"as passenger"],["Trips posted",stats.trips,"as driver"]].map(([l,v,sub])=>(
                <div key={String(l)} style={{background:"var(--cream)",borderRadius:"var(--r)",padding:"14px 16px",textAlign:"center"}}>
                  <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:900,fontSize:"1.75rem",color:"var(--green)"}}>{v}</div>
                  <div style={{fontWeight:600,fontSize:".875rem"}}>{l}</div>
                  <div className="text-xs text-muted">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Download app */}
          <div className="card card-p" style={{background:"var(--green-p)",border:"none"}}>
            <h3 className="h4 mb-2" style={{color:"var(--green)"}}>Get the mobile app</h3>
            <p className="text-sm text-muted mb-4">Same account, richer experience with real-time notifications.</p>
            <div className="flex gap-3 flex-wrap">
              <a href="#" className="store-btn" style={{flex:1}}><span>🤖</span><div><div style={{fontSize:".6rem",color:"rgba(255,255,255,.6)",textTransform:"uppercase"}}>Get on</div><div style={{fontFamily:"Plus Jakarta Sans",fontWeight:700,fontSize:".8rem"}}>Google Play</div></div></a>
              <a href="#" className="store-btn" style={{flex:1}}><span>🍎</span><div><div style={{fontSize:".6rem",color:"rgba(255,255,255,.6)",textTransform:"uppercase"}}>Download on</div><div style={{fontFamily:"Plus Jakarta Sans",fontWeight:700,fontSize:".8rem"}}>App Store</div></div></a>
            </div>
          </div>
        </div>

        {/* Right */}
        <div>
          {/* Account info */}
          <div className="card mb-4">
            <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)"}}>
              <h3 className="h4">Account details</h3>
            </div>
            {[
              {icon:User,label:"Full name",value:name},
              {icon:Phone,label:"Phone number",value:user.phone_number},
              {icon:Shield,label:"Account type",value:isDriver?"Driver & Passenger":"Passenger"},
            ].map(({icon:Icon,label,value})=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:36,height:36,borderRadius:"var(--r)",background:"var(--green-p)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--green)",flexShrink:0}}><Icon size={16}/></div>
                <div style={{flex:1}}>
                  <div className="text-xs text-muted">{label}</div>
                  <div style={{fontWeight:600,fontSize:".9rem",marginTop:1}}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick navigation */}
          <div className="card mb-4">
            <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)"}}>
              <h3 className="h4">Quick access</h3>
            </div>
            {[
              {href:"/search",icon:BookOpen,label:"Find a trip",sub:"Search available trips"},
              {href:"/my-bookings",icon:BookOpen,label:"My bookings",sub:"View all your bookings"},
              {href:"/chat",icon:MessageCircle,label:"Chat",sub:"Messages with drivers & passengers"},
              {href:"/notifications",icon:Bell,label:"Notifications",sub:"Trip updates and alerts"},
              ...(isDriver?[
                {href:"/my-trips",icon:Car,label:"My trips",sub:"Manage trips you\'ve posted"},
                {href:"/post-trip",icon:Car,label:"Post a trip",sub:"Publish a new trip for passengers"},
              ]:[]),
            ].map(({href,icon:Icon,label,sub})=>(
              <Link key={href} href={href} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:"1px solid var(--border)",textDecoration:"none",color:"inherit",transition:".1s"}} className="card-pressable">
                <div style={{width:36,height:36,borderRadius:"var(--r)",background:"var(--cream)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--green)",flexShrink:0}}><Icon size={16}/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:".9rem"}}>{label}</div>
                  <div className="text-xs text-muted">{sub}</div>
                </div>
              </Link>
            ))}
            <div style={{padding:"8px 20px"}}>
              <button onClick={()=>{logout();router.push("/");}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px",borderRadius:"var(--r)",color:"var(--danger)",fontWeight:600,fontSize:".875rem",border:"none",background:"none",cursor:"pointer",width:"100%",transition:".1s"}}>
                <LogOut size={16}/>Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}