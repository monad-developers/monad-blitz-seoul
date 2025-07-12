defmodule MonadApp.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      MonadAppWeb.Telemetry,
      MonadApp.Repo,
      {DNSCluster, query: Application.get_env(:monad_app, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: MonadApp.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: MonadApp.Finch},
      # Start a worker by calling: MonadApp.Worker.start_link(arg)
      # {MonadApp.Worker, arg},
      # Start to serve requests, typically the last entry
      MonadAppWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: MonadApp.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    MonadAppWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
