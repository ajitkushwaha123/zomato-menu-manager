const Loading = ({ message = "Loading Menu Experience..." }) => {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-12 w-12 rounded-full bg-primary/20 animate-spin border-t-2 border-primary"></div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
