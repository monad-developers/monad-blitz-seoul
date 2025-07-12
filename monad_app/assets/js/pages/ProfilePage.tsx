import React, { useState, useEffect } from "react";
import { Link, usePage, useForm } from "@inertiajs/react";
import { ethers } from "ethers";
interface MatchRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  sender_name: string;
  sender_nickname: string;
  sender_profile_picture: string;
  preferred_date: string;
  time_slot: string;
  region: string;
  message?: string;
  highest_bid_amount?: number;
  highest_bid_currency?: string;
}

interface Profile {
  user_id: string;
  hobbies: string[];
  interests: string[];
  one_line_intro: string;
  portfolio_url?: string;
}

interface Schedule {
  id: string;
  user_id: string;
  date: string;
  time_slot: string;
  region: string;
}

interface Me {
  id: string;
  name: string;
  nickname: string;
  email: string;
  password: string;
  wallet_address: string;
  phone_number: string;
  league: string;
  gender: string;
  profile_picture: string;
  introduction: string;
  staked_amount: number;
  sns_links: {
    instagram?: string;
    twitter?: string;
  };
  schedule_visibility: string;
  created_at: string;
  updated_at: string;
  profile: Profile;
  schedules: Schedule[];
}

interface SchedulePageProps {
  me: Me;
  match_requests: MatchRequest[];
}

const ProfilePage = ({ me, match_requests }: SchedulePageProps) => {
  const [showModal, setShowModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    region: "",
    currency: "ETH",
    amount: "",
  });
  const { props } = usePage();
  const user = props.user;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);

        setWalletAddress(address);
        setBalance(ethers.formatEther(balance));
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      connectWallet();
    }
  }, []);

  const handleCreateSchedule = async () => {
    const payload = {
      user_id: me.id,
      date: form.date,
      time_slot: form.time,
      region: form.region,
      currency: form.currency,
      amount: parseFloat(form.amount),
    };

    console.log(me);
    console.log("POST /api/schedule", payload);

    setShowModal(false);
  };

  const handleMatchAction = async (requestId: string, accept: boolean) => {
    console.log(
      `${accept ? "Accepting" : "Denying"} match request:`,
      requestId,
    );
    // TODO: API call to handle match request
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-pink-800 text-white p-8 relative">
      {/* Profile Picture + Intro */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={me.profile_picture}
          alt="Profile"
          className="w-28 h-28 rounded-full border-4 border-pink-400 shadow-lg mb-2"
        />
        <h2 className="text-xl font-bold">{user.nick_name}</h2>
        <p className="text-pink-300 italic mt-1">{me.profile.one_line_intro}</p>
        <div className="text-purple-300 mt-2">
          <p>
            <strong>MetaMask:</strong>{" "}
            {isConnected ? walletAddress : "Not connected"}
          </p>
          <p>
            <strong>Balance:</strong>{" "}
            {isConnected ? `${parseFloat(balance).toFixed(4)} ETH` : "--"}
          </p>
          {!isConnected && (
            <button
              onClick={connectWallet}
              className="mt-2 px-3 py-1 bg-blue-500 rounded hover:bg-blue-600 transition text-sm"
            >
              Connect MetaMask
            </button>
          )}
        </div>
      </div>

      {/* ✅ Match Requests Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">📝 Match Requests</h2>
        {match_requests.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {match_requests.map((req) => (
              <div
                key={req.id}
                className="bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md hover:bg-white/15 transition"
              >
                <div className="flex items-center gap-4 mb-3">
                  <img
                    src={req.sender_profile_picture}
                    alt={req.sender_name}
                    className="w-14 h-14 rounded-full border-2 border-pink-400 shadow-md object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjgiIGN5PSIyOCIgcj0iMjgiIGZpbGw9IiM5MzM5RkYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxNiIgeT0iMTYiPgo8cGF0aCBkPSJNMTIgMTJDMTQuNDg1MyAxMiAxNi41IDkuOTg1MjggMTYuNSA3LjVDMTYuNSA1LjAxNDcyIDE0LjQ4NTMgMyAxMiAzQzkuNTE0NzIgMyA3LjUgNS4wMTQ3MiA3LjUgNy41QzcuNSA5Ljk4NTI4IDkuNTE0NzIgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTMuNUM4LjEzNDAxIDEzLjUgNSAxNi42MzQgNSAyMC41VjIxSDEyLjVIMTlWMjAuNUMxOSAxNi42MzQgMTUuODY2IDEzLjUgMTIgMTMuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K";
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-pink-200">
                      {req.sender_nickname}
                    </h3>
                    <p className="text-sm text-purple-300">{req.sender_name}</p>
                  </div>
                </div>
                <div className="text-sm text-purple-100 mb-3">
                  <p>📅 {req.preferred_date}</p>
                  <p>🕒 {req.time_slot}</p>
                  <p>📍 {req.region}</p>
                  {req.highest_bid_amount && req.highest_bid_currency && (
                    <p className="mt-2 text-yellow-300 font-semibold">
                      💰 {req.highest_bid_amount} {req.highest_bid_currency}
                    </p>
                  )}
                  {req.message && (
                    <p className="mt-2 text-pink-300 italic">
                      💬 "{req.message}"
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-auto">
                  <button
                    onClick={() => handleMatchAction(req.id, true)}
                    className="px-4 py-1 bg-green-500/80 rounded hover:bg-green-600 transition text-white text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleMatchAction(req.id, false)}
                    className="px-4 py-1 bg-red-500/80 rounded hover:bg-red-600 transition text-white text-sm"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-pink-300">No match requests.</p>
        )}
      </div>

      {/* Schedule Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">📅 Upcoming Schedules</h2>
        {me.schedules.length > 0 ? (
          <ul className="space-y-4">
            {me.schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition"
              >
                <div className="flex justify-between font-semibold text-purple-300">
                  <span>
                    Date: {new Date(schedule.date).toLocaleDateString()}
                  </span>
                  <span>Time: {schedule.time_slot}</span>
                </div>
                <p className="mt-1 text-pink-200 text-sm">
                  Region: {schedule.region}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-pink-300">No schedules available.</p>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition transform duration-200"
        aria-label="Add Schedule"
      >
        ➕ Add Schedule
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-pink-300">
              New Schedule
            </h2>
            <div className="space-y-4">
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              />
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              />
              <input
                type="text"
                name="region"
                placeholder="Region"
                value={form.region}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              />
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              >
                <option value="ETH">ETH</option>
                <option value="SOL">SOL</option>
                <option value="MATIC">MATIC</option>
              </select>
              <input
                type="number"
                name="amount"
                placeholder="Amount to stake"
                value={form.amount}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded hover:from-pink-600 hover:to-purple-700 transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
