"""JEV router: zero-shot decision model with calibrated probabilities."""

from switchless.routers.base import Decision, Router


class JEVRouter(Router):
    name = "jev"

    def route(self, text: str) -> Decision:
        raise NotImplementedError
