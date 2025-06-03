import { MapPin, Phone, User, CheckCircle, ArrowLeft, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { backendurl, socketurl } from "../../../config";
import { useAuth } from "../../context/AuthContext";

export const AddressSelection = ({ selectedAddress, onSelectAddress, onNext, onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    alternateMobile: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const userData = user;

  const fetchAddressesByUserId = async (userId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${socketurl}/api/address/${userId}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? "User not found" : "Failed to fetch addresses");
      }

      const result = await response.json();
      setAddresses(result.status && result.data ? result.data : []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?._id) fetchAddressesByUserId(userData._id);
  }, [userData?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${socketurl}/api/address/${userData._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add address");

      setShowModal(false);
      setFormData({
        name: "",
        mobile: "",
        alternateMobile: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
      });

      await fetchAddressesByUserId(userData._id);
    } catch (error) {
      console.error("Address submission error:", error);
      alert("Error saving address. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!userData?._id) {
    return (
      <div className="p-7 bg-stone-900 text-yellow-400 text-center">
        User not authenticated. Please log in.
      </div>
    );
  }

  return (
    <div className="p-7  rounded-xl text-white">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center mb-4 gap-2">
          <button className="btn btn-ghost rounded-full" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-yellow-400">Select Delivery Address</h2>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full mb-4 py-2 rounded-xl bg-amber-200 text-black hover:bg-yellow-600 transition font-semibold shadow flex justify-center items-center gap-2"
        >
          <Plus size={20} /> Add New Address
        </button>

        {/* Address List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center p-8 text-yellow-200">Loading addresses...</div>
          ) : error ? (
            <div className="text-red-500 text-sm text-center">Error loading addresses: {error}</div>
          ) : addresses.length === 0 ? (
            <div className="text-center p-8 text-stone-300">No saved addresses found. Add a new address to continue.</div>
          ) : (
            addresses.map((addressItem) => (
              <div
                key={addressItem._id}
                className={`p-4 rounded-xl bg-stone-700 hover:shadow-md transition cursor-pointer border-2 ${
                  selectedAddress?._id === addressItem._id ? "border-yellow-400" : "border-stone-600"
                }`}
                onClick={() => onSelectAddress(addressItem)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User size={16} />
                      <span className="font-semibold">{addressItem.name}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin size={16} />
                      <span>
                        {addressItem.line1}, {addressItem.line2}, {addressItem.city}, {addressItem.state} - {addressItem.pincode}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone size={16} />
                      <span>{addressItem.mobile}</span>
                      {addressItem.alternateMobile && <span>, {addressItem.alternateMobile}</span>}
                    </div>
                  </div>
                  {selectedAddress?._id === addressItem._id && <CheckCircle className="text-yellow-400" />}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!selectedAddress}
          className="w-full mt-6 py-3 rounded-full bg-yellow-400 text-black hover:bg-yellow-600 transition font-bold shadow disabled:opacity-50"
        >
          Confirm Address
        </button>
      </div>

      {/* Modal for New Address */}
      {showModal && (
        <dialog className="modal modal-open">
          <div className="modal-box w-full max-w-2xl bg-stone-900 text-white">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </form>

            <h3 className="text-xl font-bold text-yellow-400 mb-4">Add New Address</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white">Full Name</span>
                  </label>
                  <div className="flex">
                    <span className="bg-yellow-500 px-3 flex items-center rounded-l-xl text-white">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="input w-full bg-stone-700 border-yellow-400 text-white rounded-r-xl"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white">Mobile Number</span>
                  </label>
                  <div className="flex">
                    <span className="bg-yellow-500 px-3 flex items-center rounded-l-xl text-white">
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10-digit mobile"
                      className="input w-full bg-stone-700 border-yellow-400 text-white rounded-r-xl"
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Alternate Mobile */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Alternate Mobile</span>
                </label>
                <div className="flex">
                  <span className="bg-yellow-500 px-3 flex items-center rounded-l-xl text-white">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    name="alternateMobile"
                    value={formData.alternateMobile}
                    onChange={handleChange}
                    className="input w-full bg-stone-700 border-yellow-400 text-white rounded-r-xl"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Address Line 1</span>
                </label>
                <div className="flex">
                  <span className="bg-yellow-500 px-3 flex items-center rounded-l-xl text-white">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="text"
                    name="line1"
                    value={formData.line1}
                    onChange={handleChange}
                    className="input w-full bg-stone-700 border-yellow-400 text-white rounded-r-xl"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-white">Address Line 2</span>
                </label>
                <input
                  type="text"
                  name="line2"
                  value={formData.line2}
                  onChange={handleChange}
                  className="input w-full bg-stone-700 border-yellow-400 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white">City</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input w-full bg-stone-700 border-yellow-400 text-white"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white">State</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input w-full bg-stone-700 border-yellow-400 text-white"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white">Pincode</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="input w-full bg-stone-700 border-yellow-400 text-white"
                    pattern="[0-9]{6}"
                    required
                  />
                </div>
              </div>

              <div className="modal-action flex justify-end gap-3">
                <button type="button" className="btn btn-ghost text-yellow-400" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn border-0 bg-yellow-400 hover:bg-amber-500 text-black font-bold shadow">
                  Save Address
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowModal(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};
