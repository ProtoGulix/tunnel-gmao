# Chaîner les exceptions (raise ... from e)

ruff B904 : 43 `raise` dans des blocs except sans `from e`, ce qui perd la cause dans les traces. Désactivé dans ruff.toml pour démarrer ; à reprendre module par module, puis réactiver la règle.
