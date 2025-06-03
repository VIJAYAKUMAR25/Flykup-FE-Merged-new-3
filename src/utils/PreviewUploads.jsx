import { useEffect, useState } from "react";
import { generateSignedUrl } from "./aws";
import { X } from "lucide-react";

const PreviewUploads = ({ imageKey, onRemove }) => {
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

  const fileName = imageKey ? imageKey.split("/").pop() : "";
  const fileNameParts = fileName.split("_");
  const originalFileName =
    fileNameParts.length > 1 ? fileNameParts.slice(1).join("_") : fileName;

  return (
    <div className="relative max-w-[300px] mx-auto">
      {url ? (
        <img
          src={url}
          alt="preview"
          className="w-full h-48 object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-48 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-newBlack"></span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 btn btn-circle btn-xs bg-black text-white"
      >
        <X size={16} />
      </button>
      {originalFileName && (
        <div className="mt-2 text-center text-sm text-green-700">
          {originalFileName} uploaded successfully
        </div>
      )}
    </div>
  );
};

export default PreviewUploads;
