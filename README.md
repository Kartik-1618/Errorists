# Skill Gap Assessment & Recommendation System

A platform that guides students from their current skill status toward a career goal by identifying skill gaps and recommending actions to bridge those gaps.

PROBLEM:
Students struggle with:
- understanding which skills they currently have
- identifying missing skills for a chosen career role
- finding the right courses/projects to build those skills
- tracking progress toward job-ready status

This solution provides a living guidance system to help students navigate career development.

SOLUTION SUMMARY

We compare user skill evidence with a predefined role framework to determine:
1. current status
2. missing skills (gap)
3. best next actions (course/project)
4. readiness toward goal

The system updates as students complete learning tasks.

FEATURES

- Signup + skill intake
- Domain and goal selection
- Dynamic skill gap analysis
- Readiness calculation (weighted)
- Course/project recommendations
- Skill progression tracking
- Mock LinkedIn skill import
- Explainable rule-based intelligence
- Dashboard visualizations (charts)

WORKFLOW (END-TO-END)

Signup → Skill Intake → Gap Analysis → Recommendations → Progress → Updated Status

Detailed:
1. User signs up
2. User enters skills (manual/project/import)
3. System compares against role skill framework
4. Missing skills are identified as gap
5. Recommendations issued (course/project)
6. User completes learning tasks
7. System recalculates readiness
8. System suggests next action

TECH STACK

Frontend:
- React (JSX)
- Bootstrap 5 (CDN)
- CSS
- Chart.js

Backend:
- Node.js + Express

Database:
- MongoDB Atlas

Authentication:
- JWT

Integration:
- Mock LinkedIn Skill Import

Intelligence:
- Rule-based skill gap engine

ARCHITECTURE

Frontend (React)
    ↓ REST API
Backend (Express)
    ↓ Queries
Database (MongoDB Atlas)

Gap + recommendation logic computed in backend.

DATABASE SCHEMA OVERVIEW

users
- name
- email
- password
- degree
- year
- domain
- createdAt

user_skills
- userId
- skills[{ name, source, confidence, lastUpdated }]

roles (seeded)
- roleName
- domain
- skills[{ name, weight }]

recommendations (seeded)
- skill
- actions[{ type, title, provider, link, difficulty, impact }]

progress
- userId
- completed[]
- readiness

READINESS LOGIC

readiness = matched_weights / total_weights

Status levels:
- Beginner
- Developing
- Near-Ready
- Ready

API ROUTES (OVERVIEW)

POST /auth/signup
POST /auth/login
POST /skills/add
GET  /gap
GET  /recommend
POST /progress
GET  /status

DEMO FLOW (FOR PRESENTATION)

1. Create account
2. Add skills
3. View dashboard readiness
4. Explore skill gap
5. Get recommendations
6. Mark completion
7. System updates readiness

SETUP AND RUN

Backend:
cd backend
npm install
npm start

Frontend:
cd frontend
npm install
npm run dev

Environment (.env):
MONGO_URI=
JWT_SECRET=

FUTURE SCOPE

- Multi-role comparison
- Real platform integration (LinkedIn/Coursera)
- Certification tracking
- Soft skill mapping
- ML-enabled recommendations
- Employer dashboard

TEAM

Kartik Dafda
Priyanshu Patel
Tushar Jaswani
