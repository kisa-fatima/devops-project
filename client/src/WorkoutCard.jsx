function WorkoutCard({ id, label, onGetWorkout, runningId, backgroundImage }) {
  const isRunning = runningId === id
  const isDisabled = runningId !== null
  const style = backgroundImage
    ? {
        background: `url(${backgroundImage}) center center / cover no-repeat`,
      }
    : {}

  return (
    <article className={`workout-card ${backgroundImage ? 'workout-card--with-bg' : ''}`} style={style}>
      {backgroundImage && <div className="workout-card-overlay" />}
      <h2>{label}</h2>
      <button
        type="button"
        className="run-btn"
        onClick={() => onGetWorkout(id)}
        disabled={isDisabled}
      >
        {isRunning ? 'Running…' : 'Get workout'}
      </button>
    </article>
  )
}

export default WorkoutCard
