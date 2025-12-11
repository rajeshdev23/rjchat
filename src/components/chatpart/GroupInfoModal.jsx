import React, { useState, useEffect } from 'react';
import { MdClose, MdOutlineAddPhotoAlternate, MdEdit, MdCheck, MdExitToApp, MdDeleteForever } from "react-icons/md";
import Input from '../../utils/Input';
import Button from '../../utils/Button';
import { doc, getDoc, updateDoc, arrayRemove, deleteField, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { useSelector, useDispatch } from 'react-redux';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { changeUser } from '../../features/chatSlice';

const GroupInfoModal = ({ onClose }) => {
    const { chatId, user: chatUser } = useSelector((state) => state.chat);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const [groupData, setGroupData] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    // Separate states for Name and Photo editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState("");

    const [newFile, setNewFile] = useState(null);

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                const chatDoc = await getDoc(doc(db, "chats", chatId));
                if (chatDoc.exists()) {
                    const data = chatDoc.data();
                    setGroupData(data);
                    setNewName(data.groupName);

                    // Fetch participants details
                    const participantPromises = data.participants.map(uid => getDoc(doc(db, "users", uid)));
                    const participantDocs = await Promise.all(participantPromises);
                    const participantData = participantDocs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setParticipants(participantData);
                }
            } catch (error) {
                console.error("Error fetching group data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGroupData();
    }, [chatId]);

    const isAdmin = groupData?.admin === user.uid;

    const handleUpdateName = async () => {
        if (!newName.trim()) return alert("Group name cannot be empty");
        setUploading(true);

        try {
            // 1. Update Group Doc
            await updateDoc(doc(db, "chats", chatId), {
                groupName: newName
            });

            // 2. Update userChats for ALL participants
            const updatePromises = groupData.participants.map(uid =>
                setDoc(doc(db, "userChats", uid), {
                    [chatId]: {
                        userInfo: {
                            displayName: newName,
                            // Keep existing photo
                            photoURL: groupData.groupPhoto
                        }
                    }
                }, { merge: true })
            );

            await Promise.all(updatePromises);

            setGroupData(prev => ({ ...prev, groupName: newName }));
            setIsEditingName(false);

        } catch (error) {
            console.error("Error updating group name:", error);
            alert("Failed to update group name");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdatePhoto = async () => {
        if (!newFile) return;
        setUploading(true);

        try {
            const storageRef = ref(storage, `images/${chatId}`); // Overwrite existing
            const uploadTask = await uploadBytesResumable(storageRef, newFile);
            const photoURL = await getDownloadURL(uploadTask.ref);

            // 1. Update Group Doc
            await updateDoc(doc(db, "chats", chatId), {
                groupPhoto: photoURL
            });

            // 2. Update userChats for ALL participants
            const updatePromises = groupData.participants.map(uid =>
                setDoc(doc(db, "userChats", uid), {
                    [chatId]: {
                        userInfo: {
                            // Keep existing name
                            displayName: groupData.groupName,
                            photoURL: photoURL
                        }
                    }
                }, { merge: true })
            );

            await Promise.all(updatePromises);

            setGroupData(prev => ({ ...prev, groupPhoto: photoURL }));
            setNewFile(null);

        } catch (error) {
            console.error("Error updating group photo:", error);
            alert("Failed to update group photo");
        } finally {
            setUploading(false);
        }
    };

    const handleExitGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;

        try {
            // 1. Remove from participants in Group Doc
            await updateDoc(doc(db, "chats", chatId), {
                participants: arrayRemove(user.uid)
            });

            // 2. Remove chat from userChats (or mark as left? usually remove)
            await updateDoc(doc(db, "userChats", user.uid), {
                [chatId]: deleteField()
            });

            // 3. Reset Chat View
            dispatch(changeUser({ user: {}, chatId: "null" }));
            onClose();

        } catch (error) {
            console.error("Error leaving group:", error);
            alert("Failed to leave group");
        }
    };

    const handleDeleteGroup = async () => {
        if (!window.confirm("Are you sure you want to PERMANENTLY delete this group? This cannot be undone.")) return;

        try {
            // 1. Remove chat from ALL participants' userChats
            const updatePromises = groupData.participants.map(uid =>
                updateDoc(doc(db, "userChats", uid), {
                    [chatId]: deleteField()
                })
            );
            await Promise.all(updatePromises);

            // 2. Delete the Group Document
            await deleteDoc(doc(db, "chats", chatId));

            // 3. Reset Chat View
            dispatch(changeUser({ user: {}, chatId: "null" }));
            onClose();

        } catch (error) {
            console.error("Error deleting group:", error);
            alert("Failed to delete group");
        }
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#202c33] w-full max-w-md rounded-lg shadow-xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-white text-lg font-medium">Group Info</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">

                    {/* Group Header Info */}
                    <div className="flex flex-col items-center gap-4 mb-6">

                        {/* Photo Section */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative group">
                                <img
                                    src={newFile ? URL.createObjectURL(newFile) : (groupData?.groupPhoto || "")}
                                    alt=""
                                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-700"
                                />
                                {isAdmin && (
                                    <label htmlFor="editGroupPhoto" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition">
                                        <MdOutlineAddPhotoAlternate size={24} className="text-white" />
                                    </label>
                                )}
                                <input type="file" id="editGroupPhoto" className="hidden" onChange={e => setNewFile(e.target.files[0])} disabled={!isAdmin} />
                            </div>

                            {/* Photo Actions */}
                            {newFile && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUpdatePhoto}
                                        disabled={uploading}
                                        className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded"
                                    >
                                        {uploading ? "Saving..." : "Save Photo"}
                                    </button>
                                    <button
                                        onClick={() => setNewFile(null)}
                                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Name Section */}
                        <div className="flex flex-col items-center gap-2 w-full justify-center">
                            {isEditingName ? (
                                <div className="flex flex-col gap-3 w-full">
                                    <Input
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="!bg-transparent !border-b !border-teal-500 !rounded-none !px-1 text-center text-xl font-medium text-white w-full"
                                        placeholder="Group Name"
                                    />
                                    <div className="flex gap-2 justify-center w-full mt-2">
                                        <Button
                                            text={uploading ? "Saving..." : "Save Name"}
                                            onClick={handleUpdateName}
                                            disabled={uploading}
                                            className="!bg-teal-600 hover:!bg-teal-700 !py-2 !px-4 !text-sm flex-1"
                                        />
                                        <Button
                                            text="Cancel"
                                            onClick={() => { setIsEditingName(false); setNewName(groupData.groupName); }}
                                            className="!bg-gray-600 hover:!bg-gray-700 !py-2 !px-4 !text-sm flex-1"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-medium text-white">{groupData?.groupName}</h1>
                                    {isAdmin && (
                                        <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-white" title="Edit Group Name">
                                            <MdEdit size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {!isEditingName && <p className="text-gray-400 text-sm">Group • {participants.length} participants</p>}
                    </div>

                    {/* Participants List */}
                    <h3 className="text-teal-500 text-sm font-medium mb-3 uppercase px-2">Participants</h3>
                    <div className="flex flex-col gap-1 bg-[#111b21] rounded-lg overflow-hidden mb-6">
                        {participants.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-800 transition border-b border-gray-800 last:border-none">
                                <img src={p.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-medium">
                                            {p.uid === user.uid ? "You" : p.name}
                                        </span>
                                        {groupData?.admin === p.uid && (
                                            <span className="text-xs bg-teal-500/20 text-teal-500 px-2 py-0.5 rounded border border-teal-500/30">Group Admin</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">{p.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleExitGroup}
                            className="flex items-center gap-3 text-red-400 hover:bg-red-500/10 w-full p-3 rounded-lg transition"
                        >
                            <MdExitToApp size={24} />
                            <span className="font-medium">Exit Group</span>
                        </button>

                        {isAdmin && (
                            <button
                                onClick={handleDeleteGroup}
                                className="flex items-center gap-3 text-red-500 hover:bg-red-500/10 w-full p-3 rounded-lg transition border border-red-500/20"
                            >
                                <MdDeleteForever size={24} />
                                <span className="font-medium">Delete Group</span>
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GroupInfoModal;
