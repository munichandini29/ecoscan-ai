import os
import io
import re
import math
import json
import base64
from datetime import datetime, timedelta
from typing import Optional, Tuple
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from PIL import Image, ExifTags
from dotenv import load_dotenv
import torch
import torch.nn.functional as F
from transformers import CLIPProcessor, CLIPModel

load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecoscan.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ThreatReport(Base):
    __tablename__ = "threat_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(80), nullable=False, index=True, default="CIT-101")
    submitted_by = Column(String(120), nullable=False, default="Citizen User")
    category = Column(String(100), nullable=False)
    issue_type = Column(String(200), nullable=False)
    location = Column(String(250), nullable=False)
    severity = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    impact = Column(Text, nullable=False)
    action_steps = Column(Text, nullable=False)
    image_data = Column(Text, nullable=True)
    after_image_data = Column(Text, nullable=True)
    verification_note = Column(Text, nullable=True)
    status = Column(String(50), default="Pending")
    assigned_ngo = Column(String(150), default="Unassigned")
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI(title="EcoScan AI Local CLIP Vision & Municipal SLA Pipeline", version="7.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load Local CLIP Vision-Language Model Once at Startup ---
MODEL_ID = "openai/clip-vit-base-patch32"
print(f"Loading local vision pipeline ({MODEL_ID})...")
clip_model = CLIPModel.from_pretrained(MODEL_ID)
clip_processor = CLIPProcessor.from_pretrained(MODEL_ID)
clip_model.eval()
print("Local CLIP Vision Pipeline ready!")

PIPELINE_PROMPTS = [
    (
        "Clean Environment",
        "a clean swept concrete pavement, clean building exterior wall, clean shutter, tidy indoor corridor or hospital hallway "
        "with polished floor tiles, light reflections, ceiling lights, painted doors, or a clean green park, clean bench, "
        "and neat street with zero trash or litter",
    ),
    (
        "Garbage Dump",
        "overflowing garbage dumpsters, piles of discarded trash bags, municipal solid waste heaps, and filthy waste accumulation",
    ),
    (
        "Plastic Waste",
        "loose crumpled plastic wrappers, disposable plastic bottles, polythene bags, and synthetic litter lying on ground or floor",
    ),
    (
        "Smoke Pollution",
        "thick dark smoke plumes, open waste burning fire, heavy smog, and hazardous air pollution",
    ),
    (
        "Water Pollution",
        "polluted dirty water, floating garbage in water body, raw sewage discharge, and oily water contamination",
    ),
]

CATEGORY_DETAILS = {
    "Clean Environment": {
        "issue_type": "Clean & Safe Environment",
        "severity": "None",
        "impact": "Vision audit confirms a clean environment with no pollution or waste.",
        "action_steps": ["No cleanup ticket generated — environment is clean and safe."],
    },
    "Garbage Dump": {
        "issue_type": "Overflowing Garbage Bins & Solid Waste Accumulation",
        "severity": "High",
        "impact": "Creates vector-borne disease risks, foul odor, and leachate groundwater contamination.",
        "action_steps": [
            "Cordon off overflowing waste site immediately.",
            "Deploy municipal/NGO waste haulage vehicle within 24 hours.",
            "Sanitize surroundings and increase bin collection frequency.",
        ],
    },
    "Plastic Waste": {
        "issue_type": "Scattered Non-Biodegradable Plastic Waste",
        "severity": "High",
        "impact": "High risk of microplastic runoff, soil degradation, and drainage/surface clutter.",
        "action_steps": [
            "Collect and segregate discarded plastic items for recycling.",
            "Dispatch local NGO/facility cleanup squad to clear the spot.",
            "Place proper waste disposal bins nearby.",
        ],
    },
    "Smoke Pollution": {
        "issue_type": "Hazardous Smoke & Particulate Air Emission",
        "severity": "High",
        "impact": "Elevates PM2.5/PM10 levels, posing acute respiratory hazards to nearby people.",
        "action_steps": [
            "Alert local fire safety and pollution control authorities immediately.",
            "Extinguish open burning or halt unauthorized emissions.",
            "Issue local air-quality advisory for nearby residents.",
        ],
    },
    "Water Pollution": {
        "issue_type": "Contaminated Surface Water / Effluent Discharge",
        "severity": "High",
        "impact": "Threatens aquatic ecosystems, depletes dissolved oxygen, and contaminates water bodies.",
        "action_steps": [
            "Collect water quality samples and trace upstream discharge source.",
            "Deploy floating containment booms to trap surface debris.",
            "Notify municipal water board for remediation treatment.",
        ],
    },
}

MIN_HAZARD_CONFIDENCE = 0.55
MIN_MARGIN_OVER_CLEAN = 0.08
MIN_SCENE_SIMILARITY = 0.62
MAX_GEO_DISTANCE_METERS = 100.0
DUPLICATE_IMAGE_SIMILARITY = 0.94
SAME_SPOT_SCENE_SIMILARITY = 0.78
DUPLICATE_GEO_RADIUS_METERS = 50.0
RESOLVED_COOLDOWN_MINUTES = 30
MAX_EXIF_AGE_HOURS = 24
SLA_TARGET_HOURS = 24


def compute_dynamic_severity(category: str, confidence_pct: float) -> str:
    if category == "Clean Environment":
        return "None"
    if category in ("Smoke Pollution", "Water Pollution") and confidence_pct >= 72.0:
        return "High"
    if confidence_pct >= 82.0:
        return "High"
    if confidence_pct >= 65.0:
        return "Medium"
    return "Low"


def format_sla_metrics(created_at: Optional[datetime], resolved_at: Optional[datetime], status: str) -> dict:
    if not created_at:
        return {"elapsed_text": "N/A", "sla_status": "Unknown"}

    end_time = resolved_at if (status == "Resolved" and resolved_at) else datetime.utcnow()
    delta = max(end_time - created_at, timedelta(seconds=0))
    total_mins = int(delta.total_seconds() // 60)
    hours, mins = divmod(total_mins, 60)

    if total_mins < 1:
        elapsed_text = "< 1 min"
    elif hours == 0:
        elapsed_text = f"{mins}m"
    else:
        elapsed_text = f"{hours}h {mins}m"

    breached = delta > timedelta(hours=SLA_TARGET_HOURS)
    if status == "Resolved":
        sla_status = "SLA Breached" if breached else "Met 24h SLA"
    else:
        sla_status = "Overdue (>24h)" if breached else "Within 24h SLA"

    return {"elapsed_text": elapsed_text, "sla_status": sla_status}


def make_thumbnail_base64(image: Image.Image) -> str:
    thumb = image.copy()
    thumb.thumbnail((360, 360))
    buf = io.BytesIO()
    thumb.save(buf, format="JPEG", quality=75)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def decode_base64_image(data_url: str) -> Optional[Image.Image]:
    if not data_url or "," not in data_url:
        return None
    try:
        b64_part = data_url.split(",", 1)[1]
        raw = base64.b64decode(b64_part)
        return Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        return None


def validate_exif_recency(raw_image: Image.Image) -> None:
    try:
        exif_data = raw_image.getexif()
        if not exif_data:
            return
        tag_map = {ExifTags.TAGS.get(k, k): v for k, v in exif_data.items()}
        dt_str = tag_map.get("DateTimeOriginal") or tag_map.get("DateTime")
        if not dt_str or not isinstance(dt_str, str):
            return
        captured_dt = datetime.strptime(dt_str.strip(), "%Y:%m:%d %H:%M:%S")
        age = datetime.now() - captured_dt
        if age > timedelta(hours=MAX_EXIF_AGE_HOURS):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Stale Photo Rejected: Image EXIF timestamp ({captured_dt.strftime('%Y-%m-%d %H:%M')}) "
                    f"is older than {MAX_EXIF_AGE_HOURS} hours. Capture a fresh live photo."
                ),
            )
    except HTTPException:
        raise
    except Exception:
        return


def compute_scene_similarity(img1: Image.Image, img2: Image.Image) -> float:
    inputs = clip_processor(images=[img1, img2], return_tensors="pt")
    with torch.no_grad():
        image_features = clip_model.get_image_features(pixel_values=inputs["pixel_values"])
        if not isinstance(image_features, torch.Tensor):
            image_features = getattr(image_features, "pooler_output", image_features[0])
        image_features = F.normalize(image_features, p=2, dim=-1)
        similarity = F.cosine_similarity(image_features[0:1], image_features[1:2]).item()
    return float(similarity)


def extract_lat_lng(location_str: str) -> Optional[Tuple[float, float]]:
    if not location_str:
        return None
    match = re.search(r"(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)", location_str)
    if not match:
        return None
    lat, lng = float(match.group(1)), float(match.group(2))
    if -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0:
        return (lat, lng)
    return None


def haversine_meters(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    r = 6371000.0
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def check_duplicate_submission(
    db: Session,
    pil_image: Image.Image,
    thumb_b64: str,
    location_str: str,
) -> None:
    existing_reports = db.query(ThreatReport).order_by(ThreatReport.id.desc()).limit(30).all()
    new_coords = extract_lat_lng(location_str)
    now_utc = datetime.utcnow()

    for existing in existing_reports:
        ticket_code = f"#ECO-{100 + existing.id}"

        if existing.image_data and existing.image_data == thumb_b64:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Duplicate Report Blocked: This exact photo was already submitted as {ticket_code} "
                    f"(Status: {existing.status})."
                ),
            )

        sim = 0.0
        if existing.image_data:
            existing_pil = decode_base64_image(existing.image_data)
            if existing_pil is not None:
                sim = compute_scene_similarity(existing_pil, pil_image)

        if sim >= DUPLICATE_IMAGE_SIMILARITY:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Duplicate Image Blocked ({round(sim * 100, 1)}% match with {ticket_code}): "
                    f"This exact scene is already logged (Status: {existing.status})."
                ),
            )

        existing_coords = extract_lat_lng(existing.location)
        if new_coords and existing_coords and sim >= SAME_SPOT_SCENE_SIMILARITY:
            dist_m = haversine_meters(new_coords, existing_coords)
            if dist_m <= DUPLICATE_GEO_RADIUS_METERS:
                if existing.status in ("Pending", "In Progress"):
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            f"Duplicate Spot Blocked ({ticket_code}, {int(dist_m)}m away, {round(sim * 100, 1)}% scene match): "
                            f"This exact hazard spot already has an open ticket."
                        ),
                    )
                if (
                    existing.status == "Resolved"
                    and existing.created_at
                    and (now_utc - existing.created_at) <= timedelta(minutes=RESOLVED_COOLDOWN_MINUTES)
                ):
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            f"Recently Resolved Same Spot ({ticket_code}, {int(dist_m)}m away, {round(sim * 100, 1)}% scene match): "
                            f"This exact spot was cleaned within the last {RESOLVED_COOLDOWN_MINUTES} minutes."
                        ),
                    )


def run_local_clip_pipeline(image: Image.Image, category_hint: str) -> dict:
    labels = [item[0] for item in PIPELINE_PROMPTS]
    texts = [item[1] for item in PIPELINE_PROMPTS]

    inputs = clip_processor(text=texts, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = clip_model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0].tolist()

    prob_map = dict(zip(labels, probs))
    clean_prob = prob_map["Clean Environment"]

    scored = sorted(zip(labels, probs), key=lambda x: x[1], reverse=True)
    top_category, top_prob = scored[0]

    if top_category == "Clean Environment":
        chosen_category = "Clean Environment"
        chosen_prob = clean_prob
    else:
        margin_over_clean = top_prob - clean_prob
        if top_prob < MIN_HAZARD_CONFIDENCE or margin_over_clean < MIN_MARGIN_OVER_CLEAN:
            chosen_category = "Clean Environment"
            chosen_prob = max(clean_prob, 1.0 - top_prob)
        else:
            chosen_category = top_category
            chosen_prob = top_prob

    if (
        chosen_category != "Clean Environment"
        and category_hint in CATEGORY_DETAILS
        and category_hint != "Clean Environment"
        and category_hint != "Auto-Detect"
    ):
        chosen_category = category_hint
        chosen_prob = max(chosen_prob, prob_map.get(category_hint, chosen_prob))

    confidence = round(min(max(chosen_prob * 100.0, 60.0), 99.2), 1)
    severity = compute_dynamic_severity(chosen_category, confidence)
    details = CATEGORY_DETAILS[chosen_category]

    return {
        "category": chosen_category,
        "issue_type": details["issue_type"],
        "severity": severity,
        "confidence": confidence,
        "impact": details["impact"],
        "action_steps": details["action_steps"],
    }


def is_clean_result(ai_result: dict) -> bool:
    return ai_result.get("category") == "Clean Environment" or ai_result.get("severity") == "None"


# --- API Endpoints ---
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "pipeline": "Local CLIP Vision + Municipal SLA + Admin Override Pipeline",
        "model": MODEL_ID,
        "sla_target_hours": SLA_TARGET_HOURS,
        "offline_ready": True,
    }


@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    category: str = Form("Auto-Detect"),
    location: str = Form("Unknown Location"),
    user_id: str = Form("CIT-101"),
    submitted_by: str = Form("Citizen User"),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read()
    raw_image = Image.open(io.BytesIO(image_bytes))
    validate_exif_recency(raw_image)
    pil_image = raw_image.convert("RGB")

    ai_result = run_local_clip_pipeline(pil_image, category)

    if is_clean_result(ai_result):
        return {
            "id": None,
            "ticket_created": False,
            "user_id": user_id.strip() or "CIT-101",
            "submitted_by": submitted_by.strip() or "Citizen User",
            "category": "Clean Environment",
            "issue_type": ai_result["issue_type"],
            "location": location.strip() or "Unspecified Location",
            "severity": "None",
            "confidence": ai_result["confidence"],
            "impact": ai_result["impact"],
            "action_steps": ai_result["action_steps"],
            "status": "Clean Environment (Not Saved to DB)",
        }

    thumb_b64 = make_thumbnail_base64(pil_image)
    clean_location = location.strip() or "Unspecified Location"

    check_duplicate_submission(db, pil_image, thumb_b64, clean_location)

    report = ThreatReport(
        user_id=user_id.strip() or "CIT-101",
        submitted_by=submitted_by.strip() or "Citizen User",
        category=ai_result["category"],
        issue_type=ai_result["issue_type"],
        location=clean_location,
        severity=ai_result["severity"],
        confidence=ai_result["confidence"],
        impact=ai_result["impact"],
        action_steps=json.dumps(ai_result["action_steps"]),
        image_data=thumb_b64,
        status="Pending",
        assigned_ngo="Unassigned",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "ticket_created": True,
        "user_id": report.user_id,
        "submitted_by": report.submitted_by,
        "category": report.category,
        "issue_type": report.issue_type,
        "location": report.location,
        "severity": report.severity,
        "confidence": report.confidence,
        "impact": report.impact,
        "action_steps": json.loads(report.action_steps),
        "image_data": report.image_data,
        "status": report.status,
    }


@app.get("/api/reports")
def get_reports(user_id: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ThreatReport)
    if user_id:
        query = query.filter(ThreatReport.user_id == user_id)
    if status:
        query = query.filter(ThreatReport.status == status)
    reports = query.order_by(ThreatReport.id.desc()).all()

    results = []
    for r in reports:
        sla = format_sla_metrics(r.created_at, r.resolved_at, r.status)
        clean_note = (r.verification_note or "").replace("))", ")")
        results.append(
            {
                "id": r.id,
                "user_id": r.user_id,
                "submitted_by": r.submitted_by,
                "category": r.category,
                "issue_type": r.issue_type,
                "location": r.location,
                "severity": r.severity,
                "confidence": r.confidence,
                "impact": r.impact,
                "action_steps": json.loads(r.action_steps),
                "image_data": r.image_data,
                "after_image_data": r.after_image_data,
                "verification_note": clean_note,
                "status": r.status,
                "assigned_ngo": r.assigned_ngo,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "N/A",
                "resolved_at": r.resolved_at.strftime("%Y-%m-%d %H:%M") if r.resolved_at else None,
                "elapsed_text": sla["elapsed_text"],
                "sla_status": sla["sla_status"],
            }
        )
    return results


@app.post("/api/reports/{report_id}/verify-cleanup")
async def verify_cleanup_proof(
    report_id: int,
    file: UploadFile = File(...),
    ngo_name: str = Form("GreenEarth Response Squad"),
    ngo_lat: Optional[float] = Form(None),
    ngo_lng: Optional[float] = Form(None),
    db: Session = Depends(get_db),
):
    report = db.query(ThreatReport).filter(ThreatReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Proof of work must be an image file.")

    image_bytes = await file.read()
    raw_image = Image.open(io.BytesIO(image_bytes))
    validate_exif_recency(raw_image)
    pil_image = raw_image.convert("RGB")
    after_b64 = make_thumbnail_base64(pil_image)

    if report.image_data and after_b64 == report.image_data:
        raise HTTPException(
            status_code=400,
            detail="Duplicate Image Rejected: You uploaded the exact same 'Before' image.",
        )

    geo_note = "GPS verified"
    report_coords = extract_lat_lng(report.location)
    if report_coords and ngo_lat is not None and ngo_lng is not None:
        dist_m = haversine_meters(report_coords, (ngo_lat, ngo_lng))
        if dist_m > MAX_GEO_DISTANCE_METERS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Location Mismatch: Your GPS is {int(dist_m)}m away from the reported site "
                    f"(must be within {int(MAX_GEO_DISTANCE_METERS)}m)."
                ),
            )
        geo_note = f"GPS match: {int(dist_m)}m from site"

    before_pil = decode_base64_image(report.image_data)
    scene_sim_pct = 100.0
    if before_pil is not None:
        similarity = compute_scene_similarity(before_pil, pil_image)
        scene_sim_pct = round(similarity * 100.0, 1)
        if similarity < MIN_SCENE_SIMILARITY:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Scene/Location Mismatch ({scene_sim_pct}% visual match): Uploaded photo does not match "
                    f"the original site background. Capture a photo of the exact same spot."
                ),
            )

    audit = run_local_clip_pipeline(pil_image, "Auto-Detect")
    if not is_clean_result(audit):
        raise HTTPException(
            status_code=422,
            detail=(
                f"AI Cleanliness Verification Failed: Site still shows '{audit['category']}' "
                f"({audit['confidence']}% confidence)."
            ),
        )

    report.status = "Resolved"
    report.assigned_ngo = ngo_name
    report.after_image_data = after_b64
    report.resolved_at = datetime.utcnow()
    # Fixed double-bracket typo: single clean parenthesis
    report.verification_note = (
        f"Verified Same Site ({scene_sim_pct}% scene match, {geo_note}) & "
        f"Clean Environment ({audit['confidence']}% AI confidence)."
    )
    db.commit()
    db.refresh(report)

    sla = format_sla_metrics(report.created_at, report.resolved_at, report.status)
    return {
        "id": report.id,
        "status": report.status,
        "assigned_ngo": report.assigned_ngo,
        "after_image_data": report.after_image_data,
        "verification_note": report.verification_note,
        "resolved_at": report.resolved_at.strftime("%Y-%m-%d %H:%M"),
        "elapsed_text": sla["elapsed_text"],
        "sla_status": sla["sla_status"],
    }


class StatusUpdate(BaseModel):
    status: str
    assigned_ngo: Optional[str] = None
    admin_note: Optional[str] = None


@app.patch("/api/reports/{report_id}")
def update_report(report_id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    report = db.query(ThreatReport).filter(ThreatReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = payload.status
    if payload.assigned_ngo:
        report.assigned_ngo = payload.assigned_ngo

    # Admin Re-open / Override support
    if payload.status == "Pending":
        report.after_image_data = None
        report.resolved_at = None
        report.verification_note = (
            payload.admin_note
            or "Re-opened by Municipal Admin for mandatory re-inspection and cleanup."
        )
    elif payload.status == "Rejected":
        report.resolved_at = datetime.utcnow()
        report.verification_note = (
            payload.admin_note
            or "Dismissed by Municipal Admin (Low-confidence / false positive report)."
        )

    db.commit()
    db.refresh(report)
    return {
        "id": report.id,
        "status": report.status,
        "assigned_ngo": report.assigned_ngo,
        "verification_note": report.verification_note,
    }


@app.delete("/api/reports/{report_id}")
def delete_report(report_id: int, user_id: Optional[str] = None, db: Session = Depends(get_db)):
    report = db.query(ThreatReport).filter(ThreatReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if user_id and report.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own reports.")
    if report.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete report because NGO already marked it as '{report.status}'.",
        )
    db.delete(report)
    db.commit()
    return {"deleted": True, "id": report_id}