# 🧪 AdAlchemist  

## Modern AI-Powered Marketing Creative Generation Platform

AdAlchemist is a sophisticated, full-stack AdTech platform built to empower marketers, creators, and businesses to generate high-converting, platform-optimized advertising mockups in a matter of seconds. By leveraging state-of-the-art Generative AI, AdAlchemist transforms raw images and simple prompts into stunning, production-ready creatives.

---

# 🚀 Live Demo  

🔗 **https://ad-alchemist.vercel.app**

---

# 🎯 Core Features  

## 🪄 AI Image & Video Magic
- **Instant Ad Generation:** Feed in a product image and seamlessly generate engaging background contexts.
- **Video Motion Generation:** One-click transformation of static image ads into dynamic, scrolling-stopping video mockups optimized for reels and short-form content.
- **Targeted Aspect Ratios:** Render ads specifically tailored for 16:9 (YouTube), 1:1 (Instagram), and 9:16 (TikTok/Reels).

## 🏘️ Creator Lounge & Community
- **Discussion Forums:** A dedicated "Creator Lounge" for users to interact, share prompts, discuss tutorials, and provide feedback on AI ad generation.
- **Community Showcase:** A beautifully masonry-styled grid showcasing publicly published generations from fellow creators. Allows others to draw inspiration and track trending marketing styles.
- **Social Interactions:** Engage with community-published projects by liking and instantly opening comment threads to foster creative collaboration.
- **Real-time Search:** Effortlessly filter user discussions using integrated search and intelligent topic recommendation chips.

## 📁 Intelligent Project Management
- **Dashboard:** Safely store, preview, and manage all your historical AI generations.
- **Edit Studio:** Retouch previously generated assets directly inside the platform.
- **Safe Cloud Storage:** Assets are stored robustly for 24/7 access, with intuitive quick-download capabilities for pictures and MP4 video formats.

## 🔐 Secure & Managed Access
- **Clerk Authentication:** Bank-grade user authentication encompassing social logins and standard email handling.
- **Smart Credit System:** A built-in economy system to track AI usage. Distinct generation actions gracefully consume differing values of platform credits.

---

# 🏗️ Modern Tech Stack  

## 💻 Frontend
- **React.js & Vite** for blazing-fast development and optimized production bundling.
- **JavaScript (ES6+)** codebase.
- **Tailwind CSS** providing utility-first, highly-customizable and aesthetic visual stylings.
- **Framer Motion** integrating buttery-smooth micro-animations, page transitions, and interactive visual feedback.
- **Clerk UI Components** for secure sign-in, sign-up, and user profile management.

## ⚙️ Backend
- **Node.js runtime** powered by **Express.js** handling robust asynchronous API routing.
- **Prisma ORM** facilitating strongly-typed, predictable database interactions.
- **NeonDB (PostgreSQL)** acting as the scalable, serverless cloud persistence layer.
- **Replicate / OpenAI APIs** powering the core generative image and temporal video capabilities.
- **Sentry** proactively capturing and isolating production errors.

## ☁️ Deployment
- **Frontend:** Vercel (Edge-network static hosting)
- **Backend:** Render (Web services)

---

# 📂 Architecture Overview  

```
AdAlchemist/
│
├── Frontend/                 # React SPA bundled using Vite
│   ├── src/
│   │   ├── components/       # Reusable UI pieces (Buttons, Navbar, ProjectCards, DiscussionPanels)
│   │   ├── configs/          # Axios interception and global config 
│   │   ├── pages/            # Application routes (Home, Community, CreatorLounge, Generator)
│   │   ├── assets/           # Dummy data, base css
│   │   └── App.jsx           # Master route orchestration
│   └── vite.config.js
│
└── Backend/                  # Express RESTful API
    ├── server.js             # Express app entry & middleware composition
    ├── configs/              # Environment binding and Prisma singleton
    ├── controllers/          # Business logic handlers (Social, Credits, Ads)
    ├── routes/               # Modular Express routing structures
    ├── middlewares/          # Security checkpoints (auth checks via Clerk SDK)
    └── prisma/
        └── schema.prisma     # Relational persistence layout
```

---

# 🗄️ Relational Schema

```prisma
model User {
  id          String        @id @default(cuid())
  clerkId     String        @unique
  email       String
  name        String?
  image       String?
  credits     Int           @default(100)
  projects    Project[]
  discussions Discussion[]
  comments    Comment[]
  projectLikes ProjectLike[]
  commentLikes CommentLike[]
  createdAt   DateTime      @default(now())
}

model Project {
  id                 String        @id @default(cuid())
  productName        String?
  productDescription String?       @db.Text
  aspectRatio        String?
  uploadedImages     String[]
  generatedImage     String?
  generatedVideo     String?
  isGenerating       Boolean       @default(false)
  isPublished        Boolean       @default(false)
  userId             String
  user               User          @relation(fields: [userId], references: [id])
  comments           Comment[]
  projectLikes       ProjectLike[]
  createdAt          DateTime      @default(now())
}

model Discussion {
  id        String    @id @default(cuid())
  title     String
  content   String    @db.Text
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  comments  Comment[]
  createdAt DateTime  @default(now())
}

model Comment {
  id           String        @id @default(cuid())
  content      String        @db.Text
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  projectId    String?
  project      Project?      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  discussionId String?
  discussion   Discussion?   @relation(fields: [discussionId], references: [id], onDelete: Cascade)
  parentId     String?
  parent       Comment?      @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies      Comment[]     @relation("CommentReplies")
  likes        CommentLike[]
  createdAt    DateTime      @default(now())
}
```

---

# 🛠️ Local Development Setup  

### 1️⃣ Clone Repository
```bash
git clone https://github.com/ManojK1405/AdAlchemist_JS.git
cd AdAlchemist_JS
```

### 2️⃣ Backend Configuration
```bash
cd Backend
npm install
```
Create a `.env` file within `/Backend`:
```
PORT=5000
DATABASE_URL=your_postgresql_connection_string
CLERK_SECRET_KEY=your_clerk_secret
CLIENT_URL=http://localhost:5173
```
Synchronize the DB schema and ignite the backend:
```bash
npx prisma generate
npx prisma db push
npm run dev
```

### 3️⃣ Frontend Configuration
```bash
cd Frontend
npm install
```
Create a `.env` file within `/Frontend`:
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000
```
Ignite the frontend:
```bash
npm run dev
```
Navigate to `http://localhost:5173` to experience AdAlchemist.

---

# 📜 License  

Unlicensed. Feel free to explore, learn, and expand upon the project.

---

### *Why AdAlchemist?*  
*In a digital era demanding exponential creative iteration, AdAlchemist bridges the gap between a simple product shot and an immersive, converting narrative. Let AI do the heavy lifting of design, leaving you entirely to strategy.*
