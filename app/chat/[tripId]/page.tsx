"use client";
import {useState,useEffect,useRef} from "react";
import {useParams,useRouter} from "next/navigation";
import {ChevronLeft,Send,Trash2,Loader} from "lucide-react";
import {api,fmtTime} from "../../lib/api";
import {useAuth} from "../../lib/context";

interface Msg{id:string;sender_id:string;content:string;created_at:string;message_type:string;}

export default function ChatRoomPage(){
  const {tripId}=useParams<{tripId:string}>();
  const router=useRouter();
  const {user,token}=useAuth();
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [tripStatus,setTripStatus]=useState("");
  const bottomRef=useRef<HTMLDivElement>(null);

  async function loadMsgs(){
    try{
      const [m,t]=await Promise.all([api.get(`/trips/${tripId}/messages`,token),api.get(`/trips/${tripId}`,token)]);
      setMsgs(Array.isArray(m)?m:m.messages||[]);
      setTripStatus(t.status||"");
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

  async function send(){
    if(!text.trim()||sending) return;
    setSending(true);
    const t=text;setText("");
    try{
      await api.post(`/trips/${tripId}/messages`,{content:t},token);
      await loadMsgs();
    }catch(e:unknown){setText(t);alert(e instanceof Error?e.message:"Failed to send");}
    finally{setSending(false);}
  }

  async function deleteMsg(msgId:string){
    if(!confirm("Delete this message?")) return;
    try{await api.patch(`/trips/${tripId}/messages/${msgId}/delete`,undefined,token);await loadMsgs();}catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
  }

  const readOnly=["completed","cancelled"].includes(tripStatus);

  return(
    <div className="chat-layout" style={{height:"calc(100vh - 64px)"}}>
      {/* Header */}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10}} className="chat-header">
        <button onClick={()=>router.push("/chat")} className="btn btn-ghost btn-sm" style={{padding:"6px 8px"}}><ChevronLeft size={18}/></button>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:".95rem"}}>Trip chat</div>
          {readOnly&&<div className="text-xs text-muted">This trip is {tripStatus} — read only</div>}
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",paddingTop:65}}>
        {/* Messages */}
        <div className="chat-messages" style={{flex:1}}>
          {loading?(
            <div style={{textAlign:"center",padding:"40px 0"}}><div className="spinner spinner-g" style={{margin:"0 auto"}}/></div>
          ):msgs.length===0?(
            <div style={{textAlign:"center",color:"var(--muted)",fontSize:".875rem",padding:"40px 0"}}>No messages yet. Say hello! 👋</div>
          ):msgs.map(m=>{
            if(m.message_type==="system") return <div key={m.id} className="msg msg-sys">{m.content}</div>;
            if(m.message_type==="deleted") return <div key={m.id} className="msg msg-sys" style={{fontStyle:"italic"}}>Message deleted</div>;
            const isMe=m.sender_id===user?.id;
            return(
              <div key={m.id} style={{alignSelf:isMe?"flex-end":"flex-start",display:"flex",flexDirection:isMe?"row-reverse":"row",alignItems:"flex-end",gap:8,maxWidth:"72%",marginLeft:isMe?"auto":"0"}}>
                {!isMe&&<div className="avatar" style={{width:28,height:28,fontSize:".7rem",flexShrink:0}}>?</div>}
                <div>
                  <div className={`msg${isMe?" msg-me":" msg-them"}`} style={{position:"relative"}}>
                    {m.content}
                    {isMe&&(
                      <button onClick={()=>deleteMsg(m.id)} style={{position:"absolute",top:-6,right:-6,background:"var(--danger)",border:"none",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",opacity:0}} onMouseOver={e=>(e.currentTarget.style.opacity="1")} onMouseOut={e=>(e.currentTarget.style.opacity="0")}>
                        <Trash2 size={10} color="#fff"/>
                      </button>
                    )}
                  </div>
                  <div style={{fontSize:".68rem",color:"var(--muted)",marginTop:3,textAlign:isMe?"right":"left"}}>{fmtTime(m.created_at)}</div>
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
            <input className="input" style={{flex:1}} placeholder="Type a message..." value={text}
              onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} autoFocus/>
            <button onClick={send} disabled={!text.trim()||sending} className="btn btn-primary" style={{borderRadius:12,padding:"11px 16px",flexShrink:0}}>
              {sending?<Loader size={16} className="spinner"/>:<Send size={16}/>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}