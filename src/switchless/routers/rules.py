"""Hand-written keyword/pattern rules: the traditional core router."""

from switchless.routers.base import Decision, Router


class RulesRouter(Router):
    name = "rules"

    def route(self, text: str) -> Decision:
        raise NotImplementedError
