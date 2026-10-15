"""LLM router: asks a general-purpose LLM to pick the service."""

from switchless.routers.base import Decision, Router


class LLMRouter(Router):
    name = "llm"

    def route(self, text: str) -> Decision:
        raise NotImplementedError
