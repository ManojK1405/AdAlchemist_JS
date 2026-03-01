import nodemailer from 'nodemailer';
import * as Sentry from '@sentry/node';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"AdAlchemist" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        return info;
    } catch (error) {
        Sentry.captureException(error);
        console.error("Email Error:", error);
        throw error;
    }
};

export const getTipEmailTemplate = (senderName, amount) => {
    return `
    <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #8b5cf6;">You just got a Tip! 🪙</h2>
        <p>Hello Creative,</p>
        <p>Great news! <strong>${senderName}</strong> just tipped you <strong>${amount} credits</strong> for your amazing work on AdAlchemist.</p>
        <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; margin: 20px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; color: #fbbf24;">+${amount} Credits</span>
        </div>
        <p>Keep up the great work and continue inspiring the community!</p>
        <a href="https://adalchemist.vercel.app/my-generations" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 20px;">View My Balance</a>
        <p style="margin-top: 40px; font-size: 12px; color: #64748b;">This is an automated notification from AdAlchemist.</p>
    </div>
    `;
};

export const getCommentEmailTemplate = (commenterName, projectTitle, commentContent) => {
    return `
    <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #8b5cf6;">New Comment on your project! 💬</h2>
        <p>Hello Creative,</p>
        <p><strong>${commenterName}</strong> just left a comment on your project <strong>"${projectTitle}"</strong>:</p>
        <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; margin: 20px 0; font-style: italic;">
            "${commentContent}"
        </div>
        <p>Go to the community to reply and engage with your audience!</p>
        <a href="https://adalchemist.vercel.app/community" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 20px;">Reply to Comment</a>
        <p style="margin-top: 40px; font-size: 12px; color: #64748b;">This is an automated notification from AdAlchemist.</p>
    </div>
    `;
};

export const getVideoCompleteEmailTemplate = (projectTitle, videoUrl) => {
    return `
    <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #8b5cf6;">Your Video is ready! 🎬</h2>
        <p>Hello Creative,</p>
        <p>The AI magic is complete! Your cinematic video for <strong>"${projectTitle}"</strong> has been successfully generated and is ready for prime time.</p>
        <div style="margin: 20px 0; text-align: center;">
             <img src="${videoUrl.replace('.mp4', '.jpg')}" alt="Video Preview" style="width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);" />
        </div>
        <p>You can now download it or publish it directly to social media.</p>
        <a href="https://adalchemist.vercel.app/my-generations" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 20px;">Watch Video</a>
        <p style="margin-top: 40px; font-size: 12px; color: #64748b;">This is an automated notification from AdAlchemist.</p>
    </div>
    `;
};

export const getQueueCompleteEmailTemplate = (userName, projectCount) => {
    return `
    <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #06b6d4;">Pipeline Processed! 🚀</h2>
        <p>Hello ${userName},</p>
        <p>Your generation pipeline has finished processing. All <strong>${projectCount}</strong> scheduled tasks have been completed successfully.</p>
        <div style="padding: 20px; background: rgba(6,182,212,0.1); border-radius: 12px; margin: 20px 0; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; color: #06b6d4;">All Generations Ready</span>
        </div>
        <p>You can now view, edit, and download your new content in your dashboard.</p>
        <a href="https://adalchemist.vercel.app/my-generations" style="display: inline-block; padding: 12px 24px; background: #06b6d4; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 20px;">Open My Dashboard</a>
        <p style="margin-top: 40px; font-size: 12px; color: #64748b;">This is an automated notification from AdAlchemist.</p>
    </div>
    `;
};

