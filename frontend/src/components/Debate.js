// import React, { useState, useEffect, useRef } from "react";
// import { Link } from "react-scroll";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
// import logo from "../assets/logonew1.jpg";
// import lockIcon from "../assets/lock.svg";
// import "./Debate.css";

// const Debate = () => {
//     const [messages, setMessages] = useState([]); // Stores chat history
//     const synth = window.speechSynthesis;
//     const navigate = useNavigate();
//     const [isLoggedIn, setIsLoggedIn] = useState(false);
//     const chatEndRef = useRef(null);

//     useEffect(() => {
//         const loggedInStatus = localStorage.getItem("loggedIn") === "true";
//         setIsLoggedIn(loggedInStatus);
//     }, []);

//     const handleLogout = () => {
//         localStorage.removeItem("loggedIn");
//         setIsLoggedIn(false);
//         navigate("/login");
//     };

//     const { transcript, listening, resetTranscript } = useSpeechRecognition();

//     useEffect(() => {
//         if (!listening && transcript) {
//             addUserMessage(transcript);
//             sendToLLM(transcript);
//         }
//     }, [listening]);

//     const speakText = (text) => {
//         const utterance = new SpeechSynthesisUtterance(text);
//         utterance.lang = "en-US";
//         utterance.rate = 1.0;
//         synth.speak(utterance);
//     };

//     const sendToLLM = async (text) => {
//         try {
//             const res = await axios.post("http://localhost:8080/chat/", { text });
//             addAIMessage(res.data.response);
//             speakText(res.data.response);
//         } catch (error) {
//             console.error("Error fetching AI response:", error);
//         }
//     };

//     const addUserMessage = (text) => {
//         setMessages((prevMessages) => [...prevMessages, { text, sender: "user" }]);
//     };

//     const addAIMessage = (text) => {
//         setMessages((prevMessages) => [...prevMessages, { text, sender: "ai" }]);
//     };

//     useEffect(() => {
//         chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     const handleButtonClick = () => {
//         if (listening) {
//             SpeechRecognition.stopListening();
//         } else {
//             synth.cancel();
//             SpeechRecognition.startListening();
//         }
//     };


//     if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
//         return <p>Your browser does not support speech recognition.</p>;
//     }

//     return (
//         <>
//             <div className="navbar">
//                 <div className="abc">
//                     <img src={logo} alt="Logo" className="logo" />
//                 </div>
//                 <div className="nav-links">
//                     <ul>
//                         <li><Link to="home" smooth={true} duration={800}>Home</Link></li>
//                         <li><Link to="about" smooth={true} duration={800}>About</Link></li>
//                         <li><Link to="features" smooth={true} duration={800} offset={-80}>Features</Link></li>
//                         <li><Link to="contactus" smooth={true} duration={800}>Contact Us</Link></li>
//                     </ul>
//                 </div>
//                 <div className="nav-buttons">
//                     {isLoggedIn ? (
//                         <button className="logout-button" onClick={handleLogout}>Logout</button>
//                     ) : (
//                         <>
//                             <button className="login-button" onClick={() => navigate('/login')}>
//                                 <img src={lockIcon} alt="Login Icon" /> Login
//                             </button>
//                             <button className="signup-button" onClick={() => navigate('/register')}>Sign Up</button>
//                         </>
//                     )}
//                 </div>
//             </div>

//             {/* Debate Chat UI */}
//             <div className="debate-container">
//                 <h1 className="debate-title">Hey Buddy...Let's Start Your Debate</h1>

//                 <div className="chat-box">
//                     {messages.map((msg, index) => (
//                         <div key={index} className={`chat-message ${msg.sender}`}>
//                             <p>{msg.text}</p>
//                         </div>
//                     ))}
//                     <div ref={chatEndRef} />
//                 </div>

//                 <button onClick={handleButtonClick} className={`speech-button ${listening ? "stop" : "start"}`}>
//                     {listening ? "Stop Listening" : "Start Talking"}
//                 </button>
//             </div>
//         </>
//     );
// };

// export default Debate;















import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import logo from "../assets/logonew1.jpg";
import lockIcon from "../assets/lock.svg";
import "./Debate.css";
import { generatePDF, downloadPDF, generateFeedback } from "./GeneratePDF";

const Debate = () => {
    const [topic, setTopic] = useState("");
    const [messages, setMessages] = useState([]);
    const [scraping, setScraping] = useState(false);
    const [debateStarted, setDebateStarted] = useState(false);
    const [feedback, setFeedback] = useState("");
    const synth = window.speechSynthesis;
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    const { transcript, listening, resetTranscript } = useSpeechRecognition();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!listening && transcript) {
            handleUserMessage(transcript);
            resetTranscript();
        }
    }, [listening]);

    const handleStartDebate = async () => {
        if (!topic.trim()) {
            alert("Please enter a debate topic!");
            return;
        }
        setScraping(true);
        try {
            await axios.post("http://localhost:8080/scrape/", { topic });
            alert("Scraping completed. You can start the debate now!");
            setDebateStarted(true);
        } catch (error) {
            console.error("Error starting debate:", error);
            alert("Failed to fetch debate data.");
        }
        setScraping(false);
    };

    const handleUserMessage = async (text) => {
        setMessages((prev) => [...prev, { text, sender: "user" }]);
        sendToLLM(text);
    };

    const sendToLLM = async (text) => {
        try {
            const res = await axios.post("http://localhost:8080/chat/", { text, topic });
            setMessages((prev) => [...prev, { text: res.data.response, sender: "ai" }]);
            speakText(res.data.response);
        } catch (error) {
            console.error("Error fetching AI response:", error);
        }
    };

    const speakText = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        synth.speak(utterance);
    };

    const stopSpeaking = () => {
        synth.cancel(); // Stop AI speech immediately
    };

    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
        return <p>Your browser does not support speech recognition.</p>;
    }

    const handleGenerateFeedback = async () => {
        const feedbackText = await generateFeedback();
        if (feedbackText) {
            setFeedback(feedbackText);
        }
    };

    return (
        <>
            <div className="navbar">
                <img src={logo} alt="Logo" className="logo" />
                <div className="nav-buttons">
                    <button className="login-button" onClick={() => navigate('/login')}>
                        <img src={lockIcon} alt="Login Icon" /> Login
                    </button>
                    <button className="signup-button" onClick={() => navigate('/register')}>Sign Up</button>
                </div>
            </div>

            {/* <div className="debate-container">
                {!debateStarted ? (
                    <>
                        <h2>Enter Your Debate Topic</h2>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter topic..."
                        />
                        <button onClick={handleStartDebate} disabled={scraping}>
                            {scraping ? "Scraping..." : "Start Debate"}
                        </button>
                    </>
                ) : (
                    <>
                        <h1>Debate on: {topic}</h1>
                        <div className="chat-box">
                            {messages.map((msg, index) => (
                                <div key={index} className={`chat-message ${msg.sender}`}>
                                    <p>{msg.text}</p>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="button-container">
                            <button
                                onClick={() => listening ? SpeechRecognition.stopListening() : SpeechRecognition.startListening()}
                                className={`speech-button ${listening ? "stop" : "start"}`}
                            >
                                {listening ? "Stop Listening" : "Start Talking"}
                            </button>
                            <button onClick={stopSpeaking} className="stop-opposer-button">
                                Stop Opposer
                            </button>
                        </div>
                    </>
                )}
            </div> */}

            <div className="debate-container">
                {!debateStarted ? (
                    <>
                        <h2 className="debate-heading">Enter Your Debate Topic</h2>

                        <div className="input-container">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Enter topic..."
                            />
                            <button
                                className="start-debate-button"
                                onClick={handleStartDebate}
                                disabled={scraping}
                            >
                                {scraping ? "Scraping..." : "Start Debate"}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1>Debate on: {topic}</h1>
                        <div className="chat-box">
                            {messages.map((msg, index) => (
                                <div key={index} className={`chat-message ${msg.sender}`}>
                                    <p>{msg.text}</p>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="button-container">
                            <button
                                onClick={() =>
                                    listening
                                        ? SpeechRecognition.stopListening()
                                        : SpeechRecognition.startListening()
                                }
                                className={`start-debate-button ${listening ? "stop" : "start"}`}
                            >
                                {listening ? "Stop Listening" : "Start Talking"}
                            </button>
                            <button onClick={stopSpeaking} className="stop-opposer-button">
                                Stop Opposer
                            </button>
                            {/* {debateStarted && <GeneratePDF topic={topic} messages={messages} />}
                             */}
                            <button
                                onClick={() => {
                                    if (messages.length === 0) {
                                        alert("No debate messages available to generate PDF.");
                                        return;
                                    }
                                    generatePDF(topic, messages);
                                }}
                                className="start-debate-button"
                            >
                                Generate PDF
                            </button>

                            <button
                                onClick={downloadPDF}
                                className="start-debate-button"
                            >
                                Download PDF
                            </button>

                            <button
                                onClick={generateFeedback}
                                className="start-debate-button"
                            >
                                Generate Feedback
                            </button>

                            {feedback && (
                                <div className="feedback-box">
                                    <h2>Feedback:</h2>
                                    <p>{feedback}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

        </>
    );
};

export default Debate;
