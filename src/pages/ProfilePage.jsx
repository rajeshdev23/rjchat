import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IoArrowBack, IoClose } from "react-icons/io5";
import { FaCamera } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { setUserProfile } from '../features/authSlice';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const ProfilePage = () => {
    const { profile, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [name, setName] = useState(profile?.name || "");
    const [about, setAbout] = useState(profile?.about || "Hey there! I am using Rj Chat.");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setAbout(profile.about || "Hey there! I am using Rj Chat.");
        }
    }, [profile]);

    const handleImageClick = () => {
        setShowFullImage(true);
    };

    const handleCameraClick = (e) => {
        e.stopPropagation(); // Prevent opening the full image
        fileInputRef.current.click();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const date = new Date().getTime();
            const storageRef = ref(storage, `avatars/${user.uid}`);

            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // You can track progress here if needed
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    console.error("Upload error:", error);
                    alert("Failed to upload image.");
                    setUploading(false);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                        // Update Firestore
                        const userRef = doc(db, "users", user.uid);
                        await updateDoc(userRef, {
                            avatar: downloadURL
                        });

                        // Update Redux
                        dispatch(setUserProfile({ ...profile, avatar: downloadURL }));
                        setUploading(false);
                        alert("Profile picture updated!");
                    });
                }
            );
        } catch (error) {
            console.error("Error handling image:", error);
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                name,
                about
            });

            // Update Redux state
            dispatch(setUserProfile({ ...profile, name, about }));

            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-800 border-b border-gray-700 text-white">
                <button onClick={() => navigate('/')} className="hover:bg-gray-700 p-2 rounded-full transition">
                    <IoArrowBack size={24} />
                </button>
                <h1 className="text-xl font-semibold">Profile</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex justify-center">
                <div className="w-full max-w-2xl flex flex-col gap-8 animate-fade-in">

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="relative group cursor-pointer"
                            onClick={handleImageClick}
                        >
                            <img
                                src={profile?.avatar || "https://via.placeholder.com/150"}
                                alt="Profile"
                                className={`w-40 h-40 rounded-full object-cover border-4 border-gray-700 transition ${uploading ? 'opacity-50' : ''}`}
                            />

                            {/* Camera Button (Separate Action) */}
                            <button
                                className="absolute bottom-0 right-0 bg-teal-600 p-3 rounded-full hover:bg-teal-700 transition shadow-lg border-4 border-gray-900"
                                onClick={handleCameraClick}
                                title="Change Profile Photo"
                            >
                                <FaCamera className="text-white text-lg" />
                            </button>

                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm">
                            {uploading ? "Uploading..." : "Click photo to view full size"}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    {/* Info Fields */}
                    <div className="flex flex-col gap-6 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">

                        {/* Name */}
                        <div className="flex flex-col gap-2">
                            <label className="text-teal-500 text-sm font-medium">Your Name</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent text-white text-lg border-b border-gray-600 focus:border-teal-500 outline-none py-2 transition"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <p className="text-gray-500 text-xs">This is not your username or pin. This name will be visible to your contacts.</p>
                        </div>

                        {/* About */}
                        <div className="flex flex-col gap-2">
                            <label className="text-teal-500 text-sm font-medium">About</label>
                            <input
                                type="text"
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                className="w-full bg-transparent text-white text-lg border-b border-gray-600 focus:border-teal-500 outline-none py-2 transition"
                                placeholder="Tell us about yourself"
                            />
                        </div>

                        {/* Email (Read Only) */}
                        <div className="flex flex-col gap-2 opacity-60">
                            <label className="text-teal-500 text-sm font-medium">Email</label>
                            <div className="text-white text-lg py-2 border-b border-gray-700">
                                {profile?.email}
                            </div>
                        </div>

                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>

                </div>
            </div>

            {/* Full Screen Image Viewer Modal */}
            {showFullImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setShowFullImage(false)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition"
                        onClick={() => setShowFullImage(false)}
                    >
                        <IoClose size={32} />
                    </button>
                    <img
                        src={profile?.avatar || "https://via.placeholder.com/150"}
                        alt="Profile Full"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
                    />
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
