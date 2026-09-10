import sys
import json
import base64
import io
from pypdf import PdfReader

# Force UTF-8 on Windows console stdout/stderr
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

def extract_text_from_pdf(input_data, is_base64=True):
    try:
        if is_base64:
            pdf_bytes = base64.b64decode(input_data)
            stream = io.BytesIO(pdf_bytes)
            should_close = False
        else:
            stream = open(input_data, "rb")
            should_close = True
            
        reader = PdfReader(stream)
        extracted = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted.append(text)
                
        if should_close:
            stream.close()

        full_text = "\n".join(extracted)
        return {"success": True, "text": full_text, "pageCount": len(reader.pages)}
    except Exception as e:
        return {"success": False, "error": str(e), "text": ""}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == "--stdin":
            raw_input = sys.stdin.read().strip()
            res = extract_text_from_pdf(raw_input, is_base64=True)
        else:
            res = extract_text_from_pdf(arg, is_base64=False)
        print(json.dumps(res, ensure_ascii=True))
    else:
        print(json.dumps({"success": False, "error": "No input provided"}, ensure_ascii=True))
