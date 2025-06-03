// display date 
export const formatDateForDisplay = (utcISOString) => {
    if (!utcISOString) {
      return "";
    }
  
    try {
      const dateObject = new Date(utcISOString);
      if (isNaN(dateObject.getTime())) {
        return "";
      }
  
      const options = {
        year: 'numeric',  
        month: 'long',   
        day: 'numeric'   
      };
  
      return dateObject.toLocaleDateString(undefined, options);
  
    } catch (error) {
      console.error("Error formatting date for display:", error);
      return "";
    }
  };
  
// display time 
export const formatTimeForDisplay = (utcISOString) => {
    if (!utcISOString) {
      return "";
    }
  
    try {
      const dateObject = new Date(utcISOString);
      if (isNaN(dateObject.getTime())) {
        return "";
      }
  
      const options = {
        hour: 'numeric',    
        minute: '2-digit', 
        hour12: true       
      };
  
      return dateObject.toLocaleTimeString(undefined, options);
  
    } catch (error) {
      console.error("Error formatting time for display:", error);
      return "";
    }
  };
  
// show creation form
  export const getUtcIsoStringFromLocal = (dateString, timeString) => {
    // Basic validation
    if (
      !dateString ||
      !timeString ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
      !/^\d{2}:\d{2}$/.test(timeString)
    ) {
      console.error("Invalid date or time string format provided.");
      return null;
    }
  
    try {
      // Combine into a format that new Date() interprets as LOCAL time
      const localDateTimeString = `${dateString}T${timeString}:00`;
  
      // Create the Date object (represents the local time)
      const localDateObject = new Date(localDateTimeString);
  
      // Check if the created date is valid
      if (isNaN(localDateObject.getTime())) {
        console.error(
          "Could not create a valid date from strings:",
          localDateTimeString
        );
        return null;
      }
  
      // Convert to UTC ISO string
      const utcISOString = localDateObject.toISOString();
      return utcISOString;
    } catch (error) {
      console.error("Error converting local date/time to UTC ISO string:", error);
      return null;
    }
  };
  
// show edit form 
export const getLocalStringsFromUtcIso = (utcISOString) => {
  if (!utcISOString) {
    console.error("Invalid UTC ISO string provided (null or empty).");
    // Return default/empty values instead of null for easier state update
    return { date: '', time: '' };
  }
  try {
    const dateObject = new Date(utcISOString);
    if (isNaN(dateObject.getTime())) {
      console.error("Could not create a valid date from UTC ISO string:", utcISOString);
       // Return default/empty values
      return { date: '', time: '' };
    }

    // Extract LOCAL date components (YYYY-MM-DD)
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // Extract LOCAL time components (HH:MM)
    const hours = String(dateObject.getHours()).padStart(2, '0');
    const minutes = String(dateObject.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    return {
      date: formattedDate,
      time: formattedTime,
    };
  } catch (error) {
    console.error("Error converting UTC ISO string to local date/time strings:", error);
     // Return default/empty values
    return { date: '', time: '' };
  }
};

// view scheduled show component 
export const formatScheduledDateTimeLocal = (scheduledAtUTCString) => {
  if (!scheduledAtUTCString) {
    return "Not scheduled";
  }

  try {
    const dateObject = new Date(scheduledAtUTCString);

    if (isNaN(dateObject.getTime())) {
      console.error("Invalid date string received:", scheduledAtUTCString);
      return "Invalid Date";
    }


    const dateOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const formattedDate = dateObject.toLocaleDateString(undefined, dateOptions);
    const formattedTime = dateObject.toLocaleTimeString(undefined, timeOptions);


    return `${formattedDate} - ${formattedTime}`;

  } catch (error) {
    console.error("Error formatting scheduledAt date:", error, "Input:", scheduledAtUTCString);
    return "Error Formatting Date";
  }
};
