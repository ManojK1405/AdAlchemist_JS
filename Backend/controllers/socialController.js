import { prisma } from "../configs/prisma.js";
import * as Sentry from "@sentry/node";

// --- Comments ---

export const addComment = async (req, res) => {
    try {
        const auth = req.auth();
        const userId = auth?.userId || null;
        const { content, projectId, discussionId, parentId } = req.body;

        if (!content) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                userId,
                projectId: projectId || null,
                discussionId: discussionId || null,
                parentId: parentId || null,
            },
            include: {
                user: true,
            },
        });

        res.status(201).json(comment);
    } catch (error) {
        Sentry.captureException(error);
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getComments = async (req, res) => {
    try {
        const { projectId, discussionId } = req.query;

        const comments = await prisma.comment.findMany({
            where: {
                projectId: projectId || undefined,
                discussionId: discussionId || undefined,
            },
            include: {
                user: true,
                likes: true,
                _count: {
                    select: { likes: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(comments);
    } catch (error) {
        Sentry.captureException(error);
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const toggleLikeComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { commentId } = req.params;

        const existingLike = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId,
                },
            },
        });

        if (existingLike) {
            await prisma.commentLike.delete({
                where: { id: existingLike.id },
            });
            return res.json({ liked: false });
        } else {
            await prisma.commentLike.create({
                data: {
                    userId,
                    commentId,
                },
            });
            return res.json({ liked: true });
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { commentId } = req.params;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                project: true,
                discussion: true
            }
        });

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check if user is the comment author OR the project/discussion owner
        const isAuthor = comment.userId === userId;
        const isProjectOwner = comment.project?.userId === userId;
        const isDiscussionOwner = comment.discussion?.userId === userId;

        if (!isAuthor && !isProjectOwner && !isDiscussionOwner) {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }

        // The schema has onDelete: Cascade on the parentId relation, 
        // so deleting this comment will automatically delete all its replies.
        await prisma.comment.delete({
            where: { id: commentId },
        });

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        Sentry.captureException(error);
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- Discussions ---

export const createDiscussion = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const discussion = await prisma.discussion.create({
            data: {
                title,
                content,
                userId,
            },
            include: {
                user: true,
            },
        });

        res.status(201).json(discussion);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getDiscussions = async (req, res) => {
    try {
        const discussions = await prisma.discussion.findMany({
            include: {
                user: true,
                _count: {
                    select: { comments: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(discussions);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getDiscussionById = async (req, res) => {
    try {
        const { id } = req.params;
        const discussion = await prisma.discussion.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        res.json(discussion);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteDiscussion = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.params;

        const discussion = await prisma.discussion.findUnique({
            where: { id }
        });

        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        if (discussion.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized to delete this discussion" });
        }

        await prisma.discussion.delete({
            where: { id }
        });

        res.json({ message: "Discussion deleted successfully" });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- Project Likes ---

export const toggleLikeProject = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { projectId } = req.params;

        const existingLike = await prisma.projectLike.findUnique({
            where: {
                userId_projectId: {
                    userId,
                    projectId,
                },
            },
        });

        if (existingLike) {
            await prisma.projectLike.delete({
                where: { id: existingLike.id },
            });
            return res.json({ liked: false });
        } else {
            await prisma.projectLike.create({
                data: {
                    userId,
                    projectId,
                },
            });
            return res.json({ liked: true });
        }
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- Creator Tipping ---

export const tipCreator = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { recipientId, amount = 5 } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (userId === recipientId) {
            return res.status(400).json({ message: "You cannot tip yourself." });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: "Invalid tip amount." });
        }

        // Fetch sender
        const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });

        if (!sender || sender.credits < amount) {
            return res.status(400).json({ message: "Insufficient credits to tip." });
        }

        // Verify recipient
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { id: true }
        });

        if (!recipient) {
            return res.status(404).json({ message: "Recipient user not found." });
        }

        // Perform atomic transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { credits: { decrement: amount } },
            }),
            prisma.user.update({
                where: { id: recipientId },
                data: { credits: { increment: amount } },
            }),
            prisma.tip.create({
                data: {
                    amount,
                    senderId: userId,
                    recipientId,
                }
            })
        ]);

        res.json({ message: `Tipped ${amount} credits successfully!` });
    } catch (error) {
        Sentry.captureException(error);
        console.error("Tip Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
