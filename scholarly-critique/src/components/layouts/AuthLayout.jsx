
import React from 'react';
import { Link } from 'react-router-dom';
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";

const AuthLayout = ({ children }) => {
  const isSignUp = window.location.pathname.toLowerCase().includes("signup");

  return (
    <div
      className="flex h-screen w-full"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text-color)' }}
    >
      {/* Left Side: Form Panel */}
      <div className="flex-1 h-full px-8 md:px-16 py-10 flex flex-col justify-between bg-#F5F5F5 overflow-y-auto shadow-lg">
        <div className="flex items-center mb-10">         
          <Link to="/welcome" className="flex items-center gap-[0.1px]">
           <img src={logo} alt="Logo" className="h-18 w-auto shrink-1" />
           <h1
             className="text-2xl tracking-tight"
             style={{ fontFamily: "Playfair Display", color: 'var(--primary-color)' }}
           >
            ScholarlyCritique
          </h1>
        </Link>
        </div>

        {children}

        <footer className="text-xs text-gray-500 text-center mt-10">
          &copy; {new Date().getFullYear()} ScholarlyCritique. All rights reserved.
        </footer>
      </div>

      {/* Right Side: Graphic Panel */}
      <div
        className="hidden md:flex flex-1 h-screen overflow-hidden p-8 relative flex-col justify-center items-center text-center text-white"
        style={{
          background: 'linear-gradient(to bottom right, var(--primary-color), #6c3e30)'
        }}
      >
        <div className="absolute w-48 h-48 rounded-[40px] bg-white/10 -top-7 -left-5 blur-sm" />
        <div className="absolute w-48 h-56 rounded-[50px] border-[25px] border-white/20 top-[30%] -right-10 blur-sm" />
        <div className="absolute w-48 h-48 rounded-[40px] bg-white/10 -bottom-10 -left-5 blur-sm" />

        {isSignUp && (
          <div className="z-20 max-w-sm">
            <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ color: 'white' }}>
              Start Reviewing Now!
            </h2>
            <p className="text-lg font-light">
              Join a community of Scholars and Students
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;