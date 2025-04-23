# ArguBuddy AI - Personalized AI Debater

ArguBuddy AI is a context-aware, personalized AI debating system designed to help users — particularly competitive exam aspirants, job seekers, and students — sharpen their critical thinking, articulation, and counterargument skills. Built using cutting-edge Natural Language Processing (NLP), Generative AI (LLaMA 3), and real-time knowledge retrieval.

## 🚀 Key Features

- 🎙️ **Voice Input & Output**: Real-time debate via speech-to-text and text-to-speech integration
- 🤖 **AI-Driven Argument Generation**: Uses LLaMA 3 for producing coherent, persuasive arguments
- 🔍 **Real-Time Web Scraping (RAG)**: Fetches latest data from trusted sources (e.g., The Times of India)
- 💬 **Text & Voice Interaction Support**: Supports seamless communication using both input modes
- 📄 **Downloadable Transcripts**: Exports debate sessions as PDF for review or sharing
- 📊 **Personalized Feedback**: Delivers insights using Gemini API
- 🧑‍🏫 **Adaptive Learning**: Adjusts to user's debating style and preferences
- 🌐 **Frontend-Backend Integration**: Built with React.js and FastAPI
- 🗣️ **Human-Like Debating**: Engages users with emotionally intelligent responses

## 🛠️ Tech Stack

### Frontend
- ⚛️ React.js – Responsive, interactive user interface
- 🎨 CSS3 – Custom styling for better user experience

### Backend
- ⚡ FastAPI – High-performance Python backend framework
- 🧠 LLaMA 3 – Meta's large language model
- 📈 Gemini API – Performance-based personalized feedback
- 🧹 BeautifulSoup – Real-time web scraping for RAG

### AI & NLP
- 🗣️ SpeechRecognition (Python) – Voice-to-text conversion
- 🔊 pyttsx3 – Text-to-speech conversion
- 🔄 RAG (Retrieval-Augmented Generation) – Real-time data integration

### Utilities
- 📝 FPDF – PDF export functionality
- 🔗 Axios / Fetch API – Frontend-backend communication
- 📦 Git & GitHub – Version control

## Project Structure
```
├── frontend/               # React frontend application
│   ├── public/            # Static files
│   ├── src/              
│   │   ├── components/    # React components
│   │   │   ├── Debate.css
│   │   │   ├── Debate.js
│   │   │   ├── GeneratePDF.js
│   │   │   ├── Home.css
│   │   │   ├── Home.js
│   │   │   └── ParticleBackground.js
│   │   ├── assets/       # Images and other assets
│   │   └── App.js        # Main application component
│   └── package.json      # Frontend dependencies
├── backend/               # FastAPI backend server
│   ├── main.py           # Main server file
│   ├── debate_articles_*.json  # Debate topic data files
│   └── .env              # Environment variables
├── requirements.txt       # Python dependencies
└── .gitignore
```

## Setup Instructions

### Backend Setup

1. Create Python virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows command
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start FastAPI server:
```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 8080 --reload
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm start
```

Access the application at `http://localhost:3000`

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is licensed under the MIT License.
