import React, { useState } from 'react';
import { MdClose, MdSend, MdOutlineImage, MdOutlineVideocam } from "react-icons/md";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from "firebase/firestore";
import { db, storage } from '../../firebase';
import { useSelector } from 'react-redux';
import { v4 as uuid } from 'uuid';
import Input from '../../utils/Input';

const StatusUploadModal = ({ onClose }) => {
    const { user, profile } = useSelector((state) => state.auth);
    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [fileType, setFileType] = useState(null); // 'image' or 'video'

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setFileType(selectedFile.type.startsWith('video') ? 'video' : 'image');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        try {
            // Use 'images/' path as it is known to work with current storage rules
            const storageRef = ref(storage, `images/${uuid()}`);

            const metadata = {
                contentType: file.type,
                customMetadata: {
                    originalName: file.name,
                    type: "status"
                }
            };

            const uploadTask = await uploadBytesResumable(storageRef, file, metadata);
            const downloadURL = await getDownloadURL(uploadTask.ref);

            const newStory = {
                id: uuid(),
                url: downloadURL,
                type: fileType,
                caption: caption,
                timestamp: Timestamp.now(),
                expiresAt: new Timestamp(Timestamp.now().seconds + 24 * 60 * 60, 0) // 24 hours from now
            };

            // Update or Create Status Document
            const statusRef = doc(db, "statuses", user.uid);

            // We use setDoc with merge: true to create if not exists, or update if exists
            await setDoc(statusRef, {
                userInfo: {
                    uid: user.uid,
                    displayName: profile?.name || user.displayName || "User",
                    photoURL: user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                },
                lastUpdated: serverTimestamp(),
                stories: arrayUnion(newStory)
            }, { merge: true });

            onClose();

        } catch (error) {
            console.error("Error uploading status:", error);
            alert("Failed to upload status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-[#202c33] w-full max-w-md rounded-lg shadow-xl flex flex-col max-h-[90vh] relative">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-white text-lg font-medium">New Status</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                    {preview ? (
                        <div className="relative w-full h-full flex flex-col items-center">
                            {fileType === 'video' ? (
                                <video src={preview} controls className="max-h-[60vh] rounded-lg" />
                            ) : (
                                <img src={preview} alt="Preview" className="max-h-[60vh] object-contain rounded-lg" />
                            )}
                            <button
                                onClick={() => { setFile(null); setPreview(null); }}
                                className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col items-center gap-2 cursor-pointer p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-teal-500 hover:bg-gray-800 transition">
                                <MdOutlineImage size={48} className="text-teal-500" />
                                <span className="text-gray-400">Upload Image</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                            </label>
                            <label className="flex flex-col items-center gap-2 cursor-pointer p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-teal-500 hover:bg-gray-800 transition">
                                <MdOutlineVideocam size={48} className="text-teal-500" />
                                <span className="text-gray-400">Upload Video</span>
                                <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {preview && (
                    <div className="p-4 border-t border-gray-700 flex gap-2 items-center">
                        <Input
                            type="text"
                            value={caption}
                            onChange={e => setCaption(e.target.value)}
                            placeholder="Add a caption..."
                            className="!bg-gray-700 !border-none !text-white flex-1"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full disabled:opacity-50"
                        >
                            <MdSend size={24} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusUploadModal;
