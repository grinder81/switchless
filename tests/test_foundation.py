import pytest

from switchless.bench.metrics import cost_per_1000, latency_percentiles, service_accuracy
from switchless.data import DATA_DIR, load_split
from switchless.routers import Decision
from switchless.services import load_services


def test_service_map_loads():
    services = load_services()
    assert len(services) >= 10
    assert all(s.description for s in services.values())


def test_no_intent_assigned_twice():
    seen: list[str] = [i for s in load_services().values() for i in s.intents]
    assert len(seen) == len(set(seen))


@pytest.mark.skipif(not (DATA_DIR / "test.csv").exists(), reason="dataset not downloaded")
def test_dataset_shape():
    train, test = load_split("train"), load_split("test")
    assert len(train) == 10003 and len(test) == 3080
    assert len({e.intent for e in test}) == 77


def test_metrics_on_toy_records():
    records = [
        {"service": "cards", "gold_intent": "card_arrival", "wall_ms": 1.0, "cost_usd": 0.001},
        {"service": "fx", "gold_intent": "card_arrival", "wall_ms": 3.0, "cost_usd": 0.001},
    ]
    assert service_accuracy(records, {"card_arrival": "cards"}) == 0.5
    assert cost_per_1000(records) == pytest.approx(1.0)
    assert latency_percentiles(records)["p50"] == pytest.approx(2.0)


def test_decision_defaults():
    d = Decision(service=None)
    assert d.service is None and d.confidence == 1.0
