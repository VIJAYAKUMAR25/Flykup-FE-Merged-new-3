import { createContext, useContext, useState } from "react";

const SearchTabContext = createContext();

export function SearchTabProvider({ children }) {
  const [activeTab, setActiveTab] = useState("shows");

  return (
    <SearchTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </SearchTabContext.Provider>
  );
}

export function useSearchTab() {
  return useContext(SearchTabContext);
}
