# from fastapi import FastAPI, UploadFile, File
# from fastapi.responses import JSONResponse
# import speech_recognition as sr
# import pyttsx3
# from pydantic import BaseModel
# from groq import Groq
# import os
# from dotenv import load_dotenv
# from fastapi.middleware.cors import CORSMiddleware

# load_dotenv()

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # Change this to your frontend URL
#     allow_credentials=True,
#     allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
#     allow_headers=["*"],  # Allows all headers
# )

# # Initialize TTS engine
# tts_engine = pyttsx3.init()
# groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# class PromptRequest(BaseModel):
#     text: str

# def process_speech(audio_file):
#     recognizer = sr.Recognizer()
#     with sr.AudioFile(audio_file) as source:
#         audio = recognizer.record(source)
#         try:
#             text = recognizer.recognize_google(audio)
#             return text
#         except sr.UnknownValueError:
#             return "Could not understand audio"
#         except sr.RequestError:
#             return "Error with recognition service"

# @app.post("/transcribe/")
# async def transcribe_audio(file: UploadFile = File(...)):
#     with open("temp.wav", "wb") as buffer:
#         buffer.write(await file.read())
#     transcript = process_speech("temp.wav")
#     return JSONResponse(content={"transcript": transcript})

# @app.post("/chat/")
# async def chat_with_ai(prompt: PromptRequest):
#     system_message = """You are a friendly AI assistant. Provide complete, concise answers in 2-3 sentences using natural conversational language. 
#     Focus on the most important points only. Speak as if having a casual conversation with a friend. 
#     Your response must be a single, coherent paragraph that fully addresses the question."""
    
#     convo = [
#         {"role": "system", "content": system_message},
#         {"role": "user", "content": f"Answer this briefly: {prompt.text}"}
#     ]

#     response = groq_client.chat.completions.create(
#         messages=convo, 
#         model="llama3-70b-8192",
#         temperature=0.7,
#         max_tokens=100
#     ).choices[0].message.content

#     return JSONResponse(content={"response": response})

# @app.post("/speak/")
# async def generate_speech(prompt: PromptRequest):
#     tts_engine.save_to_file(prompt.text, "response.mp3")
#     tts_engine.runAndWait()
#     return JSONResponse(content={"audio_url": "/response.mp3"})






















from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import json
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import base64
import fitz  # PyMuPDF
import google.generativeai as genai

load_dotenv()

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq API client setup
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Pydantic models
class ScrapeRequest(BaseModel):
    topic: str

class ChatRequest(BaseModel):
    text: str
    topic: str

class DebateRequest(BaseModel):
    debate_text: str  # The extracted debate transcript



# Separate models for scraping and chat endpoints
class ScrapeRequest(BaseModel):
    topic: str

class ChatRequest(BaseModel):
    text: str
    topic: str

@app.post("/scrape/")
async def scrape_debate_articles(request: ScrapeRequest):
    topic = request.topic.strip()
    topic_formatted = topic.lower().replace(" ", "-")
    url = f"https://timesofindia.indiatimes.com/topic/{topic_formatted}/news"
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return JSONResponse(content={"message": "Failed to retrieve webpage"}, status_code=500)
        
        soup = BeautifulSoup(response.text, "html.parser")
        articles = soup.find_all(class_="uwU81")

        debate_data = []
        for article in articles[:10]:
            title = article.span.get_text(strip=True) if article.span else "No title"
            link = article.a["href"] if article.a else "No link"
            date_div = article.find("div", class_="ZxBIG")
            date = date_div.get_text(strip=True) if date_div else "No date"

            full_text = scrape_article_content(link) if link != "No link" else "No content"
            debate_data.append({
                "Topic": topic,
                "Title": title,
                "Link": f"https://timesofindia.indiatimes.com{link}",
                "Date": date,
                "Content": full_text
            })

        file_name = f"debate_articles_{topic_formatted}.json"
        with open(file_name, "w", encoding="utf-8") as file:
            json.dump(debate_data, file, indent=4, ensure_ascii=False)

        return JSONResponse(content={"message": f"Debate articles saved to {file_name}"})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

def scrape_article_content(link):
    """ Fetch article content from given link """
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = requests.get(link, headers=headers)
        if response.status_code != 200:
            return "Failed to fetch content"

        soup = BeautifulSoup(response.text, "html.parser")
        content_div = soup.find("div", class_="_s30J clearfix")
        return content_div.get_text(strip=True) if content_div else "No article content found."

    except Exception as e:
        return f"Error fetching content: {str(e)}"

@app.post("/chat/")
async def chat_with_ai(request: ChatRequest):
    topic_file = f"debate_articles_{request.topic.lower().replace(' ', '-')}.json"

    if not os.path.exists(topic_file):
        return JSONResponse(content={"error": "No relevant debate data found"}, status_code=404)

    # Load the debate articles
    with open(topic_file, "r", encoding="utf-8") as file:
        articles = json.load(file)
    
    article_texts = [article["Content"] for article in articles]
    article_titles = [article["Title"] for article in articles]

    # Compute cosine similarity
    vectorizer = TfidfVectorizer(stop_words='english')
    user_query_vector = vectorizer.fit_transform([request.text] + article_texts)

    similarities = cosine_similarity(user_query_vector[0:1], user_query_vector[1:]).flatten()

    # Filter relevant articles (Threshold: 0.3)
    relevant_articles = [articles[i] for i in range(len(similarities)) if similarities[i] > 0.3]

    # If relevant data exists, use it; otherwise, let AI generate a response
    if relevant_articles:
        related_info = " ".join([article["Content"][:500] for article in relevant_articles[:3]])
        prompt = (
            f"User's statement: {request.text}\n\n"
            f"Relevant Debate Information: {related_info}\n\n"
            "Provide a respectful counter-argument opposing the user's statement, backed by facts. Keep the response short and concise. Do not go beyond 150 words and complete the sentences. Do not left any sentence incomplete."
        )
    else:
        prompt = (
            f"User's statement: {request.text}\n\n"
            "No external data is available. Form an independent, logical, and fact-based counter-argument.  Keep the response short and concise. Do not go beyond 150 words and complete the sentences. Do not left any sentence incomplete."
        )

    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0.3,
            max_tokens=200,  # Increased max tokens to prevent cutoff
            stop=["\n\n"]  # Ensures response is complete
        ).choices[0].message.content

        # Trim response to avoid abrupt cutoff
        if response[-1] not in ".!?":  
            response += "."

        return JSONResponse(content={"response": response})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
# -------------------- NEW: FEEDBACK ENDPOINT --------------------

class FeedbackRequest(BaseModel):
    pdf_base64: str  # Base64-encoded PDF from frontend

@app.post("/generate-feedback/")
async def generate_feedback(request: FeedbackRequest):
    try:
        # Decode base64 to binary
        pdf_bytes = base64.b64decode(request.pdf_base64.split(",")[1])

        # Extract text from PDF using PyMuPDF
        with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf:
            full_text = ""
            for page in pdf:
                full_text += page.get_text()

        if not full_text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF.")

        # Prompt Gemini to give feedback
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            "This is a transcript of a user’s debate with an AI.\n\n"
            "Please provide personalized feedback on the user's debating performance. "
            "Include insights on the following:\n"
            "- Overall clarity and coherence of arguments\n"
            "- Use of supporting facts and logic\n"
            "- Persuasiveness and tone\n"
            "- Areas for improvement\n\n"
            "Keep the feedback specific and constructive.\n\n"
            f"Debate Transcript:\n{full_text}"
        )

        response = model.generate_content(prompt)

        return JSONResponse(content={"feedback": response.text})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# class FeedbackRequest(BaseModel):
#     pdf_base64: str

# @app.post("/generate-feedback/")
# async def generate_feedback(request: FeedbackRequest):
#     try:
#         base64_str = request.pdf_base64
#         if "," in base64_str:
#             base64_str = base64_str.split(",")[1]

#         pdf_bytes = base64.b64decode(base64_str)

#         with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf:
#             full_text = ""
#             for page in pdf:
#                 full_text += page.get_text()

#         if not full_text.strip():
#             raise HTTPException(status_code=400, detail="No text found in PDF.")

#         # model = genai.GenerativeModel("gemini-pro")
#         model = genai.GenerativeModel("gemini-2.0-flash")
#         prompt = (
#             "This is a transcript of a user’s debate with an AI.\n\n"
#             "Please provide personalized feedback on the user's debating performance. "
#             "Include insights on the following:\n"
#             "- Overall clarity and coherence of arguments\n"
#             "- Use of supporting facts and logic\n"
#             "- Persuasiveness and tone\n"
#             "- Areas for improvement\n\n"
#             "Keep the feedback specific and constructive.\n\n"
#             f"Debate Transcript:\n{full_text}"
#         )

#         response = model.generate_content(prompt)

#         return JSONResponse(content={"feedback": response.text})

#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)

