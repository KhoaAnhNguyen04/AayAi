from pathlib import Path
import json
import os

from dotenv import load_dotenv
from fastapi import Body, FastAPI, Form, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from chainlit.utils import mount_chainlit

load_dotenv()

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

system_config = {
    "api_key": os.getenv("OPENAI_API_KEY", ""),
    "prompt": os.getenv("SYSTEM_PROMPT", "Bạn là trợ lý nội bộ chuyên nghiệp."),
}

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data.json"


def get_empty_data():
    return {
        "sources": [],
        "duplicate_groups": [],
    }


def read_data():
    if not DATA_FILE.exists():
        return get_empty_data()

    try:
        with DATA_FILE.open("r", encoding="utf-8") as f:
            raw_data = json.load(f)
    except json.JSONDecodeError:
        return get_empty_data()

    # Hỗ trợ data.json format cũ: [...]
    if isinstance(raw_data, list):
        return {
            "sources": raw_data,
            "duplicate_groups": [],
        }

    # Hỗ trợ data.json format mới: { sources: [], duplicate_groups: [] }
    if isinstance(raw_data, dict):
        data = get_empty_data()
        data["sources"] = raw_data.get("sources", [])
        data["duplicate_groups"] = raw_data.get("duplicate_groups", [])
        return data

    return get_empty_data()


def write_data(data):
    DATA_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


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
            "prompt": system_config["prompt"],
        },
    )


@app.get("/duplicates")
def get_duplicates_page(request: Request):
    return templates.TemplateResponse(
        "duplicates.html",
        {
            "request": request,
        },
    )


@app.post("/save-config")
def save_config(api_key: str = Form(...), prompt: str = Form(...)):
    system_config["api_key"] = api_key
    system_config["prompt"] = prompt
    return RedirectResponse(url="/config", status_code=303)


@app.get("/api/sources")
def get_sources():
    data = read_data()
    return data["sources"]


@app.post("/api/sources")
async def save_sources(sources: list = Body(...)):
    data = read_data()
    data["sources"] = sources
    write_data(data)

    return {
        "status": "success",
        "count": len(sources),
    }


@app.get("/api/duplicates")
def get_duplicate_groups():
    data = read_data()
    return data["duplicate_groups"]


@app.post("/api/duplicates")
async def save_duplicate_groups(duplicate_groups: list = Body(...)):
    data = read_data()
    data["duplicate_groups"] = duplicate_groups
    write_data(data)

    return {
        "status": "success",
        "count": len(duplicate_groups),
    }


mount_chainlit(app=app, target="chat.py", path="/chat")