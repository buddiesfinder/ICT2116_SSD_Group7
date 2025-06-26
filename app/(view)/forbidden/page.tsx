export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white bg-black px-4">
      <h1 className="text-4xl font-bold text-red-500 mb-4">403 - Forbidden</h1>
      <p className="text-lg text-zinc-300">
        You do not have permission to access this page.
      </p>
    </div>
  );
}
