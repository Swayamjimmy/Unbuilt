"use client";

import { useState, useEffect } from "react";
import {
  postGenerateIdeas,
  pollJobStatus,
  GenerateIdeasRequest,
  JobStatus,
  IdeaResult,
} from "@/lib/api";

// Stage labels for the compass progress indicator
const STAGE_LABELS: Record<string, string> = {
  scouting: "Scouting the seas for signals...",
  analyzing: "Analyzing discoveries...",
  architecting: "Forging your ideas...",
};

export default function DiscoverPage() {
  // Form state
  const [techStack, setTechStack] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [interests, setInterests] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // Polling state
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [results, setResults] = useState<IdeaResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add a tech stack tag when user presses Enter
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!techStack.includes(tagInput.trim().toLowerCase())) {
        setTechStack([...techStack, tagInput.trim().toLowerCase()]);
      }
      setTagInput("");
    }
  };

  // Remove a tech stack tag
  const handleRemoveTag = (tag: string) => {
    setTechStack(techStack.filter((t) => t !== tag));
  };

  // Submit the form and start idea generation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults(null);
    setStatus(null);

    const request: GenerateIdeasRequest = {
      tech_stack: techStack,
      interests: interests.split(",").map((i) => i.trim()).filter(Boolean),
      ...(githubUrl && { github_url: githubUrl }),
    };

    try {
      const { job_id } = await postGenerateIdeas(request);
      setJobId(job_id);
      setIsPolling(true);
    } catch (err) {
      setError("Failed to start idea generation. Please try again.");
    }
  };

  // Poll for job status every 1.5 seconds
  useEffect(() => {
    if (!isPolling || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const jobStatus = await pollJobStatus(jobId);
        setStatus(jobStatus);

        // Show partial results as they arrive
        if (jobStatus.partial_results) {
          setResults(jobStatus.partial_results);
        }

        // Stop polling when complete or errored
        if (jobStatus.status === "complete") {
          setResults(jobStatus.final_results || []);
          setIsPolling(false);
        } else if (jobStatus.status === "error") {
          setError(jobStatus.error || "An unexpected error occurred.");
          setIsPolling(false);
        }
      } catch (err) {
        setError("Lost connection to the server. Please try again.");
        setIsPolling(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isPolling, jobId]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gold-400 mb-2">
        Discover New Ideas
      </h1>
      <p className="text-navy-300 mb-8">
        Tell us about your skills and interests. Our agents will navigate the
        seas of developer communities to find validated project ideas for you.
      </p>

      {/* Input Form */}
      {!isPolling && !results && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tech Stack Tag Selector */}
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-2">
              Your Tech Stack
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {techStack.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-navy-700 text-gold-300 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-navy-400 hover:text-red-400"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type a technology and press Enter (e.g. python, react, aws)"
              className="w-full px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          {/* Interest Keywords */}
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-2">
              Interests &amp; Keywords
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. machine learning, developer tools, automation"
              className="w-full px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <p className="text-xs text-navy-400 mt-1">
              Separate multiple interests with commas.
            </p>
          </div>

          {/* Optional GitHub URL */}
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-2">
              GitHub Profile URL (optional)
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourusername"
              className="w-full px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={techStack.length === 0 && interests.trim() === ""}
            className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Sail for Ideas
          </button>

          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </form>
      )}

      {/* Polling Progress UI */}
      {isPolling && (
        <div className="flex flex-col items-center justify-center py-16">
          {/* Animated compass spinner */}
          <div className="w-24 h-24 border-4 border-navy-600 border-t-gold-400 rounded-full animate-spin mb-6" />
          <p className="text-gold-300 text-lg font-medium">
            {status ? STAGE_LABELS[status.status] || "Processing..." : "Setting sail..."}
          </p>
          <p className="text-navy-400 text-sm mt-2">
            This may take 30-60 seconds while our agents search.
          </p>

          {/* Progressive reveal of partial results */}
          {results && results.length > 0 && (
            <div className="mt-8 w-full">
              <p className="text-navy-300 text-sm mb-4">
                Discoveries so far:
              </p>
              <div className="space-y-4">
                {results.map((idea, index) => (
                  <IdeaCard key={index} idea={idea} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results View */}
      {!isPolling && results && results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gold-400">
              Your Discoveries
            </h2>
            <button
              onClick={() => {
                setResults(null);
                setJobId(null);
                setStatus(null);
              }}
              className="px-4 py-2 text-sm border border-navy-600 text-navy-300 rounded-lg hover:bg-navy-800 transition"
            >
              Start New Voyage
            </button>
          </div>
          <div className="space-y-6">
            {results.map((idea, index) => (
              <IdeaCard key={index} idea={idea} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Idea card component with evidence and feasibility
function IdeaCard({ idea }: { idea: IdeaResult }) {
  // Map feasibility level to visual indicator
  const feasibilityColor = {
    low: "text-red-400 bg-red-400/10",
    medium: "text-yellow-400 bg-yellow-400/10",
    high: "text-green-400 bg-green-400/10",
  }[idea.feasibility];

  return (
    <div className="border border-navy-600 rounded-xl p-6 bg-navy-800/50">
      {/* Title and feasibility badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">{idea.title}</h3>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${feasibilityColor}`}
        >
          {idea.feasibility} feasibility
        </span>
      </div>

      {/* Description */}
      <p className="text-navy-300 mb-4">{idea.description}</p>

      {/* Why this matches you */}
      <div className="mb-4 p-3 rounded-lg bg-gold-500/10 border border-gold-500/20">
        <p className="text-sm text-gold-300">
          <span className="font-medium">Why this matches you:</span>{" "}
          {idea.match_reason}
        </p>
      </div>

      {/* Evidence links */}
      <div>
        <p className="text-xs font-medium text-navy-400 uppercase mb-2">
          Demand Evidence
        </p>
        <div className="space-y-2">
          {idea.evidence.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-navy-700/50 hover:bg-navy-700 transition"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-navy-400">
                  {link.source === "reddit" ? "Reddit" : "HackerNews"}
                </span>
                <span className="text-sm text-gold-300">{link.title}</span>
              </div>
              <p className="text-xs text-navy-400">{link.snippet}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}