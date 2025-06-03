// components/search/UserResults.js
import React, { useEffect } from 'react';
import { UserCircle } from 'lucide-react'; 
import { useInView } from 'react-intersection-observer';

import { useNavigate } from 'react-router-dom';

const getUserInitials = (userName) => {
    if (!userName) return null; 

    const alphanumericChars = userName.replace(/[^a-zA-Z0-9]/g, '');

    if (!alphanumericChars) return null;

    return alphanumericChars.substring(0, 2).toUpperCase();
};


const UserResults = ({ users = [], isLoading, error, loadMore, hasMore }) => {
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '200px 0px',
        triggerOnce: false
    });

    const navigate = useNavigate();


    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            loadMore();
        }
    }, [inView, hasMore, isLoading, loadMore]);

    const handleUserClick = (userName) => {
        if (!userName) {
            console.warn("Cannot navigate: user has no userName.");
            return; 
        }
    
        navigate(`/user/user/${userName}`);
    };
   

    return (
       
        <div className="space-y-3 max-w-lg mx-auto md:mx-0">
            {users.map((user) => {
             
                const avatarUrl = user?.profileURL?.azureUrl ;
                const displayName = user?.name || user?.userName || 'Unnamed User';
                const userNameToShow = (user?.name && user?.userName && user.name !== user.userName) ? `@${user.userName}` : (user?.userName && !user.name ? `@${user.userName}` : null);

                const userInitials = getUserInitials(user?.userName);
            

                return (
                
                    <div
                        key={user?._id}
                        className={`flex items-center gap-4 p-3 bg-base-100 hover:bg-base-200 rounded-lg border border-base-300 transition-colors duration-150 ${user?.userName ? 'cursor-pointer' : ''}`} // Add cursor-pointer if navigable
                        onClick={() => handleUserClick(user?.userName)}
                    >
                        <div className="avatar">
                            <div className="w-12 h-12 rounded-full ring ring-newYellow ring-offset-base-100 ring-offset-1 overflow-hidden bg-base-300"> {/* Added background color here for fallback visibility */}
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={`${displayName}'s avatar`}
                                      
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextElementSibling;
                                            if (fallback) {
                                                fallback.style.display = 'flex';
                                            }
                                        }}
                                        loading="lazy"
                                        className="w-full h-full object-cover" 
                                    />
                                ) : null }

                               
                                <div
                                   className={`w-full h-full items-center justify-center bg-newBlack text-newYellow font-semibold ${avatarUrl ? 'hidden' : 'flex'}`} // Initially hidden if avatarUrl exists, otherwise shown
                                   style={!avatarUrl ? { display: 'flex' } : {}}
                                >
                                    {userInitials ? (
                                        userInitials 
                                    ) : (
                                       
                                        <UserCircle size={24} className="text-base-content/50"/>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-hidden"> 
                            <p className="font-semibold text-base-content truncate">
                                {displayName}
                            </p>
                            {userNameToShow && (
                                 <p className="text-sm text-base-content/70 truncate">{userNameToShow}</p> 
                                
                                 
                             )}
                        </div>
                    </div>
                );
            })}

            
            {hasMore && !isLoading && ( 
                <div ref={ref} className="h-10" />
            )}

            {/* Optional: Loading indicator */}
            {isLoading && (
                <div className="text-center p-4 text-base-content/70">Loading...</div>
            )}

             {error && (
                 <div className="text-center p-4 text-error">{error.message || 'Failed to load users.'}</div>
             )}
        </div>
    );
};

export default UserResults;