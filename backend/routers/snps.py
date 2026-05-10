from fastapi import APIRouter

from deps import state

router = APIRouter()


@router.get("/api/snps")
def list_snps():
    """SNP definitions for the genomic overlay panel (used client-side for instant re-render)."""
    return state.genomic_modifier.get_snp_definitions()
