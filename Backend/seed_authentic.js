import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const users = [
    { id: 'user_mock_1', email: 'alex@example.com', name: 'Alex Rivera', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 'user_mock_2', email: 'maya@example.com', name: 'Maya Chen', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya' },
    { id: 'user_mock_3', email: 'jordan@example.com', name: 'Jordan Smith', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
    { id: 'user_mock_4', email: 'sarah@example.com', name: 'Sarah Black', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'user_mock_5', email: 'ethan@example.com', name: 'Ethan Vance', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan' },
    { id: 'user_mock_6', email: 'chloe@example.com', name: 'Chloe Bennett', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe' },
    { id: 'user_mock_7', email: 'nathan@example.com', name: 'Nathan Miller', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nathan' },
    { id: 'user_mock_8', email: 'olivia@example.com', name: 'Olivia Hayes', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia' },
    { id: 'user_mock_9', email: 'benjamin@example.com', name: 'Benjamin Reed', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin' },
    { id: 'user_mock_10', email: 'sophia@example.com', name: 'Sophia Grant', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia' },
];

const discussions = [
    {
        title: "Prompt Engineering for Luxury Goods",
        content: "I've been struggling to get the texture of silk right in my product shots. Any tips on specific keywords to use for high-end fabric rendering? I've tried 'lustrous', 'sheen', and 'hyper-realistic'.",
        userIndex: 0,
        replies: [
            { content: "Try adding 'subtle highlights' and 'soft fabric shadows'. Also, 'specular reflections' works wonders for silk.", userIndex: 1 },
            { content: "I usually go with '8k resolution, cinematic lighting, macro photography' combined with 'woven texture'.", userIndex: 2 },
            { content: "Don't forget to mention the lighting! 'Side lighting' specifically helps in defining silk folds.", userIndex: 3 }
        ]
    },
    {
        title: "Meta vs. TikTok Ad Performance 2024",
        content: "Is anyone seeing a shift in ROI lately? My CPMs on Meta have doubled in the last 3 weeks, while TikTok seems to be holding steady but the conversion rate is much lower.",
        userIndex: 4,
        replies: [
            { content: "TikTok is all about the hook. If your first 1.5 seconds don't hit, the CVR drops off a cliff.", userIndex: 5 },
            { content: "Meta is definitely getting more expensive. I'm moving 30% of my budget to Advantage+ campaigns, seeing better results there.", userIndex: 6 }
        ]
    },
    {
        title: "Scaling SaaS Ads with Limited Budgets",
        content: "What's the best way to scale a B2B SaaS product when you only have $1k/month to spend? Is it better to go broad on LinkedIn or targeted on Google Search?",
        userIndex: 1,
        replies: [
            { content: "$1k is tight for LinkedIn. I'd stick to high-intent Google Search keywords first.", userIndex: 2 },
            { content: "Agreed. Google Search for 'competitor alternatives' is usually the highest ROI for low budgets.", userIndex: 7 },
            { content: "Try cold outreach on Twitter/X too, it's free and very effective for SaaS founders.", userIndex: 0 }
        ]
    },
    {
        title: "Color Psychology in E-commerce Banners",
        content: "Does anyone have data on how much the CTA button color affects CTR? I've heard orange is the best, but our brand is strictly blue and white.",
        userIndex: 8,
        replies: [
            { content: "Contrast is more important than the specific color. If your site is blue, a yellow or orange button will work because it's the complement.", userIndex: 9 },
            { content: "We tested red vs green for a year. Green won by 15% but only for 'Positive Action' items.", userIndex: 3 }
        ]
    },
    {
        title: "Handling Negative Comments on Sponsored Posts",
        content: "How do you guys handle the 'scam' or 'overpriced' comments on your ads? Hide them, delete them, or reply to them?",
        userIndex: 2,
        replies: [
            { content: "Never hide unless it's pure spam. Reply with value and social proof. It actually boosts the algorithm because of 'engagement'.", userIndex: 4 },
            { content: "I reply with a discount code sometimes. Turns a hater into a customer half the time!", userIndex: 5 }
        ]
    }
];

async function seed() {
    console.log("Starting authentic seed...");
    
    // 1. Create/Update mock users first to ensure we have a base
    for (const u of users) {
        await prisma.user.upsert({
            where: { id: u.id },
            update: { image: u.image, name: u.name },
            create: { id: u.id, email: u.email, name: u.name, image: u.image }
        });
    }
    console.log("Mock users ready.");

    // 2. Fetch ALL users (including potential real ones in the DB)
    const allUsers = await prisma.user.findMany();
    console.log(`Found ${allUsers.length} total users in DB.`);

    // 3. Clear existing discussions/comments to redo it authentically
    await prisma.comment.deleteMany({});
    await prisma.discussion.deleteMany({});
    console.log("Cleared old synergy hubs.");

    // Helper to get a semi-random user that isn't always the same
    const getRandomUser = (indexHint) => {
        // If we have real users, mix them in. Otherwise use the pool.
        return allUsers[indexHint % allUsers.length];
    };

    for (let i = 0; i < discussions.length; i++) {
        const d = discussions[i];
        const creator = getRandomUser(i); // Assign to a random user from the DB
        
        const newDiscussion = await prisma.discussion.create({
            data: {
                title: d.title,
                content: d.content,
                userId: creator.id,
            }
        });

        for (let j = 0; j < d.replies.length; j++) {
            const r = d.replies[j];
            const replier = getRandomUser(i + j + 1); // Get a different user for each reply
            
            await prisma.comment.create({
                data: {
                    content: r.content,
                    userId: replier.id,
                    discussionId: newDiscussion.id
                }
            });
        }
    }

    console.log("Discussions and replies seeded successfully using actual DB users.");
    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
