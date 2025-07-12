defmodule MonadApp.Repo do
  use Ecto.Repo,
    otp_app: :monad_app,
    adapter: Ecto.Adapters.Postgres
end
