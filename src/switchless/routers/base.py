"""The contract every router implements."""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class Decision:
    service: str | None  # None = abstain / escalate
    intent: str | None = None
    confidence: float = 1.0
    latency_ms: float = 0.0
    cost_usd: float = 0.0
    router: str = ""


class Router(ABC):
    name: str

    @abstractmethod
    def route(self, text: str) -> Decision:
        """Decide which service handles `text`."""
