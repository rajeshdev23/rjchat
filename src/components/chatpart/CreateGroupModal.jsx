import React, { useState, useEffect } from 'react';
import { MdClose, MdOutlineAddPhotoAlternate } from "react-icons/md";
import Input from '../../utils/Input';
import Button from '../../utils/Button';
import { collection, getDocs, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { useSelector } from 'react-redux';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuid } from 'uuid';

const CreateGroupModal = ({ onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, "users");
                const snapshot = await getDocs(usersRef);
                const allUsers = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(u => u.uid !== user.uid);
                setUsers(allUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, [user.uid]);

    const toggleUser = (uid) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(uid)) {
            newSelected.delete(uid);
        } else {
            newSelected.add(uid);
        }
        setSelectedUsers(newSelected);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return alert("Please enter a group name");
        if (selectedUsers.size === 0) return alert("Please select at least one user");

        setLoading(true);
        try {
            const groupId = uuid();
            let photoURL = null;

            // 1. Upload Photo if selected
            if (file) {
                const storageRef = ref(storage, `images/${uuid()}`);
                const uploadTask = await uploadBytesResumable(storageRef, file);
                photoURL = await getDownloadURL(uploadTask.ref);
            }

            // 2. Create Group Chat Document
            await setDoc(doc(db, "chats", groupId), {
                messages: [],
                type: "group",
                groupName: groupName,
                groupPhoto: photoURL,
                admin: user.uid,
                participants: [user.uid, ...Array.from(selectedUsers)],
                createdAt: serverTimestamp()
            });

            // 3. Update userChats for ALL participants (including self)
            const groupInfo = {
                uid: groupId,
                displayName: groupName,
                photoURL: photoURL,
                isGroup: true
            };

            const participants = [user.uid, ...Array.from(selectedUsers)];

            // We need to update each user's userChats document
            // We can do this in parallel
            await Promise.all(participants.map(async (participantId) => {
                await setDoc(doc(db, "userChats", participantId), {
                    [groupId]: {
                        userInfo: groupInfo,
                        date: serverTimestamp(),
                        lastMessage: {
                            text: "Group created"
                        },
                        unreadCount: 0 // Initialize unread count
                    }
                }, { merge: true });
            }));

            onClose();
        } catch (error) {
            console.error("Error creating group:", error);
            alert("Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#202c33] w-full max-w-md rounded-lg shadow-xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-white text-lg font-medium">Create Group</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">

                    {/* Group Info */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <label htmlFor="groupFile" className="cursor-pointer block w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition overflow-hidden">
                                {file ? (
                                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <MdOutlineAddPhotoAlternate size={24} className="text-gray-400" />
                                )}
                            </label>
                            <input type="file" id="groupFile" className="hidden" onChange={e => setFile(e.target.files[0])} />
                        </div>
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Group Name"
                                className="!bg-transparent !border-b !border-gray-600 !rounded-none !px-0 text-white focus:!border-teal-500 placeholder-gray-500"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* User Selection */}
                    <h3 className="text-gray-400 text-sm font-medium mb-3 uppercase">Select Participants</h3>
                    <div className="flex flex-col gap-2">
                        {users.map(u => (
                            <div
                                key={u.uid}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${selectedUsers.has(u.uid) ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                                onClick={() => toggleUser(u.uid)}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedUsers.has(u.uid) ? "bg-teal-500 border-teal-500" : "border-gray-500"}`}>
                                    {selectedUsers.has(u.uid) && <MdClose size={16} className="text-white rotate-45" />} {/* Using rotate-45 close as checkmark roughly or just check */}
                                </div>
                                <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                <span className="text-white">{u.name}</span>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 flex justify-end">
                    <Button
                        text={loading ? "Creating..." : "Create Group"}
                        onClick={handleCreate}
                        disabled={loading}
                        className="!py-2 !px-6"
                    />
                </div>

            </div>
        </div>
    );
};

export default CreateGroupModal;
