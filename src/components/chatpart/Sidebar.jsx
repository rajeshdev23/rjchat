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

import { SidebarSkeleton } from '../../components/utils/Skeleton'

const Sidebar = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [userChats, setUserChats] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    // 2. Listen to active chats for last message info
    const unsub = onSnapshot(doc(db, "userChats", user.uid), (doc) => {
      setUserChats(doc.data() || {});
    });

    return () => unsub();
  }, [user?.uid]);


  // 1. Active Chats: Derived from userChats keys to ensure we catch all interactions
  // Normalize userChats to handle both nested objects and legacy dot-notation keys
  const normalizedChats = {};
  const keys = Object.keys(userChats);

  // Pass 1: Handle legacy dot-notation keys first
  keys.forEach(key => {
    if (key.includes('.userInfo')) {
      const realId = key.split('.userInfo')[0];
      if (!normalizedChats[realId]) normalizedChats[realId] = {};
      normalizedChats[realId].userInfo = userChats[key];
    } else if (key.includes('.date')) {
      const realId = key.split('.date')[0];
      if (!normalizedChats[realId]) normalizedChats[realId] = {};
      normalizedChats[realId].date = userChats[key];
    } else if (key.includes('.lastMessage')) {
      const realId = key.split('.lastMessage')[0];
      if (!normalizedChats[realId]) normalizedChats[realId] = {};
      normalizedChats[realId].lastMessage = userChats[key];
    } else if (key.includes('.unreadCount')) {
      const realId = key.split('.unreadCount')[0];
      if (!normalizedChats[realId]) normalizedChats[realId] = {};
      normalizedChats[realId].unreadCount = userChats[key];
    }
  });

  // Pass 2: Handle modern nested object keys (overwrites legacy if present)
  keys.forEach(key => {
    if (!key.includes('.') && typeof userChats[key] === 'object' && userChats[key] !== null) {
      if (!normalizedChats[key]) normalizedChats[key] = {};
      // Merge carefully: prefer the object's properties if they exist
      normalizedChats[key] = { ...normalizedChats[key], ...userChats[key] };
    }
  });

  const activeChats = Object.keys(normalizedChats).map(combinedId => {
    const chatData = normalizedChats[combinedId];

    // Check if it's a group chat
    if (chatData.userInfo?.isGroup) {
      return {
        id: combinedId, // For groups, the combinedId IS the groupId
        name: chatData.userInfo.displayName,
        avatar: chatData.userInfo.photoURL,
        isGroup: true,
        chatInfo: chatData
      };
    }

    // Robust ID extraction: Remove current user's UID from combined ID to get the other user's ID
    let otherId = null;
    if (combinedId.includes(user.uid)) {
      otherId = combinedId.replace(user.uid, "");
    } else {
      // This might happen if the chat ID is malformed or doesn't contain the user ID
      // Try to fallback to userInfo.uid if available
      if (chatData.userInfo?.uid) {
        otherId = chatData.userInfo.uid;
      }
    }

    // Find the user who is part of this chat
    let participant = null;
    if (otherId) {
      participant = users.find(u => (u.uid === otherId || u.id === otherId));
    }

    if (participant) {
      return { ...participant, chatInfo: chatData };
    }

    // Fallback: Use stored userInfo
    if (chatData && chatData.userInfo) {
      return {
        ...chatData.userInfo,
        id: chatData.userInfo.uid || otherId, // Ensure we have an ID
        chatInfo: chatData
      };
    }

    // If we have a chat but no user info and can't find the user, we still want to show it?
    // Maybe show "Unknown User" so it's not hidden?
    if (otherId) {
      return {
        id: otherId,
        name: "Unknown User",
        avatar: "", // Default avatar?
        chatInfo: chatData
      };
    }

    return null;
  }).filter(u => u !== null)
    .sort((a, b) => {
      // If date is null (pending write), treat it as "now" so it stays at the top
      const dateA = a.chatInfo?.date ? a.chatInfo.date.seconds : Number.MAX_SAFE_INTEGER;
      const dateB = b.chatInfo?.date ? b.chatInfo.date.seconds : Number.MAX_SAFE_INTEGER;
      return dateB - dateA;
    });

  // 2. Search Results: All users matching search query
  const searchResults = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  // Decide what to display
  const isSearching = search.trim() !== "";
  const displayList = isSearching ? searchResults : activeChats;

  // Auto-select first user (Desktop only) - Only on initial load/default view
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    // Only auto-select if we have active chats and no chat selected
    if (isDesktop && activeChats.length > 0 && chatId === "null" && !isSearching) {
      handleSelect(activeChats[0]);
    }
  }, [activeChats, chatId, isSearching]);

  const handleSelect = async (u) => {
    if (!user || !u) return;

    // Check if it's a group
    if (u.isGroup) {
      dispatch(changeUser({ user: u, chatId: u.id }));
      setSearch("");

      // Reset unread count for group
      await updateDoc(doc(db, "userChats", user.uid), {
        [`${u.id}.unreadCount`]: 0
      });
      return;
    }

    const otherId = u.uid || u.id;
    const combinedId = user.uid > otherId ? user.uid + otherId : otherId + user.uid;

    // Optimistically select the chat
    dispatch(changeUser({ user: u, chatId: combinedId }));
    setSearch(""); // Clear search immediately

    try {
      const chatRef = doc(db, "chats", combinedId);
      const res = await getDoc(chatRef);

      // Prepare user info, ensuring no undefined values
      const userInfo = {
        uid: otherId,
        name: u.name,
        avatar: u.avatar || null,
      };

      const currentUserInfo = {
        uid: user.uid,
        name: user.name,
        avatar: user.avatar || null,
      };

      if (!res.exists()) {
        // Create new chat
        await setDoc(chatRef, { messages: [] });
      }

      // Check if chat already exists for current user
      const currentUserChat = userChats[combinedId];

      // Always update userChats to ensure it shows up in the sidebar
      // Use nested object syntax to avoid dot notation issues in setDoc
      await setDoc(doc(db, "userChats", user.uid), {
        [combinedId]: {
          userInfo: userInfo,
          // Only update date if it's a new chat or doesn't exist, otherwise keep existing date
          date: currentUserChat?.date || serverTimestamp(),
          unreadCount: 0
        }
      }, { merge: true });

      // Check if chat exists for other user to avoid overwriting their date/unread count unnecessarily
      // Actually, for the other user, we just want to ensure the chat exists. 
      // We shouldn't change their date or unread count just because WE clicked the chat.
      // But if it's a NEW chat, we need to initialize it.

      // For simplicity and safety, we'll only set initial data if it doesn't exist, 
      // or just update userInfo in case they changed avatar/name.
      // But we must NOT change their date here.

      await setDoc(doc(db, "userChats", otherId), {
        [combinedId]: {
          userInfo: currentUserInfo,
          // We don't update date for them when WE click. 
          // It will be updated when we send a message.
          // If it's a new chat, we might want to set a date, but let's leave it to the first message.
          // However, to ensure it appears in their list if it's brand new:
          ...((!currentUserChat) ? { date: serverTimestamp() } : {})
        }
      }, { merge: true });

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

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header for Search Results */}
        {isSearching && (
          <div className="px-4 py-2 text-xs font-semibold text-teal-500 uppercase tracking-wider bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
            Global Search Results
          </div>
        )}

        {loading ? (
          <SidebarSkeleton />
        ) : (
          <>
            {displayList.length === 0 && (
              <div className='text-center text-gray-500 mt-5 flex flex-col gap-2'>
                <p>{isSearching ? "No users found" : "No active chats. Search to start one."}</p>
              </div>
            )}

            {displayList.map((u) => {
              const otherId = u.uid || u.id;
              // For groups, the combinedId is just the ID. For users, it's the combined one.
              const combinedId = u.isGroup ? u.id : (user.uid > otherId ? user.uid + otherId : otherId + user.uid);

              // Check if this user is already in active chats (to style differently if needed, or just for logic)
              // Use normalizedChats if available, otherwise fallback to userChats check (though normalized is better)
              // Since normalizedChats is local to the render, we need to access it or just use the activeChats array
              const isActiveChat = activeChats.some(chat => chat.id === (u.isGroup ? u.id : otherId));

              // Helper to get chat data for display
              const chatData = activeChats.find(chat => chat.id === (u.isGroup ? u.id : otherId))?.chatInfo;

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
                      {/* Only show time if it's an active chat view OR if the user has chat info */}
                      {(u.chatInfo?.date || (isActiveChat && chatData?.date)) && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-400">
                            {new Date((u.chatInfo?.date || chatData?.date).toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {/* Unread Badge */}
                          {(u.chatInfo?.unreadCount > 0 || (isActiveChat && chatData?.unreadCount > 0)) && (
                            <div className="bg-green-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                              {u.chatInfo?.unreadCount || chatData?.unreadCount}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {/* Show last message if active, otherwise generic text for search results */}
                      {(u.chatInfo?.lastMessage?.text || (isActiveChat && chatData?.lastMessage?.text)) || <span className="text-teal-500">Click to start chatting</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
