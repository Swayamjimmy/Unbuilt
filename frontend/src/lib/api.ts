// API client for communicating with the IdeaForge backend

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Request type for idea generation
export interface GenerateIdeasRequest {
  tech_stack: string[];
  interests: string[];
  github_url?: string;
}

// Response from the generate endpoint
export interface GenerateIdeasResponse {
  job_id: string;
}

// Status response from polling endpoint
export interface JobStatus {
  status: "scouting" | "analyzing" | "architecting" | "complete" | "error";
  partial_results?: IdeaResult[];
  final_results?: IdeaResult[];
  error?: string;
}

// A single idea result from the agents
export interface IdeaResult {
  title: string;
  description: string;
  evidence: EvidenceLink[];
  feasibility: "low" | "medium" | "high";
  match_reason: string;
}

// Evidence link from Reddit or HackerNews
export interface EvidenceLink {
  source: "reddit" | "hackernews";
  title: string;
  url: string;
  snippet: string;
}

// Submit a new idea generation request
export async function postGenerateIdeas(
  request: GenerateIdeasRequest
): Promise<GenerateIdeasResponse> {
  const response = await fetch(`${API_URL}/api/generate-ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Generation request failed: ${response.statusText}`);
  }

  return response.json();
}

// Poll the status of a running job
export async function pollJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_URL}/api/status/${jobId}`);

  if (!response.ok) {
    throw new Error(`Status poll failed: ${response.statusText}`);
  }

  return response.json();
}