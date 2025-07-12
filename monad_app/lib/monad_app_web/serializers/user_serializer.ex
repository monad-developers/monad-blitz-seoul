defmodule MonadAppWeb.UserSerializer do
  def to_map(user = %MonadApp.Accounts.User{}) do
    %{
      id: user.id,
      nick_name: user.nick_name,
      email: user.email
    }
  end

  def assign_prop(conn, name, user) do
    Inertia.Controller.assign_prop(conn, name, fn -> user && to_map(user) end)
  end
end
