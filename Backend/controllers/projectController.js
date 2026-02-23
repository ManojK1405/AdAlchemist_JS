import * as Sentry from "@sentry/node";
import { sendEmail, getVideoCompleteEmailTemplate } from "../utils/email.js";
import { prisma } from "../configs/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import {
    HarmBlockThreshold,
    HarmCategory,
} from "@google/genai";
import fs from "fs";
import ai from "../configs/ai.js";
import axios from "axios";
import path from "path";

const loadImage = (filePath, mimeType) => {
    return {
        inlineData: {
            data: fs.readFileSync(filePath).toString("base64"),
            mimeType,
        },
    };
};

// Create project
export const createProject = async (req, res) => {
    let tempProjectId = null;
    let isCreditDeducted = false;

    try {
        const { userId } = req.auth();
        const {
            name = "New Project",
            aspectRatio,
            userPrompt,
            productName,
            productDescription,
            targetLength = 5,
        } = req.body;

        const images = req.files;

        if (!images || images.length < 2 || !productName) {
            return res.status(400).json({
                message:
                    "At least 2 images are required and product name is mandatory",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res
                .status(400)
                .json({ message: "User Not Found" });
        }

        const brandKit = await prisma.brandKit.findUnique({ where: { userId } });

        if (user.credits < 10) {
            return res
                .status(400)
                .json({ message: "Insufficient Credits" });
        }

        // Deduct credits
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: 10 },
            },
        });

        isCreditDeducted = true;

        // Upload original images
        const uploadedImages = await Promise.all(
            images.map(async (item) => {
                const result = await cloudinary.uploader.upload(item.path, {
                    resource_type: "image",
                    folder: "adalchemist",
                });
                return result.secure_url;
            })
        );

        // Create project
        const project = await prisma.project.create({
            data: {
                name,
                aspectRatio,
                userPrompt,
                productName,
                productDescription,
                targetLength: parseInt(targetLength),
                userId,
                uploadedImages,
                isGenerating: true,
            },
        });

        tempProjectId = project.id;

        // Gemini config
        const generationConfig = {
            maxOutputTokens: 32768,
            temperature: 1,
            topP: 0.95,
            responseModalities: ["IMAGE"],
            imageConfig: {
                aspectRatio: aspectRatio || "9:16",
                imageSize: "1K",
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.OFF,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.OFF,
                },
            ],
        };

        const img1 = loadImage(images[0].path, images[0].mimetype);
        const img2 = loadImage(images[1].path, images[1].mimetype);

        const promptImage = `
You are a professional commercial photographer creating a premium advertisement image.

CORE OBJECTIVE:
Create a photorealistic advertisement showing a person naturally interacting with the product in a way that feels authentic and aspirational.

PRODUCT INTEGRITY (CRITICAL):
- Product is the hero - main focal point of composition
- Preserve exact product appearance: shape, colors, logos, text, design details
- No warping, stretching, or distortion of any kind
- Maintain accurate product scale relative to person and environment
- Product must be in sharp focus with visible details

HUMAN SUBJECT:
- Natural, confident body language appropriate for the product
- Realistic skin tones and textures across all ethnicities
- Anatomically correct hands with proper finger positioning
- Genuine facial expression matching the product/brand mood
- Professional styling - hair, makeup, wardrobe coordinated with brand aesthetic

COMPOSITION & FRAMING:
- Rule of thirds or centered hero composition
- Person positioned to complement, not compete with product
- Negative space used strategically for text overlay areas
- Eye line and gesture directing attention to product
- Environmental context relevant to product use case

LIGHTING & TECHNICAL QUALITY:
- Studio-quality three-point lighting or natural window light simulation
- Consistent light temperature (warm/cool matching brand identity)
- Realistic shadows with proper direction and softness
- Subtle highlights on product surfaces for dimension
- Catchlights in subject's eyes for life and engagement

VISUAL STYLE:
- Shot on professional camera: Canon 5D Mark IV or Sony A7R IV
- 85mm f/1.8 lens for flattering compression and natural bokeh
- Shallow depth of field (f/2.8-f/4) with product and face in focus
- Color grading: ${userPrompt?.includes('color') ? 'per user specification' : 'clean, modern, slightly elevated saturation'}
- Professional retouching: subtle, maintaining authenticity

ENVIRONMENT:
- Clean, minimal background that doesn't distract
- Context appropriate to product category and use
- Props only if they enhance storytelling
- Consistent art direction matching brand tier (luxury/mainstream/lifestyle)

FORBIDDEN ELEMENTS:
- No AI artifacts, melted features, or uncanny valley effects
- No unrealistic proportions or physics-defying poses
- No floating objects or disconnected elements
- No excessive blur, grain, or technical flaws
- No generic stock photo clichés

BRAND ALIGNMENT:
Tone: Premium, aspirational, trustworthy, modern
Mood: ${userPrompt?.includes('mood') || userPrompt?.includes('vibe') ? 'per user specification' : 'Confident, authentic, approachable'}
Target: High-end consumer expecting quality and authenticity
${brandKit?.color ? `Brand Signature Color (incorporate into lighting, props, or background): ${brandKit.color}` : ''}
${brandKit?.voice ? `Brand Voice & Aesthetic Guidelines: ${brandKit.voice}` : ''}

${userPrompt ? `\nCUSTOM REQUIREMENTS:\n${userPrompt}` : ''}

OUTPUT:
Single high-resolution advertisement image ready for commercial use.
Quality: Magazine-cover standard, suitable for billboards and premium digital placements.
`;

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: [img1, img2, promptImage],
            config: generationConfig,
        });

        if (!response?.candidates?.[0]?.content?.parts) {
            throw new Error("No content generated");
        }

        const parts = response.candidates[0].content.parts;

        let finalBuffer = null;

        for (const part of parts) {
            if (part.inlineData?.data) {
                finalBuffer = Buffer.from(part.inlineData.data, "base64");
                break; // stop after first image
            }
        }

        if (!finalBuffer) {
            throw new Error("Failed to generate image");
        }

        // Upload generated image
        const uploadResult = await cloudinary.uploader.upload(
            `data:image/png;base64,${finalBuffer.toString("base64")}`,
            {
                resource_type: "image",
                folder: "adalchemist/generated",
            }
        );

        await prisma.project.update({
            where: { id: tempProjectId },
            data: {
                generatedImage: uploadResult.secure_url,
                isGenerating: false,
            },
        });

        return res.json({ projectId: project.id });

    } catch (error) {

        if (tempProjectId) {
            await prisma.project.update({
                where: { id: tempProjectId },
                data: {
                    isGenerating: false,
                    error: error.message,
                },
            });
        }

        if (isCreditDeducted) {
            await prisma.user.update({
                where: { id: req.auth()?.userId },
                data: {
                    credits: { increment: 10 },
                },
            });
        }

        Sentry.captureException(error);
        console.error(error);

        return res.status(500).json({ message: "Internal server error" });
    }
};


//create video
export const createVideo = async (req, res) => {
    const { userId } = req.auth();
    const { projectId } = req.body;

    let isCreditDeducted = false;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return res
            .status(400)
            .json({ message: "User Not Found" });
    }

    if (user.credits < 40) {
        return res
            .status(400)
            .json({ message: "Insufficient Credits" });
    }

    //deduct credits for video generation i.e 40 credits
    await prisma.user.update({
        where: { id: userId },
        data: {
            credits: { decrement: 40 },
        },
    }).then(() => {
        isCreditDeducted = true;
    });
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId },
            include: {
                user: true,
            },
        });

        if (!project || project.isGenerating) {
            return res.status(404).json({ message: 'Project not found or is generating' });
        }

        if (project.generatedVideo) {
            return res.status(400).json({ message: 'Video already generated' });
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                isGenerating: true,
            },
        });

        const prompt = `
Create a high-end cinematic commercial video featuring: ${project.productName}.
Context: ${project.productDescription || "Premium brand advertisement"}.

STRICT PRODUCT INTEGRITY:
• Hero Treatment: Product must be the focal point of every frame.
• Design Fidelity: Preserve exact physical appearance, colors, and branding without any distortion.

MOTION & DIRECTION:
• Dynamic Action: Natural human interaction with the product (unboxing, wearing, using, or showcasing).
• Cinematic Camera: Use a combination of slow-motion tracking shots and elegant focus shifts (bokeh).
• Atmosphere: Premium lighting, realistic reflections, and physically accurate shadows.

TECHNICAL QUALITY:
• Ultra-high-fidelity textures.
• Zero artifacts, morphing, or uncanny valley effects.
• Motion should feel intentional and professional, not random.

OUTPUT:
A stunningly realistic, brand-quality commercial segment ready for prime-time marketing.
`;


        const model = 'veo-3.1-generate-preview';

        if (!project.generatedImage) {
            throw new Error('Generated image not found');
        }

        const image = await axios.get(project.generatedImage, { responseType: 'arraybuffer' })

        const imageBytes = Buffer.from(image.data);

        let operation = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: imageBytes.toString('base64'),
                mimeType: 'image/png',
            },
            config: {
                aspectRatio: project?.aspectRatio || '9:16',
                numberOfVideos: 1,
                resolution: '720p'
            }

        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // wait for 10 seconds before checking again
            operation = await ai.operations.getVideosOperation({
                operation: operation,
            });
        }

        const fileName = `${userId}_${Date.now()}.mp4`;

        const filePath = path.join('videos', fileName);

        //create image directory if not exists
        fs.mkdirSync('videos', { recursive: true });

        if (!operation.response.generatedVideos) {
            throw new Error('Video generation failed');
        }

        //Download the video
        await ai.files.download({
            file: operation.response.generatedVideos[0].video,
            downloadPath: filePath,
        });

        //Upload to cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            resource_type: "video",
            folder: "adalchemist/generated",
        });

        //Update project with generated video url
        await prisma.project.update({
            where: { id: project.id },
            data: {
                generatedVideo: uploadResult.secure_url,
                isGenerating: false,
            },
        });

        // 💌 Send Notification Email
        if (project.user?.email) {
            const template = getVideoCompleteEmailTemplate(project.productName, uploadResult.secure_url);
            sendEmail(project.user.email, `Your video for ${project.productName} is ready! 🎬`, template)
                .catch(err => console.error("Video Completion Email failed:", err));
        }

        //delete the local video file
        fs.unlinkSync(filePath);

        return res.json({ message: 'Video generated successfully', videoUrl: uploadResult.secure_url });

    } catch (error) {

        await prisma.project.update({
            where: { id: projectId, userId },
            data: {
                isGenerating: false,
                error: error.message,
            },
        });

        if (isCreditDeducted) {
            await prisma.user.update({
                where: { id: req.auth()?.userId },
                data: {
                    credits: { increment: 40 },
                },
            });
        }

        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
}

//get all published projects
export const getAllPublishedProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                isPublished: true,
            },
            include: {
                user: true,
                projectLikes: true,
                comments: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ projects });

    } catch (error) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
}

//delete project
export const deleteProject = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const projectId = req.params.projectId;

        // Use findFirst instead of findUnique
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: userId,
            },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        await prisma.project.delete({
            where: { id: projectId },
        });

        return res.json({ message: "Project deleted successfully" });

    } catch (error) {
        Sentry.captureException(error);
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get project by id
export const getProjectById = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = req.auth?.userId;


        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required" });
        }

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: userId
            },
            include: {
                user: true,
                projectLikes: true,
                comments: true,
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        return res.json(project);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Edit & Regenerate Image (5 credits only)
export const editGeneration = async (req, res) => {
    let isCreditDeducted = false;
    let project = null;

    try {
        const { userId } = req.auth();
        const projectId = req.params.projectId;


        const {
            aspectRatio,
            userPrompt,
            productName,
            productDescription,
            name,
        } = req.body;

        // ✅ Check user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res
                .status(400)
                .json({ message: "User Not Found" });
        }

        if (user.credits < 5) {
            return res
                .status(400)
                .json({ message: "Insufficient Credits" });
        }

        // ✅ Get project safely
        project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project || project.userId !== userId) {
            return res.status(404).json({ message: "Project not found" });
        }

        const brandKit = await prisma.brandKit.findUnique({ where: { userId } });

        if (project.isGenerating) {
            return res.status(400).json({ message: "Project is already generating" });
        }

        // ✅ Deduct 5 credits
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: 5 },
            },
        });

        isCreditDeducted = true;

        // ✅ Mark project as generating
        await prisma.project.update({
            where: { id: projectId },
            data: {
                isGenerating: true,
            },
        });

        // ✅ Gemini config
        const generationConfig = {
            maxOutputTokens: 32768,
            temperature: 1,
            topP: 0.95,
            responseModalities: ["IMAGE"],
            imageConfig: {
                aspectRatio: aspectRatio || project.aspectRatio || "9:16",
                imageSize: "1K",
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.OFF,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.OFF,
                },
            ],
        };

        // ✅ Reuse previously uploaded images
        const image1Response = await axios.get(project.uploadedImages[0], {
            responseType: "arraybuffer",
        });

        const image2Response = await axios.get(project.uploadedImages[1], {
            responseType: "arraybuffer",
        });

        const img1 = {
            inlineData: {
                data: Buffer.from(image1Response.data).toString("base64"),
                mimeType: "image/png",
            },
        };

        const img2 = {
            inlineData: {
                data: Buffer.from(image2Response.data).toString("base64"),
                mimeType: "image/png",
            },
        };

        // ✅ Final prompt
        const finalPrompt = `
You are a world-class commercial photographer and art director creating a high-end advertisement image.

IMPORTANT:
This is a REFINEMENT phase. You are taking a base concept and elevating it to magazine-standard quality.
Apply the new creative direction with precision and artistic flair.
Do NOT simply repeat the previous generation; evolve it.

PRODUCT MASTER RULES (NON-NEGOTIABLE):
• Name: ${productName || project.productName}
• Description: ${productDescription || project.productDescription}
• Preserve absolute geometry: Exact shape, sharp edges, and authentic label placement.
• Hero Treatment: Product must be the undisputed focal point, rendered with ultra-realistic textures (brushed metal, smooth plastic, liquid reflections, etc.).
• No Distortion: Zero warping or melting of product components.

NEW ARTISTIC DIRECTION:
${userPrompt || project.userPrompt || "Create a clean, premium commercial look."}

${brandKit && brandKit.color ? `BRANDING SIGNATURE: Seamlessly integrate the brand color ${brandKit.color} into the lighting, environment accents, or subtle color grading.` : ''}
${brandKit && brandKit.voice ? `BRANDING AESTHETIC: Follow the brand's core vibe: ${brandKit.voice}.` : ''}

TECHNICAL SPECIFICATIONS:
• Lighting: Global Illumination, softbox key light, rim lighting to separate product from background.
• Lens: 100mm f/2.8 Macro lens look for extreme detail and natural background compression.
• Environment: Clean, contextually relevant, minimal but high-quality studio or lifestyle setting.
• Subject Interaction: If a person is present, ensure natural grip on product, expressive eyes, and professional styling. 
• Negative Space: Strategic placement for future ad copy (Top, Bottom, or Sides).

FORBIDDEN:
• AI Hallucinations (extra limbs, merged objects).
• Generic stock photo look.
• Low-contrast or muddy colors.

OUTPUT:
One ultra-high-resolution photorealistic advertisement image that looks like it was shot for a premium global brand campaign.
`;



        // ✅ Generate image
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: [img1, img2, finalPrompt],
            config: generationConfig,
        });

        if (!response?.candidates?.[0]?.content?.parts) {
            throw new Error("No content generated");
        }

        const parts = response.candidates[0].content.parts;

        let finalBuffer = null;

        for (const part of parts) {
            if (part.inlineData?.data) {
                finalBuffer = Buffer.from(part.inlineData.data, "base64");
                break;
            }
        }

        if (!finalBuffer) {
            throw new Error("Failed to generate image");
        }

        // ✅ Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(
            `data:image/png;base64,${finalBuffer.toString("base64")}`,
            {
                resource_type: "image",
                folder: "adalchemist/generated",
            }
        );

        // ✅ Update project with new values
        await prisma.project.update({
            where: { id: projectId },
            data: {
                name: name ?? project.name,
                aspectRatio: aspectRatio ?? project.aspectRatio,
                userPrompt: userPrompt ?? project.userPrompt,
                productName: productName ?? project.productName,
                productDescription:
                    productDescription ?? project.productDescription,
                generatedImage: uploadResult.secure_url,
                isGenerating: false,
                error: "",
            },
        });

        return res.json({
            message: "Image regenerated successfully",
            imageUrl: uploadResult.secure_url,
        });

    } catch (error) {

        // ✅ Refund credits if deducted
        if (isCreditDeducted) {
            await prisma.user.update({
                where: { id: req.auth()?.userId },
                data: {
                    credits: { increment: 5 },
                },
            });
        }

        // ✅ Safely reset project generating state
        if (project) {
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    isGenerating: false,
                    error: error.message,
                },
            });
        }

        Sentry.captureException(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const editVideo = async (req, res) => {
    const { userId } = req.auth();
    const { projectId, userPrompt } = req.body;

    let isCreditDeducted = false;

    try {
        // ✅ Check user credits (20)
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res
                .status(400)
                .json({ message: "User Not Found" });
        }

        if (user.credits < 20) {
            return res
                .status(400)
                .json({ message: "Insufficient Credits" });
        }

        // ✅ Get project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { user: true }
        });

        if (!project || project.userId !== userId) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!project.generatedImage) {
            return res
                .status(400)
                .json({ message: "Image must exist before editing video" });
        }

        if (project.isGenerating) {
            return res
                .status(400)
                .json({ message: "Project is already generating" });
        }

        // ✅ Deduct 20 credits
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: 20 },
            },
        });

        isCreditDeducted = true;

        // ✅ Mark project as generating
        await prisma.project.update({
            where: { id: projectId },
            data: {
                isGenerating: true,
            },
        });

        // 🔥 Build enhanced motion prompt
        const prompt = `
You are a senior video editor and motion designer refining a premium commercial advertisement.

CORE TASK:
Elevate the existing scene from a static or basic motion state into a cinematic masterpiece.
Maintain total brand consistency while injecting high-end motion dynamics.

BASE ASSET CONSTANTS:
• Name: ${project.productName}
• Context: ${project.productDescription}
• STAY IDENTICAL: Product scale, branding, lighting environment, and core setting.

MOTION DIRECTIVE:
${userPrompt || project.userPrompt || "Refine motion with smoother cinematic movement."}

MOTION REFINEMENT RULES:
• Parallax Effect:Foreground and background should move at slightly different offsets to create professional depth.
• Camera Dynamics: Use high-end film equipment simulation (Dolly, Pan, or Crane shots).
• Micro-Expressions: If a subject is visible, ensure realistic blinks, subtle smiles, or natural shifts in weight.
• Product Interaction: Movement should highlight the product's premium features (glint of light on metal, fluid movement of liquid, etc.).

TECHNICAL QUALITY:
• 24fps cinematic cadence.
• Zero morphing artifacts or physics-defying glitches.
• Consistent temporal coherence (objects should not change shape during movement).

OUTPUT:
A breathtakingly professional 5-second commercial segment that looks like it was produced by a top-tier creative agency.
`;


        const model = "veo-3.1-generate-preview";

        // ✅ Download base image
        const imageResponse = await axios.get(project.generatedImage, {
            responseType: "arraybuffer",
        });

        const imageBytes = Buffer.from(imageResponse.data);

        // ✅ Start video generation
        let operation = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: imageBytes.toString("base64"),
                mimeType: "image/png",
            },
            config: {
                aspectRatio: project.aspectRatio || "9:16",
                numberOfVideos: 1,
                resolution: "720p",
            },
        });

        // ✅ Poll until done
        while (!operation.done) {
            await new Promise((resolve) => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({
                operation,
            });
        }

        if (!operation.response.generatedVideos) {
            throw new Error("Video regeneration failed");
        }

        // ✅ Save temp video
        const fileName = `${userId}_${Date.now()}_edit.mp4`;
        const filePath = path.join("videos", fileName);

        fs.mkdirSync("videos", { recursive: true });

        await ai.files.download({
            file: operation.response.generatedVideos[0].video,
            downloadPath: filePath,
        });

        // ✅ Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            resource_type: "video",
            folder: "adalchemist/generated",
        });

        // ✅ Update project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedVideo: uploadResult.secure_url,
                isGenerating: false,
                userPrompt: userPrompt ?? project.userPrompt,
                error: "",
            },
        });

        // 💌 Send Notification Email
        if (project.user?.email) {
            const template = getVideoCompleteEmailTemplate(project.productName, uploadResult.secure_url);
            sendEmail(project.user.email, `Enhanced video for ${project.productName} is ready! 🎬`, template)
                .catch(err => console.error("Video Edit Email failed:", err));
        }

        // Delete local file
        fs.unlinkSync(filePath);

        return res.json({
            message: "Video regenerated successfully",
            videoUrl: uploadResult.secure_url,
        });

    } catch (error) {

        // Refund credits if failed
        if (isCreditDeducted) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    credits: { increment: 20 },
                },
            });
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                isGenerating: false,
                error: error.message,
            },
        });

        Sentry.captureException(error);
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

// get trending projects (most liked)
export const getTrendingProjects = async (req, res) => {
    try {
        const trendingProjects = await prisma.project.findMany({
            where: {
                isPublished: true,
            },
            include: {
                user: true,
                projectLikes: true,
                comments: true,
                _count: {
                    select: { projectLikes: true }
                }
            },
            orderBy: {
                projectLikes: {
                    _count: 'desc'
                }
            },
            take: 10
        });

        res.json({ projects: trendingProjects });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
