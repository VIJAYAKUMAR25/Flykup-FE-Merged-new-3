import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuPencil, LuCamera, LuUser, LuFileText } from "react-icons/lu";
import { BiLoaderAlt } from "react-icons/bi";
import { CgClose } from "react-icons/cg";
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { uploadImageToS3 } from '../../utils/aws.js';

// --- Configuration ---
const CDNURL = import.meta.env.VITE_AWS_CDN_URL;

// --- Helper Functions ---
const getUserInitials = (userName = '') => {
    const alphanumericChars = userName.replace(/[^a-zA-Z0-9]/g, '');
    if (!alphanumericChars) return '??';
    return alphanumericChars.substring(0, 2).toUpperCase();
};

const generateColorFromString = (str = '') => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 50%, 60%)`;
};

// --- Main Component ---
const EditProfileModal = ({ onProfileUpdate }) => {
    const { user, setUser } = useAuth();
    const originalUsername = useRef(user?.userName || '');

    // --- State Management ---
    const [isOpen, setIsOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [bio, setBio] = useState('');
    const [profileURL, setProfileURL] = useState({ key: '' });
    const [backgroundCoverURL, setBackgroundCoverURL] = useState({ key: '' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [isProfileUploading, setIsProfileUploading] = useState(false);
    const [isBackgroundUploading, setIsBackgroundUploading] = useState(false);

    // --- Refs ---
    const profileInputRef = useRef(null);
    const backgroundInputRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        if (user) {
            setUserName(user.userName || '');
            setBio(user.bio || '');
            setProfileURL(user.profileURL || { key: '' });
            setBackgroundCoverURL(user.backgroundCoverURL || { key: '' });
            originalUsername.current = user.userName || '';
        }
    }, [user, isOpen]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    // --- Debounced Username Check ---
    const checkUsernameAvailability = useCallback(
        debounce(async (usernameToCheck) => {
            const trimmedUsername = usernameToCheck.trim();
            if (!trimmedUsername || trimmedUsername === originalUsername.current) {
                setMessage('');
                setMessageType('');
                setCheckingUsername(false);
                return;
            }
            setCheckingUsername(true);
            setMessage('Checking availability...');
            setMessageType('info');
            try {
                const { data } = await axiosInstance.get(`profile/username-availability`, { params: { userName: trimmedUsername } });
                setMessage(data.message);
                setMessageType(data.status ? 'success' : 'error');
            } catch (error) {
                setMessage(error.response?.data?.message || 'Error checking username');
                setMessageType('error');
            } finally {
                setCheckingUsername(false);
            }
        }, 500),
        []
    );

    // --- Image Upload Handler ---
    const handleImageUpload = async (file, s3Path, uploaderSetter, urlSetter, imageType) => {
        if (!file) return;
        uploaderSetter(true);
        setMessage('');
        setMessageType('');
        try {
            setMessage(`Uploading ${imageType}...`);
            setMessageType('info');
            const imageKey = await uploadImageToS3(file, s3Path);
            if (!imageKey) throw new Error("S3 upload failed to return a key.");
            urlSetter({ key: imageKey });
            setMessage(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} ready to save.`);
            setMessageType('success');
        } catch (error) {
            console.error(`${imageType} S3 upload failed:`, error);
            setMessage(`${imageType} upload failed: ${error.message || 'Server error'}`);
            setMessageType('error');
            urlSetter(imageType === 'profile' ? (user?.profileURL || { key: '' }) : (user?.backgroundCoverURL || { key: '' }));
        } finally {
            uploaderSetter(false);
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
        const payload = {
            userName: trimmedUsername,
            bio,
            profileURL: profileURL.key ? profileURL : null,
            backgroundCoverURL: backgroundCoverURL.key ? backgroundCoverURL : null,
        };
        setLoading(true);
        setMessage('Saving profile...');
        setMessageType('info');
        try {
            const response = await axiosInstance.put('profile', payload);
            setUser(response.data.data);
            setMessage('Profile updated successfully!');
            setMessageType('success');
            if (onProfileUpdate) onProfileUpdate();
            setTimeout(closeModal, 1200);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to save profile.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    // --- Modal Control ---
    const openModal = () => setIsOpen(true);
    const closeModal = () => {
        if (loading || isProfileUploading || isBackgroundUploading) return;
        setIsOpen(false);
    };

    const isUploading = isProfileUploading || isBackgroundUploading;
    const disableSave = loading || isUploading || checkingUsername || (messageType === 'error' && userName.trim() !== originalUsername.current);

    // --- Render ---
    return (
        <>
            <button
                onClick={openModal}
                className='btn bg-slate-800 hover:bg-slate-700 text-white rounded-xl  px-6 h-11 min-h-11 border-none transition-all duration-300'
                aria-label="Edit profile"
            >
                <LuPencil size={16} />
                <span className="ml-2">Edit Profile</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative z-10 w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
                                <button onClick={closeModal} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" disabled={isUploading || loading}>
                                    <CgClose size={20} />
                                </button>
                            </header>

                            <main className="flex-grow overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-x-8">
                                {/* --- Left Column: Image Uploads --- */}
                                <div className="col-span-1 p-6 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Profile Picture</h3>
                                        <div className="relative w-32 h-32 mx-auto group">
                                            <div className="h-full w-full rounded-full ring-4 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                                {profileURL.key ? (
                                                    <img src={`${CDNURL}${profileURL.key}`} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl" style={{ backgroundColor: generateColorFromString(userName) }}>
                                                        {getUserInitials(userName)}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                                onClick={() => profileInputRef.current?.click()}
                                            >
                                                <LuCamera size={24} className="text-white" />
                                            </div>
                                            {isProfileUploading && (
                                                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center z-10 text-white">
                                                    <BiLoaderAlt className="animate-spin h-8 w-8" />
                                                </div>
                                            )}
                                        </div>
                                        <input ref={profileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], 'profile-images', setIsProfileUploading, setProfileURL, 'profile')} />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Cover Photo</h3>
                                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg relative group">
                                            {backgroundCoverURL.key && <img src={`${CDNURL}${backgroundCoverURL.key}`} alt="Background" className="w-full h-full object-cover rounded-lg" />}
                                            <div
                                                className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                                onClick={() => backgroundInputRef.current?.click()}
                                            >
                                                <div className="text-center text-white bg-black/50 p-2 rounded-lg">
                                                    <LuCamera size={20} className="mx-auto" />
                                                    <span className="text-xs font-semibold">Change Cover</span>
                                                </div>
                                            </div>
                                            {isBackgroundUploading && (
                                                <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center z-10 text-white">
                                                    <BiLoaderAlt className="animate-spin h-8 w-8" />
                                                </div>
                                            )}
                                        </div>
                                        <input ref={backgroundInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], 'background-images', setIsBackgroundUploading, setBackgroundCoverURL, 'background')} />
                                    </div>
                                </div>

                                {/* --- Right Column: Form Fields --- */}
                                <div className="col-span-1 lg:col-span-2 p-6 border-t lg:border-t-0 lg:border-l dark:border-gray-700 space-y-6">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Username</label>
                                        <div className="relative">
                                            <LuUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" value={userName} onChange={(e) => {
                                                const newUsername = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
                                                setUserName(newUsername);
                                                checkUsernameAvailability(newUsername);
                                            }} className="input-style pl-10" placeholder="Enter a unique username" disabled={isUploading || loading} />
                                        </div>
                                        <p className={`text-xs mt-1.5 min-h-[1rem] flex items-center ${messageType === 'success' ? 'text-green-500' : messageType === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                                            {message.toLowerCase().includes('username') || message.toLowerCase().includes('available') ? message : 'Only letters, numbers, and underscores are allowed.'}
                                            {checkingUsername && <BiLoaderAlt className="animate-spin inline-block ml-2" />}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Bio</label>
                                        <div className="relative">
                                            <LuFileText className="absolute left-3 top-3.5 text-gray-400" />
                                            <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} className="input-style h-32 pl-10 resize-none" placeholder="Tell us about yourself..." maxLength={160} disabled={isUploading || loading} />
                                        </div>
                                        <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/160</p>
                                    </div>
                                </div>
                            </main>

                            <footer className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                                <div className="flex-grow mr-4">
                                    {message && !(message.toLowerCase().includes('username') || message.toLowerCase().includes('available')) && (
                                        <span className={`font-medium text-sm transition-all duration-300 ${messageType === 'success' ? 'text-green-500' : messageType === 'error' ? 'text-red-500' : 'text-sky-500'}`}>{message}</span>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    <button onClick={closeModal} className="btn btn-ghost mr-2" disabled={isUploading || loading}>Cancel</button>
                                    <button onClick={handleSave} disabled={disableSave} className="btn bg-sky-600 hover:bg-sky-700 text-white min-w-[120px] transition-all duration-300 disabled:bg-sky-400 disabled:cursor-not-allowed">
                                        {loading ? <BiLoaderAlt className="animate-spin" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default EditProfileModal;

// Simple debounce function
const debounce = (func, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
};