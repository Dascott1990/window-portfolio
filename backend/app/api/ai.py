"""
app/api/ai.py
Proxy for Groq API — streams SSE to the browser.
Groq is free, fast, and uses the same OpenAI-compatible streaming format.
"""
import os
import json
import requests
from flask import Blueprint, request, Response, stream_with_context
from app.middleware.error_handlers import APIError

ai_bp = Blueprint("ai", __name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


@ai_bp.post("/chat")
def chat():
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise APIError("GROQ_API_KEY not configured on server", 500)

    body = request.get_json(force=True)
    if not body.get("messages"):
        raise APIError("messages is required", 400)

    # Groq uses OpenAI format — system prompt goes as first message
    system_prompt = body.get("system", "")
    user_messages = body.get("messages", [])

    groq_messages = []
    if system_prompt:
        groq_messages.append({"role": "system", "content": system_prompt})
    groq_messages.extend(user_messages)

    groq_body = {
        "model":       "llama-3.3-70b-versatile",  # best free Groq model
        "messages":    groq_messages,
        "max_tokens":  body.get("max_tokens", 1024),
        "stream":      True,
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type":  "application/json",
    }

    def generate():
        with requests.post(
            GROQ_API_URL,
            headers=headers,
            json=groq_body,
            stream=True,
            timeout=120,
        ) as r:
            if not r.ok:
                try:
                    err = r.json().get("error", {}).get("message", f"HTTP {r.status_code}")
                except Exception:
                    err = f"HTTP {r.status_code}"
                # Emit as Anthropic-compatible error so frontend handles it
                yield f"data: {json.dumps({'type': 'error', 'message': err})}\n\n"
                return

            # Groq streams OpenAI-format SSE — translate each chunk to
            # Anthropic content_block_delta format so the frontend works
            # without any changes.
            for line in r.iter_lines():
                if not line:
                    continue
                decoded = line.decode("utf-8")
                if not decoded.startswith("data: "):
                    continue
                data = decoded[6:].strip()
                if data == "[DONE]":
                    yield f"data: {json.dumps({'type': 'message_stop'})}\n\n"
                    return
                try:
                    chunk = json.loads(data)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    text  = delta.get("content", "")
                    if text:
                        # Emit in Anthropic SSE format — frontend reads this
                        yield f"data: {json.dumps({'type': 'content_block_delta', 'delta': {'type': 'text_delta', 'text': text}})}\n\n"
                    # Emit usage if present (finish chunk)
                    usage = chunk.get("x_groq", {}).get("usage", {})
                    if usage:
                        yield f"data: {json.dumps({'type': 'message_delta', 'usage': {'output_tokens': usage.get('completion_tokens', 0)}})}\n\n"
                except Exception:
                    continue

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",
            "Access-Control-Allow-Origin": "*",
        },
    )