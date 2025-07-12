defmodule MonadAppWeb.AuthPlug do
  use MonadAppWeb, :verified_routes
  alias MonadAppWeb.UserSerializer

  def init(mode) when is_atom(mode) do
    [mode: mode]
  end

  def call(conn, opts) do
    case Keyword.get(opts, :mode, :user_required) do
      :user_required ->
        if !conn.assigns[:current_user],
          do:
            conn
            |> Phoenix.Controller.redirect(to: Keyword.get(opts, :to, ~p"/login"))
            |> Plug.Conn.halt(),
          else: conn |> assign_user_prop()

      :user_optional ->
        if conn.assigns[:current_user],
          do: conn |> assign_user_prop(),
          else: Plug.Conn.assign(conn, :current_user, nil)

      :no_user ->
        if(conn.assigns[:current_user],
          do:
            conn
            |> assign_user_prop()
            |> Phoenix.Controller.redirect(to: Keyword.get(opts, :to, ~p"/"))
            |> Plug.Conn.halt(),
          else: conn
        )
    end
  end

  defp assign_user_prop(conn) do
    conn
    |> UserSerializer.assign_prop(:user, conn.assigns.current_user)
  end
end
