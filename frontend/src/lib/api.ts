// API client for communicating with the IdeaForge backend

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL environment variable is missing"
  );
}


// Request type for idea generation
export interface GenerateIdeasRequest {
  tech_stack: string[];
  interests: string[];
  github_url?: string;
}


// Response from generate endpoint
export interface GenerateIdeasResponse {
  job_id: string;
  status: JobStatus["status"];
  stage?: string | null;
  ideas?: IdeaResult[] | null;
}


// Status response from polling endpoint
export interface JobStatus {
  job_id: string;
  status:
    | "queued"
    | "scouting"
    | "analyzing"
    | "architecting"
    | "complete"
    | "error"
    | "not_found";
  stage?: string | null;
  ideas?: IdeaResult[] | null;
}


// A single idea result from the agents
export interface IdeaResult {
  title: string;
  description: string;

  pain_point?: string;

  evidence: EvidenceLink[];

  tech_stack?: string[];

  difficulty?:
    | "beginner"
    | "intermediate"
    | "advanced";

  estimated_weeks?: number;

  why_this_matches: string;
}


// Evidence returned by architect agent
export interface EvidenceLink {
  source: string;
  quote: string;
  url?: string;
}


// Submit a new idea generation request
export async function postGenerateIdeas(
  request: GenerateIdeasRequest
): Promise<GenerateIdeasResponse> {
  console.log(
    "POSTING GENERATION REQUEST:",
    request
  );

  const response = await fetch(
    `${API_URL}/api/generate-ideas`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(request),
    }
  );

  const body = await response.text();

  console.log(
    "GENERATION RESPONSE:",
    response.status,
    body
  );

  if (!response.ok) {
    throw new Error(
      `Generation request failed `
      + `(${response.status}): ${body}`
    );
  }

  return JSON.parse(body);
}


// Poll the status of a running job
export async function pollJobStatus(
  jobId: string
): Promise<JobStatus> {
  const response = await fetch(
    `${API_URL}/api/status/${jobId}`
  );

  const body = await response.text();

  console.log(
    "STATUS RESPONSE:",
    response.status,
    body
  );

  if (!response.ok) {
    throw new Error(
      `Status poll failed `
      + `(${response.status}): ${body}`
    );
  }

  return JSON.parse(body);
}