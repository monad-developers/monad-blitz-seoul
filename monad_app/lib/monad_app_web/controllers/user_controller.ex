defmodule MonadAppWeb.UserController do
  use MonadAppWeb, :controller

  def profile(conn, _params) do
    me = %{
      id: "user-1234",
      name: "James Carter",
      nickname: "jcarter",
      email: "james.carter@moname.com",
      password: "supersecret",
      wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
      phone_number: "+1-555-1234",
      gender: "male",
      profile_picture: "https://avatars.githubusercontent.com/u/96886982?v=4",
      introduction: "Hi, I’m James. I love decentralized tech and good food.",
      league: "platinum",
      staked_amount: 150.0,
      sns_links: %{
        instagram: "https://instagram.com/jcarter",
        twitter: "https://twitter.com/jcarter_eth"
      },
      schedule_visibility: "league",
      created_at: ~N[2025-07-01 10:00:00],
      updated_at: ~N[2025-07-10 18:45:00],
      profile: %{
        user_id: "user-1234",
        hobbies: ["Cooking", "Hiking", "Chess"],
        interests: ["Blockchain", "Philosophy", "AI"],
        one_line_intro: "Dreamer. Builder. Degen.",
        portfolio_url: "https://jcarter.dev"
      },
      schedules: [
        %{
          id: "sched-001",
          user_id: "user-1234",
          date: ~D[2025-07-13],
          time_slot: "19:00-21:00",
          region: "Seoul"
        },
        %{
          id: "sched-002",
          user_id: "user-1234",
          date: ~D[2025-07-15],
          time_slot: "20:30-22:00",
          region: "Gangnam"
        }
      ]
    }

    match_requests = [
      %{
        id: "req-001",
        from_user_id: "user-999",
        to_user_id: "user-1234",
        status: "requested",
        requested_at: ~N[2025-07-10 14:00:00],
        responded_at: nil,
        sender_name: "Alice Kim",
        sender_nickname: "alicek",
        sender_profile_picture: "https://source.unsplash.com/random/100x100?woman,face,1",
        preferred_date: "2025-07-14",
        time_slot: "18:00-19:30",
        region: "Seoul",
        message: "Let's spar before the next league!",
        highest_bid_amount: 2.5,
        highest_bid_currency: "ETH"
      },
      %{
        id: "req-002",
        from_user_id: "user-888",
        to_user_id: "user-1234",
        status: "requested",
        requested_at: ~N[2025-07-11 09:30:00],
        responded_at: nil,
        sender_name: "Bob Lee",
        sender_nickname: "boblee",
        sender_profile_picture: "https://source.unsplash.com/random/100x100?man,face,2",
        preferred_date: "2025-07-16",
        time_slot: "21:00-22:00",
        region: "Busan",
        message: nil,
        highest_bid_amount: 1.8,
        highest_bid_currency: "ETH"
      },
      %{
        id: "req-003",
        from_user_id: "user-777",
        to_user_id: "user-1234",
        status: "requested",
        requested_at: ~N[2025-07-12 17:45:00],
        responded_at: nil,
        sender_name: "Sara Yoon",
        sender_nickname: "saray",
        sender_profile_picture: "https://source.unsplash.com/random/100x100?woman,face,3",
        preferred_date: "2025-07-18",
        time_slot: "20:00-21:30",
        region: "Gangnam",
        message: "Hope we can match this week 🙌",
        highest_bid_amount: 3.2,
        highest_bid_currency: "ETH"
      }
    ]

    conn
    |> assign(:page_title, "예약")
    |> assign_prop(:me, me)
    |> assign_prop(:match_requests, match_requests)
    |> render_inertia("ProfilePage")
  end
end
