import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { MdAdd, MdHistory } from "react-icons/md";
import StatusUploadModal from './StatusUploadModal';
import StatusViewer from './StatusViewer';

const StatusList = () => {
    const { user } = useSelector((state) => state.auth);
    const [myStatus, setMyStatus] = useState(null);
    const [recentUpdates, setRecentUpdates] = useState([]); // Kept for safety, though unused now generally we use filtered lists
    // const [sortedUpdates, setSortedUpdates] = useState([]);
    const [newUpdates, setNewUpdates] = useState([]);
    const [viewedUpdates, setViewedUpdates] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const [viewingStatus, setViewingStatus] = useState(null);
    const [friendsMap, setFriendsMap] = useState({});
    const [isViewedExpanded, setIsViewedExpanded] = useState(false);

    // 1. Fetch Friends List (people I have chatted with)
    useEffect(() => {
        const fetchFriends = async () => {
            const userChatsRef = doc(db, "userChats", user.uid);
            const unsub = onSnapshot(userChatsRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    const map = {};

                    Object.keys(data).forEach(key => {
                        const info = data[key].userInfo;
                        if (info && info.uid && info.uid !== user.uid) {
                            map[info.uid] = {
                                displayName: info.displayName || info.name, // Handle both naming conventions
                                photoURL: info.photoURL || info.avatar
                            };
                        }
                    });

                    setFriendsMap(map);
                }
            });
            return () => unsub();
        };
        if (user.uid) fetchFriends();
    }, [user.uid]);

    // 2. Fetch Statuses
    useEffect(() => {
        const friendUids = Object.keys(friendsMap);
        if (!friendUids.length && !user.uid) return;

        // Fetch My Status
        const unsubMyStatus = onSnapshot(doc(db, "statuses", user.uid), (doc) => {
            if (doc.exists()) {
                setMyStatus(doc.data());
            } else {
                setMyStatus(null);
            }
        });

        // Fetch Friends' Statuses
        const q = query(collection(db, "statuses"));
        const unsubAll = onSnapshot(q, (snapshot) => {
            const statuses = [];
            const now = Timestamp.now();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const uid = data.userInfo.uid;

                // Check if this user is in our friends map
                if (friendsMap[uid]) {
                    // Check if has valid stories (not expired)
                    const validStories = data.stories.filter(s => (now.seconds - s.timestamp.seconds) < 86400);
                    if (validStories.length > 0) {
                        // Override display name/photo from friendsMap if available (more reliable)
                        const friendInfo = friendsMap[uid];
                        const enhancedData = {
                            ...data,
                            userInfo: {
                                ...data.userInfo,
                                displayName: friendInfo.displayName || data.userInfo.displayName || "User",
                                photoURL: friendInfo.photoURL || data.userInfo.photoURL
                            },
                            stories: validStories
                        };
                        statuses.push(enhancedData);
                    }
                }
            });

            // Sort by last updated
            statuses.sort((a, b) => b.lastUpdated?.seconds - a.lastUpdated?.seconds);
            // Sort by last updated
            statuses.sort((a, b) => b.lastUpdated?.seconds - a.lastUpdated?.seconds);

            // Split into new and viewed
            const newSt = [];
            const viewedSt = [];

            statuses.forEach(status => {
                const isFullyViewed = status.stories.every(story =>
                    story.viewers && story.viewers.some(v => v.uid === user.uid)
                );

                if (isFullyViewed) {
                    viewedSt.push(status);
                } else {
                    newSt.push(status);
                }
            });

            setNewUpdates(newSt);
            setViewedUpdates(viewedSt);
        });

        return () => {
            unsubMyStatus();
            unsubAll();
        };
    }, [friendsMap, user.uid]);

    const hasMyActiveStatus = myStatus?.stories?.some(s => (Timestamp.now().seconds - s.timestamp.seconds) < 86400);

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* My Status */}
            <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-[#202c33] transition" onClick={() => hasMyActiveStatus ? setViewingStatus(myStatus) : setShowUpload(true)}>
                <div className="relative">
                    <img
                        src={user.photoURL}
                        alt=""
                        className={`w-12 h-12 rounded-full object-cover ${hasMyActiveStatus ? 'border-2 border-teal-500 p-[2px]' : ''}`}
                    />
                    {!hasMyActiveStatus && (
                        <div className="absolute bottom-0 right-0 bg-teal-500 rounded-full p-0.5 border-2 border-[#111b21] text-white">
                            <MdAdd size={14} />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-medium">My Status</h3>
                    <p className="text-gray-400 text-sm">{hasMyActiveStatus ? "Tap to view status" : "Tap to add status update"}</p>
                </div>
            </div>

            <hr className="border-gray-800 mx-4" />

            {/* Recent Updates (Unseen) */}
            <div className="p-4 pb-0">
                <h3 className="text-teal-500 text-sm font-medium mb-4 uppercase">Recent updates</h3>
                <div className="flex flex-col gap-4">
                    {newUpdates.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No new updates</p>
                    ) : (
                        newUpdates.map(status => (
                            <div key={status.userInfo.uid} className="flex items-center gap-3 cursor-pointer hover:bg-[#202c33] p-2 rounded-lg transition" onClick={() => setViewingStatus(status)}>
                                <div className="relative">
                                    <img
                                        src={status.userInfo.photoURL}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover border-2 border-teal-500 p-[2px]"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-medium">{status.userInfo.displayName}</h3>
                                    <p className="text-gray-400 text-xs">
                                        {status.lastUpdated?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Viewed Updates */}
            {viewedUpdates.length > 0 && (
                <div className="p-4">
                    <div
                        className="flex items-center justify-between cursor-pointer mb-4"
                        onClick={() => setIsViewedExpanded(!isViewedExpanded)}
                    >
                        <h3 className="text-gray-400 text-sm font-medium uppercase">Viewed updates</h3>
                        <span className="text-gray-400 text-xl">{isViewedExpanded ? '−' : '+'}</span>
                    </div>

                    {isViewedExpanded && (
                        <div className="flex flex-col gap-4">
                            {viewedUpdates.map(status => (
                                <div key={status.userInfo.uid} className="flex items-center gap-3 cursor-pointer hover:bg-[#202c33] p-2 rounded-lg transition opacity-60" onClick={() => setViewingStatus(status)}>
                                    <div className="relative">
                                        <img
                                            src={status.userInfo.photoURL}
                                            alt=""
                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-500 p-[2px]"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium">{status.userInfo.displayName}</h3>
                                        <p className="text-gray-400 text-xs">
                                            {status.lastUpdated?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showUpload && <StatusUploadModal onClose={() => setShowUpload(false)} />}
            {viewingStatus && <StatusViewer status={viewingStatus} onClose={() => setViewingStatus(null)} />}
        </div>
    );
};

export default StatusList;
