import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdChevronLeft, MdChevronRight, MdVisibility, MdDelete } from "react-icons/md";
import { Timestamp, doc, updateDoc, arrayUnion, getDoc, arrayRemove, onSnapshot } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { useSelector } from 'react-redux';
import { db, storage } from '../../firebase';

const StatusViewer = ({ status, onClose }) => {
    const { user } = useSelector((state) => state.auth);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showViewers, setShowViewers] = useState(false);
    const [realtimeStories, setRealtimeStories] = useState(status?.stories || []);
    const [isPaused, setIsPaused] = useState(false);
    const videoRef = useRef(null);

    // Listen to real-time updates for this status
    useEffect(() => {
        if (!status?.userInfo?.uid) return;

        const unsub = onSnapshot(doc(db, "statuses", status.userInfo.uid), (doc) => {
            if (doc.exists()) {
                setRealtimeStories(doc.data().stories || []);
            } else {
                // Document deleted
                onClose();
            }
        });
        return () => unsub();
    }, [status?.userInfo?.uid, onClose]);

    const stories = realtimeStories;
    const currentStory = stories[currentIndex];
    const timerRef = useRef(null);
    const isOwner = status.userInfo.uid === user.uid;

    // Filter out expired stories (client-side check for display)
    const validStories = stories.filter(story => {
        if (!story.timestamp) return true;
        const now = Timestamp.now();
        return (now.seconds - story.timestamp.seconds) < 86400;
    });

    // If no valid stories, close
    useEffect(() => {
        if (validStories.length === 0) {
            onClose();
        }
    }, [validStories, onClose]);

    // Record View Logic
    useEffect(() => {
        if (!currentStory || isOwner) return;

        const recordView = async () => {
            const hasViewed = currentStory.viewers?.some(v => v.uid === user.uid);
            if (hasViewed) return;

            try {
                const statusRef = doc(db, "statuses", status.userInfo.uid);
                const statusDoc = await getDoc(statusRef);
                if (statusDoc.exists()) {
                    const data = statusDoc.data();
                    const updatedStories = data.stories.map(s => {
                        if (s.id === currentStory.id) {
                            const viewers = s.viewers || [];
                            if (!viewers.some(v => v.uid === user.uid)) {
                                return {
                                    ...s,
                                    viewers: [
                                        ...viewers,
                                        {
                                            uid: user.uid,
                                            name: user.displayName || "User",
                                            avatar: user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                                            timestamp: Timestamp.now()
                                        }
                                    ]
                                };
                            }
                        }
                        return s;
                    });

                    await updateDoc(statusRef, { stories: updatedStories });
                }
            } catch (err) {
                console.error("Error recording view:", err);
            }
        };

        const timeout = setTimeout(recordView, 1000);
        return () => clearTimeout(timeout);

    }, [currentIndex, currentStory?.id, isOwner, user.uid, status.userInfo.uid]);


    useEffect(() => {
        if (!currentStory || showViewers) return;

        setProgress(0);
        const duration = currentStory.type === 'video' ? 15000 : 5000;
        const interval = 50;
        const step = 100 / (duration / interval);

        const intervalId = setInterval(() => {
            if (!isPaused) {
                setProgress(prev => {
                    if (prev >= 100) {
                        handleNext();
                        return 100;
                    }
                    return prev + step;
                });
            }
        }, interval);

        timerRef.current = intervalId;

        return () => clearInterval(timerRef.current);
    }, [currentIndex, currentStory, showViewers, isPaused]);

    // Handle Video Pause/Play
    useEffect(() => {
        if (currentStory?.type === 'video' && videoRef.current) {
            if (isPaused) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    }, [isPaused, currentStory]);

    const handleHoldStart = () => setIsPaused(true);
    const handleHoldEnd = () => setIsPaused(false);

    const handleNext = () => {
        if (currentIndex < validStories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Clamp index when stories change
    useEffect(() => {
        if (currentIndex >= validStories.length && validStories.length > 0) {
            setCurrentIndex(validStories.length - 1);
        }
    }, [validStories.length, currentIndex]);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            // 1. Delete from Storage
            if (currentStory.url) {
                const fileRef = ref(storage, currentStory.url);
                await deleteObject(fileRef).catch(err => console.warn("Error deleting file (might not exist):", err));
            }

            // 2. Delete from Firestore
            const statusRef = doc(db, "statuses", user.uid);
            const docSnap = await getDoc(statusRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const updatedStories = data.stories.filter(s => s.id !== currentStory.id);

                await updateDoc(statusRef, {
                    stories: updatedStories
                });
            }

            // UI updates are handled by the realtime listener and the index clamping useEffect
            setShowDeleteConfirm(false);

        } catch (err) {
            console.error("Error deleting status:", err);
            alert("Failed to delete status: " + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!currentStory) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">

            {/* Progress Bars */}
            <div className="absolute top-4 left-0 right-0 flex gap-1 px-2 z-10">
                {validStories.map((_, idx) => (
                    <div key={idx} className="h-1 bg-gray-600 flex-1 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-100 ease-linear"
                            style={{
                                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#202c33] p-6 rounded-lg shadow-xl max-w-sm w-full animate-scale-up">
                        <h3 className="text-white text-lg font-medium mb-2">Delete Status?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete this status update? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="text-teal-500 hover:text-teal-400 font-medium px-4 py-2 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="absolute top-8 left-4 flex items-center gap-3 z-50">
                <img src={status.userInfo.photoURL} alt="" className="w-10 h-10 rounded-full border border-white" />
                <div className="flex flex-col">
                    <span className="text-white font-medium">{status.userInfo.displayName}</span>
                    <span className="text-gray-300 text-xs">
                        {currentStory.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="absolute top-8 right-4 flex items-center gap-4 z-50">
                {isOwner && (
                    <button onClick={handleDeleteClick} className="text-white hover:text-red-500 transition">
                        <MdDelete size={24} />
                    </button>
                )}
                <button onClick={onClose} className="text-white hover:opacity-80">
                    <MdClose size={28} />
                </button>
            </div>

            {/* Content */}
            <div className="w-full h-full flex items-center justify-center relative">
                {/* Navigation Areas */}
                {!showViewers && (
                    <>
                        <div
                            className="absolute inset-y-0 left-0 w-1/3 z-20"
                            onClick={handlePrev}
                            onMouseDown={handleHoldStart}
                            onMouseUp={handleHoldEnd}
                            onMouseLeave={handleHoldEnd}
                            onTouchStart={handleHoldStart}
                            onTouchEnd={handleHoldEnd}
                        />
                        <div
                            className="absolute inset-y-0 right-0 w-1/3 z-20"
                            onClick={handleNext}
                            onMouseDown={handleHoldStart}
                            onMouseUp={handleHoldEnd}
                            onMouseLeave={handleHoldEnd}
                            onTouchStart={handleHoldStart}
                            onTouchEnd={handleHoldEnd}
                        />
                        {/* Center area for holding without navigating */}
                        <div
                            className="absolute inset-y-0 left-1/3 right-1/3 z-20"
                            onMouseDown={handleHoldStart}
                            onMouseUp={handleHoldEnd}
                            onMouseLeave={handleHoldEnd}
                            onTouchStart={handleHoldStart}
                            onTouchEnd={handleHoldEnd}
                        />
                    </>
                )}

                {currentStory.type === 'video' ? (
                    <video
                        src={currentStory.url}
                        autoPlay={!showViewers}
                        className="max-h-full max-w-full object-contain"
                        onEnded={handleNext}
                        ref={videoRef}
                    />
                ) : (
                    <img
                        src={currentStory.url}
                        alt="Story"
                        className="max-h-full max-w-full object-contain"
                    />
                )}

                {/* Caption */}
                {currentStory.caption && (
                    <div className="absolute bottom-20 bg-black/50 px-4 py-2 rounded-lg text-white text-center max-w-[80%]">
                        {currentStory.caption}
                    </div>
                )}

                {/* Owner Viewers Button */}
                {isOwner && (
                    <div
                        className="absolute bottom-8 z-30 flex flex-col items-center cursor-pointer hover:scale-110 transition"
                        onClick={() => setShowViewers(!showViewers)}
                    >
                        <div className="bg-black/50 p-2 rounded-full mb-1">
                            <MdVisibility size={24} className="text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">{currentStory.viewers?.length || 0} views</span>
                    </div>
                )}
            </div>

            {/* Viewers List Bottom Sheet */}
            {showViewers && isOwner && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#202c33] rounded-t-2xl z-40 max-h-[50vh] flex flex-col animate-slide-up shadow-2xl border-t border-gray-700">
                    <div className="flex justify-between items-center p-4 border-b border-gray-700">
                        <h3 className="text-white font-medium">Viewed by {currentStory.viewers?.length || 0}</h3>
                        <button onClick={() => setShowViewers(false)} className="text-gray-400 hover:text-white">
                            <MdClose size={24} />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                        {currentStory.viewers && currentStory.viewers.length > 0 ? (
                            currentStory.viewers.map((viewer, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <img src={viewer.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{viewer.name}</span>
                                        <span className="text-gray-400 text-xs">
                                            {viewer.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No views yet</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusViewer;
