from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.deps import get_current_user
from app.models.student import Student
from app.models.user import User
from app.models.session import Session as SessionModel
from app.models.word_mastery import WordMastery
from app.schemas.student import StudentCreate, StudentResponse
import uuid

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/", response_model=list[StudentResponse])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all students for exercise selection."""
    return db.query(Student).order_by(Student.name).all()


@router.post("/", response_model=StudentResponse)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = Student(name=data.name, age=data.age)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == str(student_id)).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/{student_id}/mastery")
def get_mastery(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all words this student has practiced,
    sorted from weakest to strongest.
    Frontend can use this to show a struggling words list.
    """
    sid = str(student_id)
    student = db.query(Student).filter(Student.id == sid).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    words = (
        db.query(WordMastery)
        .filter(WordMastery.student_id == sid)
        .order_by(WordMastery.mastery_score.asc())
        .all()
    )

    return {
        "student_id":   str(student_id),
        "student_name": student.name,
        "total_words_practiced": len(words),
        "words": [
            {
                "word":          wm.word,
                "mastery_score": round(wm.mastery_score, 3),
                "times_seen":    wm.times_seen,
                "times_correct": wm.times_correct,
                "status":        (
                    "mastered"    if wm.mastery_score >= 0.8  else
                    "improving"   if wm.mastery_score >= 0.5  else
                    "struggling"
                )
            }
            for wm in words
        ]
    }


@router.get("/{student_id}/stats")
def get_stats(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a full progress report for this student.
    Dashboard uses this to show charts and summaries.
    """
    sid = str(student_id)
    student = db.query(Student).filter(Student.id == sid).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # all submitted sessions
    sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.student_id == sid,
            SessionModel.score.isnot(None)
        )
        .order_by(SessionModel.submitted_at.asc())
        .all()
    )

    # average score
    avg_score = (
        round(sum(s.score for s in sessions) / len(sessions), 3)
        if sessions else 0.0
    )

    # score trend — last 10 sessions
    score_trend = [round(s.score, 3) for s in sessions[-10:]]

    # word mastery breakdown
    all_words = db.query(WordMastery).filter(
        WordMastery.student_id == sid
    ).all()

    mastered   = [w.word for w in all_words if w.mastery_score >= 0.8]
    struggling = [w.word for w in all_words if w.mastery_score <  0.5]

    # collect all character errors across all sessions
    confusion_pairs = {}
    for s in sessions:
        for err in (s.char_errors or []):
            if err.get("error_type") in ("substitution", "reversal"):
                pair = f"{err.get('expected_char')} -> {err.get('actual_char')}"
                confusion_pairs[pair] = confusion_pairs.get(pair, 0) + 1

    # sort by most frequent
    top_confusions = sorted(
        confusion_pairs.items(), key=lambda x: x[1], reverse=True
    )[:5]

    # exercise type breakdown
    type_scores = {}
    for s in sessions:
        from app.models.exercise import Exercise
        ex = db.query(Exercise).filter(Exercise.id == s.exercise_id).first()
        if ex:
            if ex.type not in type_scores:
                type_scores[ex.type] = []
            type_scores[ex.type].append(s.score)

    type_accuracy = {
        t: round(sum(scores) / len(scores), 3)
        for t, scores in type_scores.items()
    }

    return {
        "student_id":            str(student_id),
        "student_name":          student.name,
        "current_difficulty":    student.difficulty_level,
        "total_sessions":        len(sessions),
        "average_score":         avg_score,
        "score_trend":           score_trend,
        "words_mastered":        mastered,
        "words_struggling":      struggling,
        "total_words_practiced": len(all_words),
        "top_confusion_pairs":   [
            {"pattern": pair, "count": count}
            for pair, count in top_confusions
        ],
        "accuracy_by_type":      type_accuracy
    }