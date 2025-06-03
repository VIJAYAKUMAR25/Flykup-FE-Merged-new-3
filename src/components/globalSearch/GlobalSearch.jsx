import { useState, useEffect, useCallback, useMemo } from "react"
import { Tv, Video, ShoppingBag, Users, ArrowLeft, Search, Loader2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import ShowResults from "./ShowResults"
import VideoResults from "./VideoResults"
import ProductResults from "./ProductResults"
import UserResults from "./UserResults"
import axiosInstance from "../../utils/axiosInstance"
import { SEARCH_ENDPOINTS } from "../api/apiDetails"
import { SkeletonLoader, LoadingGrid } from "./SkeletonLoader"
import { useSearchTab } from "../../context/SearchContext"

const DEFAULT_LIMIT = 20

function GlobalSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchTermFromState = location.state?.searchTerm ?? ""

  // const [activeTab, setActiveTab] = useState("shows")
  const { activeTab, setActiveTab } = useSearchTab();
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // States remain the same
  const [results, setResults] = useState({ shows: [], videos: [], products: [], users: [] })
  const [pagination, setPagination] = useState({
    shows: { currentPage: 1, totalCount: 0, totalPages: 1, hasMore: false, limit: DEFAULT_LIMIT },
    videos: { currentPage: 1, totalCount: 0, totalPages: 1, hasMore: false, limit: DEFAULT_LIMIT },
    products: { currentPage: 1, totalCount: 0, totalPages: 1, hasMore: false, limit: DEFAULT_LIMIT },
    users: { currentPage: 1, totalCount: 0, totalPages: 1, hasMore: false, limit: DEFAULT_LIMIT },
  })
  const [loadingStates, setLoadingStates] = useState({
    shows: false,
    videos: false,
    products: false,
    users: false,
    globalSearchChange: false,
  })
  const [errorStates, setErrorStates] = useState({
    shows: null,
    videos: null,
    products: null,
    users: null,
  })

  const TABS = useMemo(
    () => [
      { key: "shows", label: "Shows", icon: <Tv size={18} className="text-purple-500" /> },
      { key: "videos", label: "Videos", icon: <Video size={18} className="text-blue-500" /> },
      { key: "products", label: "Products", icon: <ShoppingBag size={18} className="text-amber-500" /> },
      { key: "users", label: "Users", icon: <Users size={18} className="text-green-500" /> },
    ],
    [],
  )

  // Tab colors for visual distinction
  const getTabColors = (tabKey) => {
    const colors = {
      shows: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        border: "border-purple-300",
        hover: "hover:bg-purple-200",
      },
      videos: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", hover: "hover:bg-blue-200" },
      products: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", hover: "hover:bg-amber-200" },
      users: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", hover: "hover:bg-green-200" },
    }
    return colors[tabKey] || colors.shows
  }

  const fetchDataForCategory = useCallback(
    async (category, term, page = 1, appendResults = false) => {
      const trimmedTerm = term.trim()

      console.log(`Fetching ${category} for term: "${trimmedTerm}" (Page: ${page}, Append: ${appendResults})`)
      setLoadingStates((prev) => ({ ...prev, [category]: true }))
      if (!appendResults || (category === activeTab && page === 1)) {
        setErrorStates((prev) => ({ ...prev, [category]: null }))
      }

      const limit = pagination[category].limit

      try {
        const response = await axiosInstance.get(SEARCH_ENDPOINTS[category], {
          params: { term: trimmedTerm, page, limit },
        })

        if (response.data && response.data.status) {
          const { data, pagination: apiPagination } = response.data
          setResults((prev) => ({
            ...prev,
            [category]: appendResults ? [...prev[category], ...data] : data || [],
          }))
          setPagination((prev) => ({
            ...prev,
            [category]: {
              ...prev[category],
              currentPage: apiPagination.currentPage,
              totalCount: apiPagination.totalCount,
              totalPages: apiPagination.totalPages,
              hasMore: apiPagination.hasMore ?? apiPagination.currentPage < apiPagination.totalPages,
            },
          }))
        } else {
          const errorMsg = response.data?.message || `Failed to fetch ${category}`
          console.error(`API Error for ${category}: ${errorMsg}`, response.data)
          throw new Error(errorMsg)
        }
      } catch (err) {
        console.error(`Fetch Error for ${category} (term: ${term}, page: ${page}):`, err)
        const message = err.response?.data?.message || err.message || `Failed to fetch ${category}`
        setErrorStates((prev) => ({ ...prev, [category]: message }))
        if (!appendResults) {
          setResults((prev) => ({ ...prev, [category]: [] }))
          setPagination((prev) => ({
            ...prev,
            [category]: { ...prev[category], currentPage: 1, totalCount: 0, totalPages: 1, hasMore: false },
          }))
        }
      } finally {
        setLoadingStates((prev) => ({ ...prev, [category]: false }))
        if (page === 1 && !appendResults) {
          setTimeout(() => setIsInitialLoad(false), 0)
        }
      }
    },
    [pagination, activeTab],
  )

  useEffect(() => {
    console.log("Location State Changed - New Term:", searchTermFromState)
    setPagination((prev) => {
      const newState = { ...prev }
      Object.keys(newState).forEach((key) => {
        newState[key] = { ...newState[key], currentPage: 1 }
      })
      return newState
    })
    setLoadingStates((prev) => ({ ...prev, globalSearchChange: true }))
    if (!isInitialLoad) {
    }
    Promise.all([
      fetchDataForCategory("shows", searchTermFromState, 1),
      fetchDataForCategory("videos", searchTermFromState, 1),
      fetchDataForCategory("products", searchTermFromState, 1),
      fetchDataForCategory("users", searchTermFromState, 1),
    ]).finally(() => {
      setLoadingStates((prev) => ({ ...prev, globalSearchChange: false }))
      console.log("Term Change Fetch Sequence Completed for term:", searchTermFromState)
    })
  }, [searchTermFromState])

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    const needsFetch = results[tabKey].length === 0 && !loadingStates[tabKey] && !errorStates[tabKey]
    if (needsFetch) {
      console.log(`Fetching ${tabKey} on tab change as it's empty.`)
      fetchDataForCategory(tabKey, searchTermFromState, 1)
    }
  }

  const handleGoBack = () => {
    navigate("/")
  }

  const loadMore = useCallback(() => {
    const category = activeTab
    const currentPagination = pagination[category]
    if (!loadingStates[category] && currentPagination.hasMore) {
      console.log(`Loading more for ${category}, page ${currentPagination.currentPage + 1}`)
      fetchDataForCategory(category, searchTermFromState, currentPagination.currentPage + 1, true)
    }
  }, [activeTab, pagination, loadingStates, searchTermFromState, fetchDataForCategory])

  // Render skeleton loaders based on active tab
  const renderSkeletonLoader = () => {
    switch (activeTab) {
      case "shows":
        return <LoadingGrid type="show" count={6} columns={3} />
      case "videos":
        return <LoadingGrid type="video" count={8} columns={4} />
      case "products":
        return <LoadingGrid type="product" count={6} columns={3} />
      case "users":
        return (
          <div className="space-y-4">
            <SkeletonLoader type="user" count={5} />
          </div>
        )
      default:
        return <LoadingGrid type="default" count={6} columns={3} />
    }
  }

  const renderResults = () => {
    const currentResults = results[activeTab] || []
    const currentPagination = pagination[activeTab]
    const isLoading = loadingStates[activeTab]
    const isGloballyLoading = loadingStates.globalSearchChange
    const error = errorStates[activeTab]
    const hasSearched = searchTermFromState.trim().length > 0
    const tabColors = getTabColors(activeTab)

    if ((isInitialLoad || isGloballyLoading) && currentResults.length === 0 && !error) {
      return renderSkeletonLoader() // Use skeleton loader instead of spinner
    }
    if (error && currentResults.length === 0) {
      return (
        <div role="alert" className="alert alert-error shadow-lg mx-auto max-w-md animate-fade-in">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Error! {error}</span>
        </div>
      )
    }

    const noResultsFound =
      !isLoading && !isGloballyLoading && currentResults.length === 0 && currentPagination.totalCount === 0

    if (noResultsFound) {
      if (hasSearched) {
        return (
          <div className="text-center py-16 animate-fade-in">
            <div className={`inline-flex items-center justify-center p-6 rounded-full ${tabColors.bg} mb-4`}>
              <Search className={`w-10 h-10 ${tabColors.text}`} />
            </div>
            <p className="text-xl font-semibold mb-2">
              No {activeTab} found for "{searchTermFromState}"
            </p>
            <p className="text-sm text-base-content/70">
              Try searching for something else or check a different category.
            </p>
          </div>
        )
      } else {
        return (
          <div className="text-center py-16 animate-fade-in">
            <div className={`inline-flex items-center justify-center p-6 rounded-full ${tabColors.bg} mb-4`}>
              {TABS.find((tab) => tab.key === activeTab)?.icon}
            </div>
            <p className="text-xl font-semibold mb-2">No {activeTab} available</p>
            <p className="text-sm text-base-content/70">There are currently no {activeTab} to display.</p>
          </div>
        )
      }
    }
    const resultsToShow = currentResults.length > 0 ? currentResults : []
    const commonProps = {
      isLoading: isLoading && resultsToShow.length > 0,
      error,
      loadMore,
      hasMore: currentPagination.hasMore,
    }

    switch (activeTab) {
      case "shows":
        return <ShowResults shows={resultsToShow} {...commonProps} />
      case "videos":
        return <VideoResults videos={resultsToShow} {...commonProps} />
      case "products":
        return <ProductResults products={resultsToShow} {...commonProps} />
      case "users":
        return <UserResults users={resultsToShow} {...commonProps} />
      default:
        return null
    }
  }

  // Render tab skeleton loader
  const renderTabSkeletons = () => {
    return (
      <div className="w-full">
        <SkeletonLoader type="tab-item" count={4} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Layout: Sidebar + Results */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
        {/* Left Sidebar - Tabs */}
        <aside className="w-full md:w-48 lg:w-56 flex-shrink-0">
          <div className="sticky top-[88px] z-10">
            {/* Header with back button and search term */}
            <div className="flex items-center mb-6 sticky top-0 z-20 bg-base-100 py-4 -mt-6 border-b border-base-300">
              <button
                onClick={handleGoBack}
                className="btn btn-ghost btn-circle mr-2 hover:bg-base-200 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex-grow">
                <h1 className="text-xl md:text-2xl font-bold">
                  {searchTermFromState ? (
                    <span className="flex items-center">
                      <Search className="w-5 h-5 mr-2 text-primary" />
                      <span className="line-clamp-1">{searchTermFromState}</span>
                    </span>
                  ) : (
                    `All ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
                  )}
                </h1>
                {searchTermFromState && (
                  <p className="text-xs text-base-content/60 mt-1">Showing results across all categories</p>
                )}
              </div>
              {/* Global Loading Indicator */}
              {loadingStates.globalSearchChange && (
                <div className="flex items-center justify-center ml-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Category heading */}
            <h2 className="text-sm font-semibold text-base-content/70 uppercase mb-3 px-2 hidden md:block">
              Categories
            </h2>

            {/* Mobile tabs */}
            <div className="flex md:hidden overflow-x-auto gap-2 pb-3 mb-4 scrollbar-hide">
              {TABS.map((tab) => {
                const category = tab.key
                const count = pagination[category]?.totalCount ?? 0
                const isActive = activeTab === tab.key
                const tabColors = getTabColors(tab.key)

                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                      isActive
                        ? `${tabColors.bg} ${tabColors.text} font-medium shadow-sm`
                        : "bg-base-200 hover:bg-base-300"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/30" : "bg-base-300"}`}
                      >
                        {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Desktop sidebar tabs */}
            {isInitialLoad ? (
              renderTabSkeletons()
            ) : (
              <ul className="menu p-0 md:p-2 rounded-box bg-base-100 md:bg-base-200 hidden md:block">
                {TABS.map((tab) => {
                  const category = tab.key
                  const count = pagination[category]?.totalCount ?? 0
                  const isLoadingTab = loadingStates[category]
                  const hasExistingResults = results[category]?.length > 0
                  const hasMoreResults = pagination[category]?.hasMore
                  const isActive = activeTab === tab.key
                  const tabColors = getTabColors(tab.key)

                  return (
                    <li key={tab.key} className="mb-1">
                      <button
                        onClick={() => handleTabChange(tab.key)}
                        className={`flex items-center gap-3 w-full justify-start text-sm md:text-base rounded-lg transition-all ${
                          isActive
                            ? `${tabColors.bg} ${tabColors.text} font-medium shadow-sm border ${tabColors.border}`
                            : `hover:bg-base-300 ${tabColors.hover}`
                        }`}
                      >
                        <div className={`p-1 rounded-md ${isActive ? "bg-white/50" : ""}`}>{tab.icon}</div>
                        <span>{tab.label}</span>
                        {count > 0 && (
                          <span
                            className={`ml-auto text-xs px-2 py-1 rounded-full ${
                              isActive ? "bg-white/30" : "bg-base-300"
                            }`}
                          >
                            {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                          </span>
                        )}
                        {isLoadingTab && hasExistingResults && hasMoreResults && (
                          <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-grow min-w-0">
          {/* Results header for mobile */}
          <div className="md:hidden mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              {TABS.find((tab) => tab.key === activeTab)?.icon}
              <span className="ml-2">{TABS.find((tab) => tab.key === activeTab)?.label}</span>
              {pagination[activeTab]?.totalCount > 0 && (
                <span className="ml-2 text-sm text-base-content/70">({pagination[activeTab].totalCount})</span>
              )}
            </h2>
          </div>

          {/* Results content */}
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-4">
            {renderResults()}

            {/* Bottom Loader for pagination */}
            {loadingStates[activeTab] && results[activeTab]?.length > 0 && pagination[activeTab]?.hasMore && (
              <div className="py-6">
                <div className="flex gap-4 overflow-hidden">
                  {activeTab === "users" ? (
                    <div className="w-full">
                      <SkeletonLoader type="user" count={1} />
                    </div>
                  ) : (
                    <>
                      <div className="w-1/3">
                        <SkeletonLoader type={activeTab.slice(0, -1)} count={1} />
                      </div>
                      <div className="w-1/3">
                        <SkeletonLoader type={activeTab.slice(0, -1)} count={1} />
                      </div>
                      <div className="w-1/3">
                        <SkeletonLoader type={activeTab.slice(0, -1)} count={1} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Load more button */}
            {!loadingStates[activeTab] && results[activeTab]?.length > 0 && pagination[activeTab]?.hasMore && (
              <div className="text-center mt-6">
                <button onClick={loadMore} className="btn btn-outline btn-primary">
                  Load More {TABS.find((tab) => tab.key === activeTab)?.label}
                </button>
              </div>
            )}

            {/* Error loading more indicator */}
            {errorStates[activeTab] &&
              results[activeTab]?.length > 0 &&
              pagination[activeTab]?.hasMore &&
              !loadingStates[activeTab] && (
                <div className="alert alert-error mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Could not load more {activeTab}. Please try again.</span>
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  )
}

// Add these animations to your CSS
const styles = `
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
`

export default GlobalSearch
