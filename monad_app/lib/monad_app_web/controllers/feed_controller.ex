defmodule MonadAppWeb.FeedController do
  use MonadAppWeb, :controller

  def index(conn, _params) do
    conn
    |> assign(:page_title, "피드 조회")
    |> render_inertia("FeedPage")
  end
end
