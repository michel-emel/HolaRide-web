"use client";
import {useState,useEffect,useRef} from "react";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {Car,Search,Bell,Menu,X,Home,BookOpen,Plus,LogOut,User,MessageCircle,Map} from "lucide-react";
import {useAuth} from "../lib/context";
import {api} from "../lib/api";

export default function Navbar(){
  const {user,token,isDriver,logout}=useAuth();
  const path=usePathname();
  const router=useRouter();
  const [mobileOpen,setMobileOpen]=useState(false);
  const [unread,setUnread]=useState(0);

  useEffect(()=>{
    if(!token) return;
    api.get("/me/notifications/unread-count",token).then(d=>setUnread(d?.count||0)).catch(()=>{});
    const iv=setInterval(()=>{
      api.get("/me/notifications/unread-count",token).then(d=>setUnread(d?.count||0)).catch(()=>{});
    },30000);
    return ()=>clearInterval(iv);
  },[token]);

  const initial=user?.first_name?.[0]?.toUpperCase()||"?";

  function doLogout(){logout();router.push("/");}
  const active=(href:string)=>path===href||path.startsWith(href+"/")||path.startsWith(href.replace(/\/[^/]+$/,""));

  return(
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon"><Car size={18}/></div>
            <span><span style={{color:"var(--dark)"}}>Hola</span><span style={{color:"var(--green)"}}>Ride</span></span>
          </Link>

          <div className="nav-links">
            <Link href="/" className={`nav-link${active("/")&&path==="/"?" active":""}`}><Home size={15}/>Home</Link>
            <Link href="/search" className={`nav-link${active("/search")?" active":""}`}><Search size={15}/>Find a Ride</Link>
            {user&&<Link href="/my-bookings" className={`nav-link${active("/my-bookings")?" active":""}`}><BookOpen size={15}/>My Bookings</Link>}
            {user&&<Link href="/chat" className={`nav-link${active("/chat")?" active":""}`}><MessageCircle size={15}/>Chat</Link>}
            {isDriver&&<Link href="/my-trips" className={`nav-link nav-link-driver${active("/my-trips")?" active":""}`}><Map size={15}/>My Trips</Link>}
            {isDriver&&<Link href="/post-trip" className={`nav-link nav-link-driver${active("/post-trip")?" active":""}`}><Plus size={15}/>Post a Trip</Link>}
          </div>

          <div className="nav-actions">
            {user&&(
              <Link href="/notifications" style={{position:"relative"}}>
                <button className="nav-notif"><Bell size={18}/>
                  {unread>0&&<span className="nav-badge">{unread>9?"9+":unread}</span>}
                </button>
              </Link>
            )}
            {user?(
              <div className="dropdown">
                <button className="nav-avatar">{initial}</button>
                <div className="dropdown-menu">
                  <div style={{padding:"8px 12px 4px",fontSize:".8rem",color:"var(--muted)",fontWeight:600}}>
                    {user.first_name||user.phone_number}
                  </div>
                  <div className="dropdown-sep"/>
                  <Link href="/profile" className="dropdown-item"><User size={14}/>Profile</Link>
                  <Link href="/my-bookings" className="dropdown-item"><BookOpen size={14}/>My bookings</Link>
                  {isDriver&&<Link href="/my-trips" className="dropdown-item"><Map size={14}/>My trips</Link>}
                  {isDriver&&<Link href="/post-trip" className="dropdown-item"><Plus size={14}/>Post a trip</Link>}
                  <div className="dropdown-sep"/>
                  <button onClick={doLogout} className="dropdown-item" style={{color:"var(--danger)"}}><LogOut size={14}/>Sign out</button>
                </div>
              </div>
            ):(
              <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
            )}
            <button className="nav-menu-btn" onClick={()=>setMobileOpen(true)}><Menu size={22}/></button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${mobileOpen?" open":""}`} onClick={e=>{if(e.target===e.currentTarget)setMobileOpen(false)}}>
        <div className="mobile-panel">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <span style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.1rem"}}>Menu</span>
            <button onClick={()=>setMobileOpen(false)} style={{border:"none",background:"none",cursor:"pointer",color:"var(--muted)"}}><X size={22}/></button>
          </div>
          {user&&<div style={{marginBottom:16,padding:"10px 12px",background:"var(--green-p)",borderRadius:12,fontSize:".875rem",fontWeight:600,color:"var(--green)"}}>👋 {user.first_name||user.phone_number}</div>}
          {[
            {href:"/",label:"Home",icon:Home},
            {href:"/search",label:"Find a Ride",icon:Search},
            ...(user?[{href:"/my-bookings",label:"My Bookings",icon:BookOpen},{href:"/chat",label:"Chat",icon:MessageCircle},{href:"/notifications",label:"Notifications",icon:Bell},{href:"/profile",label:"Profile",icon:User}]:[]),
            ...(isDriver?[{href:"/my-trips",label:"My Trips",icon:Map},{href:"/post-trip",label:"Post a Trip",icon:Plus}]:[]),
          ].map(({href,label,icon:Icon})=>(
            <Link key={href} href={href} onClick={()=>setMobileOpen(false)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px",borderRadius:10,color:"var(--dark)",fontWeight:500}}>
              <Icon size={18} color="var(--green)"/>{label}
            </Link>
          ))}
          {user?(
            <button onClick={doLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"12px",borderRadius:10,color:"var(--danger)",fontWeight:500,border:"none",background:"none",width:"100%",cursor:"pointer",marginTop:8}}>
              <LogOut size={18}/>Sign out
            </button>
          ):(
            <Link href="/login" className="btn btn-primary btn-block" onClick={()=>setMobileOpen(false)} style={{marginTop:12,borderRadius:12,justifyContent:"center"}}>Sign in</Link>
          )}
        </div>
      </div>
    </>
  );
}