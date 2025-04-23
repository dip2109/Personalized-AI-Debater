import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { marked } from 'marked';

// Function to generate and store PDF
const generatePDF = (topic, messages) => {
    if (!Array.isArray(messages) || messages.length === 0) {
        alert("No debate messages available to generate PDF.");
        return;
    }

    const doc = new jsPDF();
    doc.text(`Debate on: ${topic}`, 10, 10);

    autoTable(doc, {
        startY: 20,
        head: [["Speaker", "Message"]],
        body: messages.map(msg => [msg.sender === "user" ? "User" : "AI", msg.text]),
    });

    // Store the PDF in localStorage as a Base64 string
    const pdfData = doc.output("datauristring");
    localStorage.setItem("generatedPDF", pdfData);
    alert("PDF generated and saved! Now click 'Download PDF'.");
};

// Function to download the generated PDF
const downloadPDF = () => {
    const pdfData = localStorage.getItem("generatedPDF");

    if (!pdfData) {
        alert("No generated PDF found. Please generate first.");
        return;
    }

    // Convert Base64 to Blob and trigger download
    const link = document.createElement("a");
    link.href = pdfData;
    link.download = "debate.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("PDF downloaded successfully!");
};

const generateFeedback = async () => {
    const pdfData = localStorage.getItem("generatedPDF");

    if (!pdfData) {
        alert("No PDF found. Generate it first.");
        console.error("No PDF data found in localStorage.");
        return null;
    }

    try {
        console.log("Sending feedback request to the backend...");

        const response = await fetch("http://localhost:8080/generate-feedback/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ pdf_base64: pdfData }),
        });

        console.log("Response received from backend:", response);

        const data = await response.json();
        console.log("Parsed response data:", data);

        if (response.ok) {
            // Instead of alert, display in a nice looking modal
            displayFeedbackModal(data.feedback);
            return data.feedback;
        } else {
            alert(`Error: ${data.error}`);
            console.error("Error data:", data);
            return null;
        }
    } catch (error) {
        console.error("Network or server error:", error);
        alert("An error occurred while generating feedback. Check the console for more details.");
        return null;
    }
};

// Function to display feedback in a nice-looking modal
const displayFeedbackModal = (markdownContent) => {
    // Create modal container
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "feedback-modal-overlay";
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.className = "feedback-modal-content";
    modalContent.style.cssText = `
        background-color: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 80%;
        max-height: 80%;
        overflow-y: auto;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        position: relative;
    `;

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.className = "feedback-modal-close";
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #555;
    `;
    closeButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };

    // Create heading
    const heading = document.createElement("h2");
    heading.textContent = "Feedback";
    heading.style.cssText = `
        margin-top: 0;
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
        margin-bottom: 20px;
    `;

    // Create content area with markdown
    const feedbackContent = document.createElement("div");
    feedbackContent.className = "markdown-content";
    feedbackContent.style.cssText = `
        line-height: 1.6;
        color: #333;
    `;

    // Use a markdown parser to convert the markdown to HTML
    // For this example, I'm assuming you have a markdown parser available
    // If you don't, you would need to include one like marked.js
    
    // Check if marked library is available
    if (window.marked) {
        feedbackContent.innerHTML = marked.parse(markdownContent);
    } else {
        // If marked is not available, load it dynamically
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/marked/4.0.2/marked.min.js";
        script.onload = () => {
            feedbackContent.innerHTML = marked.parse(markdownContent);
        };
        document.head.appendChild(script);
        
        // In the meantime, show content with basic formatting
        feedbackContent.innerHTML = markdownContent.replace(/\n/g, "<br>");
    }

    // Add some styling for the markdown content
    const style = document.createElement("style");
    style.textContent = `
        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
            color: #2c3e50;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .markdown-content h1 {
            font-size: 26px;
            border-bottom: 1px solid #eaecef;
            padding-bottom: 10px;
        }
        .markdown-content h2 {
            font-size: 22px;
        }
        .markdown-content h3 {
            font-size: 18px;
        }
        .markdown-content p {
            margin-bottom: 16px;
        }
        .markdown-content ul, .markdown-content ol {
            padding-left: 25px;
            margin-bottom: 16px;
        }
        .markdown-content li {
            margin-bottom: 8px;
        }
        .markdown-content code {
            background-color: #f6f8fa;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
        .markdown-content pre {
            background-color: #f6f8fa;
            padding: 16px;
            overflow: auto;
            border-radius: 6px;
        }
        .markdown-content blockquote {
            border-left: 4px solid #dfe2e5;
            padding-left: 16px;
            color: #6a737d;
            margin-left: 0;
        }
        .markdown-content table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
        }
        .markdown-content th, .markdown-content td {
            border: 1px solid #dfe2e5;
            padding: 8px 12px;
        }
        .markdown-content th {
            background-color: #f6f8fa;
        }
        .markdown-content a {
            color: #0366d6;
            text-decoration: none;
        }
        .markdown-content a:hover {
            text-decoration: underline;
        }
        .markdown-content img {
            max-width: 100%;
        }
    `;

    // Assemble the modal
    modalContent.appendChild(closeButton);
    modalContent.appendChild(heading);
    modalContent.appendChild(feedbackContent);
    modalOverlay.appendChild(modalContent);
    document.head.appendChild(style);
    document.body.appendChild(modalOverlay);
};


export { generatePDF, downloadPDF, generateFeedback };