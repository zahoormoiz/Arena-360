'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Check, Crop as CropIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/utils/cropImage';

export default function SportsPage() {
    const [sports, setSports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSport, setEditingSport] = useState<any>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    // ... (rest of state)

    // Form State
    const [formData, setFormData] = useState<{
        name: string, description: string, basePrice: number, weekendPrice: number, image: string, durationOptions: number[], isActive: boolean, sortOrder: number
    }>({
        name: '', description: '', basePrice: 0, weekendPrice: 0, image: '', durationOptions: [1, 1.5, 2], isActive: true, sortOrder: 0
    });

    useEffect(() => {
        fetchSports();
    }, []);

    const fetchSports = async () => {
        const res = await fetch('/api/admin/sports');
        const data = await res.json();
        if (data.success) {
            setSports(data.data);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        let imageUrl = formData.image;

        if (selectedFile) {
            const uploadData = new FormData();
            uploadData.append('file', selectedFile);

            try {
                const uploadRes = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: uploadData
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    if (data.success) {
                        imageUrl = data.url;
                    } else {
                        alert('Image upload failed: ' + data.error);
                        setUploading(false);
                        return;
                    }
                } else {
                    alert('Image upload failed');
                    setUploading(false);
                    return;
                }
            } catch (err) {
                console.error(err);
                alert('Image upload error');
                setUploading(false);
                return;
            }
        }

        const finalData = { ...formData, image: imageUrl };

        const url = editingSport ? `/api/admin/sports/${editingSport._id}` : '/api/admin/sports';
        const method = editingSport ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingSport(null);
                fetchSports();
                resetForm();
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Operation failed');
            }
        } catch {
            alert('Network error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const choice = confirm('Warning: Deleting a sport is usually not recommended if it has historical bookings.\n\nCancel to abort.\nOK to proceed with permanent deletion.');
        if (!choice) return;

        await fetch(`/api/admin/sports/${id}`, { method: 'DELETE' });
        fetchSports();
        alert('Sport deleted.');
    };

    const openEdit = (sport: any) => {
        setEditingSport(sport);
        setFormData({
            name: sport.name,
            description: sport.description || '',
            basePrice: sport.basePrice,
            weekendPrice: sport.weekendPrice || sport.basePrice,
            image: sport.image,
            durationOptions: sport.durationOptions || [1, 1.5, 2],
            isActive: sport.isActive ?? true,
            sortOrder: sport.sortOrder || 0
        });
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', basePrice: 0, weekendPrice: 0, image: '', durationOptions: [1, 1.5, 2], isActive: true, sortOrder: 0 });
        setSelectedFile(null);
        setImageSrc(null);
        setIsCropping(false);
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const performCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            // Create a File from Blob
            const file = new File([croppedImageBlob], "cropped-image.jpg", { type: "image/jpeg" });
            setSelectedFile(file);
            setIsCropping(false);
        } catch (e) {
            console.error(e);
            alert('Could not crop image');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Sports Management</h1>
                    <p className="text-gray-400">Configure available sports and pricing</p>
                </div>
                <Button onClick={() => { setEditingSport(null); resetForm(); setIsModalOpen(true); }} className="gap-2">
                    <Plus size={18} /> Add Sport
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sports.map((sport) => (
                    <div key={sport._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group">
                        <div className="h-40 bg-black/50 relative">
                            {/* In real app, next/image would be used, but external URLs might be dynamic */}
                            <img src={sport.image || '/placeholder.jpg'} alt={sport.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(sport)} className="p-2 bg-black/80 rounded-full text-white hover:bg-primary hover:text-black"><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(sport._id)} className="p-2 bg-black/80 rounded-full text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2">{sport.name}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{sport.description}</p>
                            <div className="flex justify-between items-center border-t border-white/10 pt-4">
                                <span className="text-primary font-mono text-lg font-bold">Rs {sport.basePrice}/hr</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500 bg-white/10 px-2 py-1 rounded">
                                        Order: {sport.sortOrder || 0}
                                    </span>
                                    <span className={`text-xs font-bold ${sport.isActive ? 'text-green-500' : 'text-gray-500'}`}>
                                        {sport.isActive ? 'Visible' : 'Hidden'}
                                    </span>
                                    <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name={`toggle-${sport._id}`} id={`toggle-${sport._id}`}
                                            checked={sport.isActive ?? true}
                                            onChange={async (e) => {
                                                const newStatus = e.target.checked;
                                                // Optimistic update
                                                const updatedSports = sports.map(s => s._id === sport._id ? { ...s, isActive: newStatus } : s);
                                                setSports(updatedSports);

                                                try {
                                                    await fetch(`/api/admin/sports/${sport._id}`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ isActive: newStatus })
                                                    });
                                                } catch {
                                                    fetchSports(); // Revert on error
                                                }
                                            }}
                                            className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5"
                                        />
                                        <label htmlFor={`toggle-${sport._id}`} className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${sport.isActive ? 'bg-green-500' : 'bg-gray-700'}`}></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                        <h2 className="text-2xl font-bold text-white mb-6">{editingSport ? 'Edit Sport' : 'Add New Sport'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Sport Name</label>
                                <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Cricket" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Base Price (Weekday)</label>
                                    <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                        value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value === '' ? 0 : Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-xs uppercase text-primary font-bold block mb-1">Weekend Price</label>
                                    <input type="number" className="w-full bg-white/5 border border-primary/30 rounded-lg p-3 text-white"
                                        value={formData.weekendPrice} onChange={e => setFormData({ ...formData, weekendPrice: e.target.value === '' ? 0 : Number(e.target.value) })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Sort Order (Lower = First)</label>
                                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                                    value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: e.target.value === '' ? 0 : Number(e.target.value) })}
                                    placeholder="0" />
                            </div>

                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Sport Image</label>
                                <div className="space-y-3">
                                    {/* File Input */}
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={onFileChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90"
                                        />
                                    </div>

                                    {/* Cropper Modal */}
                                    {isCropping && imageSrc && (
                                        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
                                            <div className="relative w-full max-w-2xl h-[400px] bg-[#111] rounded-lg overflow-hidden mb-4">
                                                <Cropper
                                                    image={imageSrc}
                                                    crop={crop}
                                                    zoom={zoom}
                                                    aspect={3 / 4}
                                                    onCropChange={setCrop}
                                                    onCropComplete={onCropComplete}
                                                    onZoomChange={setZoom}
                                                />
                                            </div>
                                            <div className="flex gap-4">

                                                <Button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="bg-red-500 hover:bg-red-600">
                                                    <X size={18} className="mr-2" /> Cancel
                                                </Button>
                                                <Button onClick={performCrop} className="bg-green-500 hover:bg-green-600">
                                                    <Check size={18} className="mr-2" /> Use Cropped Image
                                                </Button>
                                            </div>
                                            <div className="mt-4 w-full max-w-xs">
                                                <label className="text-white text-xs mb-1 block">Zoom</label>
                                                <input
                                                    type="range"
                                                    value={zoom}
                                                    min={1}
                                                    max={3}
                                                    step={0.1}
                                                    aria-labelledby="Zoom"
                                                    onChange={(e) => setZoom(Number(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Preview */}
                                    {(selectedFile || formData.image) && (
                                        <div className="relative w-full h-40 bg-black/40 rounded-lg overflow-hidden border border-white/10">
                                            <img
                                                src={selectedFile ? URL.createObjectURL(selectedFile) : formData.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Show URL for reference if using existing image */}
                                            {!selectedFile && (
                                                <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-xs text-gray-400 truncate">
                                                    {formData.image}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Fallback to URL input if needed */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-px bg-white/10 flex-1"></div>
                                        <span className="text-xs text-gray-600">OR URL</span>
                                        <div className="h-px bg-white/10 flex-1"></div>
                                    </div>

                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-gray-400 text-sm"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Duration Options</label>
                                <div className="flex gap-4">
                                    {[1, 1.5, 2, 3].map((dur) => (
                                        <label key={dur} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.durationOptions.includes(dur)}
                                                onChange={(e) => {
                                                    const newOpts = e.target.checked
                                                        ? [...formData.durationOptions, dur]
                                                        : formData.durationOptions.filter(d => d !== dur);
                                                    setFormData({ ...formData, durationOptions: newOpts.sort() });
                                                }}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <span className="text-sm text-gray-300">{dur}h</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold block mb-1">Description</label>
                                <textarea className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white h-24"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-sm text-white font-bold">Active Status</span>
                                <div className="ml-auto relative inline-block w-12 mr-2 align-middle select-none">
                                    <input type="checkbox" name="active-toggle" id="active-toggle"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6"
                                    />
                                    <label htmlFor="active-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.isActive ? 'bg-green-500' : 'bg-gray-700'}`}></label>
                                </div>
                            </div>

                            <Button fullWidth className="mt-4" disabled={uploading}>
                                {uploading ? 'Uploading & Saving...' : (editingSport ? 'Update Sport' : 'Create Sport')}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
