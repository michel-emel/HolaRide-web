import Link from "next/link";
import {Star,Users,Calendar,MapPin} from "lucide-react";
import {fmt,fmtDate,fmtTime} from "../lib/api";

interface Trip{
  id:string;origin_city:string;destination_city:string;
  origin_location?:string;destination_location?:string;
  departure_time:string;price_per_seat:number;available_seats:number;
  driver_name:string;driver_rating_average?:number|null;
  driver_rating_count:number;vehicle_label?:string;
}

export default function TripCard({trip}:{trip:Trip}){
  return(
    <Link href={`/trips/${trip.id}`} className="card card-pressable trip-card" style={{display:"block"}}>
      <div className="flex items-center gap-3 mb-3">
        <div className="avatar" style={{width:44,height:44,fontSize:"1rem",flexShrink:0}}>
          {trip.driver_name?.[0]?.toUpperCase()||"?"}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:".9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{trip.driver_name}</div>
          <div className="flex items-center gap-2 text-xs text-muted mt-1">
            {trip.driver_rating_count>0&&<span className="flex items-center gap-1"><Star size={11} fill="var(--gold)" color="var(--gold)"/>{trip.driver_rating_average?.toFixed(1)}</span>}
            {trip.vehicle_label&&<span>{trip.vehicle_label}</span>}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:"1.1rem",color:"var(--green)"}}>{fmt(trip.price_per_seat)}</div>
          <div className="text-xs text-muted">/ seat</div>
        </div>
      </div>

      <div className="route-wrap mb-3">
        <div className="route-line"><div className="dot-start"/><div className="line-mid"/><div className="dot-end"/></div>
        <div className="route-text">
          <div>
            <div style={{fontWeight:700}}>{trip.origin_city}</div>
            {trip.origin_location&&<div className="text-xs text-muted">{trip.origin_location}</div>}
          </div>
          <div style={{height:10}}/>
          <div>
            <div style={{fontWeight:700}}>{trip.destination_city}</div>
            {trip.destination_location&&<div className="text-xs text-muted">{trip.destination_location}</div>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-muted">
          <Calendar size={13}/>{fmtDate(trip.departure_time)} · {fmtTime(trip.departure_time)}
        </span>
        <span className="seats-pill"><Users size={11}/>{trip.available_seats} seats left</span>
      </div>
    </Link>
  );
}