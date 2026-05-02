import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [activeTab, setActiveTab] = useState('workouts')
  const [runningId, setRunningId] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [runError, setRunError] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [lambdaResult, setLambdaResult] = useState(null)
  const [resultsList, setResultsList] = useState([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [selectedResultContent, setSelectedResultContent] = useState('')
  const fileInputRef = useRef(null)

  const fetchResultsList = useCallback(async () => {
    setResultsLoading(true)
    try {
      const res = await fetch(`${API_URL}/results`)
      const data = await res.json()
      setResultsList(Array.isArray(data) ? data : [])
    } catch {
      setResultsList([])
    } finally {
      setResultsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'results') fetchResultsList()
  }, [activeTab, fetchResultsList])

  const handleViewResult = async (key) => {
    setSelectedResult(key)
    setSelectedResultContent('')
    try {
      const res = await fetch(`${API_URL}/result?key=${encodeURIComponent(key)}`)
      const data = await res.json()
      setSelectedResultContent(data.result || 'No content found.')
    } catch {
      setSelectedResultContent('Failed to load result.')
    }
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const pollForResult = (outputKey) => {
    const maxAttempts = 20  // 20 × 3s = 60s timeout
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`${API_URL}/result?key=${encodeURIComponent(outputKey)}`)
        if (res.ok) {
          const data = await res.json()
          clearInterval(interval)
          setUploadStatus(null)
          setUploadMessage('')
          setLambdaResult(data.result)
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setUploadStatus('error')
          setUploadMessage('Timed out waiting for AI response. Check S3 outputs manually.')
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval)
          setUploadStatus('error')
          setUploadMessage('Failed to retrieve AI response.')
        }
      }
    }, 3000)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.txt')) {
      setUploadStatus('error')
      setUploadMessage('Only .txt files are allowed')
      e.target.value = ''
      return
    }

    setUploadStatus('uploading')
    setUploadMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/upload-prompt`, { method: 'POST', body: formData })
      let data
      try { data = await res.json() } catch { throw new Error(`Server error (${res.status}) — check backend logs`) }
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setUploadStatus('success')
      setUploadMessage('Uploaded! Waiting for AI response…')

      // Derive the output key Lambda will write to
      const outputKey = data.key.replace('.txt', '_response.txt')
      pollForResult(outputKey)
    } catch (err) {
      setUploadStatus('error')
      setUploadMessage(err.message)
    }

    e.target.value = ''
  }

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

      <div className="tabs">
        <button className={`tab-btn${activeTab === 'workouts' ? ' tab-btn--active' : ''}`} onClick={() => setActiveTab('workouts')}>Workouts</button>
        <button className={`tab-btn${activeTab === 'results' ? ' tab-btn--active' : ''}`} onClick={() => setActiveTab('results')}>Results</button>
      </div>

      <div className="upload-section">
        <input
          type="file"
          accept=".txt"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          className="upload-btn"
          onClick={handleUploadClick}
          disabled={uploadStatus === 'uploading'}
        >
          {uploadStatus === 'uploading' ? 'Uploading…' : '↑ Upload Prompt (.txt)'}
        </button>
        {uploadStatus === 'success' && (
          <span className="upload-status upload-status--success">{uploadMessage}</span>
        )}
        {uploadStatus === 'error' && (
          <span className="upload-status upload-status--error">{uploadMessage}</span>
        )}
      </div>

      {activeTab === 'workouts' && (
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
      )}

      {activeTab === 'results' && (
        <div className="results-tab">
          <div className="results-header">
            <span>{resultsList.length} result{resultsList.length !== 1 ? 's' : ''} stored in S3</span>
            <button className="refresh-btn" onClick={fetchResultsList} disabled={resultsLoading}>
              {resultsLoading ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>
          {resultsLoading && <p className="results-empty">Loading…</p>}
          {!resultsLoading && resultsList.length === 0 && (
            <p className="results-empty">No results yet. Upload a prompt to get started.</p>
          )}
          <div className="results-list">
            {resultsList.map(item => (
              <button key={item.key} className="result-item" onClick={() => handleViewResult(item.key)}>
                <span className="result-filename">{item.filename}</span>
                <span className="result-date">{new Date(item.lastModified).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedResult && (
        <WorkoutModal title={selectedResult.split('/').pop()} onClose={() => { setSelectedResult(null); setSelectedResultContent('') }}>
          {selectedResultContent
            ? <div className="response-content" dangerouslySetInnerHTML={{ __html: formatResponseText(selectedResultContent) }} />
            : <p className="modal-message">Loading…</p>
          }
        </WorkoutModal>
      )}

      {lambdaResult && (
        <WorkoutModal title="AI Response (from S3)" onClose={() => setLambdaResult(null)}>
          <div
            className="response-content"
            dangerouslySetInnerHTML={{ __html: formatResponseText(lambdaResult) }}
          />
        </WorkoutModal>
      )}

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
