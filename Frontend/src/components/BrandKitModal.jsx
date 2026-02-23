import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Palette, MessageSquareText, Save, X, Loader2Icon } from 'lucide-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';

const BrandKitModal = ({ isOpen, onClose }) => {
    const { getToken } = useAuth();
    const [color, setColor] = useState('#4f46e5');
    const [voice, setVoice] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchBrandKit();
        }
    }, [isOpen]);

    const fetchBrandKit = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.get('/api/user/brand-kit', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setColor(data.brandKit.color || '#4f46e5');
            setVoice(data.brandKit.voice || '');
        } catch (error) {
            console.error('Error fetching brand kit', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await getToken();
            await api.post('/api/user/brand-kit', { color, voice }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Brand Kit saved consistently!');
            onClose();
        } catch (error) {
            toast.error('Failed to save Brand Kit');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold mb-2 text-white">Brand Kit Settings</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Maintain consistency across generations by setting your brand's signature color and voice.
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2Icon className="animate-spin text-indigo-500 size-8" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Color Setting */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-200">
                                    <Palette size={16} className="text-indigo-400" />
                                    Signature Color (Hex)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="h-10 w-16 bg-transparent rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-indigo-500 text-white uppercase"
                                        placeholder="#4F46E5"
                                    />
                                </div>
                            </div>

                            {/* Voice Setting */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-200">
                                    <MessageSquareText size={16} className="text-indigo-400" />
                                    Brand Aesthetic / Voice Guidelines
                                </label>
                                <textarea
                                    value={voice}
                                    onChange={(e) => setVoice(e.target.value)}
                                    rows={4}
                                    placeholder="e.g. Minimalist luxury, bright and energetic, moody cinematic, professional corporate..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-indigo-500 text-white"
                                />
                                <p className="text-xs text-gray-500 mt-2 hover:text-gray-400 transition-colors">
                                    These rules will be injected behind the scenes into every prompt to maintain brand consistency.
                                </p>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                {saving ? <Loader2Icon className="animate-spin size-5" /> : <Save size={18} />}
                                {saving ? "Saving..." : "Save Brand Protocol"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandKitModal;
