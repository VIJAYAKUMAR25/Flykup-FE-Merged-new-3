import axios from "axios";

export const uploadToAzure = async (sasUrl, file, onProgress) => {
    try {

        const response = await axios.put(sasUrl, file, {
            headers: {
                "Content-Type": file.type,
                "x-ms-blob-type": "BlockBlob",
                // "x-ms-blob-content-disposition": "inline"
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                } else {
                    onProgress(0);
                }
            },
        });
        return response;
    } catch (error) {
        console.error("Azure upload failed:", error);
        let errorMessage = "Azure upload failed.";
        if (error.response) {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(error.response.data, "text/xml");
                const azureError = xmlDoc.getElementsByTagName("Message")[0]?.textContent;
                if (azureError) errorMessage = `Azure Error: ${azureError}`;
                else errorMessage = `Azure Error: HTTP ${error.response.status} - ${error.response.statusText}`;
            } catch (parseError) {
                errorMessage = `Azure Error: HTTP ${error.response.status} - ${error.response.statusText}`;
            }
        } else if (error.request) {
            errorMessage = "Azure Upload Error: No response received from Azure.";
        } else {
            errorMessage = `Azure Upload Error: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
};