function WorkoutCard({ id, label, onGetWorkout, runningId, backgroundImage }) {
  const isDisabled = runningId !== null
  const style = backgroundImage
    ? {
        background: `url(${backgroundImage}) center center / cover no-repeat`,
      }
    : {}

  const handleClick = () => {
    if (!isDisabled) onGetWorkout(id)
  }

  return (
    <article
      className={`workout-card ${backgroundImage ? 'workout-card--with-bg' : ''} ${isDisabled ? 'workout-card--disabled' : ''}`}
      style={style}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`Get ${label} workout`}
    >
      {backgroundImage && <div className="workout-card-overlay" />}
      <h2>{label}</h2>
    </article>
  )
}

export default WorkoutCard
