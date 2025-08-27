"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const COLLEGE_NAME = "BESC College";
const COLLEGE_TAGLINE = "Empowering Students for a Brighter Future";
const COLLEGE_MISSION = "Your one-stop portal for admissions, profiles, notifications, and all student services.";

const features = [
  {
    title: "Study Materials",
    description: "Access and download study materials and resources anytime.",
    illustration: "/illustrations/notifications/class.svg",
  },
  {
    title: "Exam Notifications",
    description: "Get real-time updates on upcoming exams and results.",
    illustration: "/illustrations/notifications/assignment.svg",
  },
  {
    title: "Library Management",
    description: "Search, borrow, and track library books easily.",
    illustration: "/illustrations/profile/academic.svg",
  },
  {
    title: "Attendance Tracking",
    description: "Track your attendance and mark presence digitally.",
    illustration: "/illustrations/profile/address.svg",
  },
];

const steps = [
  {
    icon: "/illustrations/notifications/class.svg",
    title: "Register",
    desc: "Create your student account in a few easy steps.",
  },
  {
    icon: "/illustrations/profile/background.svg",
    title: "Apply",
    desc: "Fill out your admission form and upload documents.",
  },
  {
    icon: "/illustrations/notifications/assignment.svg",
    title: "Track",
    desc: "Get updates on your application and student journey.",
  },
];

export default function Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="w-full flex flex-col min-h-screen bg-gradient-to-b from-purple-100 via-white to-purple-50 font-sans h-screen overflow-auto">
      {/* Navbar/Header */}
      <header className="fixed top-0 left-0 w-full z-30 bg-white/70 backdrop-blur border-b border-gray-200 transition-all">
        <nav className="max-w-6xl mx-auto flex items-center justify-between py-3 px-6">
          <div className="flex items-center gap-3">
            <img
              src="/besc-logo.jpeg"
              alt={COLLEGE_NAME}
              className="w-9 h-9 rounded-full border-2 border-purple-400 bg-white shadow"
            />
            <span className="text-xl font-bold text-purple-800 tracking-tight">{COLLEGE_NAME}</span>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-gray-700 font-medium hover:text-purple-700 transition">Features</Link>
            <Link href="#how" className="text-gray-700 font-medium hover:text-purple-700 transition">How it works</Link>
            <Link href="/admissions" className="text-gray-700 font-medium hover:text-purple-700 transition">Admissions</Link>
            <Link
              href="/login"
              className="ml-2 px-5 py-1.5 rounded-full border-2 border-purple-500 text-purple-700 font-semibold bg-white shadow hover:bg-purple-50 hover:text-purple-900 transition"
            >
              Login
            </Link>
          </div>
          {/* Hamburger for mobile */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Open menu"
          >
            <svg className="w-7 h-7 text-purple-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur border-b border-purple-100 shadow-lg px-6 py-4 flex flex-col gap-4 animate-fade-in z-40">
            <Link href="#features" className="text-gray-700 font-medium hover:text-purple-700 transition" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="#how" className="text-gray-700 font-medium hover:text-purple-700 transition" onClick={() => setMobileMenuOpen(false)}>How it works</Link>
            <Link href="/admissions" className="text-gray-700 font-medium hover:text-purple-700 transition" onClick={() => setMobileMenuOpen(false)}>Admissions</Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full border-2 border-purple-500 text-purple-700 font-semibold bg-white shadow hover:bg-purple-50 hover:text-purple-900 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative w-full flex flex-col items-center justify-center pt-[72px] md:pt-24 pb-10 px-1 min-h-[70vh] bg-gradient-to-br from-purple-400/30 via-white to-purple-200 overflow-hidden">
        {/* Floating shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200 rounded-full blur-2xl opacity-40 animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
        {/* Glassy Card */}
        <div className="relative z-10 w-full max-w-4xl mx-auto rounded-3xl bg-white/60 backdrop-blur-lg shadow-2xl px-2 sm:px-4 md:px-10 md:py-12 flex flex-col md:flex-row items-center gap-6 md:gap-10 border border-purple-100">
          <div className="flex-1 flex flex-col items-center md:items-start justify-center text-center md:text-left gap-3 w-full break-words">
            <h1 className="w-full text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold mb-1 text-gray-900 leading-tight break-words">
              <span>BESC </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-purple-700">College</span>
            </h1>
            <h2 className="w-full text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-purple-600 mb-1 break-words">{COLLEGE_TAGLINE}</h2>
            <p className="w-full text-sm xs:text-base sm:text-lg text-gray-700 mb-3 max-w-xl break-words">{COLLEGE_MISSION}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center md:justify-start">
              <Link
                href="/admissions"
                className="inline-block bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold px-6 py-3 rounded-full shadow-lg text-base sm:text-lg hover:scale-105 hover:from-purple-600 hover:to-purple-800 transition text-center w-full sm:w-auto"
              >
                Apply for Admission
              </Link>
              <Link
                href="/login"
                className="inline-block bg-white border-2 border-purple-200 text-purple-700 font-bold px-6 py-3 rounded-full shadow hover:bg-purple-50 hover:text-purple-900 transition text-center w-full sm:w-auto"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center w-full md:w-auto mt-4 md:mt-0">
            <img
              src="/illustrations/landing-page-illustration.png"
              alt="Students Illustration"
              className="max-w-full h-auto w-40 xs:w-48 sm:w-64 md:w-full max-w-[220px] sm:max-w-xs md:max-w-md drop-shadow-2xl animate-float rounded-md mx-auto"
              style={{ minHeight: 120, maxHeight: 220, objectFit: 'contain' }}
            />
          </div>
        </div>
        {/* Scroll Down Indicator */}
        <div className="absolute left-1/2 bottom-6 -translate-x-1/2 flex flex-col items-center z-20">
          <span className="text-purple-400 text-xs mb-1">Scroll</span>
          <div className="w-6 h-6 rounded-full border-2 border-purple-300 flex items-center justify-center animate-bounce">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 w-full flex flex-col items-center bg-gradient-to-b from-white via-purple-50 to-purple-100">
        <div className="max-w-6xl w-full mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14 text-gray-900">Features</h2>
          <div className="grid md:grid-cols-4 gap-8 w-full">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.6, type: "spring" }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.06, boxShadow: "0 8px 32px 0 rgba(168,85,247,0.18)" }}
                className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-lg flex flex-col items-center text-center transition-transform duration-300 border border-purple-100 hover:bg-purple-100"
              >
                <img src={feature.illustration} alt={feature.title} className="w-16 h-16 mb-4" />
                <h3 className="text-lg font-bold text-purple-700 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how" className="py-20 px-4 w-full flex flex-col items-center bg-gradient-to-b from-purple-100 via-white to-purple-50">
        <div className="max-w-5xl w-full mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-purple-700">How it works</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-purple-200 z-0" style={{ transform: 'translateY(-50%)' }} />
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.6, type: "spring" }}
                viewport={{ once: true }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow flex flex-col items-center text-center border border-purple-100 relative z-10"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 via-purple-100 to-purple-300 flex items-center justify-center mb-4 shadow-md">
                  <img src={step.icon} alt={step.title} className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-purple-700 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gradient-to-r from-purple-800 to-purple-900 border-t border-purple-900 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2 px-6">
          <div className="flex items-center gap-3">
            <img src="/besc-logo.jpeg" alt={COLLEGE_NAME} className="w-7 h-7 rounded-full border border-purple-300 bg-white shadow" />
            <span className="text-base font-semibold text-white">{COLLEGE_NAME}</span>
            <div className="flex gap-2 ml-2">
              {/* Facebook SVG */}
              <a href="#" className="text-purple-300 hover:text-white" aria-label="Facebook">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.406.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.406 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
              </a>
              {/* Twitter SVG */}
              <a href="#" className="text-purple-300 hover:text-white" aria-label="Twitter">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.38 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.938-.856 2.021-.857 3.17 0 2.188 1.115 4.116 2.823 5.247a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.142 0 14.307-7.721 13.995-14.646A9.936 9.936 0 0 0 24 4.557z"/></svg>
              </a>
              {/* LinkedIn SVG */}
              <a href="#" className="text-purple-300 hover:text-white" aria-label="LinkedIn">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11.75 20h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.25 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.599v5.597z"/></svg>
              </a>
            </div>
          </div>
          {/* <div className="flex flex-col md:items-end items-center gap-1">
            <div className="flex items-center gap-1 text-purple-200 text-sm">
              <span>Powered by</span>
              <img src="/datachef-logo.svg" alt="DataChef" className="w-6 h-6 rounded-full bg-white border border-purple-300" />
              <span className="font-bold text-white">DataChef</span>
            </div>
          </div> */}
        </div>
      </footer>
      <style>{`
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s cubic-bezier(0.4,0,0.6,1) infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .transition-transform {
          transition: transform 0.3s cubic-bezier(0.4,0,0.6,1);
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
