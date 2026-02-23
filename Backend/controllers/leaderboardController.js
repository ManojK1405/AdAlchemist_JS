import prisma from '../configs/prisma.js';
import * as Sentry from '@sentry/node';

export const getLeaderboard = async (req, res) => {
    try {
        // 1. Most Liked Creators (based on total project likes)
        const topLikedUsers = await prisma.user.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                image: true,
                _count: {
                    select: { projectLikes: true }
                }
            },
            orderBy: {
                projectLikes: {
                    _count: 'desc'
                }
            }
        });

        // 2. Most Tipped Creators (based on aggregate tip amount received)
        // Note: Prisma doesn't directly support sum in findMany easily without raw queries or grouping
        // We'll use groupBy for this
        const topTippedGroup = await prisma.tip.groupBy({
            by: ['recipientId'],
            _sum: {
                amount: true
            },
            orderBy: {
                _sum: {
                    amount: 'desc'
                }
            },
            take: 5
        });

        // Resolve user details for top tipped
        const topTippedWithDetails = await Promise.all(topTippedGroup.map(async (group) => {
            const user = await prisma.user.findUnique({
                where: { id: group.recipientId },
                select: { id: true, name: true, image: true }
            });
            return {
                ...user,
                totalTips: group._sum.amount
            };
        }));

        // 3. Trending Prompts (from most liked projects)
        const trendingPrompts = await prisma.project.findMany({
            where: {
                isPublished: true,
                userPrompt: { not: "" }
            },
            take: 5,
            select: {
                id: true,
                userPrompt: true,
                productName: true,
                _count: {
                    select: { projectLikes: true }
                }
            },
            orderBy: {
                projectLikes: {
                    _count: 'desc'
                }
            }
        });

        res.json({
            topLiked: topLikedUsers,
            topTipped: topTippedWithDetails,
            trendingPrompts: trendingPrompts
        });
    } catch (error) {
        Sentry.captureException(error);
        console.error("Leaderboard Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
