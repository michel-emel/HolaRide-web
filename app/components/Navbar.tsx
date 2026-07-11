"use client";
import {useState,useEffect} from "react";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {Car,Search,Bell,Menu,X,Home,BookOpen,Plus,LogOut,User,MessageCircle,Map,ArrowLeftRight} from "lucide-react";
import {useAuth} from "../lib/context";
import {api} from "../lib/api";

// ── Switch mode modal ────────────────────────────────────────────────────
function SwitchModal({onClose}:{onClose:()=>void}){
  const {mode,setMode,isDriverMode}=useAuth();

  function doSwitch(){
    setMode(isDriverMode?"passenger":"driver");
    onClose();
  }

  return(
    <div
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:500,
        display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:28,maxWidth:380,width:"100%",
        boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        {/* Icon */}
        <div style={{width:56,height:56,borderRadius:16,
          background:isDriverMode?"var(--green-p)":"#FFF3CD",
          display:"flex",alignItems:"center",justifyContent:"center",
          margin:"0 auto 16px",fontSize:"1.75rem"}}>
          {isDriverMode?"👤":"🚗"}
        </div>

        <h2 style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.2rem",
          textAlign:"center",marginBottom:8}}>
          Switch to {isDriverMode?"passenger":"driver"} mode
        </h2>
        <p style={{textAlign:"center",fontSize:".875rem",color:"var(--muted)",
          lineHeight:1.5,marginBottom:24}}>
          {isDriverMode
            ?"You'll switch to passenger view — search and book trips."
            :"You'll switch to driver view — post trips and manage bookings."}
        </p>

        {/* Current mode indicator */}
        <div style={{background:"var(--cream)",borderRadius:12,padding:"10px 14px",
          marginBottom:20,display:"flex",alignItems:"center",gap:8,fontSize:".83rem"}}>
          <span>{isDriverMode?"🚗":"👤"}</span>
          <span style={{color:"var(--muted)"}}>Currently in</span>
          <span style={{fontWeight:700,color:"var(--dark)"}}>
            {isDriverMode?"Driver mode":"Passenger mode"}
          </span>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose}
            style={{flex:1,padding:"11px",borderRadius:12,border:"1.5px solid var(--border)",
              background:"none",cursor:"pointer",fontWeight:600,fontSize:".875rem",color:"var(--muted)"}}>
            Stay here
          </button>
          <button onClick={doSwitch}
            style={{flex:1,padding:"11px",borderRadius:12,border:"none",
              background:"var(--green)",color:"#fff",cursor:"pointer",
              fontWeight:700,fontSize:".875rem",display:"flex",alignItems:"center",
              justifyContent:"center",gap:6}}>
            <ArrowLeftRight size={15}/>
            Switch
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────
export default function Navbar(){
  const {user,token,isDriver,isDriverMode,mode,logout}=useAuth();
  const path=usePathname();
  const router=useRouter();
  const [mobileOpen,setMobileOpen]=useState(false);
  const [switchOpen,setSwitchOpen]=useState(false);
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
  const active=(href:string)=>path===href||path.startsWith(href+"/");

  return(
    <>
      <nav className="nav">
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon"><Car size={18}/></div>
            <span><span style={{color:"var(--dark)"}}>Hola</span><span style={{color:"var(--green)"}}>Ride</span></span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            <Link href="/" className={`nav-link${path==="/"?" active":""}`}><Home size={15}/>Home</Link>
            <Link href="/search" className={`nav-link${active("/search")?" active":""}`}><Search size={15}/>Find a Ride</Link>
            {user&&<Link href="/my-bookings" className={`nav-link${active("/my-bookings")?" active":""}`}><BookOpen size={15}/>My Bookings</Link>}
            {user&&<Link href="/chat" className={`nav-link${active("/chat")?" active":""}`}><MessageCircle size={15}/>Chat</Link>}
            {isDriverMode&&<Link href="/my-trips" className={`nav-link nav-link-driver${active("/my-trips")?" active":""}`}><Map size={15}/>My Trips</Link>}
            {isDriverMode&&<Link href="/post-trip" className={`nav-link nav-link-driver${active("/post-trip")?" active":""}`}><Plus size={15}/>Post a Trip</Link>}
          </div>

          {/* Actions */}
          <div className="nav-actions">
            {/* Driver mode badge */}
            {isDriver&&(
              <button onClick={()=>setSwitchOpen(true)}
                style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"6px 12px",borderRadius:100,border:"none",cursor:"pointer",
                  background:isDriverMode?"var(--green)":"var(--cream-d)",
                  color:isDriverMode?"#fff":"var(--dark)",
                  fontSize:".78rem",fontWeight:700,transition:".2s",
                }}>
                {isDriverMode?"🚗 Driver":"👤 Passenger"}
              </button>
            )}

            {/* Notification bell */}
            {user&&(
              <Link href="/notifications" style={{position:"relative"}}>
                <button className="nav-notif"><Bell size={18}/>
                  {unread>0&&<span className="nav-badge">{unread>9?"9+":unread}</span>}
                </button>
              </Link>
            )}

            {/* Avatar dropdown */}
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
                  {isDriverMode&&<Link href="/my-trips" className="dropdown-item"><Map size={14}/>My trips</Link>}
                  {isDriverMode&&<Link href="/post-trip" className="dropdown-item"><Plus size={14}/>Post a trip</Link>}
                  {isDriver&&(
                    <>
                      <div className="dropdown-sep"/>
                      <button onClick={()=>setSwitchOpen(true)} className="dropdown-item" style={{color:"var(--green)"}}>
                        <ArrowLeftRight size={14}/>Switch to {isDriverMode?"passenger":"driver"} mode
                      </button>
                    </>
                  )}
                  <div className="dropdown-sep"/>
                  <button onClick={doLogout} className="dropdown-item" style={{color:"var(--danger)"}}><LogOut size={14}/>Sign out</button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",gap:8}}>
                <Link href="/login?mode=register" className="btn btn-outline btn-sm" style={{borderColor:"var(--green)",color:"var(--green)"}}>Register</Link>
                <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
              </div>
            )}
            <button className="nav-menu-btn" onClick={()=>setMobileOpen(true)}><Menu size={22}/></button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${mobileOpen?" open":""}`} onClick={e=>{if(e.target===e.currentTarget)setMobileOpen(false)}}>
        <div className="mobile-panel">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.1rem"}}>Menu</span>
            <button onClick={()=>setMobileOpen(false)} style={{border:"none",background:"none",cursor:"pointer",color:"var(--muted)"}}><X size={22}/></button>
          </div>

          {user&&(
            <div style={{marginBottom:16,padding:"10px 14px",background:"var(--green-p)",borderRadius:12,
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:".875rem",fontWeight:600,color:"var(--green)"}}>
                👋 {user.first_name||user.phone_number}
              </div>
              {isDriver&&(
                <button onClick={()=>{setSwitchOpen(true);setMobileOpen(false);}}
                  style={{fontSize:".72rem",fontWeight:700,padding:"4px 10px",borderRadius:100,
                    border:"none",cursor:"pointer",
                    background:isDriverMode?"var(--green)":"var(--cream-d)",
                    color:isDriverMode?"#fff":"var(--dark)"}}>
                  {isDriverMode?"🚗 Driver":"👤 Passenger"}
                </button>
              )}
            </div>
          )}

          {[
            {href:"/",label:"Home",icon:Home},
            {href:"/search",label:"Find a Ride",icon:Search},
            ...(user?[
              {href:"/my-bookings",label:"My Bookings",icon:BookOpen},
              {href:"/chat",label:"Chat",icon:MessageCircle},
              {href:"/notifications",label:"Notifications",icon:Bell},
              {href:"/profile",label:"Profile",icon:User},
            ]:[]),
            ...(isDriverMode?[
              {href:"/my-trips",label:"My Trips",icon:Map},
              {href:"/post-trip",label:"Post a Trip",icon:Plus},
            ]:[]),
          ].map(({href,label,icon:Icon})=>(
            <Link key={href} href={href} onClick={()=>setMobileOpen(false)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"12px",
                borderRadius:10,color:"var(--dark)",fontWeight:500,textDecoration:"none"}}>
              <Icon size={18} color="var(--green)"/>{label}
            </Link>
          ))}

          {user&&(
            <button onClick={doLogout}
              style={{display:"flex",alignItems:"center",gap:10,padding:"12px",borderRadius:10,
                color:"var(--danger)",fontWeight:500,border:"none",background:"none",
                width:"100%",cursor:"pointer",marginTop:8}}>
              <LogOut size={18}/>Sign out
            </button>
          )}
          {!user&&(
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:12}}>
            <Link href="/login?mode=register" className="btn btn-block"
              onClick={()=>setMobileOpen(false)}
              style={{borderRadius:12,justifyContent:"center",background:"var(--cream)",
                color:"var(--green)",border:"1.5px solid var(--green)"}}>
              Register
            </Link>
            <Link href="/login" className="btn btn-primary btn-block"
              onClick={()=>setMobileOpen(false)}
              style={{borderRadius:12,justifyContent:"center"}}>
              Sign in
            </Link>
          </div>
          )}
        </div>
      </div>

      {/* Switch mode modal */}
      {switchOpen&&<SwitchModal onClose={()=>setSwitchOpen(false)}/>}
    </>
  );
}