import React, { useState } from 'react';

function App() {
    const [file, setFile] = useState(null);
    const [docId, setDocId] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    // Handler for file input
    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    // Upload document to the backend
    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                console.error('Response text:', await response.text());
                throw new Error('Upload failed');
            }

            const result = await response.json();
            setDocId(result.doc_id);
            alert('Document uploaded successfully! Document ID: ' + result.doc_id);
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Error uploading document. Please try again.');
        }
    };

    // Submit question to the backend
    const handleQuestionSubmit = async () => {
        if (!docId || !question) {
            alert('Please upload a document and enter a question.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    doc_id: docId,
                    question: question,
                }),
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                console.error('Response text:', await response.text());
                throw new Error('Failed to get an answer');
            }

            const result = await response.json();
            setAnswer(result.answer);
        } catch (error) {
            console.error('Error getting answer:', error);
            alert('Error getting answer. Please try again.');
        }
    };

    // Download summary as PDF
    const handleSummaryDownload = async () => {
        if (!docId) {
            alert('Please upload a document first.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/download_summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    doc_id: docId,
                }),
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                console.error('Response text:', await response.text());
                throw new Error('Failed to download summary');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summary.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Error downloading summary:', error);
            alert('Error downloading summary. Please try again.');
        }
    };

    return (
        <div className="App">
            <h1>Document QA App</h1>
            <div>
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleUpload}>Upload Document</button>
            </div>
            <div>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question"
                />
                <button onClick={handleQuestionSubmit}>Submit Question</button>
            </div>
            {answer && (
                <div>
                    <h2>Answer:</h2>
                    <p>{answer}</p>
                </div>
            )}
            <div>
                <button onClick={handleSummaryDownload}>Download Summary</button>
            </div>
        </div>
    );
}

export default App;
