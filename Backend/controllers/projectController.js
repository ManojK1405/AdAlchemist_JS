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
            temperature: 0.8, // Slightly lower for more stability
            topP: 0.9,      // Reduced for tighter output
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
You are an elite commercial photography AI. Your mission is to generate a high-end, photorealistic advertisement image that is indistinguishable from a professional shoot.

CORE OBJECTIVE:
Create a flawless advertisement showing the person from the uploaded content naturally interacting with the product. The output must be aspirational, clean, and commercial-grade.

SUBJECT FIDELITY & IDENTITY (CRITICAL):
- Maintain the EXACT facial features, bone structure, and identity of the person in the source image.
- ABSOLUTELY NO facial distortion, warping, or "melting" of features.
- Eyes must be sharp, expressive, and anatomically perfect (no double iris or blurred pupils).
- Skin texture must be realistic, showing natural pores and subtle imperfections, avoiding a "plastic" or "airbrushed" AI look.
- Hands and fingers must be anatomically correct, naturally gripping or gesturing towards the product without merging into it.

PRODUCT INTEGRITY:
- The product (${productName}) is the HERO. It must be rendered with perfect geometrical accuracy.
- Zero distortion of logos, text, or characteristic design elements.
- Material physics: render realistic reflections on metal/glass and accurate textures on fabric/plastic.
- Scaling must be physically accurate relative to the human subject.

COMPOSITION & ART DIRECTION:
- Professional studio-grade lighting (Rembrandt or High-key) matching the product's premium nature.
- Depth of Field: Use a soft bokeh background to make the subject and product pop (F-stop 2.8 style).
- Background: Clean, minimal environment that complements the brand kit color if provided.
- Shot on: Hasselblad H6D-400c with 85mm prime lens for maximum detail.

FORBIDDEN:
- Extra limbs, merged fingers, or unnatural body proportions.
- AI artifacts, background hallucinations, or "uncanny valley" faces.
- Floating objects or physics-defying placement.
- Watermarks, blurry textures, or low-resolution details.

BRAND ALIGNMENT:
${brandKit?.color ? `Incorporate Brand Color subtly: ${brandKit.color}` : ''}
${brandKit?.voice ? `Aesthetic Guidelines: ${brandKit.voice}` : ''}

${userPrompt ? `\nCUSTOM CREATIVE DIRECTION:\n${userPrompt}` : ''}

OUTPUT:
One high-resolution, magazine-quality advertisement image.
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

        if (operation.error) {
            throw new Error(`Generation Error: ${operation.error.message || JSON.stringify(operation.error)}`);
        }

        if (!operation.response?.generatedVideos) {
            let errorMsg = 'Video generation failed';
            if (operation.response?.raiMediaFilteredReasons?.length > 0) {
                errorMsg = `Content filtered due to safety policies: ${operation.response.raiMediaFilteredReasons.join(', ')}`;
            }
            throw new Error(errorMsg);
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
            temperature: 0.7, // Lower than initial generation for higher fidelity
            topP: 0.85,      // Tighter for refinement
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
You are a world-class commercial photographer and art director. This is a REFINEMENT phase. You are taking a base concept and elevating it to magazine-standard quality.

SUBJECT FIDELITY (HIGHEST PRIORITY):
- Maintain the EXACT facial features, bone structure, and identity of the person in the source image.
- ABSOLUTELY NO facial distortion, warping, or asymmetry.
- Eyes must be perfectly symmetrical, sharp, and full of life.
- Skin texture must be realistic and high-resolution, avoiding any "plastic" or over-smoothed AI look.
- Hands and fingers must be anatomically correct with professional posing.

PRODUCT MASTER RULES:
• Name: ${productName || project.productName}
• Description: ${productDescription || project.productDescription}
• Render with perfect geometrical accuracy. No warping or melting of product components.
• Hero Treatment: Use rim lighting and micro-contrast to make the product look premium.

NEW CREATIVE DIRECTION:
${userPrompt || project.userPrompt || "Create a clean, premium commercial look."}

BRANDING & STYLE:
${brandKit && brandKit.color ? `Brand Signature Color (incorporate subtly): ${brandKit.color}` : ''}
${brandKit && brandKit.voice ? `Brand Aesthetic Guidelines: ${brandKit.voice}` : ''}

TECHNICAL SPECS:
• Lighting: 3-point studio setup with a softbox key and back-lighting for separation.
• Camera: Digital Medium Format look (Phase One style) for ultimate clarity.
• Environment: Sophisticated, minimal, and contextually relevant.
• Negative Space: Ensure breathable composition for potential ad copy overlays.

FORBIDDEN:
• Extra limbs, merged objects, or technical artifacts.
• Low-contrast, muddy colors, or blurry focal areas.

OUTPUT:
One ultra-high-resolution photorealistic advertisement image that looks like a high-budget global campaign.
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
