import { IndianRupee } from 'lucide-react';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

import { SOCKET_URL } from '../api/apiDetails';
import { useAuth } from '../../context/AuthContext';

// const socket = io.connect("http://localhost:6969");
// const socket = io.connect(SOCKET_URL);

const BuyProductsSellers = ({ showId, streamId, product, signedUrls, fetchShow, currentAuction }) => {
    // const [user, setUser] = useState(null);
    const { user, logout } = useAuth();

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

    const handleBuy = (amnt) => {
        console.log("Buy button clicked", amnt);
    }

    return (
        <div className="card w-full max-w-lg bg-stone-950 shadow-xl rounded-2xl p-4 space-y-4 ">

            <div className="flex items-center space-x-4 bg-stone-900 p-4 rounded-lg">
                <img src={signedUrls[product?.productId?._id] || "/placeholder.svg"} className="w-20 h-20 object-contain" alt={product?.productId?.title} />
                <div>
                    <h4 className="text-xl font-bold text-white">{product?.productId?.title}</h4>
                    <p className="text-gray-300 text-sm line-clamp-2">{product?.productId?.description}</p>
                </div>
            </div>


            <div className="hidden justify-end gap-4 mb-2">
                <button
                    onClick={() => handleBuy(product?.productPrice)}
                    className="btn btn-warning btn-sm rounded-full">
                    <IndianRupee size={12} /> Buy Now
                </button>
            </div>


        </div>
    )
}

export default BuyProductsSellers