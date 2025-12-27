import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import ServerStatus from "@/components/ServerStatus";
import {
  Box,
  Card,
  Container,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  Callout,
  Separator
} from "@radix-ui/themes";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirection uniquement si déjà authentifié au chargement initial
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = localStorage.getItem("redirect_after_login");
      if (redirectUrl) {
        localStorage.removeItem("redirect_after_login");
        navigate(redirectUrl, { replace: true });
      } else {
        navigate("/interventions", { replace: true });
      }
    }
  }, []);  // Seulement au montage

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      
      // Récupérer l'URL de redirection sauvegardée
      const redirectUrl = localStorage.getItem("redirect_after_login");
      if (redirectUrl) {
        localStorage.removeItem("redirect_after_login");
        navigate(redirectUrl, { replace: true });
      } else {
        navigate("/interventions", { replace: true });
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      
      if (err.code === 'ERR_NETWORK') {
        setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
      } else if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else {
        setError("Une erreur est survenue lors de la connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--gray-2)",
        padding: "1rem"
      }}
    >
      <Container size="1" style={{ maxWidth: "420px" }}>
          <Card size="4">
            <Flex direction="column" gap="4">
              {/* Header */}
              <Flex direction="column" align="center" gap="2">
                <Box
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent-9), var(--purple-9))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem"
                  }}
                >
                  ⚙️
                </Box>
                <Heading size="6" align="center">
                  GMAO MVP
                </Heading>
                <Text size="2" color="gray" align="center">
                  Gestion de Maintenance Assistée par Ordinateur
                </Text>
              </Flex>

              <Separator size="4" />

              {/* Server Status */}
              <ServerStatus showDetails={true} />

              {/* Error Message */}
              {error && (
                <Callout.Root color="red" size="1">
                  <Callout.Icon>⚠️</Callout.Icon>
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="3">
                  <Box>
                    <Text size="2" weight="medium" as="label" mb="1" style={{ display: "block" }}>
                      Email
                    </Text>
                    <TextField.Root
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre@email.com"
                      autoComplete="email"
                      disabled={loading}
                      size="3" />
                  </Box>

                  <Box>
                    <Text size="2" weight="medium" as="label" mb="1" style={{ display: "block" }}>
                      Mot de passe
                    </Text>
                    <TextField.Root
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={loading}
                      size="3" />
                  </Box>

                  <Button
                    type="submit"
                    size="3"
                    disabled={loading}
                    style={{ width: "100%", marginTop: "0.5rem" }}
                  >
                    {loading ? (
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid currentColor",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite"
                          }} />
                        Connexion...
                      </Flex>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </Flex>
              </form>

              <Separator size="4" />

              {/* Info Box */}
              <Callout.Root color="blue" size="1">
                <Callout.Icon>ℹ️</Callout.Icon>
                <Callout.Text>
                  <Text size="1" weight="bold" style={{ display: "block", marginBottom: "2px" }}>
                    Mode hors ligne disponible
                  </Text>
                  <Text size="1" color="gray">
                    Les données en cache restent accessibles sans connexion
                  </Text>
                </Callout.Text>
              </Callout.Root>
            </Flex>
          </Card>

          {/* Footer */}
          <Box mt="4">
            <Text size="1" align="center" color="gray">
              © 2024 GMAO MVP - Tous droits réservés
            </Text>
          </Box>
        </Container>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
