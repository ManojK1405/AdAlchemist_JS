import { prisma } from '../configs/prisma.js';
import * as Sentry from '@sentry/node';

export const getLeaderboard = async (req, res) => {
    try {
        // 1. Most Liked Creators (Ranked by total likes received on all their projects)
        const usersWithLikes = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                image: true,
                projects: {
                    select: {
                        _count: {
                            select: { projectLikes: true }
                        }
                    }
                }
            }
        });

        const topLikedUsers = usersWithLikes
            .map(user => ({
                id: user.id,
                name: user.name,
                image: user.image,
                _count: {
                    projectLikes: user.projects.reduce((acc, p) => acc + p._count.projectLikes, 0)
                }
            }))
            .sort((a, b) => b._count.projectLikes - a._count.projectLikes)
            .slice(0, 5);

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

        res.json({
            topLiked: topLikedUsers,
            topTipped: topTippedWithDetails
        });
    } catch (error) {
        Sentry.captureException(error);
        console.error("Leaderboard Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
