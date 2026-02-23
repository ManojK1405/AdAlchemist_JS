import { verifyWebhook } from "@clerk/express/webhooks";
import { prisma } from "../configs/prisma.js";
import * as Sentry from "@sentry/node";

const clerkWebHooks = async (req, res) => {
    try {
        // 🔐 Verify Clerk webhook
        const evt = await verifyWebhook(req, {
            signingSecret: process.env.CLERK_WEBHOOK_SECRET,
        });

        const { data, type } = evt;

        switch (type) {

            // 🟢 USER CREATED
            case "user.created": {
                await prisma.user.create({
                    data: {
                        id: data.id,
                        email: data?.email_addresses?.[0]?.email_address,
                        name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`,
                        image: data?.image_url,
                    },
                });
                break;
            }

            // 🟡 USER UPDATED
            case "user.updated": {
                await prisma.user.update({
                    where: { id: data.id },
                    data: {
                        email: data?.email_addresses?.[0]?.email_address,
                        name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`,
                        image: data?.image_url,
                    },
                });
                break;
            }

            // 🔴 USER DELETED
            case "user.deleted": {
                await prisma.user.delete({
                    where: { id: data.id },
                });
                break;
            }

            default:
                break;
        }

        return res.json({ message: `Webhook received: ${type}` });

    } catch (error) {
        Sentry.captureException(error);
        return res.status(500).json({
            message: "Webhook verification failed",
            error: error.message,
        });
    }
};

export default clerkWebHooks;
