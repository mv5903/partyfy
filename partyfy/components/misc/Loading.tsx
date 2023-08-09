function Loading() {
    return (
      <div className="flex justify-center align-center p-10">
        <svg className="spinner-ring spinner-xl" viewBox="25 25 50 50" strokeWidth={5}>
          <circle cx="50" cy="50" r="20" />
        </svg>
      </div>
    );
}

export default Loading;