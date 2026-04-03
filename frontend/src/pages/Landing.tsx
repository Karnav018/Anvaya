export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
      <h1 className="text-5xl font-bold mb-4">Anvaya</h1>
      <p className="text-xl text-white/60 mb-8 max-w-xl">
        Build high-performance Express APIs visually. No coding required.
      </p>
      <a href="/signup" className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors">
        Start Building for Free
      </a>
    </div>
  );
}
