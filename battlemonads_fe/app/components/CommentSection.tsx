'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSupabase } from '../providers/SupabaseProvider';
import { useAccount } from 'wagmi';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useBattleMonads } from '../hooks/useBattleMonads';

interface CommentSectionProps {
  battleId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ battleId }) => {
  const { user, getUserProfile } = useSupabase();
  const { address } = useAccount();
  const { 
    useBattleComments, 
    useCanUserComment, 
    addComment, 
    isPending, 
    MonsterType,
    useTransactionStatus 
  } = useBattleMonads();

  const { data: comments, isLoading, refetch } = useBattleComments(battleId);
  const { data: canComment } = useCanUserComment(battleId, address || '');
  const { data: txReceipt, isSuccess: txSuccess } = useTransactionStatus();

  const [newComment, setNewComment] = useState('');
  const [userProfiles, setUserProfiles] = useState<Record<string, { username?: string; avatar_url?: string }>>({});

  // 트랜잭션이 성공하면 댓글 새로고침
  useEffect(() => {
    if (txSuccess && txReceipt) {
      console.log('Transaction successful, refreshing comments...');
      setTimeout(() => refetch(), 2000);
    }
  }, [txSuccess, txReceipt, refetch]);

  // 댓글이 로드되면 각 유저의 프로필 정보 가져오기
  useEffect(() => {
    const loadUserProfiles = async () => {
      if (!Array.isArray(comments) || comments.length === 0) return;

      const uniqueUsers = [...new Set(comments.map((comment: { user?: string }) => comment?.user).filter(Boolean))];
      const profiles: Record<string, { username?: string; avatar_url?: string }> = {};

      await Promise.all(
        uniqueUsers.map(async (userAddress) => {
          if (userAddress && typeof userAddress === 'string') {
            const profile = await getUserProfile(userAddress);
            if (profile) {
              profiles[userAddress] = profile;
            }
          }
        })
      );

      setUserProfiles(profiles);
    };

    loadUserProfiles();
  }, [comments, getUserProfile]);
  
  const handleSubmit = async () => {
    if (!newComment.trim() || !address) return;
    
    try {
      await addComment(battleId, newComment);
      setNewComment('');
      
      // 댓글 추가 후 3초 뒤에 refetch (트랜잭션이 완료될 시간)
      setTimeout(() => {
        refetch();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-8 bg-[#121619] rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#121619] rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // 데이터가 배열인지 확인하고 안전하게 처리
  console.log('Comments data:', comments, 'Type:', typeof comments);
  
  // comments가 배열이면 객체 형태의 댓글들을 처리하고 최신순 정렬
  let commentList: Array<{
    id: string;
    user: string;
    content: string;
    timestamp: bigint;
    isAttack: boolean;
    attackTarget: number;
  }> = [];
  if (Array.isArray(comments)) {
    commentList = comments
      .filter(comment => comment && typeof comment === 'object' && comment.id)
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp)); // 최신순 정렬 (timestamp 내림차순)
  }
  
  console.log('Filtered comment list (latest first):', commentList);

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Battle Comments</h3>
        <div className="flex gap-2 items-center">
          <Button 
            onClick={() => refetch()} 
            variant="secondary" 
            size="sm"
            disabled={isLoading}
          >
            🔄 {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Badge variant="info" size="sm">
            {commentList.length} comments
          </Badge>
        </div>
      </div>
      
      {/* Comment Input */}
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={canComment ? 'Comment or include "attack" to damage opponent...' : 'Must bet to comment...'}
            className="flex-1 bg-[#121619] border border-[#2A3238] rounded-lg px-4 py-3 text-white placeholder-[#5A6269] focus:outline-none focus:border-[#5AD8CC] text-base"
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={!canComment || !user || !address}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!newComment.trim() || isPending || !canComment || !user || !address} 
            size="lg"
          >
            {isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
        
        {!user && (
          <div className="mt-4 p-4 bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg">
            <p className="text-sm text-[#F87171] font-medium">
              💡 Login with Discord and connect wallet to participate in battle comments
            </p>
          </div>
        )}

        {user && address && !canComment && (
          <div className="mt-4 p-4 bg-[#F7931A]/10 border border-[#F7931A]/30 rounded-lg">
            <p className="text-sm text-[#F7931A] font-medium">
              💡 Place a bet first to unlock commenting
            </p>
          </div>
        )}
      </div>
      
      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {commentList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#8B9299]">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          commentList.map((comment) => {
            // 객체 형태로 직접 접근
            const { id, user, content, timestamp, isAttack, attackTarget } = comment;
            const userProfile = userProfiles[user] || {};
            
            return (
              <div key={String(id)} className="bg-[#121619] rounded-lg p-4 border border-[#2A3238]">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {userProfile.avatar_url && userProfile.avatar_url !== '' ? (
                        <Image 
                          src={userProfile.avatar_url} 
                          alt={userProfile.username || 'User'} 
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#5AD8CC] flex items-center justify-center">
                          <span className="text-xs font-bold text-black">
                            {String(user).slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        {userProfile.username && (
                          <p className="text-sm font-medium text-[#5AD8CC]">{userProfile.username}</p>
                        )}
                        <p className="text-xs font-mono text-[#8B9299]">
                          {String(user).slice(0, 6)}...{String(user).slice(-4)}
                        </p>
                      </div>
                    </div>
                    {isAttack && (
                      <Badge 
                        variant={attackTarget === MonsterType.ETH ? 'eth' : 'btc'} 
                        size="sm"
                      >
                        ⚔️ Attack {attackTarget === MonsterType.ETH ? 'ETH' : 'BTC'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-[#8B9299] font-medium">
                    {formatTime(timestamp)}
                  </span>
                </div>
                
                {isAttack ? (
                  <div className="flex items-center gap-3">
                    <span className="text-base text-[#F87171]">⚔️ {content}</span>
                    <Badge variant="error" size="sm">
                      -1 HP
                    </Badge>
                  </div>
                ) : (
                  <p className="text-base text-[#B8BFC6] leading-relaxed">{content}</p>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-[#2A3238]">
        <div className="flex justify-between items-center text-sm text-[#8B9299]">
          <span>💡 Include &quot;attack&quot; in your comment to damage opponent (-1 HP)</span>
          <span>⚡ Comments update in real-time</span>
        </div>
      </div>
    </Card>
  );
};