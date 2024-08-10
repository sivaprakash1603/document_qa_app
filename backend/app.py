from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from transformers import pipeline
from bson import ObjectId
from fpdf import FPDF
import io
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB setup with URL encoding for special characters in the password
password = quote_plus(os.getenv("MONGODB_PASSWORD"))
client = MongoClient(f'mongodb+srv://{os.getenv("MONGODB_USER")}:{password}@{os.getenv("MONGODB_HOST")}/')
db = client[os.getenv("MONGODB_DB")]
collection = db[os.getenv("MONGODB_COLLECTION")]

# Load the question-answering and summarization pipelines
qa_pipeline = pipeline("question-answering")
summarizer = pipeline("summarization")

@app.route('/upload', methods=['POST'])
def upload_document():
    file = request.files['file']
    text = file.read().decode('utf-8')
    doc_id = collection.insert_one({'text': text}).inserted_id
    return jsonify({'doc_id': str(doc_id)}), 201

@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    doc_id = data['doc_id']
    question = data['question']
    doc = collection.find_one({'_id': ObjectId(doc_id)})
    if not doc:
        return jsonify({'error': 'Document not found'}), 404
    context = doc['text']
    result = qa_pipeline(question=question, context=context)
    return jsonify(result)

@app.route('/download_summary', methods=['POST'])
def download_summary():
    data = request.get_json()
    doc_id = data['doc_id']
    
    doc = collection.find_one({'_id': ObjectId(doc_id)})
    if not doc:
        return jsonify({'error': 'Document not found'}), 404

    summary = generate_summary(doc['text'])
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, summary)
    
    pdf_output = io.BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)
    
    return send_file(pdf_output, as_attachment=True, download_name='summary.pdf', mimetype='application/pdf')

def generate_summary(text):
    # Use the summarization pipeline to generate the summary
    # Adjust max_length and min_length based on the desired summary length
    summary = summarizer(text, max_length=200, min_length=50, do_sample=False)
    return summary[0]['summary_text']

if __name__ == '__main__':
    app.run(debug=True)
