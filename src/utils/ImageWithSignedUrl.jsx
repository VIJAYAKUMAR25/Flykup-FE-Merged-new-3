import { useEffect, useState } from "react";
import { generateSignedUrl } from "./aws";
import { X } from "lucide-react";

const ImageWithSignedUrl = ({ imageKey, onRemove }) => {
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
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 btn btn-circle btn-xs"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ImageWithSignedUrl;
