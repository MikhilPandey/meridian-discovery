from fastapi import APIRouter

from deps import state

router = APIRouter()


@router.get("/api/meals")
def list_meals():
    return state.meals
