"use client";
import {useState,useEffect,Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {Search,Filter,Calendar,Users,X,SlidersHorizontal} from "lucide-react";
import TripCard from "../components/TripCard";
import {api} from "../lib/api";

interface Trip{id:string;origin_city:string;destination_city:string;origin_location?:string;destination_location?:string;departure_time:string;price_per_seat:number;available_seats:number;driver_name:string;driver_rating_average?:number|null;driver_rating_count:number;vehicle_label?:string;}
interface Loc{id:string;name:string;city_name:string;}

function SearchContent(){
  const params=useSearchParams();
  const [locs,setLocs]=useState<Loc[]>([]);
  const [trips,setTrips]=useState<Trip[]>([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const [form,setForm]=useState({from:params.get("from")||"",to:params.get("to")||"",date:"",seats:"1",sortBy:"departure"});

  useEffect(()=>{
    api.get("/locations").then(d=>setLocs(Array.isArray(d)?d:d.locations||[])).catch(()=>{});
    if(params.get("from")||params.get("to")) doSearch({from:params.get("from")||"",to:params.get("to")||"",date:"",seats:"1",sortBy:"departure"});
    else doSearch({from:"",to:"",date:"",seats:"1",sortBy:"departure"});
  },[]);

  function doSearch(f=form){
    setLoading(true);setSearched(true);
    const q=new URLSearchParams();
    if(f.from) q.set("departure_city",f.from);
    if(f.to) q.set("destination_city",f.to);
    if(f.date) q.set("date",f.date);
    if(f.seats) q.set("min_seats",f.seats);
    api.get(`/trips/search?${q}`).then(d=>setTrips(Array.isArray(d)?d:d.trips||[])).catch(()=>setTrips([])).finally(()=>setLoading(false));
  }

  function submit(e:React.FormEvent){e.preventDefault();doSearch();}
  function clear(){const f={from:"",to:"",date:"",seats:"1",sortBy:"departure"};setForm(f);doSearch(f);}

  const cities=[...new Set(locs.map(l=>l.city_name))];
  const hasFilter=form.from||form.to||form.date;

  return(
    <div className="page">
      {/* Search form */}
      <div className="card card-p mb-6" style={{borderTop:"4px solid var(--green)"}}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="h3 flex items-center gap-2"><Search size={20} className="text-green"/>Find a trip</h1>
          {hasFilter&&<button onClick={clear} className="btn btn-ghost btn-sm flex items-center gap-1"><X size={13}/>Clear filters</button>}
        </div>
        <form onSubmit={submit}>
          <div className="grid-4" style={{marginBottom:16}}>
            <div>
              <label className="label">From city</label>
              <select className="select" value={form.from} onChange={e=>setForm(f=>({...f,from:e.target.value}))}>
                <option value="">Any city</option>
                {cities.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">To city</label>
              <select className="select" value={form.to} onChange={e=>setForm(f=>({...f,to:e.target.value}))}>
                <option value="">Any city</option>
                {cities.filter(c=>c!==form.from).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <div className="input-group">
                <Calendar size={15} className="icon"/>
                <input type="date" className="input" value={form.date} min={new Date().toISOString().split("T")[0]}
                  onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{paddingLeft:36}}/>
              </div>
            </div>
            <div>
              <label className="label">Min seats</label>
              <div className="input-group">
                <Users size={15} className="icon"/>
                <select className="select" value={form.seats} onChange={e=>setForm(f=>({...f,seats:e.target.value}))} style={{paddingLeft:36}}>
                  {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+ seat{n>1?"s":""}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading?<><div className="spinner"/>Searching...</>:<><Search size={16}/>Search trips</>}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading?(
        <div style={{textAlign:"center",padding:"60px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto 12px"}}/><p className="text-muted text-sm">Finding trips...</p></div>
      ):searched&&trips.length===0?(
        <div className="empty">
          <div className="empty-icon"><Search size={28}/></div>
          <h3 className="h3 mb-2">No trips found</h3>
          <p className="text-muted text-sm mb-4">Try different cities or dates, or remove some filters.</p>
          <button onClick={clear} className="btn btn-outline btn-sm">Clear filters</button>
        </div>
      ):(
        <>
          {searched&&<div className="flex items-center gap-2 mb-4 text-sm text-muted"><SlidersHorizontal size={14}/>{trips.length} trip{trips.length!==1?"s":""} found</div>}
          <div className="grid-3">{trips.map(t=><TripCard key={t.id} trip={t}/>)}</div>
        </>
      )}
    </div>
  );
}

export default function SearchPage(){return <Suspense><SearchContent/></Suspense>;}