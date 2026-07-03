import type {Metadata,Viewport} from "next";
import {AuthProvider} from "./lib/context";
import Navbar from "./components/Navbar";
import "./globals.css";

export const metadata:Metadata={
  title:"HolaRide — Intercity ride-sharing in Cameroon",
  description:"Find a verified driver going your way. Share the cost, skip the bus terminal.",
  manifest:"/manifest.json",
};
export const viewport:Viewport={themeColor:"#1B6B45",width:"device-width",initialScale:1};

export default function RootLayout({children}:{children:React.ReactNode}){
  return(
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar/>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}