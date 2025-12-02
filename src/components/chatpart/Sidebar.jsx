import React, { useEffect, useState } from 'react'
import Navbar from './Navbar'
import Input from '../../utils/Input'
import { db } from '../../firebase'
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { useSelector, useDispatch } from 'react-redux'
import { changeUser } from '../../features/chatSlice'

const Sidebar = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [userChats, setUserChats] = useState({});
  const [search, setSearch] = useState("");
  const { user } = useSelector((state) => state.auth);
  const { chatId } = useSelector((state) => state.chat);

  // Load all users and listen to userChats
  useEffect(() => {
    if (!user?.uid) return;

    // 1. Fetch all users
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const allUsers = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.uid !== user.uid && u.id !== user.uid); // Double check both id and uid
        setUsers(allUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();

    // 2. Listen to active chats for last message info
    const unsub = onSnapshot(doc(db, "userChats", user.uid), (doc) => {
      setUserChats(doc.data() || {});
    });

    return () => unsub();
  }, [user?.uid]);

  // Sort users: Active chats first (by date), then others
  const sortedUsers = [...users].map(u => {
    const combinedId = user.uid > u.uid ? user.uid + u.uid : u.uid + user.uid;
    return { ...u, chatInfo: userChats[combinedId] };
  }).sort((a, b) => {
    const dateA = a.chatInfo?.date?.seconds || 0;
    const dateB = b.chatInfo?.date?.seconds || 0;
    return dateB - dateA;
  });

  // Filter users based on search or active chats
  const displayUsers = sortedUsers.filter(u => {
    if (search.trim() === "") {
      // If search is empty, ONLY show users with active chat history (lastMessage exists)
      return u.chatInfo?.lastMessage;
    } else {
      // If searching, show all users matching the name
      return u.name.toLowerCase().includes(search.toLowerCase());
    }
  });

  // Auto-select first user (Desktop only)
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    // Only auto-select if we have displayable users and no chat selected
    if (isDesktop && displayUsers.length > 0 && chatId === "null") {
      handleSelect(displayUsers[0]);
    }
  }, [displayUsers, chatId]);

  const handleSelect = async (u) => {
    if (!user || !u) return;

    const combinedId = user.uid > u.uid ? user.uid + u.uid : u.uid + user.uid;

    try {
      const chatRef = doc(db, "chats", combinedId);
      const res = await getDoc(chatRef);

      if (!res.exists()) {
        await setDoc(chatRef, { messages: [] });

        await setDoc(doc(db, "userChats", user.uid), {
          [combinedId + ".userInfo"]: {
            uid: u.uid,
            name: u.name,
            avatar: u.avatar,
          },
          [combinedId + ".date"]: serverTimestamp(),
        }, { merge: true });

        await setDoc(doc(db, "userChats", u.uid), {
          [combinedId + ".userInfo"]: {
            uid: user.uid,
            name: user.name,
            avatar: user.avatar,
          },
          [combinedId + ".date"]: serverTimestamp(),
        }, { merge: true });
      }

      dispatch(changeUser({ user: u, chatId: combinedId }));
      setSearch(""); // Clear search after selection

    } catch (error) {
      console.log("Chat error:", error.message);
    }
  };

  return (
    <div className="sidebar flex flex-col h-full bg-gray-900 border-r border-gray-700">
      <Navbar />

      <div className="searchbar p-3 bg-gray-800">
        <Input
          type="search"
          className="!bg-gray-700 !rounded-lg border-none py-2 text-white placeholder-gray-400"
          placeholder="Search or start new chat"
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayUsers.length === 0 && (
          <div className='text-center text-gray-500 mt-5'>
            {search ? "No users found" : "No active chats. Search to start one."}
          </div>
        )}
        {displayUsers.map((u) => {
          const combinedId = user.uid > u.uid ? user.uid + u.uid : u.uid + user.uid;

          return (
            <div
              key={u.id}
              className={`p-3 flex items-center gap-3 cursor-pointer transition-colors border-b border-gray-800
                ${chatId === combinedId ? 'bg-gray-700' : 'hover:bg-gray-800'}
              `}
              onClick={() => handleSelect(u)}
            >
              <img
                src={u.avatar}
                alt=""
                className="w-12 h-12 rounded-full object-cover bg-gray-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-white font-medium truncate">{u.name}</span>
                  {u.chatInfo?.date && (
                    <span className="text-xs text-gray-400">
                      {new Date(u.chatInfo.date.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {u.chatInfo?.lastMessage?.text || "Click to start chatting"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
