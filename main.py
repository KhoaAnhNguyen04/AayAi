import os
import json

from fastapi import FastAPI, Body
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

DATA_FILE = "data.json"

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")


def read_data():
    if not os.path.exists(DATA_FILE):
        return {
            "sources": [],
            "duplicate_groups": [],
            "source_sync_configs": [],
        }

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return {
            "sources": data,
            "duplicate_groups": [],
            "source_sync_configs": [],
        }

    data.setdefault("sources", [])
    data.setdefault("duplicate_groups", [])
    data.setdefault("source_sync_configs", [])

    return data


def write_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.get("/", response_class=HTMLResponse)
@app.get("/sources", response_class=HTMLResponse)
@app.get("/datasources", response_class=HTMLResponse)
@app.get("/data-sources", response_class=HTMLResponse)
def sources_page(request: Request):
    return templates.TemplateResponse("sources.html", {"request": request})


@app.get("/duplicates", response_class=HTMLResponse)
def duplicates_page(request: Request):
    return templates.TemplateResponse("duplicates.html", {"request": request})


@app.get("/config", response_class=HTMLResponse)
@app.get("/configuration", response_class=HTMLResponse)
@app.get("/configurations", response_class=HTMLResponse)
def configurations_page(request: Request):
    return templates.TemplateResponse("configurations.html", {"request": request})

@app.get("/api/sources")
def get_sources():
    data = read_data()
    return data.get("sources", [])


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
    return data.get("duplicate_groups", [])


@app.post("/api/duplicates")
async def save_duplicate_groups(duplicate_groups: list = Body(...)):
    data = read_data()
    data["duplicate_groups"] = duplicate_groups
    write_data(data)

    return {
        "status": "success",
        "count": len(duplicate_groups),
    }


@app.get("/api/source-sync-configs")
def get_source_sync_configs():
    data = read_data()

    sources = data.get("sources", [])
    configs = data.get("source_sync_configs", [])

    configs_by_source_id = {
        int(config.get("source_id")): config
        for config in configs
        if config.get("source_id") is not None
    }

    result = []

    for source in sources:
        source_id = source.get("id")
        if source_id is None:
            continue

        config = configs_by_source_id.get(int(source_id), {})

        result.append({
            "source_id": source_id,
            "source": source.get("source", "-"),
            "icon": source.get("icon", "code"),
            "folder": source.get("folder", "-"),
            "source_status": source.get("status", "-"),
            "last_sync": source.get("last_sync", "-"),
            "last_result": source.get("last_result", "-"),
            "sync_enabled": config.get("sync_enabled", True),
            "interval_value": config.get("interval_value", 6),
            "interval_unit": config.get("interval_unit", "hours"),
            "last_run_at": config.get("last_run_at"),
            "updated_at": config.get("updated_at", "-"),
        })

    return result


@app.post("/api/source-sync-configs")
async def save_source_sync_configs(source_sync_configs: list = Body(...)):
    data = read_data()

    valid_source_ids = {
        int(source.get("id"))
        for source in data.get("sources", [])
        if source.get("id") is not None
    }

    cleaned_configs = []

    for config in source_sync_configs:
        source_id = config.get("source_id")

        if source_id is None:
            continue

        source_id = int(source_id)

        if source_id not in valid_source_ids:
            continue

        interval_value = int(config.get("interval_value") or 1)
        interval_unit = config.get("interval_unit") or "hours"

        if interval_value < 1:
            interval_value = 1

        if interval_unit not in ["minutes", "hours", "days"]:
            interval_unit = "hours"

        cleaned_configs.append({
            "source_id": source_id,
            "sync_enabled": bool(config.get("sync_enabled")),
            "interval_value": interval_value,
            "interval_unit": interval_unit,
            "last_run_at": config.get("last_run_at"),
            "updated_at": config.get("updated_at", "-"),
        })

    data["source_sync_configs"] = cleaned_configs
    write_data(data)

    return {
        "status": "success",
        "count": len(cleaned_configs),
    }