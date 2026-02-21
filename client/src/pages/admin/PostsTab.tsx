import { UseMutationResult } from '@tanstack/react-query'

interface Post {
  id: string
  content: string
}

interface PostsTabProps {
  posts: Post[] | undefined
  approvePostMutation: UseMutationResult<any, unknown, string, unknown>
  rejectPostMutation: UseMutationResult<any, unknown, string, unknown>
}

export default function PostsTab({
  posts,
  approvePostMutation,
  rejectPostMutation,
}: PostsTabProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border border-yellow-700/30 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📝</span> Посты на модерацію
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          {posts?.length || 0} постів очікують на розгляд
        </p>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {posts && posts.length > 0 ? (
          posts.map((post, idx) => (
            <div 
              key={post.id} 
              className="bg-gradient-to-r from-gray-900/50 to-gray-900/30 border border-gray-700 hover:border-gray-600 rounded-2xl overflow-hidden transition-all"
            >
              <div className="p-6">
                {/* Post Number and ID */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-bold">#{idx + 1}</span>
                    <span className="ml-2 text-xs bg-gray-800 px-2 py-1 rounded">{post.id}</span>
                  </div>
                  <span className="text-xs bg-yellow-600/30 text-yellow-300 px-3 py-1 rounded-full">⏳ Очікує</span>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-200 leading-relaxed line-clamp-4">
                    {post.content}
                  </p>
                  {post.content.length > 200 && (
                    <p className="text-gray-500 text-sm mt-2 italic">... (обрізано)</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => approvePostMutation.mutate(post.id)}
                    disabled={approvePostMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {approvePostMutation.isPending ? '⏳' : '✅'} Затвердити
                  </button>
                  <button
                    onClick={() => rejectPostMutation.mutate(post.id)}
                    disabled={rejectPostMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {rejectPostMutation.isPending ? '⏳' : '❌'} Відхилити
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-gray-900/50 to-gray-900/30 border border-gray-700 rounded-2xl">
            <div className="text-5xl mb-3">✨</div>
            <p className="text-gray-300 font-medium">Всі пости модеровані!</p>
            <p className="text-gray-500 text-sm mt-1">Новітніх постів немає для розгляду</p>
          </div>
        )}
      </div>
    </div>
  )
}
