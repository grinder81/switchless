"""Hybrid: rules, then JEV, then LLM/human when JEV is below threshold."""

from switchless.routers.base import Decision, Router


class HybridRouter(Router):
    name = "hybrid"

    def route(self, text: str) -> Decision:
        raise NotImplementedError
