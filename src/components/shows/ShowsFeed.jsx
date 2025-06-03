import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { generateSignedUrl } from '../../utils/aws';
import { USER_FEED_SHOWS } from '../api/apiDetails';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ShowsFeed = () => {
    const [shows, setShows] = useState([]);
    const [signedUrls, setSignedUrls] = useState({});
    const navigate = useNavigate();

    const fetchShows = async () => {
        try {
            const res = await axiosInstance.get(USER_FEED_SHOWS);
            const showsData = res.data.data;
            setShows(showsData);

            // Generate signed URLs for all images
            const urlPromises = showsData.map(async (show) => {
                const url = await generateSignedUrl(show.thumbnailImage);
                return { id: show._id, url };
            });

            const resolvedUrls = await Promise.all(urlPromises);
            const urlMap = resolvedUrls.reduce((acc, { id, url }) => {
                acc[id] = url;
                return acc;
            }, {});
            setSignedUrls(urlMap);
        } catch (error) {
            console.error("Error fetching shows:", error.message);
        }
    };

    useEffect(() => {
        fetchShows();
    }, []);

    const handleShowClick = (showId) => {
        navigate(`/profile/show/${showId}`);
    };

    if (shows.length === 0) {
        return (
            <div className='flex justify-center items-center min-h-screen'>
                <h2 className='font-medium text-gray-700 md:text-2xl text-lg'>Currently no shows available</h2>
            </div>
        );
    }

    return (
        <div className='p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 container mx-auto mt-5'>
            {shows.map((show) => (
                <div
                    key={show._id}
                    className=''
                    onClick={() => handleShowClick(show._id)}
                >
                    {/* Seller Header */}
                    <div className="flex items-center p-3 border-b">
                        <img
                            src={show.sellerId?.userInfo?.profileURL || 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg'}
                            alt={show.sellerId?.userInfo?.userName || 'avatar'}
                            className="w-10 h-10 rounded-full mr-2"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{show.sellerId?.companyName}</span>
                            <span className="text-xs text-gray-600">{show.sellerId?.userInfo?.userName || "user"}</span>
                        </div>
                    </div>
                    <div className='bg-white shadow-md rounded-lg overflow-hidden card hover:shadow-xl transition-shadow cursor-pointer'>

                        {/* Card Content */}
                        <div className='relative'>
                            <div className='absolute top-2 left-2'>
                                {show.showStatus === 'live' ? (
                                    <motion.div
                                        className='bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center'
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    >
                                        <motion.span
                                            className='w-2 h-2 bg-white rounded-full mr-1'
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                        />
                                        <span className='font-bold'>LIVE</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        className='bg-black text-white text-xs px-3 py-1 rounded-full font-bold shadow-md flex items-center'
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <span className='mr-1'>•</span>
                                        <span>UPCOMING</span>
                                    </motion.div>
                                )}
                            </div>
                            <img
                                src={signedUrls[show._id] || '/placeholder.jpg'}
                                alt={show.title}
                                className='w-full lg:h-80 h-32 object-cover'
                            />
                            <div className='p-3'>
                                <h2 className='text-lg font-bold mt-1 text-gray-800'>{show.title}</h2>
                                <p className='text-sm text-gray-800'>{show.language} | {show.subCategory}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ShowsFeed;
