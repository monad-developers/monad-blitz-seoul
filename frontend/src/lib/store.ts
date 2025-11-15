import { create } from 'zustand';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface GameStore {
  players: Player[];
  currentUserId: string;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setPlayers: (players: Player[]) => void;
  isHost: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  currentUserId: '1', // 실제로는 사용자 인증에서 가져와야 함

  addPlayer: (player) => set((state) => ({
    players: [...state.players, player]
  })),

  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId)
  })),

  setPlayers: (players) => set({ players }),

  isHost: () => {
    const { players, currentUserId } = get();
    const currentUser = players.find(p => p.id === currentUserId);
    return currentUser?.isHost || false;
  },
}));
