import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, ListVideoIcon } from 'lucide-react';
import axios from 'axios';
import { backendurl, socketurl } from '../../../config';
import { generateSignedUrl } from '../../utils/aws';
import { useAuth } from '../../context/AuthContext';


const Shows = () => {
    const navigate = useNavigate();
    // const [user, setUser] = useState(null);
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [liveShows, setLiveShows] = useState([]);
    const [signedUrls, setSignedUrls] = useState({});

    const handleShowClick = (showId) => {
        navigate(`/profile/show/${showId}`, { state: { user } });
    };

    const fetchLiveShows = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${socketurl}/api/shows/live`, {
                withCredentials: true,
            })

            if (response.status === 200) {
                // console.log(response.data);

                setLiveShows(response.data.data)
            } else {
                console.error("Failed to fetch products.")
            }
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLiveShows()
    }, [])

    useEffect(() => {
        const fetchSignedUrls = async () => {
            const urls = {}
            for (const show of liveShows) {
                if (show?.thumbnailImage) {
                    urls[show._id] = await generateSignedUrl(show?.thumbnailImage)
                    // console.log(urls);
                }
            }
            setSignedUrls(urls)
        }

        fetchSignedUrls()
    }, [liveShows])

    // useEffect(() => {
    //     const storedUser = localStorage.getItem('userData');
    //     if (storedUser) {
    //         try {
    //             setUser(JSON.parse(storedUser));
    //         } catch (error) {
    //             console.error('Failed to parse user data:', error);
    //             localStorage.removeItem('userData');
    //         }
    //     }
    // }, []);

    return (
        <div className="drawer lg:drawer-open">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />

            {/* Main content */}
            <div className="drawer-content">
                {/* Mobile navbar */}
                <div className="lg:hidden navbar bg-white">
                    <div className="flex-2">
                        <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost text-black">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </label>
                    </div>
                    {/* <div className="flex-1">
                        <h1 className="text-xl font-bold">Hi {user?.userName}!</h1>
                    </div> */}
                </div>

                {/* Shows grid */}
                <div className="p-8 font-display">
                    <div className="container">
                        <h1 className="text-3xl text-black font-bold mb-8">Live Shows</h1>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {liveShows.map((show) => (
                                <div
                                    key={show._id}
                                    className="card rounded-lg bg-base-100  hover:shadow-xl transition-shadow cursor-pointer"
                                    onClick={() => handleShowClick(show._id)}
                                >
                                    <figure className="relative">
                                        <img
                                            src={signedUrls[show._id]}
                                            alt={show.title}
                                            className="w-full lg:h-80 h-32 object-cover"
                                        />
                                        {show.isLive && (
                                            <div className="absolute lg:top-4 top-2 lg:left-4 left-2 flex items-center gap-2">
                                                <span className="badge badge-error lg:badge-sm badge-xs text-white bg-red-500 shadow-lg flex items-center gap-1 px-3 py-1 rounded-full">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping"></span>
                                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                                                    </span>
                                                    Live
                                                </span>
                                                {/* <span className="badge badge-ghost bg-black/50">{show.viewerCount}</span> */}
                                            </div>
                                        )}
                                    </figure>
                                    <div className="card-body rounded-xl p-4 bg-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="avatar">
                                                <div className="w-8 h-8 rounded-full">
                                                    <img src={show?.seller?.avatar || 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg'} alt={show?.seller?.name} />
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold">{show?.seller?.name}</span>
                                        </div>
                                        <h2 className="card-title text-sm text-gray-950">{show.title}</h2>
                                        <div className="mt-2">
                                            <div className="badge lg:badge-md badge-sm badge-outline text-gray-950 whitespace-nowrap">{show.category}</div>
                                            <div className="text-xs text-gray-950 mt-1">{show.subCategory}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="drawer-side shadow-xl overflow-hidden fixed">
                <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
                <div className="menu p-4 w-80 min-h-full bg-base-100 text-base-content flex flex-col ">
                    <div className="mb-8 md:mt-2 mt-20">
                        <h1 className="text-2xl font-bold mb-4">Hi  {user?.userName}!</h1>
                    </div>

                    <div className="flex-1">
                        <div className="mb-8">
                            <Link to="/for-you" className="text-info font-bold text-xl mb-4 block">For You</Link>
                            <Link to="/sneakers" className="text-gray-400 text-md block">Sneakers & Streetwear</Link>
                        </div>
                    </div>

                    {/* <div className="mt-auto space-y-2 text-sm text-gray-500">
                        <div className="grid grid-cols-2 gap-2">
                            <Link to="/blog">Blog</Link>
                            <Link to="/careers">Careers</Link>
                            <Link to="/about">About Us</Link>
                            <Link to="/faq">FAQ</Link>
                        </div>

                        <div className="my-4">
                            <Link to="/affiliates">Whatnot Affiliates</Link>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <Link to="/privacy">Privacy</Link>
                            <Link to="/terms">Terms</Link>
                            <Link to="/contact">Contact</Link>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pb-2">
                            <Globe size={16} />
                            <span>English</span>
                        </div>

                        <div className="text-xs">
                            © 2025 Whatnot Inc.
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default Shows;