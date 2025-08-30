"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";
import { Address } from "~~/components/scaffold-eth";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  contentHash: string;
  timestamp: string;
  status: string;
}

export function PostList() {
  const { address } = useAccount();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
    // Refresh posts every 30 seconds
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/content");
      if (response.ok) {
        const data = await response.json();
        // Transform data to match the expected Post interface
        const transformedPosts = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          author: item.author,
          contentHash: item.contentHash,
          timestamp: item.timestamp,
          status: item.status,
          community: item.community,
          tags: item.tags,
        }));
        setPosts(transformedPosts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = (post: Post) => {
    // TODO: Implement challenge functionality
    console.log("Challenge post:", post);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          <p className="text-center text-gray-500">No posts yet. Be the first to create one!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="card bg-white shadow-xl border border-gray-200">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <h2 className="card-title text-gray-900">{post.title}</h2>
              <div className="badge badge-outline">{post.status}</div>
            </div>
            
            <p className="text-gray-600">{post.content}</p>
            
            <div className="divider"></div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">Author:</span>
                <Address address={post.author as `0x${string}`} />
              </div>
              
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
              </span>
            </div>

            <div className="card-actions justify-end mt-4">
              <button 
                className="btn btn-sm btn-ghost"
                onClick={() => setSelectedPost(post)}
              >
                View Details
              </button>
              
              {address && address !== post.author && (
                <button 
                  className="btn btn-sm btn-warning"
                  onClick={() => handleChallenge(post)}
                >
                  Challenge (0.2 MDT)
                </button>
              )}
              
              {address === post.author && (
                <button 
                  className="btn btn-sm btn-success"
                  disabled
                >
                  Withdraw Bond (7 days)
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Post Detail Modal */}
      {selectedPost && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{selectedPost.title}</h3>
            <p className="py-4">{selectedPost.content}</p>
            
            <div className="text-sm space-y-2">
              <p><strong>Content Hash:</strong> {selectedPost.contentHash.slice(0, 10)}...</p>
              <p><strong>Post ID:</strong> {selectedPost.id}</p>
              <p><strong>Status:</strong> {selectedPost.status}</p>
            </div>
            
            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedPost(null)}>Close</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setSelectedPost(null)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}