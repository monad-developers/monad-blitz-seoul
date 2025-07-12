defmodule MonadAppWeb.PageController do
  use MonadAppWeb, :controller

  def home(conn, _params) do
    features = [
      %{
        title: "식사 경매",
        description: "원하는 인연과 함께하는 특별한 식사 경험을 경매로"
      },
      %{
        title: "인연 매칭",
        description: "취향에 맞는 완벽한 인연 매칭 서비스"
      },
      %{
        title: "자산 수준에 맞는 인연 매칭",
        description: "자산 수준에 맞는 인연 매칭 서비스"
      }
    ]

    conn
    |> assign(:page_title, "런치 옥션")
    |> assign_prop(:features, features)
    |> assign_prop(:hero_title, "특별한 만남을 위한")
    |> assign_prop(:hero_highlight, "식사 경매 매칭")
    |> assign_prop(
      :subtitle,
      "원하는 사람과 함께하는 맞춤형 식사 경험의 시작."
    )
    |> assign_prop(
      :subtitle_highlight,
      "최고의 인연과 함께 특별한 시간을 가져보세요"
    )
    |> assign_prop(:cta_primary, "경매 참여하기")
    |> render_inertia("HomePage")
  end
end
