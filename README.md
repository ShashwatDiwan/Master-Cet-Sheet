![Master-Cet-Sheet](https://socialify.git.ci/ShashwatDiwan/Master-Cet-Sheet/image?custom_description=A+smart+study+platform+designed+to+organize+MHT-CET+resources+and+make+preparation+structured+and+efficient.&custom_language=Python&description=1&font=Jost&forks=1&issues=1&language=1&name=1&owner=1&pattern=Solid&pulls=1&stargazers=1&theme=Light)<div align="center">

<p align="center">
  <img src="https://img.shields.io/website?url=https%3A%2F%2Fcet-sheet.tech&style=flat-square&label=live%20site&up_message=online&down_message=offline&up_color=4F46E5&down_color=critical"/>
  <img src="https://img.shields.io/github/last-commit/ShashwatDiwan/Master-Cet-Sheet?style=flat-square&color=4F46E5"/>
  <img src="https://img.shields.io/github/stars/ShashwatDiwan/Master-Cet-Sheet?style=flat-square&color=4F46E5"/>
  <img src="https://img.shields.io/github/repo-size/ShashwatDiwan/Master-Cet-Sheet?style=flat-square&color=4F46E5"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white"/>
  <img src="https://img.shields.io/badge/Hibernate-59666C?style=flat-square&logo=hibernate&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/>
</p>

<p align="center">
  <a href="https://cet-sheet.tech"><b>View Live Application →</b></a>
</p>

<br/>

## Table of Contents

[Overview](#overview) · [System Architecture](#system-architecture) · [Engineering Highlights](#engineering-highlights) · [Query Optimization](#query-optimization) · [Tech Stack](#tech-stack) · [Screenshots](#screenshots) · [Getting Started](#getting-started) · [Project Structure](#project-structure)

<br/>

## Overview

**Master CET Sheet** is a full-stack study platform built for **MHT-CET aspirants** to organize preparation resources and track progress through a single, structured dashboard — replacing scattered spreadsheets, bookmarks, and PDFs.

<table>
<tr>
<td width="33%" valign="top">
<b>Problem</b><br/>
Aspirants juggle resources across disconnected PDFs, sheets, and links with no reliable way to track what has actually been completed.
</td>
<td width="33%" valign="top">
<b>Solution</b><br/>
A centralized, authenticated platform with structured resource tracking and a personal progress dashboard.
</td>
<td width="33%" valign="top">
<b>Engineering Focus</b><br/>
A backend built for low-latency access and predictable performance under real cloud constraints.
</td>
</tr>
</table>

<br/>

## Screenshots

<table>
<tr>
<td width="50%"><img width="2558" height="1146" alt="dashboard" src="https://github.com/user-attachments/assets/fbbe4f3f-6099-4979-95c8-a2cde3c970bb" />
</td>
<td width="50%"><img width="2560" height="1120" alt="mockup" src="https://github.com/user-attachments/assets/0163d416-8bf2-4b66-91eb-7ba2af134bbd" />
</td>
</tr>
<tr>
<td width="50%"><img width="2560" height="1130" alt="overview" src="https://github.com/user-attachments/assets/bbb79053-5607-44fe-bea5-ec78f979f40d" />
</td>
<td width="50%"><img width="2560" height="1384" alt="sheets" src="https://github.com/user-attachments/assets/a05c89a7-8320-4506-866f-da8c114f4e2f" />
</td>
</tr>
</table>

<p align="center"><i>click image to enlarge</i></p>

<br/>

## System Architecture

```mermaid
flowchart LR
    Client["Client Application"] -->|HTTPS| API["Spring Boot REST API"]
    API --> Auth{"Spring Security<br/>JWT Filter"}
    Auth -->|Authorized| Service["Service Layer"]
    Service --> Cache[("Redis Cache<br/>Cache-Aside")]
    Service --> DB[("Relational Database<br/>6 Entities")]
    Cache -.cache hit.-> Service
    DB -.populate on miss.-> Cache
    Service --> API
    API -->|JSON Response| Client
    Container["Docker Container"] -.hosts.-> API
    Container -.hosts.-> Cache
    Ping["Scheduled Health Ping"] -.keeps warm.-> Container
```

<p align="center"><i>Placeholder diagram — will be replaced with the final system design visual.</i></p>

<br/>

## Engineering Highlights

<table>
<tr>
<td width="180" valign="middle"><img src="https://img.shields.io/badge/-REST%20APIs-4F46E5?style=flat-square"/></td>
<td valign="middle">14 REST APIs architected with Spring Boot and Hibernate/JPA over a scalable relational data model of 6 entities, using DTO patterns to decouple internal models from API contracts.</td>
</tr>
<tr>
<td valign="middle"><img src="https://img.shields.io/badge/-Query%20Optimization-0EA5E9?style=flat-square"/></td>
<td valign="middle">Eliminated N+1 query issues by restructuring Hibernate lazy loading into optimized bulk queries, cutting database roundtrips per request from 150+ down to 2.</td>
</tr>
<tr>
<td valign="middle"><img src="https://img.shields.io/badge/-Redis%20Caching-DC382D?style=flat-square"/></td>
<td valign="middle">Integrated Redis with a Cache-Aside pattern to reduce data retrieval latency, with periodic health pings to mitigate cloud container cold-start delays.</td>
</tr>
<tr>
<td valign="middle"><img src="https://img.shields.io/badge/-JWT%20Auth-000000?style=flat-square"/></td>
<td valign="middle">JWT authentication via Spring Security, securing user-specific progress-tracking dashboards.</td>
</tr>
<tr>
<td valign="middle"><img src="https://img.shields.io/badge/-Docker-2496ED?style=flat-square"/></td>
<td valign="middle">Containerized the system with Docker, automating deployment pipelines across cloud environments for consistent, scalable delivery.</td>
</tr>
</table>

<br/>

## Query Optimization

<table>
<tr><th>Metric</th><th>Before</th><th>After</th></tr>
<tr><td>DB roundtrips per request</td><td>150+</td><td><b>2</b></td></tr>
<tr><td>Loading strategy</td><td>Per-record lazy loading</td><td>Single bulk fetch query</td></tr>
<tr><td>Data retrieval</td><td>Direct database hit</td><td>Redis Cache-Aside</td></tr>
<tr><td>Cold starts</td><td>Frequent delay on wake</td><td>Mitigated via scheduled health pings</td></tr>
</table>

**Before — N+1 lazy loading**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    Client->>API: GET /dashboard
    API->>DB: Fetch parent entity
    loop 150+ times
        API->>DB: Fetch related record (lazy load)
    end
    API-->>Client: Response (slow)
```

**After — Bulk fetch with Redis Cache-Aside**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Redis
    participant DB
    Client->>API: GET /dashboard
    API->>Redis: Check cache
    alt Cache hit
        Redis-->>API: Cached response
    else Cache miss
        API->>DB: Single bulk fetch query
        DB-->>API: Complete dataset
        API->>Redis: Store result
    end
    API-->>Client: Response (fast)
```

<br/>

## Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=java,spring,postgres,redis,docker,git,github&theme=dark" />
</p>

<p align="center"><i>Backend: Java, Spring Boot, Spring Security, Hibernate/JPA · Caching: Redis · Auth: JWT · Deployment: Docker<br/>Update the database icon above if your project uses MySQL instead of PostgreSQL. Add frontend framework icons once confirmed.</i></p>

<br/>

## Demo Video

<p align="center">
  <img src="https://placehold.co/960x520/0f172a/e0e7ff?text=Demo+Video+%E2%80%94+Coming+Soon&font=roboto" width="100%"/>
</p>

<p align="center"><i>Demo</i></p>

<br/>

## Getting Started

```bash
git clone https://github.com/ShashwatDiwan/Master-Cet-Sheet.git
cd Master-Cet-Sheet

# Backend
cd backend
./mvnw clean install
./mvnw spring-boot:run

# Frontend (separate terminal)
cd frontend
npm install
npm start
```

Update `application.properties` / `.env` with your database and Redis credentials before running.

**Live:** [cet-sheet.tech](https://cet-sheet.tech)

<br/>

## Project Structure

```
Master-Cet-Sheet/
├── backend/      Spring Boot REST API, JWT auth, Redis cache layer
├── frontend/     Client application
└── README.md
```

<br/>

## Roadmap

- [ ] Add finalized architecture diagram
- [ ] Add real UI screenshots
- [ ] Add embedded demo video
- [ ] Expand automated test coverage
- [ ] Add CI/CD pipeline badge

<br/>

<p align="center">
  <a href="https://github.com/ShashwatDiwan"><img src="https://img.shields.io/badge/GitHub-ShashwatDiwan-4F46E5?style=flat-square&logo=github&logoColor=white"/></a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0EA5E9,100:4F46E5&height=100&section=footer" width="100%"/>
</p>
