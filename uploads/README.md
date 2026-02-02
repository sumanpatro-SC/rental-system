# PDF Storage Instructions

## How to Use the PDF Search Feature

1. **Place your PDF files** in this `uploads/` folder
2. **Supported format:** `.pdf` files
3. **Example:** Save your documentation as `project-docs.pdf` in this folder

### What Happens
- When a user asks a random question in the chat widget that doesn't match predefined topics (Backend, Database, Frontend, CSS, Scaling)
- The widget automatically searches all PDFs in this folder
- It returns matching paragraphs from the PDF
- Results are displayed in the chat

### Setup
```bash
# Copy your PDF to the uploads folder
cp /path/to/your/documentation.pdf /workspaces/rental-system/uploads/

# Restart the server to pick up changes
# python app.py
```

### Example Questions
- "What is property validation?"
- "How do I configure the system?"
- "Tell me about the API endpoints"
- Any other question will trigger PDF search

### Requirements
- Install PyPDF2 for better PDF parsing (optional):
  ```bash
  pip install PyPDF2
  ```

If PyPDF2 is not installed, the search will still work but may be less accurate.
