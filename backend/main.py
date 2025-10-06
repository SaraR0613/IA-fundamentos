# backend/main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from docx import Document
import re
import os
from typing import List

app = FastAPI(title="Selector de Monitores")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_docx(file_path):
    doc = Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return "\n".join(full_text)

def extract_info(text):
    # Intentamos extraer campos clave usando patrones comunes
    name_match = re.search(r"(?:nombre|Nombre|NOMBRE)[:\s]*([^\n,;]+)", text, re.IGNORECASE)
    career_match = re.search(r"(?:carrera|Carrera|CARRERA|programa|Programa)[:\s]*([^\n,;]+)", text, re.IGNORECASE)
    semester_match = re.search(r"(?:semestre|Semestre|SEMESTRE)[:\s]*(\d+)", text, re.IGNORECASE)

    name = name_match.group(1).strip() if name_match else "Desconocido"
    career = career_match.group(1).strip() if career_match else ""
    semester = int(semester_match.group(1)) if semester_match else 0

    # Extraer materias y notas: "Cálculo I: 4.5", "Física: 4.0", etc.
    grades = {}
    # Busca patrones como "Palabra(s): número" donde número tiene punto opcional
    grade_matches = re.findall(r"([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,})[:\s]*(\d+\.?\d*)", text)
    for match in grade_matches:
        subject = match[0].strip()
        try:
            grade = float(match[1])
            # Filtrar falsos positivos (ej: "Teléfono: 321" → no es nota)
            if 0.0 <= grade <= 5.0:
                grades[subject] = grade
        except:
            continue

    return {
        "name": name,
        "career": career,
        "semester": semester,
        "grades": grades
    }

def calculate_score(candidate, filters):
    score = 0
    subject = filters["subject"]
    min_grade = filters["min_grade"]
    min_semester = filters["min_semester"]
    required_career = filters["career"]

    if candidate["career"].lower() == required_career.lower():
        score += 30
    if candidate["semester"] >= min_semester:
        score += 20
    if subject in candidate["grades"]:
        grade = candidate["grades"][subject]
        if grade >= min_grade:
            score += 40
            if grade >= 4.5:
                score += 10
    return score

@app.post("/process-cvs")
async def process_cvs(
    files: List[UploadFile] = File(...),
    subject: str = Form(...),
    min_semester: int = Form(...),
    career: str = Form(...),
    min_grade: float = Form(...)
):
    filters = {
        "subject": subject,
        "min_semester": min_semester,
        "career": career,
        "min_grade": min_grade
    }

    candidates = []
    for file in files:
        if not file.filename.lower().endswith(".docx"):
            continue

        file_path = f"temp_{file.filename}"
        try:
            with open(file_path, "wb") as f:
                f.write(await file.read())

            text = extract_text_from_docx(file_path)
            info = extract_info(text)
            score = calculate_score(info, filters)

            # Validar que cumpla los criterios mínimos
            if (
                info["career"].lower() == career.lower() and
                info["semester"] >= min_semester and
                subject in info["grades"] and
                info["grades"][subject] >= min_grade
            ):
                candidates.append({
                    "name": info["name"],
                    "score": score,
                    "semester": info["semester"],
                    "grade_in_subject": info["grades"][subject]
                })
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

    # Ordenar por puntaje descendente
    candidates.sort(key=lambda x: x["score"], reverse=True)
    return JSONResponse(candidates)