"use client";
import React,{createContext,useContext,useState,useEffect,useCallback} from "react";
import {getToken,getUser,saveSession,clearSession} from "./api";

export interface AppUser{id:string;phone_number:string;first_name?:string;last_name?:string;role:string;}
type Mode="passenger"|"driver";
interface AuthCtx{
  user:AppUser|null;token:string|null;
  isDriver:boolean;      // account is a driver (role===driver)
  mode:Mode;             // current active mode (UI)
  isDriverMode:boolean;  // isDriver && mode==="driver"
  setMode:(m:Mode)=>void;
  login:(t:string,u:AppUser)=>void;logout:()=>void;reload:()=>void;
}

const Ctx=createContext<AuthCtx|null>(null);

export function AuthProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<AppUser|null>(null);
  const [token,setToken]=useState<string|null>(null);
  const [mode,setModeState]=useState<Mode>("passenger");

  const reload=useCallback(()=>{
    setToken(getToken());
    setUser(getUser<AppUser>());
    const saved=typeof window!=="undefined"?localStorage.getItem("hr_mode"):null;
    if(saved==="driver") setModeState("driver");
  },[]);

  useEffect(()=>{reload();},[reload]);

  const login=(t:string,u:AppUser)=>{
    saveSession(t,u);setToken(t);setUser(u);
    // Default mode based on role
    const saved=typeof window!=="undefined"?localStorage.getItem("hr_mode"):null;
    if(u.role==="driver"&&saved==="driver") setModeState("driver");
    else setModeState("passenger");
  };

  const logout=()=>{clearSession();setToken(null);setUser(null);setModeState("passenger");};

  const setMode=(m:Mode)=>{
    setModeState(m);
    if(typeof window!=="undefined") localStorage.setItem("hr_mode",m);
  };

  const isDriver=user?.role==="driver"||user?.role==="admin";
  const isDriverMode=isDriver&&mode==="driver";

  return(
    <Ctx.Provider value={{user,token,isDriver,mode,isDriverMode,setMode,login,logout,reload}}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth=()=>{const c=useContext(Ctx);if(!c)throw new Error("AuthProvider missing");return c;};