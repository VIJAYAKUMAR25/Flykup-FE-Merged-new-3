import { useEffect, useState } from "react";
import { generateSignedUrl } from "./aws";
import { X } from "lucide-react";

const ImageWithSignedUrlShow = ({ imageKey, onRemove }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    generateSignedUrl(imageKey).then((signedUrl) => {
      if (isMounted) setUrl(signedUrl);
    });
    return () => {
      isMounted = false;
    };
  }, [imageKey]);

  return (
    <div className="relative">
      {url ? (
        <img
          src={url}
          alt="preview"
          className="w-24 h-24 object-cover rounded-lg"
        />
      ) : (
        <div className="w-24 h-24 flex items-center justify-center">
          Loading...
        </div>
      )}
      
    </div>
  );
};

export default ImageWithSignedUrlShow;
