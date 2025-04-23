import requests
from bs4 import BeautifulSoup
import json

def scrape_debate_articles():
    topic = input("Enter the debate topic: ").strip()  # User inputs topic
    topic_formatted = topic.lower().replace(" ", "-")  # Format for URL
    url = f"https://timesofindia.indiatimes.com/topic/{topic_formatted}/news"
    headers = {"User-Agent": "Mozilla/5.0"}

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print("Failed to retrieve the webpage")
        return
    
    soup = BeautifulSoup(response.text, "html.parser")
    articles = soup.find_all(class_="uwU81")  # Class for article blocks
    
    debate_data = []

    for article in articles[:10]:  # Get top 10 debate-related articles
        title = article.span.get_text(strip=True) if article.span else "No title"
        link = article.a["href"] if article.a else "No link"
        date_div = article.find("div", class_="ZxBIG")
        date = date_div.get_text(strip=True) if date_div else "No date"

        # Get full article text
        full_text = scrape_article_content(link) if link != "No link" else "No content"
        
        debate_data.append({
            "Topic": topic,  # Store user-input topic
            "Title": title,
            "Link": f"https://timesofindia.indiatimes.com{link}",
            "Date": date,
            "Content": full_text
        })

    # Save to JSON
    file_name = f"debate_articles_{topic_formatted}.json"
    with open(file_name, "w", encoding="utf-8") as file:
        json.dump(debate_data, file, indent=4, ensure_ascii=False)
    
    print(f"Debate articles on '{topic}' saved to {file_name}")

def scrape_article_content(link):
    """Extracts full article content"""
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(link, headers=headers)
    if response.status_code != 200:
        return "Failed to fetch content"

    soup = BeautifulSoup(response.text, "html.parser")
    content_div = soup.find("div", class_="_s30J clearfix")  # Class for article text
    return content_div.get_text(strip=True) if content_div else "No article content found."

# Run the function
scrape_debate_articles()
