# PDF/Documentation Search Feature Guide

## Overview
The chat widget now has **intelligent question answering** that combines:
1. **Pre-built answers** for common topics (Backend, Database, Frontend, CSS, Scaling)
2. **Dynamic PDF/Text search** for any random questions

## How It Works

### For Common Questions
When users ask about these topics, the widget shows predefined detailed answers:
- **Backend Architecture** - Keywords: backend, server, http.server, threading, CORS
- **Database & SQL** - Keywords: database, SQL, schema, foreign key, cascade
- **Frontend (ES6+)** - Keywords: JavaScript, fetch, DOM, async/await, template
- **CSS & UI** - Keywords: CSS, responsive, Flexbox, Grid, Dark Mode
- **Scaling** - Keywords: scale, postgres, pagination, security, payment

### For Random Questions
Any question that doesn't match the above keywords automatically searches your documentation files for an answer.

## Setting Up Documentation Files

### Option 1: Use Text Files (Recommended - No Dependencies)
1. Create `.txt` files in `/uploads/` folder
2. Add your documentation content to these files
3. The system will automatically search them

**Example:**
```
/uploads/project-documentation.txt
/uploads/faq.txt
/uploads/troubleshooting.txt
```

### Option 2: Use PDF Files (Requires PyPDF2)
1. Install PyPDF2: `pip install PyPDF2`
2. Place `.pdf` files in `/uploads/` folder
3. The system automatically extracts and indexes them

## File Structure
```
/workspaces/rental-system/
├── app.py                          # Server with search API
├── uploads/                         # Your documentation folder
│   ├── project-documentation.txt   # Sample docs (included)
│   ├── your-docs.txt               # Add your files here
│   └── another-doc.pdf             # Or PDF files
├── static/
│   └── script.js                   # Widget chat logic
└── templates/
    └── widget.html                 # Chat widget UI
```

## Testing the Feature

### Test in Browser
1. Open http://localhost:8000
2. Click the purple chat icon (bottom-right)
3. Try these test questions:

**Predefined Answers:**
- "Tell me about the backend architecture"
- "How does the database work?"
- "What frontend technologies are used?"

**PDF Search (uses documentation.txt):**
- "What is property management?"
- "How do I export data?"
- "What are the core features?"
- "How does billing work?"

### Test via API (Command Line)
```bash
curl "http://localhost:8000/api/search-pdf?q=billing"
curl "http://localhost:8000/api/search-pdf?q=export"
curl "http://localhost:8000/api/search-pdf?q=tenant"
```

Expected response:
```json
{
  "status": "found",
  "results": [
    "Matching paragraph from documentation...",
    "Another matching paragraph..."
  ]
}
```

## Creating Your Own Documentation

### Text File Format
Create `.txt` files with your content structured in paragraphs separated by two line breaks:

```
## Topic Name
Some detailed explanation here.

## Another Topic
More detailed content that matches user questions.

## Features
List features and details that might be searched.
```

### Tips for Better Search Results
1. **Use clear paragraphs** - Split content into 2-3 sentence paragraphs
2. **Use keywords** - Include relevant keywords naturally in your text
3. **Keep it concise** - Each search result is limited to 500 characters
4. **Avoid special characters** - Stick to plain text (special chars may not index well)

## API Response Format

### Success Response
```json
{
  "status": "found",
  "results": [
    "First matching paragraph...",
    "Second matching paragraph...",
    "Third matching paragraph..."
  ]
}
```

### No Results Response
```json
{
  "status": "not_found",
  "results": []
}
```

## How Search Works

1. User types a question in the chat
2. System checks if it matches predefined topics
3. If no match, it:
   - Searches all `.txt` files in `/uploads/`
   - Searches all `.pdf` files (if PyPDF2 installed)
   - Splits content into paragraphs
   - Finds paragraphs matching the user's keywords
   - Returns top 3 results

## Limitations

- **Search scope**: Only searches `/uploads/` folder
- **PDF support**: Requires PyPDF2 library (text files work without it)
- **Result limit**: Returns max 3 matching paragraphs
- **Result size**: Each result truncated to 500 characters
- **Indexing**: Search is real-time (no pre-indexing)

## Troubleshooting

### Search returning no results
- Check if files exist in `/uploads/` folder
- Ensure file names end with `.txt` or `.pdf`
- Verify file contains relevant keywords
- Check browser console for errors

### Chat showing "searching..." indefinitely
- Check if server is running
- Look at terminal for errors
- Verify `/api/search-pdf` endpoint is responding

### PDF files not being read
- Ensure PyPDF2 is installed: `pip install PyPDF2`
- Check if PDF is readable (not corrupted)
- Try converting PDF to text file instead

## Advanced Configuration

### Adding to Existing Documentation
If you have PDF documentation, you can:
1. Extract text from PDF tools
2. Save as `.txt` file in `/uploads/`
3. Or install PyPDF2 for automatic extraction

### Custom Search Logic
To modify search behavior, edit the `search_pdf_content()` function in `app.py`.

## Examples

### Sample Documentation File
See `/uploads/project-documentation.txt` for a complete example covering:
- System features
- Architecture
- API endpoints
- Database schema
- Troubleshooting
- Installation

### Sample Questions & Answers
```
Q: "What is property management?"
A: [Displays matching section from documentation]

Q: "How do I add a tenant?"
A: [Searches and finds relevant paragraph]

Q: "What's the backend architecture?"
A: [Shows predefined detailed answer]
```

## Future Enhancements
- Full-text search indexing
- Fuzzy matching for typos
- Multi-language support
- Conversation context awareness
- Admin panel to manage docs
