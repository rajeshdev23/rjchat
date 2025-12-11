import React from 'react';

const Skeleton = ({ type = "text", className = "" }) => {
    const baseClass = "animate-pulse bg-gray-700 rounded";

    const classes = {
        avatar: `${baseClass} w-12 h-12 rounded-full`,
        text: `${baseClass} h-4 w-full`,
        title: `${baseClass} h-5 w-1/2`,
        thumbnail: `${baseClass} w-full h-40`,
    };

    return (
        <div className={`${classes[type] || baseClass} ${className}`}></div>
    );
};

export const SidebarSkeleton = () => {
    return (
        <div className="flex flex-col gap-4 p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton type="avatar" />
                    <div className="flex-1 flex flex-col gap-2">
                        <Skeleton type="title" className="w-1/3" />
                        <Skeleton type="text" className="w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MessageSkeleton = () => {
    return (
        <div className="flex flex-col gap-4 p-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                    <Skeleton type="avatar" className="w-8 h-8" />
                    <div className={`flex flex-col gap-1 max-w-[60%] ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                        <Skeleton type="text" className="h-10 w-32 rounded-lg" />
                        <Skeleton type="text" className="h-3 w-12" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const FullPageSkeleton = () => {
    return (
        <div className="flex h-screen w-full bg-gray-900 overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="w-full md:w-[350px] border-r border-gray-700 flex flex-col">
                <div className="h-[60px] bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-3">
                    <Skeleton type="avatar" className="w-10 h-10" />
                    <Skeleton type="title" className="w-24" />
                </div>
                <div className="p-3">
                    <Skeleton type="text" className="h-10 rounded-lg" />
                </div>
                <SidebarSkeleton />
            </div>

            {/* Chat Area Skeleton (Hidden on mobile usually, but good for desktop) */}
            <div className="hidden md:flex flex-1 flex-col bg-gray-600">
                <div className="h-[60px] bg-[#202c33] border-b border-gray-700 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton type="avatar" className="w-10 h-10" />
                        <Skeleton type="title" className="w-32" />
                    </div>
                </div>
                <div className="flex-1 p-4">
                    <MessageSkeleton />
                </div>
                <div className="h-[60px] bg-gray-700 border-t border-gray-500 p-3">
                    <Skeleton type="text" className="h-full rounded-lg" />
                </div>
            </div>
        </div>
    );
};

export default Skeleton;
