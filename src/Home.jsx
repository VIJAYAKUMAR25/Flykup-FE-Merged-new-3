import { Routes, Route, Navigate } from "react-router-dom"
import Profile from "./components/main/Profile.jsx"
import SellerMain from "./components/main/SellerMain.jsx"
import MainFeed from "./components/main/MainFeed.jsx"
import LiveStreamForm from "./components/reuse/LiveStream/LiveStreamForm.jsx"
import ViewSheduledShows from "./components/reuse/LiveStream/ViewSheduledShows.jsx"
import LiveStreamProductForm from "./components/reuse/SellerListing&Stocks/LiveStreamProductForm.jsx"
import ProductListing from "./components/reuse/SellerListing&Stocks/ProductListing.jsx"
import EditProductListing from "./components/reuse/SellerListing&Stocks/EditProductListing.jsx"
import ProductTab from "./components/reuse/LiveStream/ProductTab4Shows.jsx"
import EditTaggedProducts from './components/reuse/LiveStream/EditTaggedProducts.jsx'
import SellerProtectedPage from "./SellerProtectedPage.jsx"
import SellerFormNew from './components/reuse/SellerForm/SellerForm.jsx';
import SocialSeller from './components/reuse/SellerForm/SocialSeller.jsx';
import BrandSeller from './components/reuse/SellerForm/BrandSeller.jsx';
import ReapplySellerFormNew from './components/reuse/SellerForm/ReapplySellerForm.jsx';
import ReapplySocialSeller from './components/reuse/SellerForm/ReapplySocial.jsx';
import ReapplyBrandSeller from './components/reuse/SellerForm/ReapplyBrand.jsx';
import { useNavigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext.jsx"
import { useEffect } from "react"
import Shows from "./components/shows/Shows.jsx"
import ShowDetailsPage from "./components/shows/ShowDetailsPage.jsx"
import ShowDetailsSeller from "./components/shows/ShowDetailsSeller.jsx"
import Feed from "./components/reels/pages/Feed.jsx"
import Dashboard from "./components/giveaway/pages/Dashboard.jsx"
import ShopableForm from "./components/reuse/ShopableVideos/ShopableForm.jsx"
import ViewShopable from "./components/reuse/ShopableVideos/ViewShoapable.jsx"
import ShopableVideoDetail from "./components/reuse/ShopableVideos/ShopableVideoDetail.jsx"
import ShowsFeed from "./components/shows/ShowsFeed.jsx"
import ShoppingTabsLayout from "./components/profile/UserEntryPage.jsx"
import SellerProfile from "./components/profile/SellerProfile.jsx"
import SellerOrdersPage from "./components/profile/SellerOrdersPage.jsx"
import UserSideSellerProfile from "./components/profile/userSideSellerView.jsx"
import UserSellerProfile from "./components/profile/userSideSellerView.jsx"
import MyProfile from "./components/profile/MyProfile.jsx"
import SellerProfileDummy from "./components/profile/sellerDashboardDummy.jsx"
import { AddressSelection } from "./components/shows/AddressSelection.jsx"
import ProductsPage from "./components/products/ProductsPage.jsx"
import Checkout from "./components/products/Checkout.jsx"
import { CartProvider } from "./context/CartContext.jsx"
import UserOrders from "./components/orders/UserOrders.jsx"
import UserProfile from "./components/ProfileComponents/UserProfile.jsx"
import ShipperProtectedPage from "./ShipperProtectedPage.jsx"
import ShipperPage from "./components/shipper/ShipperPage.jsx"
import ShipperMain from "./components/main/ShipperMain.jsx"
import ShipperLiveStreamForm from "./components/shipper/LiveStream/ShipperLiveStreamForm.jsx"
import ShipperViewSheduledShows from "./components/shipper/LiveStream/ShipperViewSheduledShows.jsx"
import ShipperEditTaggedProducts from "./components/shipper/LiveStream/ShipperEditTaggedProducts.jsx"
import ShowDetailsShipper from "./components/shows/ShowDetailsShipper.jsx"
import GlobalSearch from "./components/globalSearch/GlobalSearch.jsx"
import ShipperShopableForm from "./components/shipper/ShopableVideos/ShipperShopableForm.jsx"
import ShipperViewShopable from "./components/shipper/ShopableVideos/ShipperViewShoapable.jsx"
import ShipperShoppableVideoDetail from "./components/shipper/ShopableVideos/ShipperShopableVideoDetail.jsx"
import StartStream from "./components/reuse/LiveStream/StartStream.jsx"
import ViewLiveStream from "./components/reuse/LiveStream/ViewLiveStream.jsx"
import EditShopableForm from "./components/reuse/ShopableVideos/EditShopableForm.jsx"
import CohostStream from "./components/reuse/LiveStream/CohostStream.jsx"
import UserVerificationFlow from "./components/reuse/auth/VerifiedUserApplication.jsx"
import VerifySeller from "./components/reuse/auth/VerifySeller.jsx"


const Home = ({ inputData, setInputData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();


  useEffect(() => {
    if (user.role === "seller" &&
      !user.filledNewSellerForm) {
      navigate("/profile/reapplyform");
    }
  }, []);
  return (
    <CartProvider user={user}>
      <Routes>
        {/* Redirect Home to Profile */}
        <Route
          path="/*"
          element={
            <Navigate to="/user" replace />
          }
        />

        {/* ================
           User Routes 
           ===================*/}
        <Route
          path="/user/*"
          element={
            <Profile inputData={inputData} setInputData={setInputData} />
          }
        >
          {/* <Route path="" element={<MainFeed />} /> */}
          <Route path="" element={<MainFeed />} />
          {/* <Route path="" element={<GlobalSearch />} /> */}
          <Route path="user/:userName" element={<UserProfile />} />
          <Route path="sellerform" element={<SellerFormNew />} />
          <Route path="social-seller-registration" element={<SocialSeller />} />
          <Route path="brand-seller-registration" element={<BrandSeller />} />

          <Route path="shows" element={<Shows />} />
          <Route path="liveshows" element={<ShowsFeed />} />
          <Route path="show/:id" element={<ShowDetailsPage />} />

          <Route path="reels" element={<Feed />} />
          <Route path="reel/:reelId" element={<Feed />} />
          <Route path="giveaway" element={<Dashboard />} />

          <Route path="product/:productId" element={<ProductsPage />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<UserOrders />} />
          <Route path="stream" element={<ViewLiveStream />} />


          <Route path="verified-user" element={<UserVerificationFlow/>} />
          <Route path="verify-seller" element={<VerifySeller/>} />
          {/*  =====================
            Reapply new form Routes 
            =========================*/}

          <Route path="reapplyform" element={<ReapplySellerFormNew />} />
          <Route path="reapply-social" element={<ReapplySocialSeller />} />
          <Route path="reapply-brand" element={<ReapplyBrandSeller />} />

          <Route path="seller/:id" element={<UserSideSellerProfile />} />
          <Route path="search" element={<GlobalSearch/>} />

        </Route>

        {/* ==================
          Seller Routes 
          ======================*/}
        <Route
          path="/seller/*"
          element={
            <SellerProtectedPage>
              <SellerMain />
            </SellerProtectedPage>
          }
        >
          <Route path="sheduleshow" element={<LiveStreamForm />} />
          <Route path="allshows" element={<ViewSheduledShows />} />
          <Route path="edit-tagged-products" element={<EditTaggedProducts />} />
          <Route path="sellertab" element={<ProductTab />} />
          <Route path="show/:showId" element={<ShowDetailsSeller />} />
          <Route path="stream/:showId" element={<StartStream />} />

          <Route path="createProductListing" element={<LiveStreamProductForm />} />
          <Route path="editProductListing" element={<EditProductListing />} />
          <Route path="productlisting" element={<ProductListing />} />


          {/* shopable video routes */}
          <Route path="shopableform" element={<ShopableForm />} />
          <Route path="shopableform-edit/:videoId" element={<EditShopableForm />} />
          <Route path="viewvideo" element={<ViewShopable />} />
          <Route path="shopable-videos/:id" element={<ShopableVideoDetail />} />

          <Route path="myprofile" element={<SellerProfile />} />
          <Route path="cohost/:id" element={<CohostStream />} />
          {/* Dummy Routes */}

          <Route path="sellerorders" element={<SellerOrdersPage />} />
        </Route>

        {/* ==================
          Dropshipper Routes 
          ======================*/}
        <Route
          path="/shipper/*"
          element={
            <ShipperProtectedPage>
              <ShipperMain />
            </ShipperProtectedPage>
          }
        >
          {/* <Route path="" element={<ShipperPage />} /> */}
          <Route path="" element={<ShipperViewSheduledShows />} />
          <Route path="sheduleshow" element={<ShipperLiveStreamForm />} />
          <Route path="allshows" element={<ShipperViewSheduledShows />} />
          <Route path="edit-tagged-products" element={<ShipperEditTaggedProducts />} />
          <Route path="show/:showId" element={<ShowDetailsShipper />} />
          
          {/* shopable video routes */}
          <Route path="shopableform" element={<ShipperShopableForm />} />
          <Route path="viewvideo" element={<ShipperViewShopable />} />
          <Route path="shopable-videos/:id" element={<ShipperShoppableVideoDetail />} />

        </Route>
      </Routes>
    </CartProvider>

  );
};

export default Home;