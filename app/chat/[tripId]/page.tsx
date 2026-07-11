"use client";
import {useState,useEffect,useRef} from "react";
import {useParams,useRouter} from "next/navigation";
import {ChevronLeft,Send,Trash2,Loader,MapPin,ExternalLink} from "lucide-react";
import {api,fmtTime} from "../../lib/api";
import {useAuth} from "../../lib/context";

interface Msg{id:string;sender_id:string;content:string;created_at:string;message_type:string;}
interface Participant{id:string;first_name?:string;last_name?:string;role:string;}

// Detect GPS coordinates in message content
function parseLocation(content:string):{lat:number;lng:number}|null{
  const m=content.match(/maps\?q=([-\d.]+),([-\d.]+)/)||
           content.match(/([-\d.]+),([-\d.]+)/);
  if(m) return {lat:parseFloat(m[1]),lng:parseFloat(m[2])};
  return null;
}

function MessageContent({content}:{content:string}){
  const loc=parseLocation(content);
  if(loc){
    const mapsUrl=`https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    const osmEmbed=`https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng-0.01},${loc.lat-0.01},${loc.lng+0.01},${loc.lat+0.01}&layer=mapnik&marker=${loc.lat},${loc.lng}`;
    return(
      <div style={{borderRadius:12,overflow:"hidden",border:"1px solid var(--border)",minWidth:220,maxWidth:280}}>
        {/* Map iframe */}
        <div style={{position:"relative",height:160,background:"#e8f0e0"}}>
          <iframe
            src={osmEmbed}
            width="100%" height="160"
            style={{border:"none",display:"block",pointerEvents:"none"}}
            title="Shared location"
          />
          {/* Pin overlay */}
          <div style={{position:"absolute",top:"50%",left:"50%",
            transform:"translate(-50%,-100%)",pointerEvents:"none"}}>
            <div style={{width:28,height:28,borderRadius:"50% 50% 50% 0",
              background:"var(--green)",border:"3px solid #fff",
              transform:"rotate(-45deg)",
              boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}/>
          </div>
        </div>
        {/* Footer */}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",
            background:"var(--white)",textDecoration:"none",
            borderTop:"1px solid var(--border)"}}>
          <MapPin size={14} color="var(--green)"/>
          <span style={{fontWeight:600,fontSize:".82rem",color:"var(--green)",flex:1}}>Open in Google Maps</span>
          <ExternalLink size={13} color="var(--muted)"/>
        </a>
      </div>
    );
  }
  if(content.startsWith("http")){
    return <a href={content} target="_blank" rel="noopener noreferrer"
      style={{color:"inherit",textDecoration:"underline"}}>{content}</a>;
  }
  return <>{content}</>;
}

export default function ChatRoomPage(){
  const {tripId}=useParams<{tripId:string}>();
  const router=useRouter();
  const {user,token}=useAuth();
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [participants,setParticipants]=useState<Record<string,Participant>>({});
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [tripStatus,setTripStatus]=useState("");
  const [tripTitle,setTripTitle]=useState("Trip chat");
  const bottomRef=useRef<HTMLDivElement>(null);

  async function loadMsgs(){
    try{
      const [m,t]=await Promise.all([
        api.get(`/trips/${tripId}/chat/messages`,token),
        api.get(`/trips/${tripId}`,token),
      ]);
      setMsgs(Array.isArray(m)?m:m.messages||[]);
      setTripStatus(t.status||"");
      setTripTitle(`${t.departure_city||""} → ${t.destination_city||""}`);

      // Build participants map: driver + current user
      const parts:Record<string,Participant>={};
      if(t.driver_id){
        parts[t.driver_id]={
          id:t.driver_id,
          first_name:t.driver_first_name,
          last_name:t.driver_last_name,
          role:"driver",
        };
      }
      if(user){
        parts[user.id]={
          id:user.id,
          first_name:user.first_name,
          last_name:user.last_name,
          role:"passenger",
        };
      }
      setParticipants(parts);
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  }

  useEffect(()=>{
    if(!user){router.push("/login");return;}
    loadMsgs();
    const iv=setInterval(loadMsgs,8000);
    return ()=>clearInterval(iv);
  },[user,tripId]);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  function getInitial(senderId:string):string{
    const p=participants[senderId];
    if(!p) return "?";
    return (p.first_name?.[0]||p.last_name?.[0]||"?").toUpperCase();
  }

  function getSenderLabel(senderId:string):string{
    const p=participants[senderId];
    if(!p) return "Unknown";
    const name=[p.first_name,p.last_name].filter(Boolean).join(" ");
    return name||(p.role==="driver"?"Driver":"Passenger");
  }

  async function send(){
    if(!text.trim()||sending) return;
    setSending(true);
    const t=text;setText("");
    try{
      await api.post(`/trips/${tripId}/chat/messages`,{content:t},token);
      await loadMsgs();
    }catch(e:unknown){setText(t);alert(e instanceof Error?e.message:"Failed to send");}
    finally{setSending(false);}
  }

  async function deleteMsg(msgId:string){
    if(!confirm("Delete this message?")) return;
    try{
      await api.del(`/trips/${tripId}/chat/messages/${msgId}`,token);
      await loadMsgs();
    }catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
  }

  const readOnly=["completed","cancelled"].includes(tripStatus);

  return(
    <div className="chat-layout" style={{height:"calc(100vh - 64px)"}}>
      {/* Header */}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10}} className="chat-header">
        <button onClick={()=>router.push("/chat")} className="btn btn-ghost btn-sm" style={{padding:"6px 8px"}}>
          <ChevronLeft size={18}/>
        </button>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:".95rem"}}>{tripTitle}</div>
          {readOnly
            ?<div className="text-xs text-muted">This trip is {tripStatus} — read only</div>
            :<div className="text-xs text-muted">Auto-refreshes every 8s</div>}
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",paddingTop:65}}>
        {/* Messages */}
        <div className="chat-messages" style={{flex:1}}>
          {loading?(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div className="spinner spinner-g" style={{margin:"0 auto"}}/>
            </div>
          ):msgs.length===0?(
            <div style={{textAlign:"center",color:"var(--muted)",fontSize:".875rem",padding:"40px 0"}}>
              No messages yet. Say hello! 👋
            </div>
          ):msgs.map(m=>{
            if(m.message_type==="system") return(
              <div key={m.id} className="msg msg-sys">{m.content}</div>
            );
            if(m.message_type==="deleted") return(
              <div key={m.id} className="msg msg-sys" style={{fontStyle:"italic"}}>Message deleted</div>
            );
            const isMe=m.sender_id===user?.id;
            const initial=getInitial(m.sender_id);
            const senderLabel=getSenderLabel(m.sender_id);
            return(
              <div key={m.id} style={{
                alignSelf:isMe?"flex-end":"flex-start",
                display:"flex",
                flexDirection:isMe?"row-reverse":"row",
                alignItems:"flex-end",
                gap:8,maxWidth:"72%",
                marginLeft:isMe?"auto":"0",
              }}>
                {!isMe&&(
                  <div title={senderLabel} style={{
                    width:28,height:28,borderRadius:"50%",
                    background:"var(--green)",color:"#fff",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:".7rem",fontWeight:700,flexShrink:0,
                  }}>
                    {initial}
                  </div>
                )}
                <div>
                  {!isMe&&(
                    <div style={{fontSize:".7rem",color:"var(--muted)",marginBottom:2,paddingLeft:2}}>
                      {senderLabel}
                    </div>
                  )}
                  <div className={`msg${isMe?" msg-me":" msg-them"}`} style={{position:"relative"}}>
                    <MessageContent content={m.content}/>
                    {isMe&&(
                      <button onClick={()=>deleteMsg(m.id)}
                        style={{position:"absolute",top:-6,right:-6,background:"var(--danger)",
                          border:"none",borderRadius:"50%",width:18,height:18,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          cursor:"pointer",opacity:0}}
                        onMouseOver={e=>(e.currentTarget.style.opacity="1")}
                        onMouseOut={e=>(e.currentTarget.style.opacity="0")}>
                        <Trash2 size={10} color="#fff"/>
                      </button>
                    )}
                  </div>
                  <div style={{fontSize:".68rem",color:"var(--muted)",marginTop:3,
                    textAlign:isMe?"right":"left"}}>
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        {readOnly?(
          <div className="chat-footer" style={{justifyContent:"center",color:"var(--muted)",fontSize:".875rem"}}>
            🔒 This chat is {tripStatus==="cancelled"?"cancelled":"completed"} — read only
          </div>
        ):(
          <div className="chat-footer">
            <input className="input" style={{flex:1}} placeholder="Type a message..."
              value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} autoFocus/>
            <button onClick={send} disabled={!text.trim()||sending}
              className="btn btn-primary" style={{borderRadius:12,padding:"11px 16px",flexShrink:0}}>
              {sending?<Loader size={16} className="spinner"/>:<Send size={16}/>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
