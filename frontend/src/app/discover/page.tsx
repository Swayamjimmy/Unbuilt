"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  postGenerateIdeas,
  pollJobStatus,
  GenerateIdeasRequest,
  JobStatus,
  IdeaResult,
} from "@/lib/api";


const STAGE_LABELS: Record<string, string> = {
  scouting: "Scouting the seas for signals...",
  analyzing: "Analyzing discoveries...",
  architecting: "Forging your ideas...",
  complete: "Ideas forged successfully.",
};


export default function DiscoverPage() {
  const [techStack, setTechStack] =
    useState<string[]>([]);

  const [tagInput, setTagInput] =
    useState("");

  const [interests, setInterests] =
    useState("");

  const [githubUrl, setGithubUrl] =
    useState("");


  const [jobId, setJobId] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState<JobStatus | null>(null);

  const [isPolling, setIsPolling] =
    useState(false);

  const [results, setResults] =
    useState<IdeaResult[] | null>(null);

  const [error, setError] =
    useState<string | null>(null);


  const handleAddTag = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Enter"
      && tagInput.trim()
    ) {
      e.preventDefault();

      const tag =
        tagInput.trim().toLowerCase();

      if (!techStack.includes(tag)) {
        setTechStack([
          ...techStack,
          tag,
        ]);
      }

      setTagInput("");
    }
  };


  const handleRemoveTag = (
    tag: string
  ) => {
    setTechStack(
      techStack.filter(
        (item) => item !== tag
      )
    );
  };


  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError(null);
    setResults(null);
    setStatus(null);

    const request: GenerateIdeasRequest = {
      tech_stack: techStack,

      interests: interests
        .split(",")
        .map(
          (interest) =>
            interest.trim()
        )
        .filter(Boolean),

      ...(githubUrl.trim() && {
        github_url: githubUrl.trim(),
      }),
    };


    console.log(
      "SUBMITTING:",
      request
    );


    try {
      const response =
        await postGenerateIdeas(
          request
        );

      console.log(
        "JOB CREATED:",
        response
      );

      setJobId(response.job_id);

      setStatus({
        job_id: response.job_id,
        status: response.status,
        stage: response.stage,
        ideas: response.ideas,
      });

      setIsPolling(true);

    } catch (err) {
      console.error(
        "GENERATION ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to start idea generation."
      );
    }
  };


  useEffect(() => {
    if (
      !isPolling
      || !jobId
    ) {
      return;
    }


    const interval =
      setInterval(
async () => {
  try {
    const jobStatus = await pollJobStatus(jobId);

    console.log("JOB STATUS:", jobStatus);

    setStatus(jobStatus);

    // Show ideas if the backend provides any.
    if (jobStatus.ideas) {
      setResults(jobStatus.ideas);
    }

    if (jobStatus.status === "complete") {
      setResults(jobStatus.ideas || []);
      setIsPolling(false);
      return;
    }

    if (jobStatus.status === "error") {
      setError(
        jobStatus.stage || "Idea generation failed."
      );

      setIsPolling(false);
      return;
    }

    if (jobStatus.status === "not_found") {
      setError("Job was not found.");
      setIsPolling(false);
      return;
    }
  } catch (err) {
    console.error("POLLING ERROR:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Lost connection to server."
    );

    setIsPolling(false);
  }
},
1500
);


    return () =>
      clearInterval(interval);

  }, [
    isPolling,
    jobId,
  ]);


  const reset = () => {
    setResults(null);
    setJobId(null);
    setStatus(null);
    setError(null);
  };


  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      <h1 className="text-3xl font-bold text-gold-400 mb-2">
        Discover New Ideas
      </h1>


      <p className="text-gray-400 mb-8">
        Tell us about your skills and
        interests. Our agents will navigate
        developer communities to find
        validated project ideas.
      </p>


      {!isPolling && !results && (

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div>

            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Tech Stack
            </label>


            <div className="flex flex-wrap gap-2 mb-2">

              {techStack.map(
                (tag) => (

                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-navy-700 text-gold-300 text-sm"
                  >

                    {tag}

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveTag(tag)
                      }
                      className="text-gray-400 hover:text-red-400"
                    >
                      &times;
                    </button>

                  </span>

                )
              )}

            </div>


            <input
              type="text"
              value={tagInput}

              onChange={
                (e) =>
                  setTagInput(
                    e.target.value
                  )
              }

              onKeyDown={
                handleAddTag
              }

              placeholder="Type a technology and press Enter"

              className="w-full px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white"
            />

          </div>


          <div>

            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interests & Keywords
            </label>


            <input
              type="text"
              value={interests}

              onChange={
                (e) =>
                  setInterests(
                    e.target.value
                  )
              }

              placeholder="machine learning, developer tools, automation"

              className="w-full px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white"
            />

          </div>


          <div>

            <label className="block text-sm font-medium text-gray-300 mb-2">
              GitHub Profile URL (optional)
            </label>


            <input
              type="url"
              value={githubUrl}

              onChange={
                (e) =>
                  setGithubUrl(
                    e.target.value
                  )
              }

              placeholder="https://github.com/yourusername"

              className="w-full px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white"
            />

          </div>


          <button
            type="submit"

            disabled={
              techStack.length === 0
              && interests.trim() === ""
            }

            className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-lg disabled:opacity-50"
          >
            Set Sail for Ideas
          </button>


          {error && (

            <p className="text-red-400 text-sm">
              {error}
            </p>

          )}

        </form>

      )}


      {isPolling && (

        <div className="flex flex-col items-center justify-center py-16">

          <div className="w-24 h-24 border-4 border-navy-600 border-t-gold-400 rounded-full animate-spin mb-6" />


          <p className="text-gold-300 text-lg font-medium">

            {
              status?.stage

                ? STAGE_LABELS[
                    status.stage
                  ]
                  || "Processing..."

                : "Setting sail..."
            }

          </p>


          <p className="text-gray-400 text-sm mt-2">
            This may take 30-60 seconds
            while our agents search.
          </p>

        </div>

      )}


      {!isPolling && error && (

        <div className="py-8">

          <p className="text-red-400">
            {error}
          </p>


          <button
            onClick={reset}

            className="mt-4 px-4 py-2 border border-navy-600 text-gray-300 rounded-lg"
          >
            Try Again
          </button>

        </div>

      )}


      {!isPolling && results && (

        <div className="space-y-6">

          <div className="flex items-center justify-between">

            <h2 className="text-2xl font-bold text-gold-400">
              Your Discoveries
            </h2>


            <button
              onClick={reset}

              className="px-4 py-2 text-sm border border-navy-600 text-gray-300 rounded-lg"
            >
              Start New Voyage
            </button>

          </div>


          {results.length === 0 ? (

            <p className="text-gray-400">
              No ideas were generated.
            </p>

          ) : (

            results.map(
              (idea, index) => (

                <IdeaCard
                  key={index}
                  idea={idea}
                />

              )
            )

          )}

        </div>

      )}

    </div>
  );
}


function IdeaCard({
  idea,
}: {
  idea: IdeaResult;
}) {

  return (

    <div className="border border-navy-600 rounded-xl p-6 bg-navy-800/50">

      <div className="flex items-start justify-between mb-3">

        <h3 className="text-lg font-semibold text-white">
          {idea.title}
        </h3>


        {idea.difficulty && (

          <span className="px-2 py-1 rounded text-xs text-gold-300 bg-gold-500/10">

            {idea.difficulty}

          </span>

        )}

      </div>


      <p className="text-gray-300 mb-4">
        {idea.description}
      </p>


      {idea.pain_point && (

        <div className="mb-4">

          <p className="text-sm text-gray-400">

            <span className="font-medium text-white">
              Pain point:
            </span>{" "}

            {idea.pain_point}

          </p>

        </div>

      )}


      <div className="mb-4 p-3 rounded-lg bg-gold-500/10 border border-gold-500/20">

        <p className="text-sm text-gold-300">

          <span className="font-medium">
            Why this matches you:
          </span>{" "}

          {idea.why_this_matches}

        </p>

      </div>


      {idea.estimated_weeks && (

        <p className="text-sm text-gray-400 mb-4">

          Estimated build time:{" "}

          {idea.estimated_weeks} weeks

        </p>

      )}


      <div>

        <p className="text-xs font-medium text-gray-400 uppercase mb-2">
          Demand Evidence
        </p>


        <div className="space-y-2">

          {idea.evidence?.map(
            (evidence, index) => (

              <div
                key={index}
                className="p-3 rounded-lg bg-navy-700/50"
              >

                <p className="text-xs text-gray-400 mb-1">
                  {evidence.source}
                </p>


                <p className="text-sm text-gray-300">
                  {evidence.quote}
                </p>


                {evidence.url && (

                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"

                    className="text-xs text-gold-400 hover:text-gold-300"
                  >
                    View source
                  </a>

                )}

              </div>

            )
          )}

        </div>

      </div>

    </div>

  );
}