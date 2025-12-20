#!/bin/bash
set -e

# Configurações
REPO_URL="https://github.com/bardusco/opencode-conductor-bridge.git"
INSTALL_DIR="$HOME/.opencode/conductor-bridge"
TARGET_PROJECT=$(pwd)

echo "🚀 Instalando OpenCode Conductor Bridge..."

# 1. Garantir que o diretório base existe
mkdir -p "$HOME/.opencode"

# 2. Clonar ou Atualizar a Bridge
if [ -d "$INSTALL_DIR" ]; then
    echo "     - Atualizando bridge existente em $INSTALL_DIR..."
    cd "$INSTALL_DIR"
    git pull origin main
    git submodule update --init --recursive
else
    echo "     - Clonando bridge em $INSTALL_DIR..."
    git clone --recursive "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 3. Instalar dependências e Sincronizar
echo "     - Instalando dependências..."
npm install --quiet
echo "     - Sincronizando comandos..."
npm run sync

# 4. Vincular ao projeto atual
echo "     - Vinculando comandos ao projeto em $TARGET_PROJECT..."
npx tsx scripts/setup-bridge.ts "$TARGET_PROJECT"

echo ""
echo "✅ Pronto! Os comandos /conductor.* já estão disponíveis neste projeto."
echo "💡 Para atualizar no futuro, basta rodar este script novamente ou usar /conductor.bridge-update"
