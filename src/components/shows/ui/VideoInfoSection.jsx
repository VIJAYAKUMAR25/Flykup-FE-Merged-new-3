import React, { useEffect, useState } from 'react';
import { User, ShoppingCart, Percent, Star } from 'lucide-react';

const VideoInfoSection = ({ video, onViewProducts }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleScroll = (e) => {
    e.stopPropagation();
    console.log("scrolling");
  };

  useEffect(() => {
    if (showFullDescription) {
      const container = document.querySelector('.description-scroll');

      const preventTouchScroll = (e) => {
        e.stopPropagation();
      };

      if (container) {
        container.addEventListener('touchstart', preventTouchScroll, { passive: false });
        container.addEventListener('touchmove', preventTouchScroll, { passive: false });
        container.addEventListener('touchend', preventTouchScroll, { passive: false });
      }

      return () => {
        if (container) {
          container.removeEventListener('touchstart', preventTouchScroll);
          container.removeEventListener('touchmove', preventTouchScroll);
          container.removeEventListener('touchend', preventTouchScroll);
        }
      };
    }
  }, [showFullDescription]);
  
  return (
    <div className="bg-transparant p-3 rounded-2xl backdrop-blur-xs pointer-events-auto shadow-xl">
      <div className="flex items-start gap-3">
        {/* Profile Picture */}
        <div className="avatar animate-fade-in">
          <div className="w-7 h-7 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-4 hover:scale-105 transition-transform duration-300 shadow-lg">
            {video?.profilePic ? (
              <img
                src="https://png.pngtree.com/png-vector/20240601/ourmid/pngtree-casual-man-flat-design-avatar-profile-picture-vector-png-image_12593008.png"
                alt={video?.sellerName}
                className="object-cover"
              />
            ) : (
              <div className="bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <img
                  src="https://png.pngtree.com/png-vector/20240601/ourmid/pngtree-casual-man-flat-design-avatar-profile-picture-vector-png-image_12593008.png"
                  alt={video?.sellerName}
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 space-y-1">
          <div className="flex flex-col items-start flex-wrap">
            <div className="flex flex-col items-start gap-2 cursor-pointer">
              <h3 className="text-md font-bold text-white tracking-wide hover:text-primary transition-colors">
                {video?.sellerInfo?.basicInfo?.name}
              </h3>
            </div>

            <div className="" onWheel={handleScroll}>
              <div className="relative">
                <div className="text-xs text-white flex">
                  {showFullDescription ? (
                    <p className="leading-relaxed">
                      {video?.description}
                    </p>
                  ) : (
                    <p className="leading-relaxed">
                      {video?.description?.slice(0, 25)}
                      {video?.description?.length > 100 && '...'}
                    </p>
                  )}
                  &nbsp;
                  {video?.description?.length > 100 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-primary font-medium hover:underline mt-1 block"
                    >
                      {showFullDescription ? 'less' : 'more'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="badge badge-success gap-1 rounded-full px-3 py-3 font-semibold animate-pulse">
                <span className="text-xs whitespace-nowrap">20% OFF</span>
              </div>
              <button
                className="btn btn-xs btn-primary rounded-full hover:scale-105 transition-transform duration-300"
                onClick={() => onViewProducts(video)}
              >
                <ShoppingCart size={14} />
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoInfoSection;