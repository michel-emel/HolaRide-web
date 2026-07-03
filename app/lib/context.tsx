"use client";
import React,{createContext,useContext,useState,useEffect,useCallback} from "react";
import {getToken,getUser,saveSession,clearSession} from "./api";

export interface AppUser{id:string;phone_number:string;first_name?:string;last_name?:string;role:string}
interface AuthCtx{user:AppUser|null;token:string|null;isDriver:boolean;login:(t:string,u:AppUser)=>void;logout:()=>void;reload:()=>void}

const Ctx = createContext<AuthCtx|null>(null);

export function AuthProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<AppUser|null>(null);
  const [token,setToken]=useState<string|null>(null);
  const reload=useCallback(()=>{setToken(getToken());setUser(getUser<AppUser>());},[]);
  useEffect(()=>{reload();},[reload]);
  const login=(t:string,u:AppUser)=>{saveSession(t,u);setToken(t);setUser(u);};
  const logout=()=>{clearSession();setToken(null);setUser(null);};
  const isDriver=user?.role==="driver"||user?.role==="admin";
  return <Ctx.Provider value={{user,token,isDriver,login,logout,reload}}>{children}</Ctx.Provider>;
}
export const useAuth=()=>{const c=useContext(Ctx);if(!c)throw new Error("need AuthProvider");return c;};