"""Service map loading and stub microservice handlers."""

from dataclasses import dataclass
from pathlib import Path

import yaml

SERVICE_MAP = Path(__file__).resolve().parents[2] / "config" / "service_map.yaml"


@dataclass(frozen=True)
class Service:
    name: str
    description: str
    intents: tuple[str, ...]


def load_services(path: Path = SERVICE_MAP) -> dict[str, Service]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))["services"]
    return {
        name: Service(name, spec["description"], tuple(spec.get("intents") or ()))
        for name, spec in raw.items()
    }


def intent_to_service(services: dict[str, Service]) -> dict[str, str]:
    return {intent: s.name for s in services.values() for intent in s.intents}


def handle(service: str, text: str) -> str:
    """Stub handler: stands in for the real microservice call."""
    return f"[{service}] handled: {text}"
