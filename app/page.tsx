"use client";
import {useState,useEffect,useRef} from "react";
import Link from "next/link";
import {Search,ArrowRight,Shield,Star,MessageCircle,Clock,Users,TrendingUp,Car,Smartphone,ChevronRight, Plus} from "lucide-react";
import TripCard from "./components/TripCard";
import {api,fmt} from "./lib/api";
import {useAuth} from "./lib/context";

interface Trip{id:string;origin_city:string;destination_city:string;origin_location?:string;destination_location?:string;departure_time:string;price_per_seat:number;available_seats:number;driver_name:string;driver_rating_average?:number|null;driver_rating_count:number;vehicle_label?:string;}

export default function HomePage(){
  const {user,isDriver}=useAuth();
  const [trips,setTrips]=useState<Trip[]>([]);
  const [loading,setLoading]=useState(true);
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");

  useEffect(()=>{
    api.get("/trips?limit=6").then(d=>setTrips(Array.isArray(d)?d:d.trips||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  return(
    <>
      {/* HERO */}
      <div className="hero">
        <div className="container" style={{position:"relative",zIndex:1}}>
          <div style={{maxWidth:700}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.15)",borderRadius:100,padding:"5px 14px",fontSize:".8rem",color:"rgba(255,255,255,.9)",fontWeight:600,marginBottom:20}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>Available across Cameroon
            </div>
            <h1 className="h1" style={{color:"#fff",marginBottom:14}}>
              Travel between cities,{" "}<span style={{color:"var(--gold)"}}>together.</span>
            </h1>
            <p style={{fontSize:"1.1rem",color:"rgba(255,255,255,.8)",marginBottom:32,lineHeight:1.6}}>
              Find a verified driver going your way. Share the cost, skip the bus terminal. Safe, affordable intercity travel for Cameroon.
            </p>
            {/* Quick search */}
            <div style={{background:"#fff",borderRadius:20,padding:20,boxShadow:"0 8px 32px rgba(0,0,0,.2)",display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{flex:"1 1 140px"}}>
                <label className="label">From</label>
                <div className="input-group">
                  <Search size={15} className="icon"/>
                  <input className="input" placeholder="Yaoundé" value={from} onChange={e=>setFrom(e.target.value)} style={{paddingLeft:36}}/>
                </div>
              </div>
              <div style={{flex:"1 1 140px"}}>
                <label className="label">To</label>
                <input className="input" placeholder="Douala" value={to} onChange={e=>setTo(e.target.value)}/>
              </div>
              <Link href={`/search${from||to?"?from="+encodeURIComponent(from)+"&to="+encodeURIComponent(to):""}`}
                className="btn btn-primary btn-lg" style={{flexShrink:0,borderRadius:"var(--r-lg)"}}>
                <Search size={16}/>Search trips
              </Link>
            </div>

            {/* Driver CTA */}
            <div style={{marginTop:16,display:"flex",gap:12,flexWrap:"wrap"}}>
              <Link href="/post-trip" className="btn" style={{background:"rgba(255,255,255,.15)",color:"#fff",borderRadius:100,padding:"10px 20px",fontSize:".875rem"}}>
                <Car size={15}/>Post a trip as driver <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{background:"var(--white)",borderBottom:"1px solid var(--border)"}}>
        <div className="container">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:0}}>
            {[["15,000+","Verified travelers"],["40,000+","Trips completed"],["4.8 ★","Average rating"],["50+","Cities connected"]].map(([v,l])=>(
              <div key={l} style={{padding:"24px 28px",borderRight:"1px solid var(--border)"}}>
                <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:900,fontSize:"1.5rem",color:"var(--green)"}}>{v}</div>
                <div style={{fontSize:".8rem",color:"var(--muted)",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AVAILABLE TRIPS */}
      <div className="section">
        <div className="container">
          <div className="sec-hdr">
            <div>
              <h2 className="h2" style={{marginBottom:4}}>Available trips</h2>
              <p className="text-sm text-muted">Live trips posted by verified drivers</p>
            </div>
            <Link href="/search" className="btn btn-outline btn-sm flex items-center gap-2">See all <ArrowRight size={14}/></Link>
          </div>
          {loading?(
            <div style={{textAlign:"center",padding:"40px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>
          ):trips.length===0?(
            <div className="empty">
              <div className="empty-icon"><Car size={28}/></div>
              <div className="h3 mb-2">No trips posted yet</div>
              <p className="text-muted text-sm">Check back soon or be the first to post a trip!</p>
              <Link href="/post-trip" className="btn btn-primary mt-4">Post a trip</Link>
            </div>
          ):(
            <div className="grid-3">{trips.map(t=><TripCard key={t.id} trip={t}/>)}</div>
          )}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section" style={{background:"var(--white)"}}>
        <div className="container">
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 className="h2 mb-3">How HolaRide works</h2>
            <p className="lead">Simple, safe, and affordable intercity travel</p>
          </div>
          <div className="grid-3">
            {[
              {n:"01",title:"Find a trip",desc:"Search by city, date, and number of seats. Browse real trips posted by verified drivers.",href:"/search",cta:"Search trips"},
              {n:"02",title:"Book your seat",desc:"Request a seat. The driver accepts or declines. Pay 80% or 100% via Mobile Money.",href:"/search",cta:"Book now"},
              {n:"03",title:"Travel safely",desc:"Chat with your driver, share live location, and rate each other after the trip.",href:"/search",cta:"Get started"},
            ].map(s=>(
              <div key={s.n} className="card card-p" style={{textAlign:"center",borderTop:"4px solid var(--green)"}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"var(--green-p)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontFamily:"Plus Jakarta Sans",fontWeight:900,fontSize:"1.2rem",color:"var(--green)"}}>{s.n}</div>
                <h3 className="h4 mb-2">{s.title}</h3>
                <p className="text-sm text-muted" style={{lineHeight:1.6,marginBottom:16}}>{s.desc}</p>
                <Link href={s.href} className="btn btn-secondary btn-sm">{s.cta} <ChevronRight size={13}/></Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DRIVER SECTION */}
      <div className="section">
        <div className="container">
          <div style={{background:"linear-gradient(135deg,var(--green-d),var(--green))",borderRadius:24,padding:"48px 40px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:40,alignItems:"center"}}>
            <div>
              <div style={{background:"rgba(255,255,255,.15)",borderRadius:100,padding:"5px 14px",fontSize:".8rem",color:"rgba(255,255,255,.8)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:6,marginBottom:16}}>
                <Car size={13}/>For drivers
              </div>
              <h2 className="h2" style={{color:"#fff",marginBottom:12}}>Share your ride,<br/>earn on the way</h2>
              <p style={{color:"rgba(255,255,255,.8)",lineHeight:1.6,marginBottom:24,fontSize:".95rem"}}>
                Already driving between cities? Post your trip and split the cost with passengers. Get your vehicle approved, post in 2 minutes, and start earning.
              </p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <Link href="/post-trip" className="btn btn-lg" style={{background:"#fff",color:"var(--green)",borderRadius:14}}>
                  <Plus size={16}/>Post a trip
                </Link>
                <Link href="/my-trips" className="btn btn-lg" style={{background:"rgba(255,255,255,.15)",color:"#fff",borderRadius:14}}>
                  My trips
                </Link>
              </div>
            </div>
            <div className="grid-2" style={{gap:16}}>
              {[
                {icon:Shield,title:"Admin-approved",desc:"Every vehicle verified before accepting passengers"},
                {icon:Star,title:"Build your rating",desc:"Great service earns you more bookings"},
                {icon:Clock,title:"Flexible schedule",desc:"Post trips on your own schedule"},
                {icon:TrendingUp,title:"Earn more",desc:"Split costs or earn extra income"},
              ].map(({icon:Icon,title,desc})=>(
                <div key={title} style={{background:"rgba(255,255,255,.1)",borderRadius:14,padding:"14px 16px"}}>
                  <Icon size={20} color="rgba(255,255,255,.9)" style={{marginBottom:8}}/>
                  <div style={{color:"#fff",fontWeight:700,fontSize:".875rem",marginBottom:4}}>{title}</div>
                  <div style={{color:"rgba(255,255,255,.7)",fontSize:".78rem",lineHeight:1.4}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WHY HOLARIDE */}
      <div className="section" style={{background:"var(--white)"}}>
        <div className="container">
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 className="h2 mb-3">Why choose HolaRide?</h2>
          </div>
          <div className="grid-4">
            {[
              {icon:Shield,title:"Verified drivers",desc:"Admin-approved vehicles. Every driver screened."},
              {icon:Star,title:"Bidirectional ratings",desc:"Both passengers and drivers rate each other."},
              {icon:MessageCircle,title:"In-trip chat",desc:"Coordinate directly with your driver or passengers."},
              {icon:Smartphone,title:"Mobile Money",desc:"Pay securely with MTN or Orange Mobile Money."},
            ].map(({icon:Icon,title,desc})=>(
              <div key={title} className="card card-p" style={{textAlign:"center"}}>
                <div style={{width:48,height:48,borderRadius:14,background:"var(--green-p)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:"var(--green)"}}><Icon size={22}/></div>
                <div className="h4 mb-2">{title}</div>
                <p className="text-sm text-muted" style={{lineHeight:1.5}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* APP DOWNLOAD */}
      <div className="section">
        <div className="container">
          <div className="card" style={{padding:"40px",textAlign:"center",maxWidth:600,margin:"0 auto",background:"var(--green-p)",border:"2px solid var(--green-p)"}}>
            <div style={{fontSize:"2.5rem",marginBottom:12}}>📱</div>
            <h2 className="h2 mb-3" style={{color:"var(--green)"}}>Get the mobile app</h2>
            <p className="lead mb-6" style={{fontSize:".95rem"}}>Same account, richer experience. Real-time notifications, live location tracking, and seamless Mobile Money payments.</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <a href="#" className="store-btn"><span style={{fontSize:"1.4rem"}}>🤖</span><div><div style={{fontSize:".65rem",color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:".06em"}}>Get it on</div><div style={{fontFamily:"Plus Jakarta Sans",fontWeight:700,fontSize:".95rem"}}>Google Play</div></div></a>
              <a href="#" className="store-btn"><span style={{fontSize:"1.4rem"}}>🍎</span><div><div style={{fontSize:".65rem",color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:".06em"}}>Download on</div><div style={{fontFamily:"Plus Jakarta Sans",fontWeight:700,fontSize:".95rem"}}>App Store</div></div></a>
            </div>
            <p style={{fontSize:".78rem",color:"var(--muted)",marginTop:16}}>✓ Your web account works seamlessly in the app</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{background:"var(--green-d)",color:"rgba(255,255,255,.7)",padding:"48px 0 32px"}}>
        <div className="container">
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:40,marginBottom:32}}>
            <div>
              <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:900,fontSize:"1.25rem",color:"#fff",marginBottom:12}}>HolaRide</div>
              <p style={{fontSize:".875rem",lineHeight:1.6,maxWidth:280}}>Intercity ride-sharing built for Cameroon. Safe, affordable, and reliable.</p>
            </div>
            <div>
              <div style={{fontWeight:700,color:"#fff",marginBottom:12,fontSize:".9rem"}}>For passengers</div>
              {[["Search trips","/search"],["My bookings","/my-bookings"],["Chat","/chat"],["Notifications","/notifications"]].map(([l,h])=>(
                <Link key={l} href={h} style={{display:"block",fontSize:".85rem",padding:"4px 0",transition:".1s"}}
                  onMouseOver={e=>(e.currentTarget.style.color="#fff")} onMouseOut={e=>(e.currentTarget.style.color="")}>{l}</Link>
              ))}
            </div>
            <div>
              <div style={{fontWeight:700,color:"#fff",marginBottom:12,fontSize:".9rem"}}>For drivers</div>
              {[["Post a trip","/post-trip"],["My trips","/my-trips"],["Profile","/profile"]].map(([l,h])=>(
                <Link key={l} href={h} style={{display:"block",fontSize:".85rem",padding:"4px 0",transition:".1s"}}
                  onMouseOver={e=>(e.currentTarget.style.color="#fff")} onMouseOut={e=>(e.currentTarget.style.color="")}>{l}</Link>
              ))}
            </div>
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:24,fontSize:".8rem",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <span>© 2025 HolaRide. All rights reserved.</span>
            <span>Built for Cameroon 🇨🇲</span>
          </div>
        </div>
      </footer>
    </>
  );
}