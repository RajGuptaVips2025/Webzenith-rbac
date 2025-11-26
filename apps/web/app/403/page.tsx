export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-red-600 mb-4">403</h1>
        <p className="text-lg text-gray-600">You don't have permission to view this page.</p>
      </div>
    </div>
  );
}
