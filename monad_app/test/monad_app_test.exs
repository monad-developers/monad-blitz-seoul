defmodule MonadAppTest do
  use ExUnit.Case
  doctest MonadApp

  test "greets the world" do
    assert MonadApp.hello() == :world
  end
end
