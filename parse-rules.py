import PyPDF2
import sys

def parse_pdf(filepath):
    try:
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for i in range(len(reader.pages)):
                print(f"--- PAGE {i+1} ---")
                text = reader.pages[i].extract_text()
                if text:
                    print(text[:500] + "...") # Print first 500 chars of each page to get an overview
    except Exception as e:
        print(f"Error: {e}")

parse_pdf('/Users/meme/Antigravity/pokemon_v2/rules/rule.pdf')
