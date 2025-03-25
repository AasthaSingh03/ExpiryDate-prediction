import google.generativeai as genai
from dotenv import load_dotenv
import os
load_dotenv()

class TextAnalysisService:
    def __init__(self):
        # Setup Gemini AI with API key
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("Blunder detected: GEMINI_API_KEY missing")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')

    def analyze_text(self, text):
        """Analyze text to find expiration date information"""
        try:
            # instructing gem to look for such phrases.
            # rules are not working good, need another approach. last fix - 3AM 15 mar
            prompt = f"""
            Analyze this product text and extract ONLY expiry date information:
            {text}

            Rules:        
            1. If you find a direct expiry date, respond with: "Product expires on [DATE]"
            2. If you find manufacture date and shelf life, calculate and respond with: "Use before [CALCULATED_DATE]"
            3. If no date information found, respond with: "No expiry date information found"

            Keep the response to a single line focusing only on when to use the product by.
            Do not include any other information or explanations.
            """

            # Get gem respons
            response = self.model.generate_content(prompt)
            
            if response.parts:
                return response.text.strip()
            else:
                return "Unable to determine expiry date."
            
        except Exception as e:
            print(f"Gemini Analysis Error: {str(e)}")
            return "Unable to analyze expiry date information." 