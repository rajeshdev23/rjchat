import React, { useState } from 'react'
import { collection, query, where, getDocs, setDoc, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useSelector, useDispatch } from "react-redux";
import { changeUser } from "../../features/chatSlice";
import { MdSearch } from "react-icons/md";

const Search = () => {
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState([]);
    const [err, setErr] = useState(false);

    const { user: currentUser } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const handleSearch = async () => {
        if (!username.trim()) {
            setUsers([]);
            return;
        }

        // Capitalize first letter to match typical name storage
        const searchTerm = username.charAt(0).toUpperCase() + username.slice(1);

        const q = query(
            collection(db, "users"),
            where("name", ">=", searchTerm),
            where("name", "<=", searchTerm + "\uf8ff")
        );

        try {
            const querySnapshot = await getDocs(q);
            const foundUsers = [];
            querySnapshot.forEach((doc) => {
                foundUsers.push(doc.data());
            });

            setUsers(foundUsers);
            if (foundUsers.length === 0) {
                setErr(true);
            } else {
                setErr(false);
            }
        } catch (err) {
            setErr(true);
        }
    };

    // Real-time search with debounce
    React.useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            handleSearch();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [username]);

    const handleKey = (e) => {
        e.code === "Enter" && handleSearch();
    };

    const handleSelect = async (selectedUser) => {
        // check whether the group(chats in firestore) exists, if not create
        const combinedId =
            currentUser.uid > selectedUser.uid
                ? currentUser.uid + selectedUser.uid
                : selectedUser.uid + currentUser.uid;

        try {
            const res = await getDoc(doc(db, "chats", combinedId));

            if (!res.exists()) {
                // create a chat in chats collection
                await setDoc(doc(db, "chats", combinedId), { messages: [] });

                // create user chats (use setDoc with merge to create if doesn't exist)
                await setDoc(doc(db, "userChats", currentUser.uid), {
                    [combinedId + ".userInfo"]: {
                        uid: selectedUser.uid,
                        displayName: selectedUser.name,
                        photoURL: selectedUser.avatar,
                    },
                    [combinedId + ".date"]: serverTimestamp(),
                }, { merge: true });

                await setDoc(doc(db, "userChats", selectedUser.uid), {
                    [combinedId + ".userInfo"]: {
                        uid: currentUser.uid,
                        displayName: currentUser.name,
                        photoURL: currentUser.avatar,
                    },
                    [combinedId + ".date"]: serverTimestamp(),
                }, { merge: true });
            }
        } catch (err) {
            console.error("Error in handleSelect:", err);
        }

        // Dispatch change user with consistent field names (moved outside try-catch to ensure it always runs)
        const userData = {
            uid: selectedUser.uid,
            name: selectedUser.name,
            displayName: selectedUser.name,
            avatar: selectedUser.avatar,
            photoURL: selectedUser.avatar
        };
        dispatch(changeUser({ user: userData, chatId: combinedId }));

        setUsers([]);
        setUsername("");
    };

    return (
        <div className='search border-b border-gray-700'>
            <div className="searchForm p-2">
                <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-1">
                    <MdSearch className="text-gray-400 mr-2 cursor-pointer" size={20} onClick={handleSearch} />
                    <input
                        type="text"
                        placeholder='Find a user'
                        onKeyDown={handleKey}
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        className='bg-transparent border-none text-white outline-none w-full placeholder-gray-400 text-sm'
                    />
                </div>
            </div>
            {err && <span className='text-red-500 text-xs px-4'>User not found!</span>}
            {users.map(user => (
                <div key={user.uid} className="userChat p-2 flex items-center gap-3 text-white cursor-pointer hover:bg-[#202c33]" onClick={() => handleSelect(user)}>
                    <img src={user.avatar} alt="" className='w-10 h-10 rounded-full object-cover' />
                    <div className="userChatInfo">
                        <span className='font-medium'>{user.name}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Search
