export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <p className="text-xl font-medium">Page not found</p>
      <p className="text-muted-foreground max-w-sm">
        We couldn't find the page you are looking for. Please check the URL and try again.
      </p>
    </div>
  )
}
