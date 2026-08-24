# IdeaForge

> **Discover your next software project through real community demand.**

IdeaForge is an AI-powered project discovery platform that helps developers move beyond generic project ideas and discover software opportunities grounded in problems people are actively discussing online.

Instead of asking an LLM:

> *"Give me some project ideas for machine learning and web development."*

IdeaForge takes a research-first approach:

1. Understands the developer's interests and preferred technologies.
2. Generates targeted problem-oriented research queries.
3. Searches relevant discussions on Reddit and Hacker News.
4. Extracts community pain points and demand signals.
5. Scores and filters the strongest signals.
6. Uses an LLM to synthesize those signals into concrete, buildable software projects.
7. Returns project ideas with supporting evidence, suggested technology, difficulty, and estimated development time.

The result is not simply an AI-generated list of ideas. It is a **research-backed project discovery pipeline** designed to answer a much more useful question:

> **What should I build that people might actually care about?**

The application combines a Next.js frontend, Supabase authentication and persistence, a FastAPI backend, an asynchronous AWS job-processing architecture, LangGraph orchestration, Reddit and Hacker News research, and Gemini-powered idea synthesis.

---

# Table of Contents

* [The Problem](#the-problem)
* [Why IdeaForge is Useful](#why-ideaforge-is-useful)
* [How IdeaForge Works](#how-ideaforge-works)
* [High-Level Architecture](#high-level-architecture)
* [The Research Pipeline](#the-research-pipeline)

  * [1. Scout](#1-scout)
  * [2. Analyst](#2-analyst)
  * [3. Architect](#3-architect)
* [Reddit Research](#reddit-research)
* [Hacker News Research](#hacker-news-research)
* [Demand Signal Analysis](#demand-signal-analysis)
* [LangGraph Workflow](#langgraph-workflow)
* [Asynchronous Job Architecture](#asynchronous-job-architecture)
* [Frontend Architecture](#frontend-architecture)
* [Backend Architecture](#backend-architecture)
* [AWS Architecture](#aws-architecture)
* [Deployment Flow](#deployment-flow)
* [CI/CD Pipeline](#cicd-pipeline)
* [Project Structure](#project-structure)
* [API Reference](#api-reference)
* [Data Flow](#complete-end-to-end-data-flow)
* [Environment Variables](#environment-variables)
* [Running Locally](#running-locally)
* [Docker and AWS Lambda](#docker-and-aws-lambda)
* [Technology Stack](#technology-stack)
* [Key Design Decisions](#key-design-decisions)
* [Future Improvements](#future-improvements)

---

# The Problem

Developers constantly face the same problem:

> **"What should I build next?"**

The usual solutions are often not particularly useful.

You can:

* Browse lists of portfolio project ideas.
* Ask ChatGPT or another LLM for suggestions.
* Build a clone of an existing application.
* Pick a random problem and start coding.

The problem with these approaches is that they usually start with **the solution instead of the problem**.

For example, asking an AI:

```text
Give me five project ideas using Python and React.
```

may generate ideas such as:

* Task manager
* AI chatbot
* Expense tracker
* Weather application
* Blog platform

These projects can demonstrate technical skills, but there is no evidence that anyone actually needs them.

IdeaForge reverses this process.

Instead of:

```text
Developer interests
        ↓
Ask AI for ideas
        ↓
Generic projects
```

the application follows:

```text
Developer interests
        ↓
Research real communities
        ↓
Find complaints and unmet needs
        ↓
Analyze demand signals
        ↓
Validate promising problems
        ↓
AI synthesizes solutions
        ↓
Concrete project ideas
```

This makes IdeaForge a **problem discovery engine**, not simply an idea generator.

---

# Why IdeaForge is Useful

## 1. It starts with evidence instead of imagination

Large language models are very good at generating plausible ideas.

However, plausibility is not the same as demand.

An LLM can easily invent an interesting project that sounds useful but solves a problem nobody actually has.

IdeaForge reduces this issue by collecting signals from communities where developers, founders, engineers, and users already discuss their problems.

The final AI prompt explicitly instructs the system to use the supplied community signals as evidence and not invent Reddit or Hacker News URLs.

---

## 2. It helps developers avoid generic portfolio projects

The Architect agent explicitly avoids generic projects such as:

* Todo applications
* Chat applications
* Weather applications
* Generic AI wrappers

Instead, it prefers technically interesting systems involving areas such as:

* AI
* Backend engineering
* Infrastructure
* Developer tools
* Distributed systems

when those areas match the user's interests.

This encourages developers to build projects that demonstrate deeper engineering ability.

---

## 3. It personalizes ideas

The user provides:

* Interests
* Preferred technologies
* Optionally, a GitHub URL

These inputs allow the system to focus research around the kinds of problems and technologies the developer is interested in.

For example:

```text
Interests:
- Machine Learning
- Web Development
- Python

Tech Stack:
- React
- FastAPI
- AWS
```

The system can research discussions related to those domains and generate projects that align with the developer's skills.

---

## 4. It separates research from AI generation

One of the most important architectural decisions is that the application does **not** immediately send the user's interests to Gemini and ask for project ideas.

Instead:

```text
Research first
      ↓
Analyze second
      ↓
Generate last
```

This means the LLM is used primarily for **synthesis and product ideation**, rather than pretending to be the source of market research.

---

# How IdeaForge Works

At a high level, the complete application works like this:

```text
                         ┌─────────────────────┐
                         │       User          │
                         │                     │
                         │ Interests / Stack   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Next.js Frontend  │
                         │                     │
                         │ Discover Page       │
                         └──────────┬──────────┘
                                    │
                              POST Request
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  FastAPI Backend   │
                         │                     │
                         │ Create Job          │
                         └───────┬───────┬─────┘
                                 │       │
                                 │       │
                     Store Status│       │Queue Job
                                 │       │
                                 ▼       ▼
                       ┌──────────────┐ ┌──────────────┐
                       │   DynamoDB   │ │     SQS      │
                       │              │ │              │
                       │ queued       │ │ job message  │
                       └──────┬───────┘ └──────┬───────┘
                              ▲                 │
                              │                 ▼
                              │        ┌──────────────────┐
                              │        │ Worker Lambda    │
                              │        └────────┬─────────┘
                              │                 │
                              │                 ▼
                              │        ┌──────────────────┐
                              │        │ LangGraph        │
                              │        │                  │
                              │        │ Scout            │
                              │        │   ↓              │
                              │        │ Analyst          │
                              │        │   ↓              │
                              │        │ Architect        │
                              │        └────────┬─────────┘
                              │                 │
                              │                 ▼
                              │     ┌────────────────────────┐
                              │     │ External Research      │
                              │     │                        │
                              │     │ Reddit                │
                              │     │ Hacker News           │
                              │     │ Gemini                │
                              │     └────────────────────────┘
                              │
                              │ Update Status + Results
                              │
                              └─────────────────────┐
                                                    │
                                                    ▼
                                          ┌─────────────────┐
                                          │ Frontend Polls  │
                                          │ Job Status      │
                                          └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ Display Ideas   │
                                          └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ Save Voyage     │
                                          │ in Supabase     │
                                          └─────────────────┘
```

---

# High-Level Architecture

IdeaForge consists of several major layers.

## Client Layer

The frontend is built using:

* Next.js
* React
* TypeScript
* Tailwind CSS

The main user-facing areas include:

* Landing page
* Discover page
* Profile page
* Dashboard

The frontend communicates with:

1. Supabase for authentication and user data.
2. The FastAPI backend for project generation and job status polling.

The frontend contains dedicated API and Supabase client layers.

---

## API Layer

The FastAPI backend exposes endpoints for:

```text
POST /api/generate-ideas
GET  /api/status/{job_id}
```

The request model accepts:

* `interests`
* `tech_stack`
* optional `github_url`

while the response contains:

* `job_id`
* `status`
* `stage`
* generated `ideas`

The request and response schemas are defined using Pydantic.

---

## Queue Layer

Idea generation can involve:

* Multiple external API requests.
* Searching several communities.
* Processing many findings.
* Calling an LLM.

Instead of making the user wait for a single long HTTP request, the backend creates an asynchronous job.

The job is:

```text
Created
   ↓
Stored in DynamoDB
   ↓
Sent to SQS
   ↓
Processed by Worker Lambda
```

---

## AI Research Layer

The actual idea discovery logic is implemented as a LangGraph workflow containing three stages:

```text
Scout
   ↓
Analyst
   ↓
Architect
```

The shared state contains:

```text
user_interests
search_queries
raw_findings
analyzed_signals
final_ideas
```

This state represents the complete lifecycle of a project discovery request.

---

# The Research Pipeline

The core of IdeaForge is its multi-stage research pipeline.

## 1. Scout

The Scout is responsible for finding potential problems.

It does not immediately ask Gemini to generate ideas.

Instead, it:

1. Reads the user's interests.
2. Generates targeted research queries.
3. Selects relevant subreddits.
4. Searches Reddit.
5. Searches Hacker News.
6. Collects the raw findings.

The Scout is deliberately deterministic and does not require an LLM request.

---

### Search Query Generation

For every interest, IdeaForge generates problem-oriented queries.

For example, if the interest is:

```text
Machine Learning
```

the system can generate queries such as:

```text
machine learning frustrating problem
machine learning tool wish existed
machine learning repetitive workflow
```

The same strategy is applied to the user's other interests.

The application limits and deduplicates the generated queries so that the research process remains manageable.

The important detail is that the search is focused on **problems**, not general topic discussion.

Instead of searching:

```text
machine learning
```

IdeaForge searches for patterns that are more likely to reveal unmet needs:

```text
frustrating problem
tool wish existed
repetitive workflow
```

---

### Subreddit Selection

IdeaForge contains a lightweight mapping between technical interests and relevant communities.

Examples include:

```text
Machine Learning
    ↓
r/MachineLearning
r/learnmachinelearning

Python
    ↓
r/Python
r/learnpython

Web Development
    ↓
r/webdev
r/Frontend

AWS
    ↓
r/aws
r/devops

Developer Tools
    ↓
r/programming
r/webdev
r/ExperiencedDevs
```

If the user's interests do not match the mapping, the application falls back to general technical communities such as:

```text
r/programming
r/webdev
r/SideProject
```

This gives the Scout a focused research area instead of searching Reddit indiscriminately.

---

# Reddit Research

Reddit is used as a source of qualitative problem discovery.

The application can perform authenticated Reddit searches using OAuth credentials.

The flow is:

```text
IdeaForge
    │
    ▼
Reddit OAuth Token
    │
    ▼
Authenticated API Request
    │
    ▼
Relevant Subreddit
    │
    ▼
Search Query
    │
    ▼
Relevant Posts
```

The system searches each selected subreddit with the generated problem-oriented queries.

The search is restricted to the subreddit and sorted by relevance.

Each result can contain information such as:

```text
source
subreddit
title
selftext
score
num_comments
url
```

The implementation searches for relevant posts using the authenticated Reddit API when credentials are available.

---

## Development Fallback

The current implementation also includes a fallback mechanism when Reddit API credentials are not available.

In that situation, the application returns mock research data so the rest of the pipeline can still be tested.

This is useful for local development and demonstrating the full workflow without requiring live Reddit credentials.

However, this also means that production deployments should configure:

```text
REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET
```

to ensure that generated ideas are backed by actual Reddit research rather than fallback data.

---

# Hacker News Research

Hacker News is used as another source of technical and startup-oriented signals.

Unlike Reddit, the implementation uses the Hacker News Algolia Search API, which does not require authentication.

The flow is:

```text
Generated Query
      │
      ▼
Hacker News Algolia API
      │
      ▼
Matching Stories
      │
      ▼
Raw Findings
```

The search requests up to ten matching stories for a query.

The collected information includes:

```text
source
title
url
points
num_comments
object_id
```

This provides a second independent source of community evidence.

The Hacker News integration uses the Algolia search API to search stories matching each research query.

---

# Why Use Both Reddit and Hacker News?

The two sources provide different kinds of signals.

| Source      | Useful For                                                                               |
| ----------- | ---------------------------------------------------------------------------------------- |
| Reddit      | Detailed complaints, frustrations, workflows, niche communities, requests for tools      |
| Hacker News | Developer discussions, startups, technical products, infrastructure, emerging technology |

Using both reduces the risk of generating ideas based on a single community.

For example:

```text
Reddit:
"I spend hours manually doing this workflow."

        +
        
Hacker News:
"Discussion about limitations of current tools."

        ↓

Stronger evidence for a potential product opportunity
```

The goal is not to treat social media engagement as a perfect measure of market demand.

Instead, these discussions act as **discovery signals**.

They help answer:

* What frustrates people?
* What workflows are repetitive?
* What tools are missing?
* What alternatives are people looking for?
* Where are users building manual workarounds?

---

# Demand Signal Analysis

Collecting posts is not enough.

A research pipeline can easily collect irrelevant discussions.

The Analyst stage filters and scores findings.

The demand score starts with a baseline and increases when the content contains language associated with strong user pain.

Examples of strong signals include phrases such as:

```text
wish there was
looking for
need a tool
alternative to
frustrating
annoying
painful
hate
problem
struggle
manual
repetitive
takes forever
```

Medium-strength signals include:

```text
how do you
workflow
automate
better way
solution
tool
manage
track
```

The score is capped at 10.

Conceptually:

```text
Demand Score

Baseline
   +
Strong Pain Signals × Weight
   +
Medium Signals × Weight
   ↓
Maximum Score = 10
```

Findings below the threshold are removed.

The remaining signals are:

1. Sorted by demand score.
2. Limited to the strongest findings.
3. Passed to the Architect stage.

The system therefore performs:

```text
Raw Community Discussions
          ↓
Textual Signal Detection
          ↓
Demand Score
          ↓
Low-value Signals Removed
          ↓
Top Signals Retained
```

This stage is deterministic and does not require another Gemini request.

---

# 3. Architect

The Architect is the final stage of the LangGraph workflow.

This is where Gemini is used.

By the time the Architect runs, the system already has:

```text
User Interests
        +
Validated Community Signals
```

The LLM is instructed to generate exactly four software project ideas.

Each idea must:

* Solve a visible pain point.
* Be realistic for one developer.
* Be buildable in approximately 2–8 weeks.
* Avoid generic applications.
* Prefer technically interesting systems when relevant.
* Reference only the supplied evidence.
* Return structured JSON.

The output structure contains fields such as:

```json
{
  "title": "Project title",
  "description": "Clear explanation",
  "pain_point": "Specific problem",
  "evidence": [],
  "tech_stack": [],
  "difficulty": "intermediate",
  "estimated_weeks": 4,
  "why_this_matches": "Why it fits the user"
}
```

The Architect stage is responsible for transforming **community evidence into buildable engineering opportunities**.

---

# LangGraph Workflow

The AI pipeline is orchestrated using LangGraph.

The graph is intentionally simple and sequential:

```text
START
  │
  ▼
SCOUT
  │
  ▼
ANALYST
  │
  ▼
ARCHITECT
  │
  ▼
END
```

Each node receives and returns the shared `AgentState`.

```text
AgentState
├── user_interests
├── search_queries
├── raw_findings
├── analyzed_signals
└── final_ideas
```

This makes the pipeline easy to reason about because each stage adds or transforms information.

---

## Why LangGraph?

LangGraph provides an explicit orchestration layer.

Instead of writing one large function:

```python
async def generate_everything():
    ...
```

the application separates responsibilities:

```text
Scout
    → research

Analyst
    → validate

Architect
    → synthesize
```

This makes it easier to extend the system later.

For example, future nodes could include:

```text
Scout
   ↓
Analyst
   ↓
Competitor Research
   ↓
Market Validation
   ↓
Architect
   ↓
Project Planner
```

The current implementation deliberately avoids cyclic execution because Scout and Analyst are deterministic for the same input state, and repeatedly running them could create unnecessary or infinite cycles.

---

# Asynchronous Job Architecture

Idea generation is handled asynchronously.

This is important because the process can involve:

* Several Reddit searches.
* Several Hacker News searches.
* Network latency.
* AI inference.
* Data analysis.

If everything happened inside the original HTTP request, the request could take a long time or exceed infrastructure limits.

Instead, the system creates a job.

## Step 1: Create a Job

When the frontend sends:

```http
POST /api/generate-ideas
```

the backend generates a UUID:

```text
job_id
```

and creates an initial DynamoDB record:

```json
{
  "job_id": "...",
  "status": "queued",
  "stage": "queued"
}
```

---

## Step 2: Send the Job to SQS

The backend then creates a message containing information such as:

```json
{
  "job_id": "...",
  "interests": [],
  "tech_stack": [],
  "github_url": null
}
```

This message is sent to the SQS queue.

The API can immediately return:

```json
{
  "job_id": "...",
  "status": "queued",
  "stage": "queued",
  "ideas": null
}
```

The FastAPI router persists the initial job and queues the work rather than performing the complete research pipeline inside the request-response cycle.

---

## Step 3: Worker Processes the Job

The Worker Lambda receives SQS records.

For every record:

```text
SQS Message
    ↓
Extract job_id
    ↓
Extract interests
    ↓
Update DynamoDB
    ↓
Run LangGraph
```

The job status is updated to:

```text
status = scouting
stage = scouting
```

The worker then executes:

```text
run_idea_graph(interests)
```

When successful:

```text
status = complete
stage = complete
ideas = generated ideas
```

If something fails:

```text
status = error
stage = error details
```

This makes DynamoDB the central source of truth for job progress.

---

# Why Use SQS?

SQS acts as a buffer between the API and the expensive processing pipeline.

Without a queue:

```text
Frontend
   ↓
API
   ↓
Run everything immediately
```

With a queue:

```text
Frontend
   ↓
API
   ↓
SQS
   ↓
Worker
```

Benefits include:

* Faster API responses.
* Decoupled components.
* Better failure isolation.
* Easier scaling.
* Natural support for asynchronous processing.

The API layer does not need to know how long idea generation takes.

Its responsibility is simply:

```text
Accept request
Create job
Queue job
Return job ID
```

The worker is responsible for the actual processing.

---

# Job Status Polling

After receiving the `job_id`, the frontend repeatedly calls:

```http
GET /api/status/{job_id}
```

The frontend API client contains separate functions for:

```text
postGenerateIdeas()
pollJobStatus()
```

The first submits the job and the second retrieves the current job state.

The response may progress through states such as:

```text
queued
   ↓
scouting
   ↓
complete
```

The UI also supports stage labels for the research process such as:

```text
Scouting the seas for signals...
Analyzing discoveries...
Forging your ideas...
Ideas forged successfully.
```

The Discover page maintains job state, polling state, results, and error handling as the asynchronous request progresses.

---

# Frontend Architecture

The frontend is built with Next.js, React, TypeScript, and Tailwind CSS.

The application contains four primary experiences.

---

## Landing Page

The landing page handles authentication state.

It:

1. Loads the current Supabase session.
2. Subscribes to authentication changes.
3. Displays Google sign-in when the user is not authenticated.
4. Allows authenticated users to navigate into the discovery workflow.

Authentication is handled through Supabase OAuth with Google.

---

## Discover Page

The Discover page is where the core IdeaForge workflow begins.

The user can provide:

* Interests
* Technologies
* GitHub URL

The page then:

```text
Collect Input
      ↓
POST /api/generate-ideas
      ↓
Receive job_id
      ↓
Poll job status
      ↓
Update progress UI
      ↓
Receive ideas
      ↓
Display evidence-backed results
```

The page imports both the backend API client and Supabase client, reflecting its role as the bridge between project generation and persistence.

---

## Profile Page

The profile page allows users to manage their technology stack.

The user can:

* Add technologies.
* Remove technologies.
* Save their profile.

This provides a persistent representation of the technologies the developer works with.

---

## Dashboard

The Dashboard displays previously saved discovery sessions, called **Voyages**.

Each voyage can contain:

```text
id
user_id
created_at
interests
results
```

The Dashboard retrieves voyages from Supabase for the authenticated user and displays previous discoveries.

This means IdeaForge does not treat idea generation as a disposable interaction.

Users can return to previous research and revisit generated project opportunities.

---

# Supabase Architecture

Supabase is responsible for user-facing persistence and authentication.

It handles:

## Authentication

The application supports Google OAuth.

The frontend retrieves:

```text
session
user
authentication events
```

and updates the UI accordingly.

---

## User Data

The application uses Supabase to store user-related information such as:

* Profile information.
* Technology preferences.
* Saved voyages.

The frontend Supabase client requires:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

and throws an error if either configuration value is missing.

---

# Backend Architecture

The backend is structured into several logical layers.

```text
backend/
│
├── Dockerfile
├── requirements.txt
├── test_graph.py
│
└── app/
    │
    ├── main.py
    ├── worker.py
    │
    ├── agents/
    │   ├── graph.py
    │   ├── nodes.py
    │   ├── state.py
    │   └── tools.py
    │
    ├── routers/
    │   └── ideas.py
    │
    └── schemas/
        └── ideas.py
```

Each area has a specific responsibility.

---

## `main.py`

Responsible for:

* Creating the FastAPI application.
* Configuring CORS.
* Registering routers.
* Wrapping FastAPI using Mangum.

Mangum allows the FastAPI application to run behind AWS Lambda.

The deployed frontend URL and local development URL are included in the CORS configuration.

---

## `routers/ideas.py`

Responsible for the public API.

It provides:

```text
POST /api/generate-ideas
GET  /api/status/{job_id}
```

This layer:

* Generates job IDs.
* Creates DynamoDB records.
* Sends SQS messages.
* Retrieves job status.

---

## `worker.py`

Responsible for background processing.

It:

1. Receives SQS events.
2. Parses queue messages.
3. Updates job state.
4. Runs the LangGraph pipeline.
5. Stores final ideas.
6. Handles failures.

The worker maintains an event loop for warm Lambda invocations, allowing asynchronous graph execution from the Lambda handler.

---

## `agents/graph.py`

Responsible for defining the LangGraph workflow.

```text
START
  ↓
scout
  ↓
analyst
  ↓
architect
  ↓
END
```

---

## `agents/nodes.py`

Contains the implementation of the three major pipeline stages.

```text
scout_node()
analyst_node()
architect_node()
```

---

## `agents/state.py`

Defines the shared `AgentState`.

This is the data contract between graph nodes.

---

## `agents/tools.py`

Contains integrations with external data sources.

Currently:

* Reddit API
* Hacker News Algolia API

---

# AWS Architecture

IdeaForge uses several AWS services.

## AWS Lambda

Two different Lambda responsibilities are implied by the architecture:

### API Lambda

Runs the FastAPI application through Mangum.

```text
API Gateway
      ↓
Lambda
      ↓
Mangum
      ↓
FastAPI
```

---

### Worker Lambda

Triggered by SQS.

```text
SQS
 ↓
Worker Lambda
 ↓
LangGraph
 ↓
Reddit / Hacker News / Gemini
```

---

## DynamoDB

DynamoDB stores asynchronous job state.

A job can look conceptually like:

```json
{
  "job_id": "uuid",
  "status": "queued",
  "stage": "queued",
  "ideas": []
}
```

As processing continues:

```text
queued
   ↓
scouting
   ↓
complete
```

or:

```text
error
```

---

## SQS

SQS decouples API requests from background work.

The API pushes a job.

The worker consumes the job.

---

## IAM

The Lambda execution role receives permissions for the resources it needs.

The included AWS policy allows DynamoDB operations such as:

```text
PutItem
GetItem
UpdateItem
```

and SQS operations such as:

```text
SendMessage
ReceiveMessage
DeleteMessage
GetQueueAttributes
```

This follows the principle of giving the application access to the AWS resources required by its architecture.

---

# Complete Deployment Architecture

The deployed system looks approximately like this:

```text
                    ┌──────────────────────┐
                    │       GitHub         │
                    │                      │
                    │  Source Repository   │
                    └──────────┬───────────┘
                               │
                               │ Push to main
                               ▼
                    ┌──────────────────────┐
                    │   GitHub Actions     │
                    │                      │
                    │ Lint                 │
                    │ Test                 │
                    │ Build Docker Image   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │         ECR          │
                    │                      │
                    │ Container Image      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Lambda         │
                    │                      │
                    │ API / Worker Image   │
                    └──────────────────────┘


User
 │
 ▼
┌────────────────────┐
│       Vercel       │
│ Next.js Frontend   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│    API Gateway     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│    API Lambda      │
│ FastAPI + Mangum   │
└──────┬────────┬────┘
       │        │
       ▼        ▼
 ┌─────────┐  ┌─────────┐
 │DynamoDB │  │   SQS   │
 └────▲────┘  └────┬────┘
      │            │
      │            ▼
      │      ┌─────────────┐
      │      │Worker Lambda│
      │      └──────┬──────┘
      │             │
      │             ▼
      │      ┌─────────────┐
      │      │ LangGraph   │
      │      └──────┬──────┘
      │             │
      ▼             ▼
 Status         Research + AI

```

---

# Deployment Flow

The deployment process has multiple stages.

## Step 1: Developer Pushes Code

A developer pushes changes to:

```text
main
```

The backend deployment workflow is configured to react to backend-related changes.

---

## Step 2: GitHub Actions Starts

The workflow:

1. Checks out the repository.
2. Sets up Python 3.11.
3. Uses pip dependency caching.
4. Installs backend dependencies.
5. Installs development tools.
6. Runs Ruff linting.
7. Continues with the deployment process.

The workflow is defined to run for pushes to `main` affecting the backend and deployment workflow paths, and it configures AWS region and ECR repository values through GitHub secrets.

Conceptually:

```text
git push
    ↓
GitHub Actions
    ↓
Install Dependencies
    ↓
Lint / Validate
    ↓
Build Docker Image
    ↓
Push to ECR
    ↓
Update Lambda Image
```

---

# CI/CD Pipeline

The repository includes a GitHub Actions backend deployment workflow.

The CI/CD process is intended to automate deployment instead of requiring manual image builds and Lambda updates.

A typical pipeline is:

```text
Developer
    │
    │ git push origin main
    ▼
GitHub
    │
    ▼
GitHub Actions
    │
    ├── Checkout Code
    │
    ├── Setup Python
    │
    ├── Install Dependencies
    │
    ├── Run Ruff
    │
    ├── Run Tests
    │
    ├── Configure AWS Credentials
    │
    ├── Authenticate with ECR
    │
    ├── Build Docker Image
    │
    ├── Push Image to ECR
    │
    └── Update Lambda Function
```

The important architectural idea is that Lambda does not directly build the application.

The application code is packaged into a container image.

---

# Docker and AWS Lambda

The backend Dockerfile uses the AWS Lambda Python 3.11 base image.

The process is:

```dockerfile
FROM AWS Lambda Python 3.11
```

Then:

```text
Copy requirements
        ↓
Install dependencies
        ↓
Copy application
        ↓
Set Lambda handler
```

The Dockerfile copies the application into `${LAMBDA_TASK_ROOT}/app/` and sets the handler to the Mangum-wrapped FastAPI application.

Conceptually:

```text
Docker Image
│
├── Python Runtime
├── FastAPI
├── LangGraph
├── LangChain Google GenAI
├── Mangum
├── Boto3
├── HTTPX
│
└── app/
    ├── main.py
    ├── worker.py
    ├── agents/
    ├── routers/
    └── schemas/
```

The image is then stored in Amazon ECR.

Lambda is configured to use that image.

This gives the deployment pipeline:

```text
Source Code
    ↓
Docker Build
    ↓
Container Image
    ↓
Amazon ECR
    ↓
AWS Lambda
```

---

# API Gateway and FastAPI

FastAPI is designed around ASGI.

AWS Lambda does not natively execute an ASGI application in the same way that Uvicorn does.

Mangum acts as an adapter.

The request flow is:

```text
HTTP Request
      ↓
API Gateway Event
      ↓
AWS Lambda
      ↓
Mangum
      ↓
ASGI Request
      ↓
FastAPI
      ↓
Router
      ↓
Response
```

The application handler is:

```text
app.main.handler
```

which corresponds to the Mangum-wrapped FastAPI application.

---

# Complete End-to-End Data Flow

Here is the complete journey of a user request.

## 1. Authentication

```text
User
 ↓
Google OAuth
 ↓
Supabase
 ↓
Authenticated Session
```

---

## 2. User Configures Discovery

The user enters:

```text
Interests:
Machine Learning, Web Development, Python

Tech Stack:
React, FastAPI, AWS

Optional GitHub URL
```

---

## 3. Frontend Creates Job

```text
Next.js
    ↓
POST /api/generate-ideas
    ↓
FastAPI
```

---

## 4. Job Stored

```text
FastAPI
   ↓
DynamoDB

{
  job_id,
  status: "queued",
  stage: "queued"
}
```

---

## 5. Job Queued

```text
FastAPI
   ↓
SQS

{
  job_id,
  interests,
  tech_stack,
  github_url
}
```

---

## 6. Worker Starts

```text
SQS
 ↓
Lambda Worker
```

The worker updates the job:

```text
queued → scouting
```

---

## 7. Scout Researches Communities

```text
User Interests
      ↓
Generate Queries
      ↓
Select Subreddits
      ↓
Search Reddit
      +
Search Hacker News
      ↓
Raw Findings
```

---

## 8. Analyst Scores Findings

```text
Raw Findings
      ↓
Detect Pain Language
      ↓
Calculate Demand Score
      ↓
Filter Weak Signals
      ↓
Keep Top Signals
```

---

## 9. Architect Generates Projects

```text
User Interests
      +
Validated Signals
      ↓
Gemini
      ↓
4 Structured Project Ideas
```

---

## 10. Results Stored

The worker updates DynamoDB:

```text
status = complete
stage = complete
ideas = [...]
```

---

## 11. Frontend Polls

```text
Frontend
   ↓
GET /api/status/{job_id}
   ↓
DynamoDB
   ↓
Current Job State
```

---

## 12. Results Displayed

The user receives:

```text
Project Title

Description

Pain Point

Evidence
├── Reddit Discussion
└── Hacker News Discussion

Suggested Tech Stack

Difficulty

Estimated Development Time

Why This Matches the Developer
```

---

## 13. Voyage Saved

The completed discovery can then be stored as a voyage associated with the authenticated user.

```text
User
  ↓
Supabase
  ↓
Voyages
```

The Dashboard can later retrieve and display those previous discoveries.

---

# Project Structure

```text
swayamjimmy-unbuilt/
│
├── backend/
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── test_graph.py
│   ├── ideaforge-aws-policy.json
│   │
│   └── app/
│       │
│       ├── main.py
│       ├── worker.py
│       │
│       ├── agents/
│       │   ├── graph.py
│       │   ├── nodes.py
│       │   ├── state.py
│       │   └── tools.py
│       │
│       ├── routers/
│       │   └── ideas.py
│       │
│       └── schemas/
│           └── ideas.py
│
├── frontend/
│   │
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.js
│   │
│   └── src/
│       │
│       ├── app/
│       │   ├── page.tsx
│       │   ├── discover/
│       │   ├── dashboard/
│       │   └── profile/
│       │
│       ├── components/
│       │   └── Navigation.tsx
│       │
│       └── lib/
│           ├── api.ts
│           └── supabase.ts
│
└── .github/
    └── workflows/
        └── backend.yml
```

---

# API Reference

## Generate Ideas

### Request

```http
POST /api/generate-ideas
Content-Type: application/json
```

### Body

```json
{
  "interests": [
    "machine learning",
    "web development",
    "Python"
  ],
  "tech_stack": [
    "React",
    "FastAPI",
    "AWS"
  ],
  "github_url": "https://github.com/username"
}
```

### Response

```json
{
  "job_id": "generated-uuid",
  "status": "queued",
  "stage": "queued",
  "ideas": null
}
```

---

## Check Job Status

### Request

```http
GET /api/status/{job_id}
```

### Possible Response

```json
{
  "job_id": "generated-uuid",
  "status": "scouting",
  "stage": "scouting",
  "ideas": null
}
```

When complete:

```json
{
  "job_id": "generated-uuid",
  "status": "complete",
  "stage": "complete",
  "ideas": [
    {
      "title": "Project Title",
      "description": "Project description",
      "pain_point": "Problem being solved",
      "evidence": [],
      "tech_stack": [],
      "difficulty": "intermediate",
      "estimated_weeks": 4,
      "why_this_matches": "Why this fits the developer"
    }
  ]
}
```

---

# Environment Variables

## Backend

Create:

```text
backend/.env
```

Example:

```env
# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Reddit
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# AWS
AWS_REGION=ap-south-1

# DynamoDB
JOBS_TABLE_NAME=ideaforge-jobs

# SQS
JOBS_QUEUE_URL=your_sqs_queue_url
```

---

## Frontend

Create:

```text
frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=https://your-api-url

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The Supabase client explicitly depends on the two public Supabase environment variables.

---

# Running Locally

## Backend

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

### Linux/macOS

```bash
source .venv/bin/activate
```

### Windows

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

The backend dependencies include FastAPI, LangGraph, LangChain Google GenAI, Mangum, Pydantic, HTTPX, Uvicorn, python-dotenv, and Boto3.

Run locally:

```bash
uvicorn app.main:app --reload
```

The API should be available at:

```text
http://localhost:8000
```

---

## Testing the Idea Graph

The project also contains a standalone graph test.

From the backend directory:

```bash
python test_graph.py
```

The test runs the idea-generation graph using sample interests and prints counts for:

* Search queries
* Raw findings
* Analyzed signals
* Final ideas

This is useful for testing the research and AI pipeline independently of the HTTP API and AWS infrastructure.

---

## Frontend

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Technology Stack

| Layer                | Technology       |
| -------------------- | ---------------- |
| Frontend             | Next.js          |
| UI                   | React            |
| Language             | TypeScript       |
| Styling              | Tailwind CSS     |
| Authentication       | Supabase Auth    |
| User Data            | Supabase         |
| Backend              | FastAPI          |
| Validation           | Pydantic         |
| AI Orchestration     | LangGraph        |
| LLM Integration      | LangChain        |
| LLM                  | Google Gemini    |
| Reddit Research      | Reddit OAuth API |
| Hacker News Research | Algolia HN API   |
| Async Messaging      | Amazon SQS       |
| Job Storage          | Amazon DynamoDB  |
| Compute              | AWS Lambda       |
| Containerization     | Docker           |
| API Adapter          | Mangum           |
| Container Registry   | Amazon ECR       |
| CI/CD                | GitHub Actions   |
| Frontend Deployment  | Vercel           |

---

# Key Design Decisions

## Research Before Generation

The most important decision in IdeaForge is:

```text
Research → Analyze → Generate
```

rather than:

```text
Prompt → Generate
```

This reduces dependence on purely generative output.

---

## Deterministic Early Pipeline

Scout and Analyst do not require Gemini.

This has several benefits:

* Lower LLM cost.
* Faster deterministic processing.
* More reproducible behavior.
* Clear separation between data collection and AI synthesis.

Gemini is reserved for the stage where semantic reasoning is most valuable: converting evidence into coherent product opportunities.

---

## Asynchronous Processing

Research and LLM generation happen outside the original HTTP request.

This prevents:

* Long-running API requests.
* Tight coupling between API and processing.
* Poor user experience while waiting.

---

## Evidence-Carrying Output

Ideas are not just titles and descriptions.

The architecture is designed to preserve:

```text
Idea
  └── Evidence
       ├── Source
       ├── Discussion Title
       ├── URL
       └── Supporting Snippet
```

This gives the user a path back to the original research.

---

## Serverless Deployment

AWS Lambda allows the backend to run without maintaining dedicated servers.

Combined with:

```text
API Gateway
SQS
DynamoDB
ECR
```

the architecture separates:

* Request handling.
* Background processing.
* State storage.
* Container distribution.

---

# Future Improvements

IdeaForge can be extended significantly.

## Better Demand Scoring

The current Analyst primarily uses textual heuristics.

Future scoring could include:

```text
Demand Score =
    Pain Intensity
  + Engagement
  + Number of Similar Discussions
  + Recency
  + Cross-Platform Validation
```

For example:

```text
High Reddit comments
+
Multiple similar posts
+
Hacker News discussion
+
Recent activity
=
Higher confidence
```

---

## Semantic Clustering

Instead of treating every post independently:

```text
100 Posts
    ↓
Embeddings
    ↓
Cluster Similar Problems
    ↓
Identify Repeated Pain Points
```

This could identify problems appearing repeatedly across communities.

---

## GitHub Repository Analysis

The request schema already accepts an optional GitHub URL.

A future version could analyze:

```text
GitHub Repository
      ↓
Languages
Frameworks
Existing Projects
Experience Level
      ↓
More Personalized Recommendations
```

This would allow the Architect to avoid suggesting projects too similar to the developer's existing work.

---

## Feedback Loop

Users could rate ideas:

```text
👍 Interesting
👎 Not relevant
⭐ Building this
```

Those interactions could improve future recommendations.

---

## More Research Sources

Potential additional sources include:

* GitHub Issues
* Stack Overflow
* Product Hunt discussions
* Indie Hackers
* Dev.to
* Public technical forums

The architecture is already suitable for adding new Scout tools.

---

## Parallel Research

The current graph is sequential.

A future implementation could research sources concurrently:

```text
             ┌── Reddit
Scout ───────┼── Hacker News
             ├── GitHub
             └── Stack Overflow
                    ↓
                 Analyst
```

This could reduce overall processing time.

---

# Why This Is More Interesting Than a Simple AI Project Generator

A simple AI project generator looks like:

```text
User Prompt
    ↓
LLM
    ↓
Project Ideas
```

IdeaForge looks like:

```text
User Interests
    ↓
Problem-Oriented Query Generation
    ↓
Community Research
    ├── Reddit
    └── Hacker News
    ↓
Raw Findings
    ↓
Demand Signal Detection
    ↓
Filtering and Ranking
    ↓
Validated Context
    ↓
LLM Product Synthesis
    ↓
Evidence-Backed Project Ideas
    ↓
Asynchronous Job Storage
    ↓
Persistent User Discovery History
```

The difference is significant.

The LLM is not being treated as a magical idea machine.

Instead, it is one component in a larger system.

The system uses:

* External data.
* Deterministic heuristics.
* Asynchronous distributed processing.
* Explicit workflow orchestration.
* Structured state.
* AI synthesis.

That combination makes IdeaForge both a useful application and a technically substantial engineering project.

---

# Summary

IdeaForge is an **AI-powered, evidence-driven project discovery platform**.

It helps developers discover software projects by researching real problems instead of relying entirely on generic AI suggestions.

Its core workflow is:

```text
USER INTERESTS
      ↓
TARGETED PROBLEM QUERIES
      ↓
REDDIT + HACKER NEWS RESEARCH
      ↓
RAW COMMUNITY FINDINGS
      ↓
DEMAND SIGNAL ANALYSIS
      ↓
FILTERED VALIDATED SIGNALS
      ↓
LANGGRAPH ORCHESTRATION
      ↓
GEMINI SYNTHESIS
      ↓
4 CONCRETE PROJECT IDEAS
      ↓
ASYNC JOB COMPLETION
      ↓
SAVED DISCOVERY HISTORY
```

From an engineering perspective, the application demonstrates concepts across multiple domains:

* Full-stack development
* Authentication
* REST APIs
* Pydantic validation
* ASGI and FastAPI
* LangGraph orchestration
* LLM integration
* External API integration
* Asynchronous systems
* Message queues
* AWS Lambda
* DynamoDB
* SQS
* Docker
* ECR
* GitHub Actions CI/CD
* Vercel deployment
* Supabase persistence

The central idea behind the project is simple:

> **Don't ask AI to randomly invent something to build. Use AI to help transform real human problems into buildable software opportunities.**
