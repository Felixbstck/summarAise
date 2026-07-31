import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [docId, setDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  const handleUpload = async () => {
    if (!file) return;
    // We set loading to true to tell the page to disable the upload button
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setDocId(data.doc_id);
      setSummary(data.summary);

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const handleQuestion = async () => {
    if (question=='') return;
    setLoading(true);

    const formData = {
      'doc_id': docId,
      'question': question,
    };

    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {'CONTENT-TYPE': 'application/json'},
        body: JSON.stringify(formData),
      })
      const data = await response.json();
      console.log(data);
      setAnswer(data.answer);
    } catch (error) {
      console.error('Question failed', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>summarAIse</h1>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file || loading} >
        {loading ? 'Uploading...' : 'Upload & summarAIse'}
      </button>
      <h2>Summary</h2>
      <p>{summary}</p>

      <div>
        <input
          type="text"
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button onClick={handleQuestion} disabled={question == '' || loading} >
          {loading ? 'Answering...' : 'Ask'}
        </button>
        <h2>Answer</h2>
        <p>{answer}</p>
      </div>
    </>
  )
}

export default App
