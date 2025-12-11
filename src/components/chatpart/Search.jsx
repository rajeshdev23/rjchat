import React, { useState } from 'react'
import { collection, query, where, getDocs, setDoc, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useSelector, useDispatch } from "react-redux";
import { changeUser } from "../../features/chatSlice";
import { MdSearch } from "react-icons/md";

const Search = () => {
    const [username, setUsername] = useState("");
    const [user, setUser] = useState(null);
    const [err, setErr] = useState(false);

    const { user: currentUser } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const handleSearch = async () => {
        const q = query(
            collection(db, "users"),
            where("name", "==", username)
        );

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                setUser(doc.data());
            });
            if (querySnapshot.empty) {
                setErr(true);
                setUser(null);
            } else {
                setErr(false);
            }
        } catch (err) {
            setErr(true);
        }
    };

    const handleKey = (e) => {
        e.code === "Enter" && handleSearch();
    };

    const handleSelect = async () => {
        // check whether the group(chats in firestore) exists, if not create
        const combinedId =
            currentUser.uid > user.uid
                ? currentUser.uid + user.uid
                : user.uid + currentUser.uid;

        try {
            const res = await getDoc(doc(db, "chats", combinedId));

            if (!res.exists()) {
                // create a chat in chats collection
                await setDoc(doc(db, "chats", combinedId), { messages: [] });

                // create user chats
                await updateDoc(doc(db, "userChats", currentUser.uid), {
                    [combinedId + ".userInfo"]: {
                        uid: user.uid,
                        displayName: user.name,
                        photoURL: user.avatar,
                    },
                    [combinedId + ".date"]: serverTimestamp(),
                });

                await updateDoc(doc(db, "userChats", user.uid), {
                    [combinedId + ".userInfo"]: {
                        uid: currentUser.uid,
                        displayName: currentUser.name,
                        photoURL: currentUser.avatar,
                    },
                    [combinedId + ".date"]: serverTimestamp(),
                });
            }

            // Dispatch change user
            dispatch(changeUser({ user: user, chatId: combinedId }));

        } catch (err) { }

        setUser(null);
        setUsername("");
    };

    return (
        <div className='search border-b border-gray-700'>
            <div className="searchForm p-2">
                <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-1">
                    <MdSearch className="text-gray-400 mr-2" size={20} />
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
            {user && (
                <div className="userChat p-2 flex items-center gap-3 text-white cursor-pointer hover:bg-[#202c33]" onClick={handleSelect}>
                    <img src={user.avatar} alt="" className='w-10 h-10 rounded-full object-cover' />
                    <div className="userChatInfo">
                        <span className='font-medium'>{user.name}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Search
