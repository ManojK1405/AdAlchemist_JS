import { prisma } from "../configs/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import ai from "../configs/ai.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { HarmBlockThreshold, HarmCategory } from "@google/genai";
import { sendEmail, getQueueCompleteEmailTemplate, getVideoCompleteEmailTemplate } from "./email.js";

const loadImage = (filePath, mimeType) => {
    return {
        inlineData: {
            data: fs.readFileSync(filePath).toString("base64"),
            mimeType,
        },
    };
};

const loadImageFromUrl = async (url) => {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return {
        inlineData: {
            data: Buffer.from(response.data).toString("base64"),
            mimeType: "image/png",
        },
    };
};

export const processImageGeneration = async (projectId, payload) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { user: true }
    });

    if (!project) throw new Error("Project not found");

    const { aspectRatio, userPrompt, productName, productDescription, brandKit } = payload;
    const brandLogoUrl = payload.brandLogoUrl || project.brandLogo;

    const generationConfig = {
        maxOutputTokens: 32768,
        temperature: 0.8,
        topP: 0.9,
        responseModalities: ["IMAGE"],
        imageConfig: {
            aspectRatio: aspectRatio || "9:16",
            imageSize: "1K",
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
        ],
    };

    const img1 = await loadImageFromUrl(project.uploadedImages[0]);
    const img2 = await loadImageFromUrl(project.uploadedImages[1]);

    const promptImage = `
You are an elite commercial photography AI. Your mission is to generate a high-end, photorealistic advertisement image that is indistinguishable from a professional shoot.
CORE OBJECTIVE: Create a flawless advertisement showing the person from the uploaded content naturally interacting with the product. The output must be aspirational, clean, and commercial-grade.
SUBJECT FIDELITY & IDENTITY (CRITICAL):
- Maintain the EXACT facial features, bone structure, and identity of the person in the source image.
PRODUCT INTEGRITY:
- The product (${productName}) is the HERO. It must be rendered with perfect geometrical accuracy.
BRAND ALIGNMENT:
${brandKit?.color ? `Incorporate Brand Color subtly: ${brandKit.color}` : ''}
${brandKit?.voice ? `Aesthetic Guidelines: ${brandKit.voice}` : ''}
${brandLogoUrl ? `BRAND LOGO INTEGRATION (SUBTLE): subtly integrate logo into the scene background.` : ''}
${userPrompt ? `\nCUSTOM CREATIVE DIRECTION:\n${userPrompt}` : ''}
OUTPUT: One high-resolution, magazine-quality advertisement image.
`;

    const contents = [img1, img2];
    if (brandLogoUrl) {
        contents.push(await loadImageFromUrl(brandLogoUrl));
    }
    contents.push(promptImage);

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents,
        config: generationConfig,
    });

    if (!response?.candidates?.[0]?.content?.parts) throw new Error("No content generated");

    const part = response.candidates[0].content.parts.find(p => p.inlineData?.data);
    if (!part) throw new Error("Failed to generate image data");

    const finalBuffer = Buffer.from(part.inlineData.data, "base64");
    const uploadResult = await cloudinary.uploader.upload(`data:image/png;base64,${finalBuffer.toString("base64")}`, {
        resource_type: "image",
        folder: "adalchemist/generated",
    });

    await prisma.project.update({
        where: { id: projectId },
        data: {
            generatedImage: uploadResult.secure_url,
            imageVersions: { push: uploadResult.secure_url },
            isGenerating: false,
        },
    });

    return uploadResult.secure_url;
};

export const processVideoGeneration = async (projectId, payload) => {
    let project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { user: true }
    });

    if (!project) throw new Error("Project not found");

    // If there's no image yet, generate it first as the reference frame
    if (!project.generatedImage) {
        console.log(`[Queue] No master image found for project ${projectId}. Generating image first...`);
        await processImageGeneration(projectId, payload);
        // Refresh project data to get the new generatedImage
        project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { user: true }
        });
    }

    if (!project.generatedImage) throw new Error("Failed to secure a master image for video generation");

    const prompt = `
Create a high-end cinematic commercial video featuring: ${project.productName}.
Context: ${project.productDescription || "Premium brand advertisement"}.
Motion: Professional cinematic flow, focus shifts, and product-focused unboxing/interaction style.
Brand Alignment: ${brandKit?.voice || "Premium Commercial"}.
${userPrompt ? `Creative Narrative: ${userPrompt}` : ''}
`;
    const image = await axios.get(project.generatedImage, { responseType: 'arraybuffer' });
    const imageBytes = Buffer.from(image.data);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        image: {
            imageBytes: imageBytes.toString('base64'),
            mimeType: 'image/png',
        },
        config: {
            aspectRatio: project.aspectRatio || '9:16',
            numberOfVideos: 1,
            resolution: '720p'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation.error) throw new Error(operation.error.message);

    const fileName = `${project.userId}_${Date.now()}.mp4`;
    const filePath = path.join('videos', fileName);
    fs.mkdirSync('videos', { recursive: true });

    await ai.files.download({
        file: operation.response.generatedVideos[0].video,
        downloadPath: filePath,
    });

    const uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: "video",
        folder: "adalchemist/generated",
    });

    await prisma.project.update({
        where: { id: projectId },
        data: {
            generatedVideo: uploadResult.secure_url,
            videoVersions: { push: uploadResult.secure_url },
            isGenerating: false,
        },
    });

    if (project.user?.email) {
        const template = getVideoCompleteEmailTemplate(project.productName, uploadResult.secure_url);
        sendEmail(project.user.email, `Video Ready: ${project.productName}`, template).catch(console.error);
    }

    fs.unlinkSync(filePath);
    return uploadResult.secure_url;
};
