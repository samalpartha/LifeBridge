from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import io
import os

app = FastAPI(title="LifeBridge DocGen Service", version="1.0.0")

# Setup Jinja2
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

class RenderRequest(BaseModel):
    template_id: str
    data: Dict[str, Any]
    options: Optional[Dict[str, Any]] = {}

@app.get("/health")
def health_check():
    """Health check endpoint for orchestration & monitoring."""
    return {"status": "UP", "service": "docgen"}

@app.post("/render")
async def render_pdf(request: RenderRequest):
    """
    Render a PDF from a template and data.
    """
    try:
        # Security check: prevent directory traversal
        if ".." in request.template_id or request.template_id.startswith("/"):
            raise HTTPException(status_code=400, detail="Invalid template ID")
            
        template_name = f"{request.template_id}.html"
        
        try:
            template = env.get_template(template_name)
        except Exception:
            raise HTTPException(status_code=404, detail=f"Template '{request.template_id}' not found")
        
        # Render HTML
        html_content = template.render(**request.data)
        
        # Convert to PDF
        pdf_file = io.BytesIO()
        HTML(string=html_content).write_pdf(pdf_file)
        pdf_file.seek(0)
        
        return StreamingResponse(
            pdf_file,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={request.template_id}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rendering PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal rendering error")
