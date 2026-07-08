"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link"; // Import Link for routing

export default function ProfilePage() {
  const [techStack, setTechStack] = useState<string[]>([]);
  const [newTech, setNewTech] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // New state to track if the user is actually logged in
  const [isAuthenticated, setIsAuthenticated] = useState(true); 

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If no user, update state and stop loading
      if (authError || !user) {
        console.warn("No active session found. User must log in.");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("tech_stack")
        .eq("id", user.id)
        .single();

      if (data) {
        setTechStack(data.tech_stack || []);
      } else if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error.message);
      }
      
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to save.' });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, tech_stack: techStack });

    if (error) {
      console.error("Error saving profile:", error.message);
      setMessage({ type: 'error', text: 'Failed to save profile. Check console for details.' });
    } else {
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    }

    setSaving(false);
  }

  function addTech() {
    const trimmedTech = newTech.trim();
    if (trimmedTech && !techStack.some(t => t.toLowerCase() === trimmedTech.toLowerCase())) {
      setTechStack([...techStack, trimmedTech]);
      setNewTech("");
    }
  }

  function removeTech(techToRemove: string) {
    setTechStack(techStack.filter((t) => t !== techToRemove));
  }

  // --- RENDERING ---

  // 1. Show a friendly prompt if they are not logged in
  if (!loading && !isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-gold-500 mb-4">
          {/* Compass Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
        <p className="text-navy-300 mb-6">You need to chart your course before viewing your profile.</p>
        <Link 
          href="/"
          className="px-6 py-3 bg-gold-500 text-navy-900 font-bold rounded-lg hover:bg-gold-400 transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  // 2. Otherwise, render the profile page as normal
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Your Profile</h1>

      {loading ? (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      ) : (
        <div>
          <h2 className="text-gold-400 font-semibold mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {techStack.length === 0 && (
              <p className="text-gray-500 text-sm italic">No technologies added yet.</p>
            )}
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-navy-700 border border-navy-600 text-white rounded-full text-sm flex items-center gap-2 transition-colors hover:border-navy-500"
              >
                {tech}
                <button
                  onClick={() => removeTech(tech)}
                  className="text-gray-400 hover:text-red-400 focus:outline-none"
                  aria-label={`Remove ${tech}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTech()}
              placeholder="Add a technology (e.g. Golang, Node.js, C++)..."
              className="flex-1 px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
            />
            <button
              onClick={addTech}
              disabled={!newTech.trim()}
              className="px-4 py-2 bg-navy-700 text-gold-400 border border-navy-600 font-semibold rounded-lg hover:bg-navy-600 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-6 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            
            {message && (
              <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}