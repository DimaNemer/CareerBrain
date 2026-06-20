Career Brain
Upload your CV, see exactly which opportunities fit you and what is missing, then close that gap by joining a real team project inside the platform.

Introduction
Career Brain is a career intelligence platform built for fresh graduates and early-career developers and designers. Users upload their CV, and an AI engine builds a structured skill profile from it. That profile is matched against real job opportunities to show a percentage fit score and a clear list of missing skills no guesswork about whether you're ready to apply.

What makes Career Brain different is what happens next: instead of just telling users what they're missing, the platform connects them to CollabSpace, a built-in space where users can post project ideas, request to join other people's projects, and build real things together with a team of strangers turned collaborators. Every completed project updates the user's skill profile automatically, so their match scores improve over time based on real, verified experience not just claims on a resume.

This repository contains the MVP scope for a 2-month build: one core product loop, kept intentionally small so it can be shipped end-to-end and demoed convincingly, rather than a sprawling set of half-finished features.

Problem
Fresh graduates don't know how they measure up against the jobs they want, and have no easy way to close the gap once they find out. Job boards show listings, not fit. Learning platforms teach skills, not outcomes. Career Brain connects both: it shows the gap, and gives users a place to close it with real teammates.

Scope note
This is a deliberately reduced scope, cut down from a larger 5-path vision (jobs, scholarships, research, startups, co-founders) after mentor review. The MVP focuses on one core loop: Career Brain + Opportunity Matching, supported by a lightweight CollabSpace team-up feature that acts as the gap-closing mechanism and the reason users come back.

Core user loop
User uploads CV (and optionally LinkedIn/GitHub)
AI extracts a structured skill profile
User reviews and edits the extracted profile
Platform shows matched opportunities with a percentage score and missing skills
For each missing skill, user is shown a learning resource OR a live CollabSpace project needing that exact skill
User joins a project, builds real experience with a team, completes it
Profile and match scores update automatically  loop repeats with stronger results


Features  MVP 
1. Onboarding & profile creation
Sign up via email or Google
Upload CV as PDF (required), LinkedIn export or GitHub link (optional)
AI extracts: technical skills, soft skills, years of experience, education, certifications, languages
Editable review screen user confirms or corrects extracted data
This screen must feel accurate on the first try — it's the trust-building moment of the product

2. Career Brain engine
Convert profile into a structured skill vector with proficiency weighting
Recalculate the vector whenever the user edits their profile or completes a project
MVP scoring: weighted overlap between user vector and opportunity's required-skills vector no complex ML needed yet

3. Opportunity matching
Curated or single-API dataset of job postings (don't build multiple opportunity types yet)
Each listing shows: title, company, match score %, missing skills, estimated time to close the gap
Sort by match score, not recency

4. Gap-closing roadmap
For each missing skill: show a learning resource link
Where relevant: suggest a live CollabSpace project that needs that exact skill
This is the bridge feature connecting matching to team-building

5. AI-generated job recommendations
Beyond matching against a fixed listing, the AI can generate a ranked shortlist of job titles/positions that genuinely fit the user's current profile (e.g. "Junior Backend Developer", "Data Analyst Intern") even before a specific opening is found
This reframes the product from "here are jobs, see if you fit" to "here is what you're actually a fit for, go find it"
External job site integration (stretch goal, not MVP): pulling live listings from LinkedIn Jobs, Indeed, or similar requires either a paid API or scraping, both of which have real constraints  LinkedIn's API does not offer open job-search access, and scraping violates most job sites' terms of service. For the MVP, keep the opportunity dataset curated/manual or use a single legitimate job API (e.g. Adzuna, Indeed Publisher API, or RemoteOK's public API). Treat live multi-site aggregation as a v2 feature once the core matching loop is proven, not a day-one requirement.


6. CollabSpace team-up to build
Post a project idea: title, description, roles needed (e.g. "1 backend dev, 1 designer")
Browse open project posts, filter by role/skill needed
Send a "request to join" with a short message
Project owner accepts or declines
Simple shared workspace per project: task list, chat channel, file sharing (no video calls, no AI bots in MVP)
Completed projects are marked verified and update the member's Career Brain skill vector

7. Profile & portfolio page
Public page per user: skill summary, completed projects, readiness score
Shareable link that can replace a traditional CV
Doubles as social proof that the matching engine works
