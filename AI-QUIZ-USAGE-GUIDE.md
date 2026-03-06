# AI Quiz Generation - Usage Guide

## ✅ Valid Input Examples

### Example 1: Using Concepts (Comma-separated)
```json
{
  "concepts": "Java loops, for loops, while loops, do-while loops",
  "paragraph": "",
  "numberOfQuestions": 5,
  "difficulty": "Medium"
}
```

### Example 2: Using a Topic Paragraph
```json
{
  "concepts": "",
  "paragraph": "In Java, loops are control structures that allow code to be executed repeatedly. The for loop is ideal when you know the number of iterations in advance. While loops continue as long as a condition remains true.",
  "numberOfQuestions": 3,
  "difficulty": "Easy"
}
```

### Example 3: Advanced Topics
```json
{
  "concepts": "Inheritance, Polymorphism, Encapsulation, Abstraction",
  "paragraph": "",
  "numberOfQuestions": 7,
  "difficulty": "Hard"
}
```

---

## ❌ Invalid Input (What NOT to Send)

**Don't send UI text or page content:**
```json
{
  "concepts": "← Back Create Quiz Build a quiz...",  ❌ WRONG
  "paragraph": "⚙️ Quiz Setup ❓ Questions...",       ❌ WRONG
  ...
}
```

---

## 🔧 Testing the API

### Option 1: Using PowerShell Script
```powershell
cd backend
.\test-quiz-api.ps1
# Edit the script first to add your JWT token
```

### Option 2: Using cURL
```bash
curl -X POST http://localhost:5000/api/ai/generate-quiz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "concepts": "Python functions, lambda, decorators",
    "paragraph": "",
    "numberOfQuestions": 5,
    "difficulty": "Medium"
  }'
```

---

## 🎯 How to Use the Frontend Form

1. **Navigate to Create Quiz page**
2. **Click "Generate with AI" tab**
3. **Clear both input fields** (make sure they're empty)
4. **Enter ONLY your content:**
   - **Either** type concepts like: `Java loops, arrays, methods`
   - **Or** paste a paragraph about the topic
5. **Click "Generate Questions"**

---

## 🐛 If You Still Get Errors

### Problem: UI text appearing in inputs
**Solutions:**
1. **Refresh the page** (F5)
2. **Try Incognito/Private mode**
3. **Disable browser extensions** (especially form fillers)
4. **Clear browser cache**
5. **Try a different browser**

### Problem: "AI service quota exceeded"
The system now **automatically falls back to Gemini** when OpenAI fails, so this should work now.

### Problem: "AI service not configured"
Make sure your `.env` file has at least one of:
- `OPENAI_API_KEY=your_key`
- `GEMINI_API_KEY=your_key`

---

## 📋 Expected Response

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question": "What is the purpose of a for loop in Java?",
        "optionA": "To define a method",
        "optionB": "To repeat code a specific number of times",
        "optionC": "To create objects",
        "optionD": "To handle exceptions",
        "correctAnswer": "B"
      },
      ...
    ]
  }
}
```

---

## 🔍 Validation Rules

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `concepts` | string | One of concepts or paragraph | Any text (educational content) |
| `paragraph` | string | One of concepts or paragraph | Any text (educational content) |
| `numberOfQuestions` | number | Yes | Between 1 and 20 |
| `difficulty` | string | Yes | Must be "Easy", "Medium", or "Hard" |

---

## 📞 Still Having Issues?

Check the backend logs for detailed error messages:
```
[AI] Generate quiz request received
[AI] Request body: { ... }
```

This will show exactly what's being sent to the API.
