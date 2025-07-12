import React, { useState, useRef, useEffect } from "react";
import { Head } from "@inertiajs/react";
import {
  Heart,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Calendar,
} from "lucide-react";
import Layout from "../components/layouts";

interface LunchAvailability {
  day: string;
  times: string[];
  locations: string[];
}

interface UserProfile {
  id: number;
  name: string;
  age: number;
  location: string;
  occupation: string;
  education: string;
  bio: string;
  photo: string;
  interests: string[];
  lunchAvailability: LunchAvailability[];
}

const mockProfiles: UserProfile[] = [
  {
    id: 1,
    name: "김민지",
    age: 26,
    location: "서울, 강남구",
    occupation: "UX 디자이너",
    education: "홍익대학교",
    bio: "새로운 사람들과의 만남을 좋아하고, 디자인과 예술에 관심이 많아요. 주말에는 갤러리나 카페 투어를 즐깁니다.",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=700&fit=crop",
    interests: ["디자인", "여행", "카페", "영화", "전시회"],
    lunchAvailability: [
      {
        day: "월요일",
        times: ["12:00-13:00", "13:00-14:00"],
        locations: ["강남역", "신논현역"],
      },
      {
        day: "수요일",
        times: ["12:30-13:30"],
        locations: ["강남역"],
      },
    ],
  },
  {
    id: 2,
    name: "박성훈",
    age: 29,
    location: "서울, 마포구",
    occupation: "소프트웨어 엔지니어",
    education: "연세대학교",
    bio: "기술과 혁신을 사랑하는 개발자입니다. 운동을 좋아하고 새로운 도전을 즐깁니다.",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=700&fit=crop",
    interests: ["프로그래밍", "헬스", "게임", "독서", "요리"],
    lunchAvailability: [
      {
        day: "화요일",
        times: ["12:00-13:00"],
        locations: ["홍대입구역", "합정역"],
      },
      {
        day: "목요일",
        times: ["12:30-13:30", "13:30-14:30"],
        locations: ["홍대입구역"],
      },
    ],
  },
  {
    id: 3,
    name: "이서연",
    age: 24,
    location: "서울, 홍대",
    occupation: "마케터",
    education: "이화여자대학교",
    bio: "창의적인 아이디어로 브랜드를 만들어가는 일을 하고 있어요. 음악과 춤을 사랑합니다!",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=700&fit=crop",
    interests: ["마케팅", "음악", "춤", "패션", "맛집"],
    lunchAvailability: [
      {
        day: "월요일",
        times: ["12:00-13:00"],
        locations: ["홍대입구역", "상수역"],
      },
      {
        day: "금요일",
        times: ["12:30-13:30"],
        locations: ["홍대입구역"],
      },
    ],
  },
  {
    id: 4,
    name: "정현우",
    age: 28,
    location: "서울, 송파구",
    occupation: "의사",
    education: "서울대학교",
    bio: "환자를 치료하는 일에 보람을 느끼며, 여가 시간에는 등산과 독서를 즐깁니다.",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=700&fit=crop",
    interests: ["의학", "등산", "독서", "클래식", "와인"],
    lunchAvailability: [
      {
        day: "수요일",
        times: ["13:00-14:00"],
        locations: ["잠실역", "송파구청역"],
      },
    ],
  },
  {
    id: 5,
    name: "최유나",
    age: 25,
    location: "서울, 성북구",
    occupation: "교사",
    education: "서울교육대학교",
    bio: "아이들과 함께하는 시간이 가장 행복해요. 피아노 연주와 요가를 좋아합니다.",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=700&fit=crop",
    interests: ["교육", "피아노", "요가", "베이킹", "봉사활동"],
    lunchAvailability: [
      {
        day: "화요일",
        times: ["12:00-13:00"],
        locations: ["성신여대입구역", "한성대입구역"],
      },
      {
        day: "목요일",
        times: ["12:30-13:30"],
        locations: ["성신여대입구역"],
      },
    ],
  },
  {
    id: 6,
    name: "장민수",
    age: 31,
    location: "서울, 용산구",
    occupation: "건축가",
    education: "건국대학교",
    bio: "도시의 아름다운 공간을 만드는 일을 하고 있습니다. 사진 촬영과 여행을 즐깁니다.",
    photo:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=700&fit=crop",
    interests: ["건축", "사진", "여행", "커피", "미술"],
    lunchAvailability: [
      {
        day: "월요일",
        times: ["12:30-13:30"],
        locations: ["용산역", "노량진역"],
      },
      {
        day: "금요일",
        times: ["12:00-13:00", "13:00-14:00"],
        locations: ["용산역"],
      },
    ],
  },
  {
    id: 7,
    name: "한소영",
    age: 27,
    location: "서울, 서초구",
    occupation: "변호사",
    education: "고려대학교",
    bio: "정의로운 세상을 만들기 위해 노력하고 있어요. 테니스와 와인 테이스팅이 취미입니다.",
    photo:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=700&fit=crop",
    interests: ["법률", "테니스", "와인", "독서", "클래식"],
    lunchAvailability: [
      {
        day: "수요일",
        times: ["12:00-13:00"],
        locations: ["교대역", "서초역"],
      },
      {
        day: "금요일",
        times: ["12:30-13:30"],
        locations: ["강남역", "교대역"],
      },
    ],
  },
  {
    id: 8,
    name: "김태호",
    age: 30,
    location: "서울, 강북구",
    occupation: "요리사",
    education: "르꼬르동블루",
    bio: "맛있는 음식으로 사람들을 행복하게 만드는 것이 제 꿈입니다. 새로운 레시피 개발을 즐깁니다.",
    photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=700&fit=crop",
    interests: ["요리", "맛집탐방", "와인", "여행", "운동"],
    lunchAvailability: [
      {
        day: "화요일",
        times: ["12:00-13:00", "13:00-14:00"],
        locations: ["수유역", "미아역"],
      },
      {
        day: "목요일",
        times: ["12:30-13:30"],
        locations: ["수유역"],
      },
    ],
  },
  {
    id: 9,
    name: "이지영",
    age: 23,
    location: "서울, 동작구",
    occupation: "대학생",
    education: "중앙대학교",
    bio: "심리학을 전공하며 사람들의 마음을 이해하는 공부를 하고 있어요. 카페 투어와 영화 감상을 좋아합니다.",
    photo:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=700&fit=crop",
    interests: ["심리학", "영화", "카페", "독서", "음악"],
    lunchAvailability: [
      {
        day: "월요일",
        times: ["12:30-13:30"],
        locations: ["사당역", "이수역"],
      },
      {
        day: "수요일",
        times: ["12:00-13:00"],
        locations: ["사당역"],
      },
    ],
  },
  {
    id: 10,
    name: "조성민",
    age: 32,
    location: "서울, 노원구",
    occupation: "데이터 사이언티스트",
    education: "KAIST",
    bio: "데이터로 세상을 분석하고 예측하는 일을 합니다. 머신러닝과 통계에 관심이 많아요.",
    photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&h=700&fit=crop",
    interests: ["데이터분석", "AI", "수학", "보드게임", "하이킹"],
    lunchAvailability: [
      {
        day: "화요일",
        times: ["12:00-13:00"],
        locations: ["중계역", "노원역"],
      },
      {
        day: "금요일",
        times: ["12:30-13:30", "13:30-14:30"],
        locations: ["노원역"],
      },
    ],
  },
];

export default function FeedPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>(mockProfiles);
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(
    mockProfiles[0],
  );
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidHistory, setBidHistory] = useState<
    { amount: number; time: string }[]
  >([]);

  const handleBid = () => {
    const amount = parseFloat(bidAmount);
    if (amount > currentBid && amount > 0) {
      setCurrentBid(amount);
      setBidHistory((prev) => [
        ...prev,
        {
          amount,
          time: new Date().toLocaleTimeString(),
        },
      ]);
      setBidAmount("");
    }
  };

  const nextProfile = () => {
    const currentIndex = profiles.findIndex((p) => p.id === currentProfile.id);
    const nextIndex = (currentIndex + 1) % profiles.length;
    setCurrentProfile(profiles[nextIndex]);
    setCurrentBid(0);
    setBidHistory([]);
  };

  const resetAuction = () => {
    setCurrentBid(0);
    setBidHistory([]);
    setBidAmount("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-pink-800 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ height: "600px" }}
          >
            {/* Photo Section */}
            <div className="relative h-3/5">
              <img
                src={currentProfile.photo}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Profile Info */}
            <div className="p-4 h-2/5">
              <div className="mb-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentProfile.name}, {currentProfile.age}
                </h2>
              </div>

              <div className="space-y-1 mb-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="text-xs">{currentProfile.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Briefcase className="w-3 h-3 mr-1" />
                  <span className="text-xs">{currentProfile.occupation}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  <span className="text-xs">{currentProfile.education}</span>
                </div>
              </div>

              <p className="text-gray-700 text-xs mb-3 leading-relaxed line-clamp-2">
                {currentProfile.bio}
              </p>

              <div className="flex flex-wrap gap-1">
                {currentProfile.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
                {currentProfile.interests.length > 3 && (
                  <span className="text-gray-500 text-xs">
                    +{currentProfile.interests.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lunch Availability Panel */}
          <div
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            style={{ height: "600px" }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              점심 가능 시간
            </h2>

            <div
              className="space-y-4 overflow-y-auto"
              style={{ maxHeight: "520px" }}
            >
              {currentProfile.lunchAvailability.map((lunch, index) => (
                <div
                  key={index}
                  className="bg-white/10 rounded-lg p-4 border border-white/20"
                >
                  <div className="font-semibold text-white mb-3 text-lg">
                    {lunch.day}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-white/90">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">시간</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {lunch.times.map((time, timeIndex) => (
                        <div
                          key={timeIndex}
                          className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-lg text-sm"
                        >
                          {time}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center text-white/90 mt-3">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">위치</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {lunch.locations.map((location, locIndex) => (
                        <div
                          key={locIndex}
                          className="bg-green-500/20 text-green-200 px-3 py-1 rounded-lg text-sm"
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auction Panel */}
          <div
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            style={{ height: "600px" }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">경매</h2>

            {/* Current Highest Bid */}
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
              <div className="text-green-300 text-sm font-medium mb-1">
                현재 최고가
              </div>
              <div className="text-3xl font-bold text-white">
                {currentBid > 0
                  ? `$${currentBid.toLocaleString()}`
                  : "아직 입찰이 없습니다"}
              </div>
            </div>

            {/* Bid Input */}
            <div className="mb-6">
              <label className="text-white text-sm font-medium mb-2 block">
                입찰 금액
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="금액을 입력하세요"
                    className="w-full pl-8 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={currentBid + 1}
                  />
                </div>
                <button
                  onClick={handleBid}
                  disabled={!bidAmount || parseFloat(bidAmount) <= currentBid}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  입찰
                </button>
              </div>
              {bidAmount && parseFloat(bidAmount) <= currentBid && (
                <p className="text-red-400 text-sm mt-1">
                  현재 최고가보다 높게 입찰해야 합니다
                </p>
              )}
            </div>

            {/* Bid History */}
            <div className="mb-6">
              <h3 className="text-white text-lg font-semibold mb-3">
                입찰 기록
              </h3>
              <div className="bg-white/5 rounded-lg p-3" style={{ maxHeight: "120px", overflowY: "auto" }}>
                {bidHistory.length > 0 ? (
                  <div className="space-y-2">
                    {bidHistory
                      .slice()
                      .reverse()
                      .map((bid, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-white">
                            ${bid.amount.toLocaleString()}
                          </span>
                          <span className="text-gray-400">{bid.time}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">아직 입찰이 없습니다</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={nextProfile}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                다음 프로필
              </button>
              <button
                onClick={resetAuction}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                경매 초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
