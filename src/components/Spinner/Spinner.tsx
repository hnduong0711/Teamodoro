const Spinner = () => {
  return (
    <div className="flex-col gap-4 w-full flex items-center justify-center">
      <div className="w-20 h-20 border-4 border-transparent text-[096B68] text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full">
        <div className="w-16 h-16 border-4 border-transparent text-[FFFBDE] text-2xl animate-spin flex items-center justify-center border-t-red-400 rounded-full"></div>
      </div>
    </div>
  );
};

export default Spinner;
