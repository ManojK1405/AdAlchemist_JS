# 🧪 AdAlchemist  

## Modern AI-Powered Marketing Creative Generation Platform

AdAlchemist is a sophisticated, full-stack AdTech platform built to empower marketers, creators, and businesses to generate high-converting, platform-optimized advertising mockups in a matter of seconds. By leveraging state-of-the-art Generative AI, AdAlchemist transforms raw images and simple prompts into stunning, production-ready creatives.

---

# 🚀 Live Demo  

🔗 **https://ad-alchemist.shop**

---

# 🎯 Core Features  

## 🪄 AI Image & Video Magic
- **Instant Ad Generation:** Feed in a product image and seamlessly generate engaging background contexts.
- **Queue Management:** Intelligent background processing for generation tasks with real-time status updates ([worker.js](file:///Users/manojk./Desktop/AdAlchemist-JS/Backend/worker.js)).
- **Video Motion Generation:** One-click transformation of static image ads into dynamic, scrolling-stopping video mockups optimized for reels and short-form content.
- **Targeted Aspect Ratios:** Render ads specifically tailored for 16:9 (YouTube), 1:1 (Instagram), and 9:16 (TikTok/Reels).

## 🎟️ Promotional & Growth Systems
- **Coupon System:** Robust discount and free credit management with unique/global code support.
- **Growth Tactics:** Integrated social proof, scarcity, and urgency triggers to drive conversions ([GrowthSocialProof.jsx](file:///Users/manojk./Desktop/AdAlchemist-JS/Frontend/src/components/GrowthSocialProof.jsx)).
- **Admin Dashboard:** Centralized control for feature toggles, service health, and platform settings.

## 🏘️ Creator Lounge & Community
- **Discussion Forums:** A dedicated "Creator Lounge" for users to interact, share prompts, discuss tutorials, and provide feedback on AI ad generation.
- **Community Showcase:** A beautifully masonry-styled grid showcasing publicly published generations from fellow creators. 
- **Social Interactions:** Engage with community-published projects by liking and instantly opening comment threads to foster creative collaboration.

## 📁 Intelligent Project Management
- **Dashboard:** Safely store, preview, and manage all your historical AI generations.
- **Edit Studio:** Retouch previously generated assets directly inside the platform.
- **Safe Cloud Storage:** Assets are stored robustly for 24/7 access, with quick-download capabilities for pictures and MP4 video formats.

## 🔐 Secure & Managed Access
- **Clerk Authentication:** Bank-grade user authentication encompassing social logins and standard email handling.
- **Smart Credit System:** A built-in economy system to track AI usage.

---

# 🏗️ Modern Tech Stack  

## 💻 Frontend
- **React.js & Vite** for blazing-fast development.
- **Tailwind CSS** providing utility-first, highly-aesthetic visual stylings.
- **Framer Motion** for buttery-smooth micro-animations and transitions.
- **Clerk SDK** for authentication and user management.

## ⚙️ Backend
- **Node.js & Express.js** handling API routing and business logic.
- **Prisma ORM** for type-safe database interactions.
- **NeonDB & PostgreSQL** for scalable cloud persistence.
- **Redis (BullMQ)** facilitating background job queues and worker processing.
- **Replicate / OpenAI / Meta APIs** powering generative capabilities and social integrations.

## ☁️ Deployment
- **Frontend:** Vercel
- **Backend:** Render / Railway

---

# 📂 Architecture Overview  

```
AdAlchemist/
│
├── Frontend/                 # React SPA bundled using Vite
│   ├── src/
│   │   ├── components/       # Reusable UI (QueueManager, GrowthSocialProof, Pricing)
│   │   ├── configs/          # Axios and global configuration
│   │   ├── pages/            # Application routes (AdminSettings, Generator, Result)
│   │   └── App.jsx           # Master route orchestration
│   └── vite.config.js
│
└── Backend/                  # Express RESTful API
    ├── server.js             # Express app entry
    ├── worker.js             # Background task worker
    ├── controllers/          # Business logic (Coupon, Queue, Social, Credits)
    ├── routes/               # Modular Express routing structures
    ├── prisma/
    │   └── schema.prisma     # Relational persistence layout
    └── utils/                # Helper utilities (Generation, Email)
```

---

# 🗄️ Relational Schema

```prisma
model User {
  id                String          @id
  email             String
  name              String
  credits           Int             @default(20)
  hasProAccess      Boolean         @default(false)
  projects          Project[]
  generationJobs    GenerationJob[]
  couponUsages      CouponUsage[]
}

model Project {
  id                 String          @id @default(uuid())
  productName        String   
  uploadedImages     String[]
  generatedImage     String          @default("")
  generatedVideo     String          @default("")
  isGenerating       Boolean         @default(false)
  generationJobs     GenerationJob[]
}

model GenerationJob {
  id        String   @id @default(uuid())
  userId    String
  projectId String?
  type      String   // IMAGE, VIDEO, EDIT_IMAGE, EDIT_VIDEO
  status    String   @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED
  payload   Json     
  position  Int      @default(0)
}

model Coupon {
  id        String   @id @default(uuid())
  code      String   @unique
  type      String   // FREE_CREDITS, DISCOUNT
  value     Float    
  isActive  Boolean  @default(true)
  usages    CouponUsage[]
}

model CouponUsage {
  id        String   @id @default(uuid())
  userId    String
  couponId  String
  usedAt    DateTime @default(now())
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
Setup your environment variables by copying the example file:
```bash
cp .env.example .env
```
*Note: Open the `.env` file and fill in your actual keys for Clerk, Database, Google AI, Cloudinary, and Razorpay.*

Synchronize the DB schema and ignite the backend:
```bash
npx prisma generate
npx prisma db push
npm run dev
```
*The backend will start running on `http://localhost:3000`.*

### 3️⃣ Frontend Configuration
Open a new terminal window:
```bash
cd Frontend
npm install
```
Setup your frontend environment variables:
```bash
cp .env.example .env
```
*Note: Ensure `VITE_BASEURL=http://localhost:3000` is set in your `.env` so it can talk to the local backend.*

Ignite the frontend:
```bash
npm run dev
```
Navigate to the provided localhost URL (usually `http://localhost:5173`) to experience AdAlchemist locally!

---

# 📜 License  

Unlicensed. Feel free to explore, learn, and expand upon the project.

---

### *Why AdAlchemist?*  
*In a digital era demanding exponential creative iteration, AdAlchemist bridges the gap between a simple product shot and an immersive, converting narrative. Let AI do the heavy lifting of design, leaving you entirely to strategy.*
