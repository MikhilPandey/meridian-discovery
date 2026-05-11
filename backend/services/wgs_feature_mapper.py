"""Future WGS / VCF feature mapper.

Demo mode (today) accepts 23andMe-style raw genotype TXT files and extracts a
hand-picked panel of 5 SNPs (TCF7L2, GCK, SLC30A8, MTNR1B, PPARG) in the
browser. This is intentionally lightweight — it lets the demo run with files
users can export from consumer DTC platforms in a few clicks.

Production mode (planned) is WGS-led:
  - VCF ingestion (per-sample, multi-sample, or population-VCF)
  - Variant annotation via VEP / SnpEff with cached releases
  - Ancestry-aware risk interpretation
  - Pharmacogenomic markers (CYP2C9, CYP2C19, SLCO1B1, etc.)
  - Polygenic features (PRS-CS or LDpred-2 scores for T2D, lipids, BMI)
  - Privacy-preserving local computation (on-device variant calling where
    feasible; otherwise enclave-based aggregation)

This module is a placeholder. None of the production behavior is implemented
in this repository — it's a marker for where that work plugs in.
"""

from __future__ import annotations

from pathlib import Path


def map_vcf_to_metabolic_features(vcf_path: str | Path) -> dict:
    """Production-mode entry point. Not implemented in the demo."""
    raise NotImplementedError(
        "WGS / VCF ingestion is not implemented in the demo. "
        "The current demo extracts 5 SNPs client-side from 23andMe-style TXT files. "
        "Production builds will replace this with a real VCF parser, annotation "
        "pipeline, and polygenic feature computation."
    )


def extract_pharmacogenomic_panel(vcf_path: str | Path) -> dict:
    """Stub for the planned pharmacogenomic adapter."""
    raise NotImplementedError("Pharmacogenomic panel extraction is a Phase 2 feature.")
