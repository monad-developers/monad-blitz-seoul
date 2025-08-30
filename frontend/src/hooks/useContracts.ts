import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { readContract } from 'wagmi/actions';
import { config } from '@/lib/wagmi';
import { useState, useEffect } from 'react';
import {
  CONTRACT_ADDRESSES,
  MONADAO_ABI,
  MOCK_USDT_ABI,
  type Task,
  type Participant,
} from '@/lib/contracts';

export function useMonaDAO() {
  const { address } = useAccount();

  const { data: taskCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.MONADAO,
    abi: MONADAO_ABI,
    functionName: 'taskCounter',
  });

  const { writeContract, isPending } = useWriteContract();

  const createTask = async (
    title: string,
    description: string,
    participationFee: string,
    maxParticipants: number,
    deadline: Date
  ) => {
    const feeInUsdt = parseUnits(participationFee, 6);
    const deadlineTimestamp = BigInt(Math.floor(deadline.getTime() / 1000));

    return writeContract({
      address: CONTRACT_ADDRESSES.MONADAO,
      abi: MONADAO_ABI,
      functionName: 'createTask',
      args: [
        title,
        description,
        feeInUsdt,
        BigInt(maxParticipants),
        deadlineTimestamp,
      ],
    });
  };

  const joinTask = async (taskId: number) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.MONADAO,
      abi: MONADAO_ABI,
      functionName: 'joinTask',
      args: [BigInt(taskId)],
    });
  };

  const submitTask = async (taskId: number) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.MONADAO,
      abi: MONADAO_ABI,
      functionName: 'submitTask',
      args: [BigInt(taskId)],
    });
  };

  const vote = async (taskId: number, approved: boolean) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.MONADAO,
      abi: MONADAO_ABI,
      functionName: 'vote',
      args: [BigInt(taskId), approved],
    });
  };

  return {
    taskCounter: taskCounter ? Number(taskCounter) : 0,
    createTask,
    joinTask,
    submitTask,
    vote,
    isPending,
  };
}

export function useTask(taskId: number) {
  const { data: task } = useReadContract({
    address: CONTRACT_ADDRESSES.MONADAO,
    abi: MONADAO_ABI,
    functionName: 'getTask',
    args: [BigInt(taskId)],
  });

  return task
    ? {
        id: Number(task.id),
        title: task.title,
        description: task.description,
        participationFee: formatUnits(task.participationFee, 6),
        maxParticipants: Number(task.maxParticipants),
        currentParticipants: Number(task.currentParticipants),
        deadline: new Date(Number(task.deadline) * 1000),
        status: task.status,
        creator: task.creator,
        totalReward: formatUnits(task.totalReward, 6),
        successReward: formatUnits(task.successReward, 6),
        failurePenalty: formatUnits(task.failurePenalty, 6),
      }
    : null;
}

export function useParticipant(taskId: number, userAddress?: string) {
  const { address } = useAccount();
  const participantAddress = userAddress || address;

  const { data: participant } = useReadContract({
    address: CONTRACT_ADDRESSES.MONADAO,
    abi: MONADAO_ABI,
    functionName: 'getParticipant',
    args: [BigInt(taskId), participantAddress as `0x${string}`],
    query: {
      enabled: !!participantAddress,
    },
  });

  return participant;
}

export function useParticipantList(taskId: number) {
  const { data: participants } = useReadContract({
    address: CONTRACT_ADDRESSES.MONADAO,
    abi: MONADAO_ABI,
    functionName: 'getParticipantList',
    args: [BigInt(taskId)],
  });

  return participants || [];
}

export function useUSDTBalance() {
  const { address } = useAccount();

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDT,
    abi: MOCK_USDT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  return balance ? formatUnits(balance, 6) : '0';
}

export function useUSDTApproval() {
  const { address } = useAccount();

  const { data: allowance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_USDT,
    abi: MOCK_USDT_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, CONTRACT_ADDRESSES.MONADAO],
    query: {
      enabled: !!address,
    },
  });

  const { writeContract, isPending } = useWriteContract();

  const approve = async (amount: string) => {
    const amountInUsdt = parseUnits(amount, 6);
    return writeContract({
      address: CONTRACT_ADDRESSES.MOCK_USDT,
      abi: MOCK_USDT_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.MONADAO, amountInUsdt],
    });
  };

  return {
    allowance: allowance ? formatUnits(allowance, 6) : '0',
    approve,
    isPending,
  };
}

export function useVote(taskId: number) {
  const { address } = useAccount();

  const { data: vote } = useReadContract({
    address: CONTRACT_ADDRESSES.MONADAO,
    abi: MONADAO_ABI,
    functionName: 'getVote',
    args: [BigInt(taskId), address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  const { data: totalVotes } = useReadContract({
    address: CONTRACT_ADDRESSES.MONADAO,
    abi: MONADAO_ABI,
    functionName: 'totalVotes',
    args: [BigInt(taskId)],
  });

  const { data: approvedVotes } = useReadContract({
    address: CONTRACT_ADDRESSES.MONADAO,
    abi: MONADAO_ABI,
    functionName: 'approvedVotes',
    args: [BigInt(taskId)],
  });

  return {
    myVote: vote && vote.timestamp > 0 ? vote : null,
    totalVotes: totalVotes ? Number(totalVotes) : 0,
    approvedVotes: approvedVotes ? Number(approvedVotes) : 0,
    rejectedVotes:
      totalVotes && approvedVotes ? Number(totalVotes - approvedVotes) : 0,
  };
}

export function useAllTasks() {
  const { data: taskCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.MONADAO,
    abi: MONADAO_ABI,
    functionName: 'taskCounter',
  });

  // We'll use a simpler approach that doesn't violate hooks rules
  // by using the taskCounter directly to determine what to fetch
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !taskCounter) return;

    const fetchTasks = async () => {
      const taskList = [];
      const count = Number(taskCounter);

      for (let i = 1; i <= count; i++) {
        try {
          // Note: This is a simplified approach. In a real app, you'd want to use
          // a more sophisticated data fetching strategy
          const taskData = await readContract(config, {
            address: CONTRACT_ADDRESSES.MONADAO,
            abi: MONADAO_ABI,
            functionName: 'getTask',
            args: [BigInt(i)],
          });

          if (taskData) {
            taskList.push({
              id: Number(taskData.id),
              title: taskData.title,
              description: taskData.description,
              participationFee: formatUnits(taskData.participationFee, 6),
              maxParticipants: Number(taskData.maxParticipants),
              currentParticipants: Number(taskData.currentParticipants),
              deadline: new Date(Number(taskData.deadline) * 1000),
              status: taskData.status,
              creator: taskData.creator,
              totalReward: formatUnits(taskData.totalReward, 6),
              successReward: formatUnits(taskData.successReward, 6),
              failurePenalty: formatUnits(taskData.failurePenalty, 6),
            });
          }
        } catch (error) {
          console.error(`Failed to fetch task ${i}:`, error);
        }
      }

      setTasks(taskList);
    };

    fetchTasks();
  }, [taskCounter]);

  return tasks;
}

export function useMyTasks() {
  const { address } = useAccount();
  const allTasks = useAllTasks();
  const [myTasks, setMyTasks] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !address || !allTasks.length) return;

    const fetchMyTasks = async () => {
      const userTasks = [];

      for (const task of allTasks) {
        if (!task) continue;

        try {
          const participant = await readContract(config, {
            address: CONTRACT_ADDRESSES.MONADAO,
            abi: MONADAO_ABI,
            functionName: 'getParticipant',
            args: [BigInt(task.id), address as `0x${string}`],
          });

          if (participant?.isActive) {
            userTasks.push({
              ...task,
              participant,
              mySubmissions: participant.hasSubmitted ? 1 : 0,
              requiredSubmissions: 1,
              progress: participant.hasSubmitted ? 100 : 0,
              result:
                task.status === 3
                  ? 'success'
                  : task.status === 4
                    ? 'failed'
                    : 'pending',
              reward: task.status === 3 ? parseFloat(task.successReward) : 0,
              daysLeft: Math.max(
                0,
                Math.floor(
                  (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
              ),
              endDate: task.deadline.toISOString().split('T')[0],
              category: 'Challenge',
              successRate: 80,
              entryFee: parseFloat(task.participationFee),
            });
          }
        } catch (error) {
          console.error(
            `Failed to fetch participant for task ${task.id}:`,
            error
          );
        }
      }

      setMyTasks(userTasks);
    };

    fetchMyTasks();
  }, [address, allTasks]);

  return myTasks;
}

export function usePendingReviews() {
  const allTasks = useAllTasks();

  const pendingReviews = allTasks.filter(
    task => task && task.status === 2 // UnderReview status
  );

  return pendingReviews;
}

export function useDAOStats() {
  const allTasks = useAllTasks();

  const daoMap = new Map();

  allTasks.forEach(task => {
    if (!task) return;

    const creator = task.creator;
    if (!daoMap.has(creator)) {
      daoMap.set(creator, {
        id: creator,
        name: `DAO ${creator.slice(0, 6)}...${creator.slice(-4)}`,
        creator,
        description: 'Challenge-based DAO for community building and rewards',
        category: 'Community',
        totalChallenges: 0,
        activeChallenges: 0,
        completedChallenges: 0,
        totalParticipants: 0,
        totalRewards: 0,
        successfulChallenges: 0,
      });
    }

    const dao = daoMap.get(creator);
    dao.totalChallenges++;
    dao.totalParticipants += task.currentParticipants;
    dao.totalRewards += parseFloat(task.totalReward);

    if (task.status === 0 || task.status === 1) dao.activeChallenges++;
    if (task.status === 3 || task.status === 4) dao.completedChallenges++;
    if (task.status === 3) dao.successfulChallenges++;
  });

  return Array.from(daoMap.values()).map(dao => ({
    ...dao,
    successRate:
      dao.completedChallenges > 0
        ? Math.round((dao.successfulChallenges / dao.completedChallenges) * 100)
        : 0,
    category: 'Community',
    endDate: new Date().toISOString().split('T')[0],
  }));
}
