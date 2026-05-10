import json
from pathlib import Path


class GenomicModifier:
    """Literature-based SNP effect lookup. Combines per-gene modifiers multiplicatively."""

    def __init__(self, snp_path: Path):
        self.snps = json.loads(Path(snp_path).read_text())

    def get_snp_definitions(self) -> dict:
        return self.snps

    def combined_modifier(self, genotypes: dict[str, str]) -> dict:
        """Given e.g. {'TCF7L2': 'CT', 'GCK': 'CC', ...}, return multiplicative
        modifier dict: {'amplitude': float, 'clearance': float, 'fasting_offset': float}."""
        amplitude = 1.0
        clearance = 1.0
        fasting_offset = 0.0
        for gene, genotype in genotypes.items():
            if gene not in self.snps:
                continue
            mods = self.snps[gene]["modifiers"].get(genotype)
            if not mods:
                continue
            amplitude *= mods["amplitude"]
            clearance *= mods["clearance"]
            fasting_offset += mods["fasting_offset"]
        return {
            "amplitude": amplitude,
            "clearance": clearance,
            "fasting_offset": fasting_offset,
        }

    def interpret(self, gene: str, genotype: str) -> str:
        if gene not in self.snps:
            return "Unknown variant"
        return self.snps[gene]["interpretations"].get(genotype, "Unknown genotype")
