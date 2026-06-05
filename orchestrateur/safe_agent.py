"""
Circuit-breaker wrapper pour agents Claude — Moteurs.com
Prévient les boucles infinies et limite la conso API.

FIX 2026-06-04 : suppression du signal.SIGALRM (interdit hors main thread).
Remplacement par httpx.Timeout thread-safe + catch anthropic.APITimeoutError.

OPTIM 2026-06-05 : prompt caching activé (anthropic-beta: prompt-caching-2024-07-31)
- system prompt mis en cache automatiquement si passé en str → converti en liste cache_control
- modèle par défaut changé : claude-opus-4-6 → claude-sonnet-4-6
- log cache_ratio ajouté dans Railway logs
"""

import logging
from typing import Optional

import httpx
import anthropic

logger = logging.getLogger(__name__)


class AgentTimeoutError(Exception):
    """Agent dépassé le timeout."""
    pass


class AgentMaxIterationsError(Exception):
    """Agent dépassé max_iterations."""
    pass


class SafeAgent:
    """Wrapper sécurisé pour appels Anthropic avec prompt caching."""

    def __init__(
        self,
        api_key: str,
        name: str,
        max_iterations: int = 5,
        timeout_seconds: int = 300,
        model: str = "claude-sonnet-4-6"  # ← était claude-opus-4-6
    ):
        # ✅ httpx.Timeout — thread-safe, pas de signal.alarm()
        self.client = anthropic.Anthropic(
            api_key=api_key,
            # ✅ Header prompt caching activé pour tous les agents
            default_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
            http_client=httpx.Client(
                timeout=httpx.Timeout(
                    connect=10.0,
                    read=float(timeout_seconds),
                    write=30.0,
                    pool=10.0,
                )
            )
        )
        self.name = name
        self.max_iterations = max_iterations
        self.timeout_seconds = timeout_seconds
        self.model = model
        self.iteration_count = 0
        self.tool_call_history = {}

    def call(
        self,
        messages: list,
        tools: Optional[list] = None,
        system: Optional[str] = None,
        max_tokens: int = 4096
    ) -> dict:
        """
        Appel sécurisé à Anthropic avec protections.

        Returns:
            dict avec keys:
                - 'success': bool
                - 'content': contenu de la réponse ou erreur
                - 'iterations': nombre d'itérations
                - 'stop_reason': raison d'arrêt
                - 'error_type': 'timeout'|'max_iterations'|'api'|None
        """
        self.iteration_count = 0
        self.tool_call_history = {}

        try:
            return self._execute(messages, tools, system, max_tokens)
        except AgentTimeoutError as e:
            logger.error(f"[{self.name}] TIMEOUT: {e}")
            return {
                'success': False,
                'content': str(e),
                'error_type': 'timeout',
                'iterations': self.iteration_count
            }
        except AgentMaxIterationsError as e:
            logger.error(f"[{self.name}] MAX_ITERATIONS: {e}")
            return {
                'success': False,
                'content': str(e),
                'error_type': 'max_iterations',
                'iterations': self.iteration_count
            }
        except (httpx.TimeoutException, anthropic.APITimeoutError) as e:
            # ✅ Timeout réseau/API capturé proprement (remplace signal.alarm)
            logger.error(f"[{self.name}] TIMEOUT réseau : {e}")
            return {
                'success': False,
                'content': str(e),
                'error_type': 'timeout',
                'iterations': self.iteration_count
            }
        except anthropic.APIError as e:
            logger.error(f"[{self.name}] API ERROR: {e}")
            return {
                'success': False,
                'content': str(e),
                'error_type': 'api',
                'iterations': self.iteration_count
            }
        except Exception as e:
            logger.error(f"[{self.name}] ERROR: {e}")
            return {
                'success': False,
                'content': str(e),
                'error_type': 'exception',
                'iterations': self.iteration_count
            }

    def _build_system_with_cache(self, system: str) -> list:
        """
        Convertit un system prompt str en liste avec cache_control ephemeral.
        Le contenu statique est mis en cache côté Anthropic (TTL 5 min, renouvelé à chaque hit).
        Gain : ~90 % de réduction sur les tokens d'entrée après le 1er appel.
        """
        return [
            {
                "type": "text",
                "text": system,
                "cache_control": {"type": "ephemeral"},
            }
        ]

    def _execute(
        self,
        messages: list,
        tools: Optional[list],
        system: Optional[str],
        max_tokens: int
    ) -> dict:
        """Exécute l'appel Anthropic avec protections et prompt caching."""

        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": messages,
        }

        # ✅ Prompt caching : system str → liste avec cache_control
        if system is not None:
            if isinstance(system, str):
                kwargs["system"] = self._build_system_with_cache(system)
            else:
                # Déjà une liste (cache_control déjà posé manuellement) — on laisse
                kwargs["system"] = system

        if tools:
            kwargs["tools"] = tools

        response = self.client.messages.create(**kwargs)

        # Si tool_use et boucle agentic
        if response.stop_reason == "tool_use":
            for block in response.content:
                if hasattr(block, 'name'):
                    tool_name = block.name
                    self.tool_call_history[tool_name] = (
                        self.tool_call_history.get(tool_name, 0) + 1
                    )

                    # 🚨 Détecte boucle : même outil > 3 fois
                    if self.tool_call_history[tool_name] > 3:
                        raise AgentMaxIterationsError(
                            f"Boucle d'outil: {tool_name} x{self.tool_call_history[tool_name]}"
                        )

            if self.iteration_count >= self.max_iterations:
                raise AgentMaxIterationsError(
                    f"Max iterations ({self.max_iterations}) atteint"
                )

        # Extraire le texte final et/ou tool_use
        final_text = ""
        tool_use_block = None
        for block in response.content:
            if hasattr(block, 'text'):
                final_text += block.text
            if hasattr(block, 'type') and block.type == "tool_use":
                tool_use_block = block

        # ✅ Log token usage étendu — cache_ratio visible dans Railway logs
        usage = getattr(response, 'usage', None)
        input_tokens = getattr(usage, 'input_tokens', 0) if usage else 0
        output_tokens = getattr(usage, 'output_tokens', 0) if usage else 0
        cache_read = getattr(usage, 'cache_read_input_tokens', 0) if usage else 0
        cache_create = getattr(usage, 'cache_creation_input_tokens', 0) if usage else 0
        cache_ratio = cache_read / max(cache_read + input_tokens, 1)

        if usage:
            logger.info(
                f"[{self.name}] tokens — in={input_tokens} out={output_tokens} "
                f"cache_read={cache_read} cache_create={cache_create} "
                f"cache_ratio={cache_ratio:.0%} "
                f"total={input_tokens + output_tokens}"
            )

        return {
            'success': True,
            'content': final_text,
            'tool_use': tool_use_block,
            'response': response,
            'iterations': self.iteration_count,
            'stop_reason': response.stop_reason,
            'error_type': None,
            'tokens': {
                'input': input_tokens,
                'output': output_tokens,
                'cache_read': cache_read,
                'cache_create': cache_create,
            },
        }


# ============================================================================
# Instances par agent — modèles inchangés sauf défaut SafeAgent
# ============================================================================

def get_veille_agent(api_key: str) -> SafeAgent:
    """Agent Veille avec 10 min timeout."""
    return SafeAgent(
        api_key=api_key,
        name="veille",
        max_iterations=10,
        timeout_seconds=600,
        model="claude-haiku-4-5-20251001"
    )


def get_redaction_agent(api_key: str) -> SafeAgent:
    """Agent Rédaction avec 5 min timeout."""
    return SafeAgent(
        api_key=api_key,
        name="redaction",
        max_iterations=5,
        timeout_seconds=300,
        model="claude-sonnet-4-6"
    )


def get_social_agent(api_key: str) -> SafeAgent:
    """Agent Social avec 2 min timeout."""
    return SafeAgent(
        api_key=api_key,
        name="social",
        max_iterations=3,
        timeout_seconds=120,
        model="claude-haiku-4-5-20251001"
    )


def get_alerte_gov_agent(api_key: str) -> SafeAgent:
    """Agent Alerte Gov avec 5 min timeout."""
    return SafeAgent(
        api_key=api_key,
        name="alerte_gov",
        max_iterations=5,
        timeout_seconds=300,
        model="claude-haiku-4-5-20251001"
    )


def get_seo_agent(api_key: str) -> SafeAgent:
    """Agent SEO avec 5 min timeout."""
    return SafeAgent(
        api_key=api_key,
        name="seo",
        max_iterations=5,
        timeout_seconds=300,
        model="claude-sonnet-4-6"
    )
