import { useState } from "react"
import { Loader2 } from "lucide-react"
import Title from "../components/Title"
import UploadZone from "../components/UploadZone"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import api from "../configs/axios"
import BrandKitModal from "../components/BrandKitModal"
import heic2any from "heic2any"

const Generator = () => {

    const { user } = useUser()
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('')
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [aspectRatio, setAspectRatio] = useState('9:16')
    const [productImage, setProductImage] = useState(null)
    const [modelImage, setModelImage] = useState(null)
    const [userPrompt, setUserPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isBrandKitOpen, setIsBrandKitOpen] = useState(false)

    const handleFileChange = async (e, type) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];

            if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic")) {
                const toastId = toast.loading("Converting iPhone image format...");
                try {
                    const blob = await heic2any({
                        blob: file,
                        toType: "image/jpeg",
                        quality: 0.8
                    });

                    const finalBlob = Array.isArray(blob) ? blob[0] : blob;
                    file = new File([finalBlob], file.name.replace(/\.heic$/i, ".jpg"), {
                        type: "image/jpeg",
                    });
                    toast.success("Image optimized!", { id: toastId });
                } catch (error) {
                    console.error("HEIC conversion failed", error);
                    toast.error("Failed to process HEIC file. Please try a different image.", { id: toastId });
                    return;
                }
            }

            if (type === 'product') setProductImage(file)
            else setModelImage(file)
        }
    }

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (!user) {
            return toast("Please sign in to generate images")
        }

        if (!productImage || !modelImage || !name || !productName || !aspectRatio) {
            return toast("Please fill in all required fields")
        }

        try {
            setIsGenerating(true);

            const formData = new FormData();
            formData.append('name', name);
            formData.append('productName', productName);
            formData.append('productDescription', productDescription);
            formData.append('aspectRatio', aspectRatio);
            formData.append('userPrompt', userPrompt);
            formData.append('images', productImage);
            formData.append('images', modelImage);

            const token = await getToken();

            const { data } = await api.post('/api/project/create', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast("Project created successfully");
            navigate(`/result/${data.projectId}`);

        } catch (error) {
            setIsGenerating(false);
            toast("Failed to generate project")
        }

    }

    return (
        <div className="min-h-screen text-white p-6 md:p-12 mt-28">
            <form onSubmit={handleGenerate} className="max-w-6xl mx-auto space-y-12">

                <Title
                    heading="Create In-Context Image"
                    description="Upload your model and product images to generate stunning UGC, short-form videos and social media posts"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* LEFT SIDE */}
                    <div className="flex flex-col gap-8 ">
                        <UploadZone
                            label="Product Image"
                            file={productImage}
                            onClear={() => setProductImage(null)}
                            onChange={(e) => handleFileChange(e, 'product')}
                        />

                        <UploadZone
                            label="Model Image"
                            file={modelImage}
                            onClear={() => setModelImage(null)}
                            onChange={(e) => handleFileChange(e, 'model')}
                        />
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="space-y-6">

                        {/* Project Name & Brand Kit */}
                        <div className="flex items-end justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-sm mb-2">Project Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    placeholder="Name your project"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                                />
                            </div>
                            {user && (
                                <button
                                    type="button"
                                    onClick={() => setIsBrandKitOpen(true)}
                                    className="flex items-center gap-2 px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2v20c-5.523 0-10-4.477-10-10S6.477 2 12 2z" />
                                        <path d="m19 14.5-2-2-4 4" />
                                        <path d="m14.5 19 2-2 4 4" />
                                    </svg>
                                    Brand Kit
                                </button>
                            )}
                        </div>

                        {/* Product Name */}
                        <div>
                            <label className="block text-sm mb-2">Product Name</label>
                            <input
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                type="text"
                                placeholder="Enter the name of the product"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        {/* Product Description */}
                        <div>
                            <label className="block text-sm mb-2">
                                Product Description <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                rows={4}
                                placeholder="Enter the description of the product"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="block text-sm mb-3">Aspect Ratio</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAspectRatio('9:16')}
                                    className={`h-14 w-12 rounded-lg border flex items-center justify-center transition ${aspectRatio === '9:16'
                                        ? 'border-violet-500 bg-violet-500/10'
                                        : 'border-white/10 hover:border-violet-500/40'
                                        }`}
                                >
                                    <div className="h-8 w-4 border border-white/50 rounded-sm" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAspectRatio('16:9')}
                                    className={`h-14 w-16 rounded-lg border flex items-center justify-center transition ${aspectRatio === '16:9'
                                        ? 'border-violet-500 bg-violet-500/10'
                                        : 'border-white/10 hover:border-violet-500/40'
                                        }`}
                                >
                                    <div className="h-4 w-8 border border-white/50 rounded-sm" />
                                </button>
                            </div>
                        </div>

                        {/* User Prompt */}
                        <div>
                            <label className="block text-sm mb-2">
                                User Prompt <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                rows={3}
                                placeholder="Describe how you want the narration to be."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-violet-500"
                            />
                        </div>

                    </div>
                </div>

                {/* GENERATE BUTTON */}
                <div className="flex justify-center pt-6">
                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="px-12 py-4 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 font-semibold flex items-center gap-3 disabled:opacity-60"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5" />
                                Generating...
                            </>
                        ) : user ? (
                            <>Generate Image</>
                        ) : (
                            <>Sign In To Generate</>
                        )}
                    </button>
                </div>


            </form>

            <BrandKitModal isOpen={isBrandKitOpen} onClose={() => setIsBrandKitOpen(false)} />
        </div>
    )
}

export default Generator
