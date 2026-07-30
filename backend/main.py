from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
import io, os
import anthropic
from dotenv import load_dotenv

# Loads Anthropic key
load_dotenv()

document_store = {}
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))

    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    doc_id = file.filename
    document_store[doc_id] = text
    summary = summarize_text(text)

    return {
        "filename": file.filename,
        "doc_id": doc_id,
        "num_pages": len(reader.pages),
        "summary": summary,
    }

def summarize_text(text: str) -> str:
    message = client.messages.create(
        # Cheap model
        model="claude-haiku-4-5-20251001",
        # We cap the tokens to avoid spending too much
        max_tokens=500,
        messages=[
            {"role": "user", "content": f"Summarize this document in a few clear paragraphs:\n\n{text}"}
        ]
    )
    return message.content[0].text


class AskRequest(BaseModel):
    doc_id: str
    question: str


@app.post("/ask")
async def ask_question(request: AskRequest):
    text = document_store.get(request.doc_id)
    if not text:
        return {"error": "Document not found"}
    message = client.messages.create(
            # Cheap model
            model="claude-haiku-4-5-20251001",
            # We cap the tokens to avoid spending too much
            max_tokens=500,
            messages=[
                {"role": "user", "content": f"Here is a document:\n\n{text}\n\nQuestion: {request.question}\n\nAnswer based only on the document above."}
            ]
        )
    return {"answer": message.content[0].text}