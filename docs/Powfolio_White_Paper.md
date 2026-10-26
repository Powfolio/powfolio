# Powfolio

## Web3-Native Portfolio and Proof-of-Work Platform

**White Paper · October 2026**  
**Current product and codebase review: 26 October 2026**

**Website:** https://www.powfolio.xyz

> **Built for people who ship, not just claim.**

---

## 1. Executive Summary

Web3 produces an enormous amount of valuable work, but that work is fragmented across wallets, block explorers, X, Discord, Telegram, trading journals, research platforms, campaign dashboards, Git repositories, portfolio sites and private documents. A person can have years of meaningful experience and still be difficult to evaluate from a single link.

Powfolio is a Web3-native professional identity and proof-of-work platform designed to solve that problem. It gives traders, researchers, community managers, moderators, airdrop hunters, testnet contributors, analysts and builders one public profile where professional history and evidence can live together.

A Powfolio profile can combine:

- Professional identity and biography
- Skills and skill descriptions
- Work experience and achievements
- Education and credentials
- Technical writing and research
- Trading records and trade updates
- Community and project contributions
- Airdrop and testnet history
- Wallets and multi-chain onchain activity
- Tokens and NFTs selected for display
- Public links and social accounts
- Profile Score and Builder Score

The central idea is simple: **a professional profile should show evidence, not only adjectives.**

Powfolio is not intended to replace the services where Web3 work happens. It acts as an identity and evidence layer around them. A trader can continue using a trading platform. A researcher can continue publishing on X or another platform. A community manager can continue working inside Discord. A builder can continue shipping code. Powfolio gives all of those activities a durable, structured place where they can be presented together.

The product also includes an authenticated dashboard for managing proof sections, visibility and identity; wallet and chain tooling for onchain profiles; a private CV/resume studio; an in-product AI assistant called Powbot; profile reporting and moderation controls; and onboarding and autofill tools intended to reduce the work required to create a strong profile.

The platform's scoring system is deliberately presented as a **profile-quality and evidence-density signal**, not as an objective measure of someone's ability or truthfulness. Profile Score focuses on completeness and professional presentation. Builder Score focuses on the amount and depth of evidence represented in the profile. Neither score replaces human diligence.

---

## 2. The Problem

### 2.1 Web3 proof is scattered

A serious Web3 professional often has plenty of proof but no unified presentation layer.

A trader may have charts on TradingView, executions on an exchange and commentary on Telegram. A researcher may have long-form articles, X threads and private research notes. A community manager may have run campaigns across several Discord servers but have no public record of what they actually did. An airdrop hunter may have spent months interacting with protocols across several networks, yet that work may be represented only by wallet history.

When an opportunity appears, the individual has to assemble the story manually. The reviewer then has to reconstruct it manually.

That creates three problems:

1. **High friction:** useful evidence takes time to find.
2. **Low context:** links and screenshots rarely explain the responsibility or reasoning behind the work.
3. **Weak continuity:** temporary roles, campaigns and communities can disappear while the person's contribution remains relevant.

Powfolio is designed to reduce that friction by turning scattered proof into a structured professional record.

### 2.2 Traditional resumes are incomplete for crypto work

A conventional resume is useful for employment history, education and a short summary of skills. It is less effective at representing work that is native to Web3.

Titles such as "Community Manager," "Research Analyst," "Trader," or "Ambassador" can describe very different levels of responsibility. A title alone does not show what was delivered, how long the person contributed, what platforms or ecosystems they worked in, what evidence exists, what the person researched or published, how they approached trading, what onchain ecosystems they interacted with, or what measurable outcomes they produced.

Powfolio therefore treats the resume as one output of a larger professional identity rather than the identity itself.

### 2.3 Pure onchain dashboards are also incomplete

Wallet analytics are valuable evidence, but wallet activity is not a complete professional biography.

A transaction can show that an address interacted with a protocol. It cannot, by itself, explain whether the person was a contributor, trader, researcher, tester, developer or simply a user.

Powfolio combines onchain evidence with human-authored context. The result is intended to be more useful for professional evaluation than either a conventional resume or a wallet dashboard alone.

### 2.4 Discovery remains relationship-driven

Web3 hiring and collaboration still depend heavily on social networks and referrals. That is efficient for people already inside the right circles, but it can hide strong talent outside them.

A future discovery layer can address this by making public Powfolio profiles searchable and filterable by useful professional attributes. This is intentionally treated as a future product surface rather than being represented as a fully shipped feature before it exists.

### 2.5 What the platform is designed to provide

Powfolio is built around five requirements:

- **One durable public identity** rather than many disconnected links.
- **Structured proof** rather than only self-description.
- **User-controlled visibility** rather than mandatory exposure.
- **Crypto-native evidence** including wallets and onchain activity.
- **Readable signals** that help a reviewer understand profile quality quickly without pretending to replace due diligence.

---

## 3. The Solution

### 3.1 Product definition

Powfolio is a Web3-native portfolio and proof-of-work platform. Each user can create a public profile at a stable username URL:

`https://www.powfolio.xyz/{username}`

The profile is divided into professional and evidence-oriented sections. Users choose which sections to expose and can curate the information presented inside them.

The platform is designed around a simple flow:

**Create identity → add evidence → connect relevant onchain activity → control visibility → share one professional URL.**

### 3.2 Proof over claims

The product encourages users to attach evidence wherever appropriate: external links, charts, articles and threads, role and project details, credentials and documents, wallet addresses, onchain records, NFT and token references, and measurable achievements.

This does not mean every item is independently verified. A linked article, a self-reported job description, an uploaded certificate and an onchain transaction are different categories of evidence and should be evaluated differently.

Powfolio's purpose is to make the evidence easier to inspect—not to remove the need for judgment.

### 3.3 User-controlled presentation

Visibility is a core product principle. Users can decide whether individual professional sections should appear on their public profile and can control aspects of onchain presentation such as chain visibility.

This is important because not every professional identity needs every category of proof. A researcher may want to emphasize writing and research. A trader may emphasize trading records. A community manager may emphasize projects and contributions.

### 3.4 A living professional record

A resume usually represents a snapshot. Powfolio is designed to accumulate history.

A role can end without the contribution disappearing. A campaign can finish without its metrics being lost. A research thread can remain part of a portfolio long after publication. Onchain history can continue to develop as the user participates in new ecosystems.

The profile therefore acts as a living professional record that can be updated as the person's work changes.

---

## 4. Product Surface

### 4.1 Public profile

The public profile is the central product surface. The identity layer can include display name, username, avatar, banner, short and long biography, location, open-to-work status, social links, connected identity providers where applicable, skills and descriptions, and selected contact information.

Primary and secondary email presentation is user-controlled rather than automatically exposed. The public page also presents the user's selected proof sections and the two public profile scores.

### 4.2 About and professional identity

The About area can contain service-oriented skill pillars, detailed skill descriptions, a long-form professional biography, work experience, achievements, employment type and work mode where provided, dates and hours where relevant, education, credential documents, and links to companies or institutions.

The goal is not to create a conventional corporate resume inside a Web3 product. The goal is to make professional context easy to understand while keeping the evidence close to the claim.

### 4.3 Projects and community contributions

The Projects / Community area records work performed for projects, protocols, communities and other organisations. A contribution can include title, role, platform, description, achievements, metrics, tags, dates, supporting media and an external URL.

This gives community managers, moderators, campaign operators and contributors a structured way to describe work that would otherwise live only in Discord messages or short job descriptions.

### 4.4 Technical writing and research

The Writing / Research area is intended for published intellectual work. Entries can include articles, research, X threads, guides, essays and other public work, with metadata such as title, URL, description, tags, publication date, images and ordering/visibility controls.

Powfolio does not attempt to become the publishing platform itself. It acts as a professional index of the user's strongest published work.

### 4.5 Trading record

The Trading Record section is designed to document trading process rather than present only profitable outcomes. Trade records can include asset or pair, direction, status, ROI, entry and exit prices, chart images, analysis/reasoning, publication links, dates and follow-up update threads.

Trading platforms can also be listed with names, links and logos.

A collection of winning screenshots is not a complete trading record. A useful trading portfolio should also expose losses, invalidated ideas, timing, reasoning and updates where the user chooses to document them.

Powfolio does not certify trading skill or guarantee performance. Trading records remain evidence that a reviewer should inspect critically.

### 4.6 Onchain and collectibles

Onchain Stats connects Web3 identity with wallet activity. The current codebase supports built-in EVM coverage for Ethereum, Base, Arbitrum, Optimism, Polygon and BNB Chain, alongside support for user-imported networks. KiiChain has dedicated handling through the imported-chain pathway, including EVM RPC, Blockscout-style explorer access and Cosmos LCD support.

The platform can surface chain-level information such as native balance, estimated USD value where pricing is available, transaction and transfer counts, token counts, valued token counts, estimated transaction volume, fees, unique contracts, unique tokens, token trades, NFT mints, deployed contracts, wallet age, active days/weeks/months, first and latest observed activity, activity dates and heatmap data, activity methods, and recognised DeFi protocol interactions where the address matches configured protocol data.

These metrics are assembled from public blockchain infrastructure and external data sources. They should therefore be treated as observations and estimates rather than universal ground truth.

### 4.7 Multi-wallet support

Powfolio supports a primary wallet plus additional named wallets, allowing a user to separate identities or purposes while still presenting relevant onchain evidence through one professional profile.

### 4.8 Chain visibility

Individual chains can be marked Public or Hidden. This controls presentation inside Powfolio, not the underlying blockchain record. If an address has already interacted with a public blockchain, that history remains observable through the relevant network infrastructure.

### 4.9 Token filtering and imported tokens

Token presentation supports dust filtering so extremely small holdings do not dominate a profile. Users can also import selected ERC-20 tokens by contract address on supported networks when the connected wallet holds them. The application resolves balances and available pricing information and can link the token back to its explorer representation.

### 4.10 NFT and collectible presentation

Collectibles can be imported from wallet scans or supported marketplace URLs. Ownership is checked onchain where the relevant implementation permits it. NFT media can be resolved through explorer metadata, IPFS gateways and a media proxy. Because NFT metadata and media are external dependencies, presentation quality can vary by collection and gateway availability.

### 4.11 Airdrops and testnets

The Airdrops section is intended for users whose professional identity includes ecosystem participation, testnet activity, campaign farming or protocol experimentation. Entries can capture campaign/project name, chain, participation status, role, description, reward where the user chooses to record it, link, image, dates and tags.

The section is optional because airdrop history is relevant to some Web3 careers and irrelevant to others.

---

## 5. Dashboard and Account Experience

### 5.1 Authenticated dashboard

The dashboard is the private workspace where users manage their public identity and proof. The current dashboard organises the main product modules into separate management surfaces for Profile and Identity, Projects and Contributions, Writing and Research, Trading, Onchain and Collectibles, and Airdrops and Testnets.

Section visibility can be controlled from the dashboard home experience.

### 5.2 Profile editing

Profile editing is organised into focused areas for identity, skills and connections, experience and education, documents and credentials, and CV details.

The identity editor supports profile information, social links, work history, education, skills, credentials and wallet-related settings. Work entries can include role, company, employment type, work mode, dates, hours, description, achievements, company URL and logo.

### 5.3 AI-assisted profile autofill

Powfolio includes an AI-assisted link autofill flow. A user can provide a public URL and the application attempts to retrieve usable information and structure it for profile creation.

This is intended to reduce repetitive data entry, not to silently publish generated information. Users remain responsible for reviewing imported content before using it as professional evidence.

### 5.4 Onboarding

The product includes an onboarding tour that introduces the major workflow, including profile setup, proof sections and Powbot. The goal is to reduce the amount of explanation required before a person can create a useful profile.

### 5.5 Private CV / resume studio

Powfolio includes a private CV/resume generation surface built from profile data. The current implementation supports four presentation styles: **Editorial, Classic, Sidebar and Ledger**.

The generated PDF is a dashboard-only artifact. The public profile does not expose a public CV download button. This allows a user to maintain a public Web3 portfolio while keeping a conventional resume as a controlled application document.

---

## 6. Powbot: In-Product AI Assistant

### 6.1 Purpose

Powbot is Powfolio's in-product AI assistant. It is designed specifically to help users understand and improve their Powfolio experience rather than act as a general-purpose financial adviser.

The current product experience exposes tasks such as explaining Powfolio features, analysing profile gaps, explaining Profile Score versus Builder Score, rewriting a short bio, helping users understand where information belongs, answering product FAQ questions, and improving pasted text through a Diff-style workflow.

### 6.2 Diff mode

Diff mode is intended for editing rather than blindly replacing the user's text. A user can provide text and ask Powbot to improve it while retaining the ability to review what changed.

This is particularly useful for biographies, descriptions, achievements and other professional copy where factual accuracy must remain under the user's control.

### 6.3 Safety boundary

Powbot is not presented as an investment adviser. It should not require or request seed phrases, private keys or other wallet secrets.

AI-generated text is also not proof. A user remains responsible for the accuracy of claims, employment history, trading results and other professional information entered into a profile.

---

## 7. Scoring System

Powfolio exposes two separate public scores because professional presentation and evidence density are related but not identical.

### 7.1 Profile Score

Profile Score is a 0–100 score intended to measure the completeness, richness and professional quality of the profile itself. The current scoring implementation considers identity information, avatar and banner presence, biography depth, location, skill descriptions, work experience depth, education, credentials, social/professional connections, wallet/ENS information where present, and whether proof sections contain meaningful records.

The score is deliberately strict. Empty fields and shallow entries do not receive the same weight as detailed professional information.

### 7.2 Builder Score

Builder Score is a separate 0–100 signal focused on evidence density across actual work and Web3 activity. The model considers categories such as technical writing and research, trading records and trading platforms, community/project contributions, airdrop and testnet activity, collectibles/onchain evidence, and professional work history.

The intent is to reward a profile that contains substantive proof rather than merely a long biography.

### 7.3 What the scores do not mean

The scores do **not** mean that the person is objectively talented, every claim has been independently verified, the person is trustworthy, the person is profitable as a trader, the person will perform well in a job, or that a higher score guarantees a better candidate.

They are structured product signals. A hiring manager, collaborator or client should inspect the underlying evidence.

### 7.4 Why two scores matter

A person can have a polished professional identity but very little documented work. Another person can have years of evidence but a weak or incomplete profile.

A high Profile Score with a low Builder Score suggests that the presentation is complete but the evidence base is still thin. A high Builder Score with a low Profile Score suggests substantial proof exists but the professional identity needs better organisation.

This is more informative than a single generic reputation number.

---

## 8. Onchain Architecture

### 8.1 Data sources

Powfolio's onchain layer uses public blockchain infrastructure, including Blockscout-style explorer APIs, public explorer endpoints, EVM JSON-RPC endpoints, Cosmos LCD endpoints for applicable imported networks, and market-pricing sources such as DEX Screener where required by the implementation.

The platform does not control the underlying blockchain data providers. Rate limits, indexing delays, unavailable RPC nodes, missing metadata and pricing failures can affect what is displayed.

### 8.2 Built-in chains

The current built-in EVM chain definitions include:

| Network | Native asset | Chain ID |
|---|---:|---:|
| Ethereum | ETH | 1 |
| Base | ETH | 8453 |
| Arbitrum | ETH | 42161 |
| Optimism | ETH | 10 |
| Polygon | POL | 137 |
| BNB Chain | BNB | 56 |

### 8.3 Imported networks

Imported networks can define network name, RPC endpoint, explorer/host, token explorer, native asset symbol, chain ID, slug and Cosmos LCD endpoint where relevant. The implementation contains dedicated handling for KiiChain, including fallback RPC and LCD configuration when the network is recognised.

### 8.4 Metric limitations

Not every blockchain exposes identical data. Consequently, a metric such as volume, contract count, NFT mint count or fees may depend on the indexed information available for that chain.

Where pricing is unavailable, a token can have a known balance but no reliable USD value. The UI therefore distinguishes between holdings and valued holdings rather than pretending that every asset has a precise market value.

### 8.5 Stored public footprint

After wallet data is collected, Powfolio can store the resulting footprint so public viewers can inspect the profile without connecting their own wallet.

This improves usability for hiring and collaboration. A reviewer should not need to approve a wallet connection merely to see evidence that the profile owner has already chosen to publish.

### 8.6 Security of external fetching

Public URL and imported-chain functionality creates a security boundary because the application may fetch user-supplied public resources.

The current codebase includes URL safety handling for public HTTPS fetching, request timeouts, redirect restrictions and response-size protections in the onchain fetching layer. These measures reduce—but do not eliminate—the operational risks associated with third-party endpoints.

---

## 9. Identity, Authentication and Account Linking

### 9.1 Authentication

Powfolio uses Supabase authentication infrastructure. The current application includes password-based authentication, OTP flows and wallet/provider-based account experiences where configured.

### 9.2 X account connection

The application includes X OAuth support for authentication and for linking an X account to an existing Powfolio identity.

This is useful because X is a major professional surface in Web3, but the connection should be treated as an identity/linking signal rather than proof that every claim on the linked account is true.

### 9.3 Wallet connection

Wallet connection is used for Web3 identity and onchain data. The application uses wallet connection infrastructure rather than asking users to submit private keys.

A fundamental security principle is that Powfolio should never need a user's seed phrase or private key to display public blockchain information.

### 9.4 Stable public usernames

The username is the foundation of the public profile URL. The platform applies username restrictions and reserved-name handling to prevent collisions with important system routes and identity surfaces.

---

## 10. Privacy, Visibility and Moderation

### 10.1 Public versus private information

Powfolio separates information intended for public presentation from information used only for account management.

The public profile has an explicit public-field allowlist. Sensitive profile fields should not be exposed merely because they exist in the underlying account record.

### 10.2 Section visibility

Users can choose whether major proof sections appear publicly. This is especially important for trading history, airdrop participation, NFT and collectible information, community work, writing and onchain data.

### 10.3 Email visibility

Email presentation is opt-in. A public profile should not automatically expose a user's authentication email.

Powfolio also separates operational contact addresses for support, privacy and development concerns.

### 10.4 Blockchain privacy limitation

Blockchain activity is fundamentally different from profile information. A profile owner can choose not to display a connected chain inside Powfolio, but that cannot erase the address's public history from a public blockchain.

Powfolio's privacy controls therefore manage **presentation**, not the underlying blockchain's public record.

### 10.5 Reporting and moderation

Public profiles include a reporting mechanism. The application also contains operational tooling for account review, reports, audit history, account lifecycle actions, holds, soft deletion, suspension and appeals. These controls are designed to give the platform a structured response to abuse, impersonation and policy violations.

### 10.6 CV privacy

The generated CV is intended to remain a private dashboard artifact. Visitors to a public profile do not receive the owner's dashboard CV download function.

---

## 11. Trust and Verification Model

A central design requirement of Powfolio is to avoid confusing **structured evidence** with **independent verification**.

The platform can represent several evidence classes.

### 11.1 Self-authored evidence

Examples include biographies, skills, work descriptions and manually entered achievements. These are useful but should be treated as self-reported unless another mechanism supports them.

### 11.2 Linked external evidence

Examples include published articles, X posts, GitHub repositories, project websites, charts and campaign pages. These allow a reviewer to inspect the original source.

### 11.3 Uploaded credentials

Credentials and documents can provide additional evidence, but an uploaded document should not automatically be treated as independently authenticated merely because it exists in Powfolio.

### 11.4 Onchain evidence

Wallet activity provides public blockchain evidence. It can be independently inspected on the relevant network, but interpretation still requires context.

### 11.5 Platform-generated signals

Profile Score, Builder Score and onchain summaries are generated by Powfolio's software. They are signals derived from the available data, not universal judgments.

### 11.6 Future verification

The roadmap includes optional verification mechanisms for selected proof types. Any future verification system should clearly define what is verified, by whom, using what evidence and for how long the verification remains valid.

---

## 12. Use Cases

### 12.1 Trader

A trader can document a selection of trades with charts, entries, exits, ROI, reasoning and follow-up updates. The profile can also show selected trading platforms and relevant onchain activity.

The value is not simply showing profitable trades. A stronger record can demonstrate process, including failed ideas and how the trader responded to changing conditions.

### 12.2 Researcher

A researcher can create a professional identity around research rather than relying on an X bio. Published work can be grouped, described and presented as a coherent body of work.

### 12.3 Community manager or moderator

A community professional can record roles, responsibilities, campaign work, platforms, dates, achievements and metrics. This converts ephemeral community work into a durable portfolio.

### 12.4 Airdrop hunter or testnet contributor

A user whose expertise is ecosystem participation can document campaigns and testnets while optionally connecting the onchain evidence associated with that activity.

### 12.5 Builder or technical contributor

A builder can combine work history, projects, technical writing, credentials, GitHub links and onchain participation in one profile.

### 12.6 Hiring team

A hiring team can use a public profile as a starting point for evaluation. Instead of asking every candidate for a portfolio, resume, wallet, X account and additional links separately, the team can inspect a structured identity and follow the underlying evidence.

The future Explore surface is intended to make this process searchable at scale.

### 12.7 Collaboration and networking

Powfolio is not limited to employment. A strong public proof-of-work profile can support partnerships, contributor opportunities, freelance work, research collaborations, community relationships and ecosystem networking.

---

## 13. Positioning

### 13.1 Versus traditional portfolio builders

General portfolio products often focus on designers, developers, writers or conventional creative work. Powfolio is designed around crypto-specific workflows such as trading records, airdrops, wallets, NFTs and multi-chain participation.

### 13.2 Versus blockchain explorers

Explorers are excellent sources of raw blockchain evidence. They are not designed to explain a person's professional history, research, community work, skills or achievements.

Powfolio uses the wallet as one layer of professional context rather than the entire identity.

### 13.3 Versus job boards

Job boards optimise around vacancies and applications. Powfolio optimises around a persistent professional record that remains useful before, during and after a hiring cycle.

### 13.4 Versus social profiles

Social profiles are excellent for distribution but often poor at structured professional evidence. Powfolio is intended to provide the structured layer behind the public identity.

---

## 14. Technical Architecture

### 14.1 Application stack

The current application is built with Next.js 15 using the App Router, React 19, TypeScript, Tailwind CSS, Supabase SSR and Supabase JS, Postgres through Supabase, Supabase Storage, viem and wallet connection infrastructure, and Vercel for deployment.

The codebase is structured around server-rendered public pages, authenticated dashboard routes, reusable React components and server/API routes for operations that require controlled access.

### 14.2 Public profile architecture

The public profile route resolves a username, checks profile status and loads an explicit public column set. The public profile can render identity information, proof sections, score rings, onchain data and moderation controls without exposing the entire underlying account record.

The implementation uses server-side access for the public profile path and maintains a public-field allowlist. This is an important architectural boundary because profile tables can contain information that should never become public simply because it exists in the database.

### 14.3 Data entities

The data model includes core records for profiles, writings, trades, trade updates, community/project items, airdrops, collectibles, credentials, skills, work experience, education, trading platforms, wallets and extra wallet configuration, custom chains, and profile visibility configuration.

### 14.4 Rendering and deployment

The application is designed for deployment through Vercel. Public profiles are server-rendered and include metadata suitable for sharing through search and social surfaces.

### 14.5 AI architecture

Powbot uses a server-side API route and structured Powfolio-specific knowledge. The client does not directly expose model credentials. AI-assisted profile autofill is also handled through a server route rather than requiring the user to interact with an external model provider directly.

### 14.6 External dependencies

The platform relies on external services for some functionality, including blockchain explorers, RPC endpoints, pricing providers, OAuth providers, AI inference and storage infrastructure. A failure in one provider can therefore degrade a feature without necessarily affecting the rest of the application.

---

## 15. Security and Operational Controls

Security is treated as a product requirement because Powfolio combines public professional information, user accounts, uploaded documents, external URLs, wallets and third-party data sources.

The current repository includes controls and infrastructure for authenticated dashboard access, Supabase Row Level Security-related database setup, wallet uniqueness checks, rate limiting, safe public HTTPS fetching, response-size protections, image byte validation utilities, controlled media proxying, public-profile field allowlisting, account deletion and lifecycle handling, report and evidence workflows, administrative audit logging, moderation queues, account holds and suspension, soft deletion, appeals, and administrative MFA support.

The repository also contains a dated security-audit document. These controls should be understood as implementation measures, not as a claim that the platform is immune to vulnerabilities. Security requires continuous review as the application and its dependencies change.

---

## 16. Current Product Status — October 2026

The current repository represents a substantially more complete product than an initial portfolio prototype.

Implemented product surfaces include public username profiles; identity and About management; skills with descriptions; work experience and achievements; education; credentials/documents; project and community contribution records; writing and research records; trading records and update threads; trading platform links; airdrop/testnet records; wallet connection and onchain profile data; multi-wallet presentation; built-in EVM chain support; imported/custom chain support; KiiChain-oriented imported-network handling; token and NFT presentation/import flows; public/private section visibility controls; chain visibility controls; Profile Score; Builder Score; private CV generation; four CV presentation styles; onboarding tour; AI-assisted link autofill; Powbot product assistant; Powbot Diff mode; X OAuth sign-in/linking; public profile reporting; suspended/deleted profile states; account lifecycle and appeal workflows; public profile metadata/SEO handling; FAQ, terms, privacy and cookie surfaces; and support/privacy/development contact channels.

This status is a codebase-oriented description. Availability of individual integrations can still depend on deployment configuration, environment variables, third-party APIs and network availability.

---

## 17. Roadmap

The roadmap should distinguish between product work that is operationally necessary, product surfaces that are planned, and longer-term strategic ideas.

### Near term

1. Continue security hardening and abuse prevention.
2. Improve reliability of third-party blockchain and NFT data sources.
3. Improve public profile mobile presentation and readability.
4. Continue improving imported-network reliability.
5. Expand operational monitoring and error handling.
6. Improve AI-assisted profile setup while preserving user review and control.
7. Build enough quality public profiles to make discovery useful rather than empty.

### Mid term

1. Launch a mature Explore/discovery surface.
2. Support filters such as skills, location, remote availability, open-to-work status and profile signals.
3. Improve DeFi protocol context in Onchain Stats.
4. Improve multi-wallet presentation and identity separation.
5. Introduce optional verification for carefully defined proof types.
6. Add more flexible CV variants and export controls.
7. Introduce team-side shortlist and evaluation workflows.

### Longer term

1. Broader chain and ecosystem coverage.
2. Portable reputation primitives.
3. Structured partner access for organisations that need talent data, subject to privacy and permission design.
4. Education and guidance surfaces that help users improve their professional evidence.
5. More sophisticated reputation signals that remain transparent about their methodology.

The roadmap is directional. It should not be interpreted as a promise that every listed feature will ship on a fixed schedule.

---

## 18. Risks and Constraints

### 18.1 Data-source reliability

Blockchain metrics depend on explorers, RPCs, indexers and pricing sources. These services can experience outages, rate limits, incomplete indexing and inconsistent metadata.

### 18.2 Pricing uncertainty

USD valuations can change rapidly and may be unavailable for illiquid or obscure assets. A displayed portfolio value should therefore be treated as an estimate based on the available pricing source and timestamp rather than an audited financial statement.

### 18.3 Self-reported information

Work history, achievements, skills and some credentials remain dependent on user input. Powfolio structures those claims and makes supporting evidence easier to inspect, but it cannot guarantee that every self-reported statement is true.

### 18.4 Trading performance interpretation

A collection of trades is not an audited track record. ROI can be calculated or entered in different ways, screenshots can omit context and historical results do not predict future performance.

Powfolio is not a broker, investment adviser or financial performance auditor.

### 18.5 AI-generated content

AI can produce incorrect or overly polished language. Users must review AI-generated profile content before publishing, especially claims about employment, achievements, technical expertise or trading performance.

### 18.6 Privacy and public chains

Users may control what Powfolio presents, but public blockchain history cannot be deleted by Powfolio. Connecting a wallet should therefore be treated as a deliberate identity decision.

### 18.7 Platform moderation

A public professional platform must handle spam, impersonation, abuse, misleading claims and other policy violations. Reporting, account-status controls and future verification mechanisms are therefore important parts of the platform rather than secondary features.

---

## 19. Trust, Safety and Responsible Use

Powfolio is intended to make professional evidence easier to inspect, not to create false certainty.

Users should publish only information they are comfortable making public; avoid exposing wallet secrets or private credentials; verify AI-generated text before publishing; avoid misrepresenting self-reported experience; provide links where claims can reasonably be supported; remember that blockchain activity can be publicly traceable; and use trading information responsibly.

Reviewers should inspect original evidence, distinguish self-reported information from independently observable information, treat scores as signals rather than verdicts, consider context behind onchain activity, and perform normal hiring, partnership or investment diligence.

---

## 20. Getting Started

### For a talent

1. Create a Powfolio account.
2. Choose a username.
3. Complete your identity and professional summary.
4. Add skills with useful descriptions.
5. Add work experience, education and credentials where relevant.
6. Add writing, research, projects, trading records, airdrops or other proof that represents your work.
7. Connect a wallet if onchain evidence is relevant to your professional identity.
8. Review imported onchain information and visibility settings.
9. Choose which sections and chains should appear publicly.
10. Review your Profile Score and Builder Score.
11. Use Powbot where it can help with setup or copy.
12. Share your public profile URL.

### For a reviewer

Start with the public profile. Read the short identity summary, inspect both scores, then move into the evidence most relevant to the role. Follow external links and inspect underlying onchain sources where appropriate.

A strong profile should make the review process faster without pretending that a single page can replace professional judgment.

---

## 21. Glossary

**Powfolio:** A Web3-native professional identity and proof-of-work platform.

**Talent / Builder:** A person using Powfolio to represent professional identity and evidence.

**Proof of work:** Evidence of actual professional activity, contribution, research, trading process, community work or onchain participation.

**Profile Score:** A 0–100 signal focused on profile completeness, richness and professional presentation.

**Builder Score:** A 0–100 signal focused on evidence density across work and Web3 activity.

**Onchain footprint:** A structured representation of public blockchain activity associated with a connected wallet.

**Imported chain:** A blockchain network added through user-provided public infrastructure configuration beyond Powfolio's built-in network definitions.

**Dust token:** A token holding valued below the product's presentation threshold; currently treated as below approximately $1 where USD pricing is available.

**Powbot:** Powfolio's in-product AI assistant for product guidance, profile improvement and related workflows.

**Public profile:** The shareable profile available at `powfolio.xyz/{username}`.

**Private CV:** A resume PDF generated from Powfolio profile data and available through the authenticated dashboard rather than the public profile.

---

## 22. Vision

Web3 work is already real. The problem is that much of it is difficult to present as a coherent professional history.

Powfolio's long-term vision is to make professional identity in crypto more portable, evidence-oriented and understandable.

A serious trader should be able to show process without reducing their career to screenshots. A researcher should be able to show a body of work without manually rebuilding a portfolio for every opportunity. A community professional should be able to preserve the record of campaigns and responsibilities that otherwise disappear when a Discord role ends. A builder should be able to combine shipped work, credentials, technical writing and onchain participation in one durable identity.

Teams should be able to evaluate people without asking them to reconstruct the same portfolio every time.

The ultimate product principle is therefore not simply **"put your resume onchain."** It is:

> **Make professional proof easier to collect, easier to understand and easier to verify.**

Powfolio is the presentation and evidence layer for that idea.

---

## 23. Conclusion

Crypto already produces real work. What is missing is a professional surface that respects how that work is actually created and evidenced.

Powfolio brings professional identity, work history, research, trading records, community contributions, airdrops, credentials and onchain activity into one structured profile. It gives users control over what they publish, provides readable signals through Profile Score and Builder Score, and makes the underlying evidence easier for other people to inspect.

The platform is intentionally not positioned as a universal truth machine. Public scores are not guarantees. Self-reported claims are not automatically verified. Onchain metrics are dependent on external data infrastructure. AI assistance does not replace human review.

Those limitations are part of the design philosophy: **make evidence more accessible without pretending that evidence eliminates judgment.**

If Powfolio succeeds, sharing a Powfolio profile should become a normal part of Web3 hiring, collaboration and professional networking—a single link that answers the question a conventional resume often cannot:

**What have you actually done?**
