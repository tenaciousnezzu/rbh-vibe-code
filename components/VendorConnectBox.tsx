"use client";

import { useState } from "react";

const VENDORS = [
  { name: "Tata Power Solar", href: "https://www.tatapowersolar.com" },
  { name: "Amplus Solar", href: "https://www.amplusgreen.com" },
  { name: "CleanMax Solar", href: "https://www.cleanmax.com" },
  { name: "Greenko", href: "https://www.greenkogroup.com" },
  { name: "ReNew Power", href: "https://www.renewpower.in" },
];

const FIELD_STYLE = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid #D1D5DB",
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
  background: "white",
} as React.CSSProperties;

interface Props {
  city: string;
}

export default function VendorConnectBox({ city }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name) { setError("Please enter your name"); return; }
    if (!phone && !email) { setError("Please add a phone number or email"); return; }
    setError("");
    setSubmitted(true);
  }

  return (
    <div className="rounded-xl p-5 w-full" style={{ background: "#F0FAF4", border: "2px solid #1D9E75" }}>
      <div className="flex flex-col md:flex-row gap-5">
        {/* Left column — vendors */}
        <div className="flex-1 md:w-3/5">
          <h4 className="text-base font-semibold text-[#1D9E75] mb-1">Connect with verified installers</h4>
          <p className="text-xs text-gray-500 mb-3">Get quotes from specialists in {city}</p>
          <div className="flex flex-wrap gap-2">
            {VENDORS.map((v) => (
              <a key={v.name} href={v.href} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-[#1D9E75] bg-white hover:bg-[#EAF3DE] transition-colors"
                style={{ border: "1px solid #1D9E75" }}
              >
                {v.name} ↗
              </a>
            ))}
          </div>
        </div>

        {/* Right column — form */}
        <div className="md:w-2/5">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full py-4 text-center">
              <div className="text-[#1D9E75] text-3xl mb-2">✓</div>
              <p className="text-sm font-semibold text-[#1D9E75]">
                Request sent to {VENDORS.length} vendors.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                They will reach out to {name} within 2 business days.
              </p>
              <button onClick={() => { setSubmitted(false); setName(""); setPhone(""); setEmail(""); }}
                className="mt-3 text-xs text-gray-400 underline hover:text-gray-600">
                Close
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 space-y-2.5" style={{ border: "1px solid #C8E6C9" }}>
              <p className="text-xs font-semibold text-gray-700">Request introductions</p>

              {/* Name */}
              <input type="text" placeholder="Your name" value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                style={FIELD_STYLE}
                onFocus={(e) => (e.target.style.borderColor = "#1D9E75")}
                onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
              />

              {/* Phone */}
              <input type="text" placeholder="Contact number" value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                style={FIELD_STYLE}
                onFocus={(e) => (e.target.style.borderColor = "#1D9E75")}
                onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
              />

              {/* Email — Change 3: new field */}
              <input type="email" placeholder="Your email address" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                style={FIELD_STYLE}
                onFocus={(e) => (e.target.style.borderColor = "#1D9E75")}
                onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
              />

              {/* Validation error */}
              {error && (
                <p style={{ color: "#E24B4A", fontSize: 12, margin: 0 }}>{error}</p>
              )}

              <button onClick={handleSubmit}
                className="w-full py-2.5 rounded-lg bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#178560] transition-colors"
              >
                Get connected
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
