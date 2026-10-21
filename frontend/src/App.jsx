import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null);
  const [docId, setDocId] = useState(() => localStorage.getItem('docId') || '');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('messages')) || []);
  const [isDragging, setIsDragging] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({behaviour: 'smooth', block: 'nearest'})
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  // When a PDF is uploaded this hook updates the pdfUrl which we use to preview the file
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file); 
    setPdfUrl(url);
    // As to not leak memory
    return () => URL.revokeObjectURL(url);
  }, [file]);
  
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
      setMessages([
        ...messages,
        {role: 'ai', text: data.summary}
      ]);
      localStorage.setItem('docId', data.doc_id);

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const handleQuestion = async () => {
    // If no question has been asked if a file hasn't been uploaded
    if (question=='' || !docId) return;
    setLoading(true);

    setMessages(messages => [
      ...messages,
      {role: 'user', text: question}
    ])

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
      setMessages(messages => [
        ...messages,
        {role: 'ai', text: data.answer}
      ]);

      
    } catch (error) {
      console.error('Question failed', error);
    } finally {
      setLoading(false);
      // Clears question box
      setQuestion('');
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault(); // required, or the browser blocks the drop
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const listMessages = messages.map((message, i) => <li key={i} className={message.role}><p>{message.text}</p></li>);

  return (
    <>
      <div className="app">
      <h1>summarAIse</h1>
      <div className="container">
        <div className="leftCol">
          <div
            className={`uploadZone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              className="inputFile"
              type="file"
              accept="application/pdf"
              id="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label htmlFor="file">Choose a file</label>
          </div>
          <button 
            onClick={handleUpload}
            disabled={!file || loading} 
          >
            {loading ? 'Uploading...' : 'Upload & summarAIse'}
          </button>
          <iframe src={pdfUrl} />
        </div>

        <div className="rightCol">
          <h2>Chat</h2>
          <ul className="messages">
            {listMessages}
            <li ref={scrollRef}/>  
          </ul>
          <div className="inputRow">
            <input
              type="text"
              id="query"
              value = {question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'Enter') {
                  handleQuestion();
                }
              }}
            />
            <button onClick={handleQuestion} disabled={question == '' || loading || !docId} >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

export default App
