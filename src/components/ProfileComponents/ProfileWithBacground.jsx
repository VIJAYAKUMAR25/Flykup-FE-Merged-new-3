import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LuPencil } from "react-icons/lu";
import { BiLoaderAlt } from "react-icons/bi";
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { uploadImageToS3, generateSignedUrl } from '../../utils/PrivateAws.js'; // ADDED AWS S3 helpers

const EditProfileModal = ({ onProfileUpdate }) => {
    const { user, setUser } = useAuth();
    const originalUsername = useRef(user?.userName || '');
    const [profileURL, setProfileURL] = useState(
        user?.profileURL || { key: '', jpgURL: '', blobName: null, azureUrl: null }
    );
    const [isProfileUploading, setIsProfileUploading] = useState(false);
    const profileInputRef = useRef(null);

    const [backgroundCoverURL, setBackgroundCoverURL] = useState(
        user?.backgroundCoverURL || { key: '', jpgURL: '', blobName: null, azureUrl: null }
    );
    const [isBackgroundUploading, setIsBackgroundUploading] = useState(false);
    const backgroundInputRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [userName, setUserName] = useState(user?.userName || '');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [bio, setBio] = useState(user?.bio || '');
    const [loading, setLoading] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);

    useEffect(() => {
        if (!isOpen && user) {
            console.log("EditProfileModal: Syncing state with context while closed.");
            setUserName(user.userName || '');
            setBio(user.bio || '');
            setProfileURL(user.profileURL || { key: '', jpgURL: '', blobName: null, azureUrl: null });
            setBackgroundCoverURL(user.backgroundCoverURL || { key: '', jpgURL: '', blobName: null, azureUrl: null });
            originalUsername.current = user.userName || '';
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const debounce = (func, delay) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const checkUsernameAvailability = useCallback(
        debounce(async (usernameToCheck) => {
            const trimmedUsername = usernameToCheck.trim();
            if (!trimmedUsername || trimmedUsername === originalUsername.current) {
                setMessage('');
                setMessageType('');
                setCheckingUsername(false);
                return;
            }
            setMessage('Checking availability...');
            setMessageType('info');
            setCheckingUsername(true);
            try {
                const response = await axiosInstance.get(`profile/username-availability`, {
                    params: { userName: trimmedUsername },
                });
                setUserName(currentUserNameInState => {
                    if (currentUserNameInState === trimmedUsername) {
                        setMessage(response.data.message);
                        setMessageType(response.data.status ? 'success' : 'error');
                    }
                    return currentUserNameInState;
                });
            } catch (error) {
                console.error("Username check failed:", error);
                setUserName(currentUserNameInState => {
                    if (currentUserNameInState === trimmedUsername) {
                        setMessage(error.response?.data?.message || 'Error checking username');
                        setMessageType('error');
                    }
                    return currentUserNameInState;
                });
            } finally {
                setUserName(currentUserNameInState => {
                    if (currentUserNameInState === trimmedUsername) {
                        setCheckingUsername(false);
                    }
                    return currentUserNameInState;
                });
            }
        }, 500),
        []
    );

    // --- Image Upload Handlers (AWS S3 Upload) ---
    const handleProfileImageUpload = async (file) => {
        if (!file) return;
        console.log("Uploading profile image to S3:", file.name);
        setIsProfileUploading(true);
        setMessage('');
        setMessageType('');

        try {
            setMessage('Preparing profile image upload...');
            setMessageType('info');
            const s3Path = 'profile-images';
            setMessage(`Uploading profile image...`); 
            const imageKey = await uploadImageToS3(file, s3Path);

            if (!imageKey) throw new Error("S3 upload failed to return a key.");

            setMessage('Generating image preview URL...');
            const signedUrl = await generateSignedUrl(imageKey);
            if (!signedUrl) throw new Error("Failed to generate signed URL for preview.");

            setProfileURL({ key: imageKey, jpgURL: signedUrl, blobName: null, azureUrl: null });
            setMessage('Profile picture ready to save.');
            setMessageType('success');
        } catch (error) {
            console.error("Profile image S3 upload failed:", error);
            setMessage(`Profile picture upload failed: ${error.message || 'S3 server error'}`);
            setMessageType('error');
            setProfileURL(user?.profileURL || { key: '', jpgURL: '', blobName: null, azureUrl: null }); 
        } finally {
            setIsProfileUploading(false);
            if (profileInputRef.current) profileInputRef.current.value = '';
        }
    };

    const handleBackgroundUpload = async (file) => {
        if (!file) return;
        console.log("Uploading background image to S3:", file.name);
        setIsBackgroundUploading(true);
        setMessage('');
        setMessageType('');

        try {
            setMessage('Preparing background image upload...');
            setMessageType('info');

            const s3Path = 'background-images';
            setMessage(`Uploading background image...`);
            const imageKey = await uploadImageToS3(file, s3Path);

            if (!imageKey) throw new Error("S3 upload failed to return a key.");

            setMessage('Generating image preview URL...');
            const signedUrl = await generateSignedUrl(imageKey);
            if (!signedUrl) throw new Error("Failed to generate signed URL for preview.");
            
            setBackgroundCoverURL({ key: imageKey, jpgURL: signedUrl, blobName: null, azureUrl: null });
            setMessage('Background image ready to save.');
            setMessageType('success');
        } catch (error) {
            console.error("Background image S3 upload failed:", error);
            setMessage(`Background upload failed: ${error.message || 'S3 server error'}`);
            setMessageType('error');
            setBackgroundCoverURL(user?.backgroundCoverURL || { key: '', jpgURL: '', blobName: null, azureUrl: null });
        } finally {
            setIsBackgroundUploading(false);
            if (backgroundInputRef.current) backgroundInputRef.current.value = '';
        }
    };

    // --- File Selection Triggers ---
    const onSelectProfileFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleProfileImageUpload(e.target.files[0]);
        }
    };

    const onSelectBackgroundFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleBackgroundUpload(e.target.files[0]);
        }
    };

    // --- Save Profile Handler ---
    const handleSave = async () => {
        const trimmedUsername = userName.trim();
        if (!trimmedUsername) {
            setMessage('Username cannot be empty.');
            setMessageType('error');
            return;
        }
        if (checkingUsername) {
            setMessage('Please wait, still checking username availability.');
            setMessageType('info');
            return;
        }
        if (messageType === 'error' && message.toLowerCase().includes('username') && trimmedUsername !== originalUsername.current) {
            setMessage('Please resolve the username issue before saving.');
            return;
        }

        const hasUsernameChanged = trimmedUsername !== originalUsername.current;
        const hasBioChanged = bio !== (user?.bio || '');
        // Compare S3 keys to see if image was changed/uploaded
        const hasProfilePicChanged = profileURL.key !== (user?.profileURL?.key || '');
        const hasBackgroundChanged = backgroundCoverURL.key !== (user?.backgroundCoverURL?.key || '');

        if (!hasUsernameChanged && !hasBioChanged && !hasProfilePicChanged && !hasBackgroundChanged) {
            setMessage("No changes were made.");
            setMessageType('info');
            return;
        }

        setLoading(true);
        setMessage('Saving profile...');
        setMessageType('info');

        try {
            // Construct payload with AWS S3 structure
            const payload = {
                userName: trimmedUsername,
                bio: bio,
                // Send profileURL object if key exists (meaning it's set or newly uploaded)
                // Ensure to send the structure your backend expects, including null for Azure fields if necessary.
                profileURL: profileURL.key 
                    ? { key: profileURL.key, jpgURL: profileURL.jpgURL, blobName: null, azureUrl: null } 
                    : (user?.profileURL?.key ? user.profileURL : null), // Send existing if not changed, or null
                backgroundCoverURL: backgroundCoverURL.key
                    ? { key: backgroundCoverURL.key, jpgURL: backgroundCoverURL.jpgURL, blobName: null, azureUrl: null }
                    : (user?.backgroundCoverURL?.key ? user.backgroundCoverURL : null),
            };
            
            // If backend prefers omitting keys if they are entirely null (no image)
            if (payload.profileURL === null) delete payload.profileURL;
            if (payload.backgroundCoverURL === null) delete payload.backgroundCoverURL;


            console.log("Saving profile with payload:", payload);
            const response = await axiosInstance.put('profile', payload);
            console.log("Profile save successful:", response.data);

            setUser(response.data.data); // Assuming backend returns the updated user with S3 structure
            originalUsername.current = response.data.data.userName;

            setMessage('Profile updated successfully!');
            setMessageType('success');

            if (onProfileUpdate) {
                onProfileUpdate();
            }

            setTimeout(closeModal, 1200);

        } catch (error) {
            console.error("Failed to save profile:", error);
            const errorMsg = error.response?.data?.message || 'Failed to save profile. Please try again.';
            setMessage(errorMsg);
            setMessageType('error');
            if (error.response?.status === 409 && errorMsg.toLowerCase().includes('username')) {
                setMessageType('error');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Modal Open/Close Handlers ---
    const openModal = () => {
        console.log("Opening edit profile modal.");
        setUserName(user?.userName || '');
        setBio(user?.bio || '');
        setProfileURL(user?.profileURL || { key: '', jpgURL: '', blobName: null, azureUrl: null });
        setBackgroundCoverURL(user?.backgroundCoverURL || { key: '', jpgURL: '', blobName: null, azureUrl: null });
        originalUsername.current = user?.userName || '';

        setMessage('');
        setMessageType('');
        setIsProfileUploading(false);
        setIsBackgroundUploading(false);
        // setProfileUploadProgress(0);
        // setBackgroundUploadProgress(0);
        setLoading(false);
        setCheckingUsername(false);
        setIsOpen(true);

        if (profileInputRef.current) profileInputRef.current.value = '';
        if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const isUploading = isProfileUploading || isBackgroundUploading;
    const disableSave =
        isUploading ||
        loading ||
        checkingUsername ||
        (messageType === 'error' && message.toLowerCase().includes('username') && userName.trim() !== originalUsername.current);

    return (
        <>
            <button
                onClick={openModal}
                className="btn btn-circle btn-sm bg-white/90 hover:bg-white text-black border-none shadow-md"
                aria-label="Edit profile"
                title="Edit profile"
            >
                <LuPencil size={18} />
            </button>

            {isOpen && (
                <div className="modal modal-open fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-60 overflow-y-auto p-4 pt-16 md:pt-24">
                    <div className="modal-box w-full max-w-4xl bg-white rounded-lg shadow-xl mb-8 relative max-h-[calc(100vh-8rem)] flex flex-col">
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost bg-gray-200 hover:bg-gray-300 z-20"
                            aria-label="Close modal"
                            disabled={isUploading || loading}
                        > ✕ </button>

                        <div className="flex-grow overflow-y-auto">
                            <div className="relative mb-16">
                                <div className="h-48 bg-gray-200 relative overflow-hidden group">
                                    {isBackgroundUploading && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10 text-white">
                                            <BiLoaderAlt className="animate-spin h-8 w-8 mb-2" />
                                            <span>Uploading...</span>
                                        </div>
                                    )}
                                    {backgroundCoverURL.jpgURL && !isBackgroundUploading ? (
                                        <img src={backgroundCoverURL.jpgURL} alt="Current background" className="w-full h-full object-cover" />
                                    ) : !isBackgroundUploading ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-gray-300 to-gray-400">
                                            <span className="text-gray-500 text-sm">Upload background image</span>
                                        </div>
                                    ) : null}
                                    <input ref={backgroundInputRef} type="file" id="background-image-input" className="hidden" accept="image/*" onChange={onSelectBackgroundFile} disabled={isUploading || loading} />
                                    <button
                                        onClick={() => backgroundInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 bg-white/70 p-2 rounded-full hover:bg-white/90 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Edit background image"
                                        title="Edit background image"
                                        disabled={isUploading || loading}
                                    >
                                        <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                </div>

                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10">
                                    <div className="relative group">
                                        <div className="avatar">
                                            <div className="w-32 h-32 rounded-full ring ring-white ring-offset-base-100 ring-offset-4 relative overflow-hidden bg-gray-300">
                                                {isProfileUploading && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10 text-white">
                                                        <BiLoaderAlt className="animate-spin h-8 w-8 mb-2" />
                                                        {/* <span>{profileUploadProgress}%</span> REMOVED percentage */}
                                                        <span>Uploading...</span>
                                                    </div>
                                                )}
                                                {/* Display S3 image using jpgURL */}
                                                {profileURL.jpgURL && !isProfileUploading ? (
                                                    <img src={profileURL.jpgURL} alt="Current profile" className="w-full h-full object-cover rounded-full" />
                                                ) : !isProfileUploading ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <input ref={profileInputRef} type="file" id="profile-image-input" className="hidden" accept="image/*" onChange={onSelectProfileFile} disabled={isUploading || loading} />
                                        <button
                                            onClick={() => profileInputRef.current?.click()}
                                            className="absolute bottom-1 right-1 bg-gray-600 p-1.5 rounded-full text-white hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Edit profile picture"
                                            title="Edit profile picture"
                                            disabled={isUploading || loading}
                                        >
                                            <LuPencil size={18} className='text-white' />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 px-4 md:px-6 lg:px-8">
                                <div>
                                    <label className="label" htmlFor="username-input">
                                        <span className="label-text font-medium text-gray-700">Username</span>
                                    </label>
                                    <input
                                        id="username-input"
                                        type="text"
                                        value={userName}
                                        onChange={(e) => {
                                            const newUsername = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
                                            setUserName(newUsername);
                                            checkUsernameAvailability(newUsername);
                                        }}
                                        className={`input input-bordered w-full bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500 ${messageType === 'error' && message.toLowerCase().includes('username') && userName !== originalUsername.current ? 'border-red-500 focus:ring-red-500' :
                                            messageType === 'success' && message.toLowerCase().includes('available') ? 'border-green-500 focus:ring-green-500' :
                                                'border-gray-300'
                                            }`}
                                        placeholder="Enter a unique username"
                                        maxLength={30}
                                        disabled={isUploading || loading}
                                        aria-describedby="username-hint"
                                    />
                                    <p id="username-hint" className={`text-sm my-1.5 font-medium min-h-[1.25rem] ${(userName === originalUsername.current && userName !== '' && !checkingUsername) ? 'text-gray-500' :
                                        messageType === 'success' ? 'text-green-600' :
                                            messageType === 'error' ? 'text-red-600' :
                                                messageType === 'info' ? 'text-blue-600' :
                                                    'text-gray-500'
                                        }`}>
                                        {(userName === originalUsername.current && userName !== '' && !checkingUsername) ? "This is your current username." : message || 'Only letters, numbers, and underscores. Max 30.'}
                                        {checkingUsername && <BiLoaderAlt className="animate-spin inline-block ml-2 h-4 w-4" />}
                                    </p>
                                </div>

                                <div>
                                    <label className="label" htmlFor="bio-input">
                                        <span className="label-text font-medium text-gray-700">Bio</span>
                                    </label>
                                    <textarea
                                        id="bio-input"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value.slice(0, 160))}
                                        className="textarea textarea-bordered w-full bg-gray-50 text-gray-800 border-gray-300 focus:ring-2 focus:ring-blue-500 h-24"
                                        placeholder="Tell us about yourself (optional)"
                                        rows={3}
                                        maxLength={160}
                                        disabled={isUploading || loading}
                                    />
                                    <p className="text-xs text-gray-500 mt-1 text-right">{bio.length}/160</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-action mt-6 px-4 pb-4 border-t border-gray-200 pt-4 flex-shrink-0">
                               <div className="flex-grow text-sm mr-4">
                                 {message && !(message.toLowerCase().includes('username') || message.toLowerCase().includes('available')) && (
                                     <span className={`${
                                         messageType === 'success' ? 'text-green-600' :
                                         messageType === 'error' ? 'text-red-600' :
                                         'text-blue-600'
                                     } font-medium`}>{message}</span>
                                 )}
                             </div>
                            <button
                                onClick={closeModal}
                                className="btn btn-ghost mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                disabled={isUploading || loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={disableSave}
                                className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-blue-400 relative min-w-[120px]"
                            >
                                {loading ? (<><BiLoaderAlt className="animate-spin h-5 w-5 mr-2" />Saving...</>) : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditProfileModal;