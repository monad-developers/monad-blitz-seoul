defmodule MonadAppWeb.Router do
  use MonadAppWeb, :router

  import MonadAppWeb.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {MonadAppWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
    plug Inertia.Plug
  end

  pipeline :authenticated do
    plug MonadAppWeb.AuthPlug, :user_required
  end

  pipeline :unauthenticated do
    plug MonadAppWeb.AuthPlug, :no_user
  end

  pipeline :auth_optional do
    plug MonadAppWeb.AuthPlug, :user_optional
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", MonadAppWeb do
    pipe_through [:browser, :auth_optional]

    get "/", PageController, :home
  end

  scope "/", MonadAppWeb do
    pipe_through [:browser, :authenticated]

    get "/users/profile", UserController, :profile
    get "/feed", FeedController, :index
  end

  scope "/", MonadAppWeb do
    pipe_through [:browser, :unauthenticated]

    get "/register", RegisterController, :index
    post "/register", RegisterController, :register

    get "/login", LoginController, :index
    post "/login", LoginController, :login
  end

  # Other scopes may use custom stacks.
  # scope "/api", MonadAppWeb do
  #   pipe_through :api
  # end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:monad_app, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: MonadAppWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

  ## Authentication routes

  scope "/", MonadAppWeb do
    pipe_through [:browser, :redirect_if_user_is_authenticated]

    post "/users/log_in", UserSessionController, :create
  end

  scope "/", MonadAppWeb do
    pipe_through [:browser, :require_authenticated_user]
  end

  scope "/", MonadAppWeb do
    pipe_through [:browser]

    delete "/users/log_out", UserSessionController, :delete
  end
end
