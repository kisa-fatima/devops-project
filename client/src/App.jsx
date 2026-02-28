import { useState } from 'react'
import './App.css'
import WorkoutCard from './WorkoutCard'
import WorkoutModal from './WorkoutModal'
import armsImg from './assets/optimized/arms.jpg'
import absImg from './assets/optimized/abs.jpg'
import backImg from './assets/optimized/back.jpg'
import cardioImg from './assets/optimized/cardio.jpg'
import fullbodyImg from './assets/optimized/fullbody.jpg'
import legsImg from './assets/optimized/legs.jpg'
import shouldersImg from './assets/optimized/shoulders.jpg'
import stretchingImg from './assets/optimized/stretching.jpg'
import yogaImg from './assets/optimized/yoga.jpg'

const API_URL = '/api'

/** Escapes HTML and converts **bold** to <strong>, newlines to <br /> */
function formatResponseText(text) {
  if (!text) return ''
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
}

const WORKOUT_CARDS = [
  { id: 1, label: 'Arms', image: armsImg },
  { id: 2, label: 'Abs', image: absImg },
  { id: 3, label: 'Legs', image: legsImg },
  { id: 4, label: 'Back', image: backImg },
  { id: 5, label: 'Full Body', image: fullbodyImg },
  { id: 6, label: 'Cardio', image: cardioImg },
  { id: 7, label: 'Shoulders', image: shouldersImg },
  { id: 8, label: 'Yoga & Relaxation', image: yogaImg },
  { id: 9, label: 'Stretching & Flexibility', image: stretchingImg },
]

function BarbellIcon() {
  return (
    <svg className="heading-icon" fill="currentColor" viewBox="0 0 388.297 388.297" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g>
        <rect x="0" y="134.514" width="64.902" height="119.269" />
        <polygon points="243.936,178.815 144.359,178.815 144.359,104.148 79.456,104.148 79.456,284.148 144.359,284.148 144.359,209.481 243.936,209.481 243.936,284.148 308.841,284.148 308.841,104.148 243.936,104.148" />
        <rect x="323.395" y="134.514" width="64.902" height="119.269" />
      </g>
    </svg>
  )
}

function App() {
  const [runningId, setRunningId] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [runError, setRunError] = useState(null)

  const handleRunPrompt = (id) => {
    setRunningId(id)
    setRunResult(null)
    setRunError(null)
    fetch(`${API_URL}/prompts/run/${id}`, {
      method: 'POST',
    })
      .then(res => res.json().then(data => {
        if (!res.ok) throw new Error(data.error || 'Request failed')
        return data
      }))
      .then(data => {
        setRunResult(data)
        setRunError(null)
      })
      .catch(err => setRunError(err.message))
      .finally(() => setRunningId(null))
  }

  return (
    <div className="container">
      {runningId !== null && (
        <div className="loader-overlay" aria-live="polite" aria-busy="true">
          <div className="loader-spinner" />
        </div>
      )}
      <div className="page-heading">
        <BarbellIcon />
        <h1>Get Your Daily Workout</h1>
        <BarbellIcon />
      </div>
      <div className="workout-grid-wrapper">
        <div className="workout-grid">
        {WORKOUT_CARDS.map(card => (
          <WorkoutCard
            key={card.id}
            id={card.id}
            label={card.label}
            onGetWorkout={handleRunPrompt}
            runningId={runningId}
            backgroundImage={card.image}
          />
        ))}
        </div>
      </div>

      {runError && (
        <WorkoutModal title="Error" onClose={() => setRunError(null)}>
          <p className="modal-message">{runError}</p>
        </WorkoutModal>
      )}

      {runResult && (
        <WorkoutModal
          title={`${WORKOUT_CARDS.find(c => c.id === runResult.promptId)?.label ?? ''} Workout`.trim() || 'Workout'}
          onClose={() => setRunResult(null)}
        >
          <div
            className="response-content"
            dangerouslySetInnerHTML={{ __html: formatResponseText(runResult.response) }}
          />
        </WorkoutModal>
      )}
    </div>
  )
}

export default App
