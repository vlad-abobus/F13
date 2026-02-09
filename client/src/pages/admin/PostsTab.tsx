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
    <div className="border-2 border-white bg-black rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">📝 Посты на модерацию</h2>
      <div className="space-y-3">
        {posts?.map((post) => (
          <div key={post.id} className="border-2 border-white p-4 rounded-lg bg-gray-900">
            <p className="mb-4">{post.content.substring(0, 200)}...</p>
            <div className="flex gap-2">
              <button
                onClick={() => approvePostMutation.mutate(post.id)}
                className="px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600"
              >
                ✅ Одобрить
              </button>
              <button
                onClick={() => rejectPostMutation.mutate(post.id)}
                className="px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600"
              >
                ❌ Отклонить
              </button>
            </div>
          </div>
        ))}
        {(!posts || posts.length === 0) && (
          <div className="text-center py-8 text-gray-400">Нет постов на модерацию</div>
        )}
      </div>
    </div>
  )
}
