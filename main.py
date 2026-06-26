from fastapi import FastAPI, Form, Request, Body
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles # Import thêm StaticFiles
from chainlit.utils import mount_chainlit
import json # Import thư viện json
import os

app = FastAPI()

# Mount thư mục static để chứa file Javascript
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

system_config = {
    "api_key": "",
    "prompt": "Bạn là trợ lý nội bộ chuyên nghiệp."
}
DATA_FILE = "data.json"

@app.get("/")
def read_root():
    return RedirectResponse(url="/config")

@app.get("/config")
def get_config(request: Request):
    return templates.TemplateResponse(
        "config.html", 
        {
            "request": request, 
            "api_key": system_config["api_key"], 
            "prompt": system_config["prompt"]
        }
    )

@app.post("/save-config")
def save_config(api_key: str = Form(...), prompt: str = Form(...)):
    system_config["api_key"] = api_key
    system_config["prompt"] = prompt
    return RedirectResponse(url="/config", status_code=303)

# --- API MỚI XỬ LÝ FILE JSON ---
@app.get("/api/sources")
def get_sources():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/sources")
def update_sources(data: list = Body(...)):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return {"message": "Lưu thành công"}

mount_chainlit(app=app, target="chat.py", path="/chat")