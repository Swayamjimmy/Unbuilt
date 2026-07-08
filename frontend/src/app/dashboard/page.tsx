"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Ensure this client is correctly initialized

// Define the shape of a single idea
interface DiscoveredIdea {
  title?: string;
  description?: string;
  // Add other properties from your backend if needed
}

// Update the Voyage interface to remove 'any'
interface Voyage {
  id: string;
  created_at: string;
  interests: string[];
  tech_stack: string[];
  // Results can be an array of ideas, or an object containing an 'ideas' array
  results: DiscoveredIdea[] | { ideas?: DiscoveredIdea[] };
}

export default function DashboardPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [selectedVoyage, setSelectedVoyage] = useState<Voyage | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all voyages for the current user on mount
  useEffect(() => {
    async function loadVoyages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("voyages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching voyages:", error);
      } else if (data) {
        setVoyages(data);
      }
      setLoading(false);
    }

    loadVoyages();
  }, []);

  return (
    <div className="flex h-full min-h-screen">
      {/* Saved Voyages Sidebar */}
      <aside className="w-80 border-r border-navy-700 bg-navy-900 p-4 overflow-y-auto">
        <h2 className="text-gold-400 font-bold text-lg mb-4">
          Saved Voyages
        </h2>
        
        {loading ? (
          <p className="text-gray-400">Loading voyages...</p>
        ) : voyages.length === 0 ? (
          <p className="text-gray-400">No voyages yet. Start discovering!</p>
        ) : (
          <ul className="space-y-2">
            {voyages.map((voyage) => (
              <li key={voyage.id}>
                <button
                  onClick={() => setSelectedVoyage(voyage)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedVoyage?.id === voyage.id
                      ? "bg-navy-700 border border-gold-400"
                      : "bg-navy-800 hover:bg-navy-700"
                  }`}
                >
                  <p className="text-white font-medium truncate">
                    {(voyage.interests || []).join(", ") || "Untitled Voyage"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {new Date(voyage.created_at).toLocaleDateString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Voyage Detail View */}
      <main className="flex-1 p-8 overflow-y-auto">
        {selectedVoyage ? (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Voyage Details
            </h1>
            <p className="text-gray-400 mb-6">
              {new Date(selectedVoyage.created_at).toLocaleDateString()}
            </p>
            
            <div className="mb-4">
              <h3 className="text-gold-400 font-semibold mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedVoyage.tech_stack || []).map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-navy-700 text-white rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-gold-400 font-semibold mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedVoyage.interests || []).map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-navy-700 text-white rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-gold-400 font-semibold mb-4">
                Discovered Ideas
              </h3>
              <div className="space-y-4">
                {(Array.isArray(selectedVoyage.results) 
                  ? selectedVoyage.results 
                  : selectedVoyage.results?.ideas || []
                ).map((idea: DiscoveredIdea, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-navy-800 rounded-lg border border-navy-600"
                  >
                    <h4 className="text-white font-bold mb-2">
                      {idea.title || "Untitled Idea"}
                    </h4>
                    <p className="text-gray-300">{idea.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-lg">
              Select a voyage to view its discoveries.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}