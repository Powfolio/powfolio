# **Powfolio** 

Web3 Native Portfolio and Proof of Work Platform 

White Paper · October 2026 

Powfolio is the professional identity layer for crypto. It gives traders, researchers, community leads, airdrop hunters and builders one public link that shows real work: trades, writing, roles, credentials and onchain activity, scored in public. 

powfolio.xyz Built for people who ship, not just claim. 

## **1. Executive Summary** 

Web3 does not lack talent. It lacks a clean way to see that talent. 

Traders post charts on Telegram. Researchers publish on Mirror and X. Community managers run campaigns in Discord. Airdrop hunters stack testnet activity across ten chains. When a project needs to hire, they open LinkedIn, scan a Google Form, or dig through Discord handles. The proof is scattered. The signal is weak. 

Powfolio solves that gap. It is a public proof of work portfolio built for crypto professionals. One shareable URL holds trading records, technical writing, community roles, airdrop history, credentials and a live onchain footprint. Two public scores, Profile Score and Builder Score, make completeness and evidence density easy to read at a glance. 

The product is live at powfolio.xyz. Builders create free profiles. Teams can browse public pages. Every section is optional, every visibility toggle is intentional, and every claim is backed by a link, a chart, a wallet or a file. Onchain data that a talent has connected is stored and readable by anyone who opens the public page, with or without an account. 

## **2. The Problem** 

### **2.1 Scattered proof** 

A serious Web3 professional already has proof. The issue is distribution. A trader may keep charts on TradingView and results in a private Notion page. A researcher may have three long form posts on Mirror and twenty threads on X. A community lead may hold roles across five Discord servers with no single public record. 

When opportunity appears, that person has to assemble a story under time pressure. The recruiter or founder has to trust screenshots, Discord tags and self written bios. That process is slow and easy to fake. 

### **2.2 Soft resumes in a hard market** 

Traditional resumes work poorly in crypto. Job titles such as Community Manager or Research Analyst mean little without context. Teams care about volume, consistency, campaigns run, research depth and 

onchain activity. A PDF with adjectives does not answer those questions. 

At the same time, pure onchain tools show wallet activity without narrative. A wallet age metric or a transaction count does not explain what someone shipped or why they matter to a team. 

### **2.3 Discovery is still broken** 

Hiring in Web3 still runs on networks. Founders ask friends. Moderators recommend friends. The best people outside those circles stay invisible. There is no shared surface where a team can filter open to work talent by craft, evidence and scores. An explore view that lets people search public profiles by skills, location, remote availability and other criteria is planned once enough real profiles exist. 

### **2.4 What builders actually need** 

Builders need a public home that is owned by them, structured around proof, readable in under two minutes, scored in a way that is hard to game, and useful for both hiring teams and peer discovery. Powfolio is built around those requirements. 

## **3. The Solution** 

### **3.1 Product definition** 

Powfolio is a Web3 native portfolio and proof of work platform. Each talent gets a public profile at a stable URL in the form powfolio.xyz/{username}. The profile is organised into sections. Each section holds a specific type of evidence. The talent controls what is public. The page is readable by anyone with the link. 

The product does not replace Discord, X, explorers or trading journals. It collects the parts that matter for reputation and hiring, and presents them in one place. 

### **3.2 Design principles** 

Proof over claims. Every section expects links, charts, files or onchain data. Visibility is intentional. Sections can be turned on or off. Dust tokens can be hidden. Chains can be public or hidden. Scores are public and strict. Profile Score tracks completeness. Builder Score tracks evidence density. Language stays human. The product calls people builders or talents. Onchain is first class. Wallet footprint, tokens, NFTs and activity metrics sit beside writing and community work. Saved onchain data is served from the database so public viewers do not need to connect a wallet. 

### **3.3 Who it is for** 

Powfolio serves people who create value in crypto: traders who want a verifiable record of wins, losses and process; researchers and technical writers who want their best work in one place; community leads, mods and campaign managers who need role history with context; airdrop hunters and testnet contributors who treat onchain activity as craft; builders and analysts who mix product work with onchain participation. 

It also serves teams: protocol founders, DAO operators, hiring managers and community organisers who need to evaluate talent quickly. The planned explore view will let them filter public profiles by skills, location, remote status and other criteria. 

## **4. Product Surface** 

### **4.1 Public profile** 

The public profile is the core product. It opens with identity: display name, username, avatar, banner, short bio, location and social links. Open to work status is visible when enabled. Primary and secondary emails only appear if the talent chooses to show them. Below the header, two score rings show Profile Score and Builder Score. Sections organise the rest of the page. 

### **4.2 Profile sections** 

About: Skills as service pillars with short descriptions, long form bio, work experience, education and uploaded credentials. Skill chips open a detail view. Company and institution links open external pages when provided. 

Projects / Collab: Personal builds, partnerships and community roles. Each card can carry a title, role, platform, description, metrics, dates, tags and a link. 

Technical Writing / Research: Articles, threads, Mirror posts and research notes. Cards support thumbnails, titles, descriptions, publish dates and share actions. 

Trading Record: Individual trades with direction, status, ROI, entry and exit, charts, analysis and optional update threads. Trading platforms can be listed as chips with logos and links. 

Onchain Stats: Footprint from connected wallets across major EVM chains and imported networks. Chain selector, value, interactions, volume, fees, contracts, unique tokens, trades, NFT mints, wallet age, active days, weeks and months, DeFi protocol hits, token list and activity heatmap. NFTs held by the wallet can be imported and shown. Data is stored so any visitor can view it without connecting a wallet. 

Airdrops: Campaigns farmed, qualified, claimed or missed. Optional by default. The talent turns this section on when they want it public. 

### **4.3 Dashboard** 

Authenticated talents manage everything from the dashboard. Each proof section has its own manager. Section visibility toggles sit on the home cards. Profile editing covers identity, skills, work, education, wallets, location and docs. A private CV export builds a professional resume from the same data. Visitors cannot download that CV from the public page. 

### **4.4 Explore view** 

An explore view is planned. It will let people search and filter public profiles by skills, location, remote availability, open to work status, scores and other criteria. It is a discovery layer over public records. It does not take a cut of work or sell bookings. 

### **4.5 Powbot** 

Powbot is the in product assistant for Powfolio only. It helps with setup, copy, scores and how the product works. It does not give investment advice and never asks for seed phrases. 

## **5. Onchain System** 

### **5.1 Why onchain sits in the profile** 

In Web3, wallet behaviour is part of professional identity. Transaction history, token holdings, NFT ownership and protocol interaction show where someone has spent time. Powfolio treats that data as first 

class evidence. Once a talent connects a wallet, the footprint is fetched, stored and served so public viewers can see it without connecting a wallet themselves. 

### **5.2 Supported networks** 

Built in coverage includes Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain and others through public explorers. Talents can import additional networks with a public JSON RPC and optional explorer and LCD endpoints. KiiChain is supported as an imported network using Blockscout, EVM RPC and Cosmos LCD. 

### **5.3 Metrics model** 

For each chain the product surfaces portfolio value and native balance, interaction count and transfer count, volume and fees in USD when pricing is available, unique contracts and unique tokens, token trades and NFT mints, first transaction age, last activity, contracts deployed, active days, weeks and months plus a heatmap of activity, and known DeFi protocol interactions where addresses match a curated list. Tokens can be filtered for dust. Native balances remain visible even when the USD value is small. 

### **5.4 Multi wallet and chain visibility** 

A talent can connect a primary wallet and extra named wallets. The public Onchain section can switch between those wallets. Talents can mark each interacted chain Public or Hidden. At least one chain must remain visible. 

### **5.5 Token and NFT import** 

Tokens can be imported by contract address on a selected chain when the connected wallet holds them. NFTs can be imported from marketplace URLs or wallet scans. Ownership is checked onchain. Artwork is resolved through explorer metadata, IPFS gateways and a media proxy. 

## **6. Scoring System** 

### **6.1 Profile Score** 

Profile Score runs from 0 to 100. It measures completeness, richness and professionalism of profile fields: identity, About depth, skills with descriptions, work and education, connections and whether proof sections have content. It answers how finished this public identity looks. 

### **6.2 Builder Score** 

Builder Score also runs from 0 to 100. It measures evidence density in craft: technical writing, trading logs and platforms, community roles, onchain and airdrop activity, and linked work history. It answers how much real proof this person shows. 

### **6.3 Design intent** 

The two scores are separate on purpose. A clean profile with little proof can score high on Profile and low on Builder. A dense trading and research record with a thin About section can invert that pattern. Teams can read both rings without treating either as a vanity metric. Scores are public. They update as the talent adds or removes evidence. They are meant to be hard to game through empty fields and easy to raise through real work. 

## **7. Use Cases** 

### **7.1 Individual talent** 

A trader builds a public record of closed trades with charts and analysis. A researcher pins Mirror posts and X threads under Technical Writing. A community lead lists campaigns with metrics and links. An airdrop hunter turns on the Airdrops section after a strong season. All of them share one URL in bios, applications and DMs. 

### **7.2 Hiring and collaboration** 

A protocol hiring a community lead opens the explore view, filters open to work profiles and reads role history plus scores. A research desk evaluates writing quality from the profile instead of asking for a separate portfolio. A trading desk checks process quality from the Trading Record section. 

### **7.3 Onchain native evaluation** 

Teams that care about wallet activity use Onchain Stats to see chain coverage, volume, last activity and protocol touch points. NFT imports and token holdings provide additional context when relevant to the role. The data is already stored, so the reviewer does not need to connect a wallet. 

### **7.4 Personal brand and continuity** 

Web3 careers move fast. Roles change. Campaigns end. A Powfolio profile accumulates history so past work does not disappear when a Discord role is removed or a temporary form link expires. 

## **8. Technical Architecture** 

### **8.1 Stack** 

Next.js with the App Router. TypeScript across the codebase. Tailwind CSS with a dark first design system and light mode support. Supabase for authentication, Postgres data and file storage. Vercel for hosting and deployments. Domain is powfolio.xyz. 

### **8.2 Data model** 

Core entities include profiles, writings, trades, trade updates, community items, airdrops, collectibles and credentials. Profiles hold skills, work experience, education, trading platforms, wallet addresses, extra wallets, custom chains, public chain visibility, imported tokens and section visibility flags. Onchain footprints are stored so public pages can render them without a live viewer wallet connection. 

### **8.3 Onchain data path** 

Address footprint loading aggregates explorer APIs for balances, transactions and token transfers. Pricing comes from explorer rates when present and from market data sources when needed. Imported chains can combine Blockscout style hosts, EVM JSON RPC and Cosmos LCD endpoints. NFT artwork resolution uses explorer instance metadata, IPFS gateway rotation and a same origin media proxy. 

### **8.4 Auth and privacy** 

Email and provider based authentication are handled by Supabase. Middleware protects dashboard routes. Public profiles require is_public. Emails on the public page are opt in. Location can be driven by device 

GPS rather than free text alone. Private CV download is restricted to the owner dashboard. Contact emails on the domain are privacy@powfolio.xyz, support@powfolio.xyz and dev@powfolio.xyz. 

## **9. Feature Detail by Module** 

Identity and About covers username, display name, short bio, long bio, avatar, banner, social links, open to work, skills with descriptions, work experience with optional company links, education with optional institution links, and credential uploads with document style thumbnails. 

Projects and community cards support title, role, platform, description, metrics, date range, tags, thumbnail and external URL. Writing entries support title, URL, description, tags, publish date, primary and secondary images, visibility and order. Trading captures ticker, pair, direction, status, ROI, prices, chart images, post URL, analysis text and date. Update threads attach later chart checkpoints. Airdrops capture title, chain, status, role, description, reward, URL, thumbnail, dates and tags. Collectibles support bulk import from a wallet or addition by marketplace URL or contract. Ownership checks and image hydration apply. 

## **10. Positioning** 

General portfolio builders optimise for designers and developers. They rarely understand trading journals, airdrop history or multi chain wallets. Powfolio starts from crypto workflows and treats onchain data as native content. 

Explorers and portfolio apps show balances and transactions. They do not host research, community roles or scored professional identity. Powfolio combines those layers. 

Job boards optimise for applications. Powfolio optimises for ongoing public proof. A profile remains useful between hiring cycles and works as a living record. The planned explore view adds search and filter over those public records without becoming a booking system. 

## **11. Roadmap** 

Near term: finish remaining security hardening, operational email on the domain, collect enough real profiles that an explore view does not look empty, harden multi chain coverage and imported network reliability, improve NFT media reliability, and polish public profile readability and mobile layout. 

Mid term: ship the explore view with filters for skills, location, remote status, open to work and scores. Deeper DeFi protocol context on Onchain Stats. More flexible multi wallet presentation. Optional verification flows for selected proof types. Improved CV variants. Team side shortlists. 

Longer term: broader chain coverage, programmatic access for partners that need structured talent data, reputation primitives that remain portable, and education surfaces that help new talents raise scores with real work. 

## **12. Vision** 

Powfolio exists so Web3 work can be shown the way it is actually done. The long term vision is that every serious builder has one durable public identity where trading process, research, community impact and onchain activity live together. Teams should be able to discover and evaluate that identity without private Discord archaeology. Scores should reward evidence. Profiles should stay under the talent's control. 

If the product succeeds, send your Powfolio becomes a normal request in crypto hiring and collaboration. 

## **13. Risks and Constraints** 

Onchain sections depend on public explorers, RPC endpoints and pricing sources. Outages, rate limits or incomplete indexers can reduce metric quality. The product mitigates this with fallbacks and stored data for public viewing. 

Uploaded content and self reported roles still require human judgement. Scores measure structure and density. They do not replace diligence. Teams should open linked sources. 

Wallet addresses and public chain activity are inherently public onchain. Profile level controls such as chain visibility, dust hiding and email toggles reduce unnecessary exposure, but cannot hide confirmed onchain history from explorers. 

## **14. Getting Started** 

Create an account and choose a username. Complete identity fields and skill pillars. Connect a wallet and review Onchain Stats. Add proof: trades, writing, community roles, airdrops, NFTs and credentials as relevant. Toggle public sections and chain visibility. Share the public URL. The public link format is https://powfolio.xyz/{username}. 

## **15. Glossary** 

Talent / Builder: a person with a Powfolio profile. Profile Score: public completeness and professionalism score from 0 to 100. Builder Score: public evidence density score from 0 to 100. Proof section: a section that holds verifiable work. Dust token: a holding valued under one US dollar, optionally hidden. Imported chain: a network added by the talent beyond the default set. Powbot: the in product assistant limited to Powfolio help. 

## **16. Conclusion** 

Crypto already produces real work. The missing piece is a professional surface that respects how that work looks: charts, threads, campaigns, wallets and documents. 

Powfolio is that surface. It gives builders one public home and gives teams a faster path to signal. It scores honesty of structure and density of evidence. It keeps control with the talent. Onchain data is stored and readable by anyone. An explore view for filtering public profiles is planned. 

The product is live at powfolio.xyz. The path forward is deeper reliability, richer discovery and the same core promise: your Web3 work, verified, visible and hireable. 

powfolio.xyz End of white paper 

