from pathlib import Path

from services.genomic_modifier import GenomicModifier

SNP_PATH = Path(__file__).resolve().parent.parent / "data" / "snp_effects.json"


def _gm():
    return GenomicModifier(SNP_PATH)


def test_empty_genotypes_returns_neutral():
    mod = _gm().combined_modifier({})
    assert mod == {"amplitude": 1.0, "clearance": 1.0, "fasting_offset": 0.0}


def test_tcf7l2_ct_increases_amplitude():
    base = _gm().combined_modifier({"TCF7L2": "CC"})
    ct = _gm().combined_modifier({"TCF7L2": "CT"})
    tt = _gm().combined_modifier({"TCF7L2": "TT"})
    assert ct["amplitude"] > base["amplitude"]
    assert tt["amplitude"] > ct["amplitude"]
    assert ct["clearance"] < base["clearance"]


def test_gck_ct_adds_fasting_offset():
    base = _gm().combined_modifier({"GCK": "CC"})
    ct = _gm().combined_modifier({"GCK": "CT"})
    tt = _gm().combined_modifier({"GCK": "TT"})
    assert ct["fasting_offset"] > base["fasting_offset"]
    assert tt["fasting_offset"] > ct["fasting_offset"]


def test_unknown_gene_is_ignored():
    mod = _gm().combined_modifier({"NOT_A_REAL_GENE": "AA"})
    assert mod == {"amplitude": 1.0, "clearance": 1.0, "fasting_offset": 0.0}


def test_unknown_genotype_for_known_gene_is_ignored():
    base = _gm().combined_modifier({"TCF7L2": "CC"})
    weird = _gm().combined_modifier({"TCF7L2": "AA"})
    assert base == weird


def test_modifiers_compose_multiplicatively():
    one = _gm().combined_modifier({"TCF7L2": "TT"})
    two = _gm().combined_modifier({"TCF7L2": "TT", "MTNR1B": "GG"})
    assert two["amplitude"] > one["amplitude"]
    assert two["fasting_offset"] > one["fasting_offset"]


def test_interpret_returns_string():
    gm = _gm()
    assert isinstance(gm.interpret("TCF7L2", "CT"), str)
    assert gm.interpret("NOT_A_GENE", "CC") == "Unknown variant"
