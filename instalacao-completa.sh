#!/bin/bash
# ============================================================
# instalacao-completa.sh
# Instalador automático do boilerplate de e-commerce
# Compatível com Ubuntu 22.04 / Debian 12
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║   INSTALADOR AUTOMÁTICO E-COMMERCE       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================
# VERIFICAÇÕES
# ============================================================
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⚠ Execute como root: sudo ./instalacao-completa.sh${NC}"
  exit 1
fi

# ============================================================
# COLETA DE DADOS
# ============================================================
echo -e "${YELLOW}Preencha as informações abaixo:${NC}\n"

read -p "  Nome da Loja: "                       STORE_NAME
read -p "  Domínio (ex: loja.com.br): "          DOMAIN
read -p "  Porta do servidor (padrão 3002): "    PORT
PORT=${PORT:-3002}
read -p "  WhatsApp (com DDI, ex: 5547999...): " STORE_WHATSAPP
read -p "  Chave PIX: "                          STORE_PIX_KEY

# Nome da pasta baseado no domínio (sem caracteres especiais)
FOLDER_NAME=$(echo "$DOMAIN" | tr '.' '-' | tr '/' '-')
INSTALL_DIR="/var/www/$FOLDER_NAME"

echo ""
echo -e "${YELLOW}Resumo:${NC}"
echo "  Loja:    $STORE_NAME"
echo "  Domínio: $DOMAIN"
echo "  Porta:   $PORT"
echo "  Pasta:   $INSTALL_DIR"
echo ""
read -p "Confirmar instalação? (s/N): " CONFIRM
[[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]] && echo "Cancelado." && exit 0

# ============================================================
# 1. DEPENDÊNCIAS DO SISTEMA
# ============================================================
echo -e "\n${GREEN}[1/6] Instalando dependências do sistema...${NC}"
apt-get update -qq
apt-get install -y nodejs npm nginx curl openssl python3 make g++

# PM2 global
npm install -g pm2 --silent

# ============================================================
# 2. ESTRUTURA DE PASTAS
# ============================================================
echo -e "${GREEN}[2/6] Criando estrutura de pastas em $INSTALL_DIR...${NC}"
mkdir -p "$INSTALL_DIR"/{admin/{css,js},public/{css,js,uploads,products,music},data}

# Copiar arquivos do boilerplate (assumindo que o script está na pasta do projeto)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$SCRIPT_DIR"/. "$INSTALL_DIR"/
chown -R www-data:www-data "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"

# ============================================================
# 3. DEPENDÊNCIAS NODE
# ============================================================
echo -e "${GREEN}[3/6] Instalando dependências Node.js...${NC}"
cd "$INSTALL_DIR"
npm install --silent

# ============================================================
# 4. ARQUIVO .ENV
# ============================================================
echo -e "${GREEN}[4/6] Criando arquivo .env...${NC}"
SESSION_SECRET=$(openssl rand -hex 32)

cat > "$INSTALL_DIR/.env" <<EOF
# Gerado automaticamente em $(date)
PORT=$PORT
NODE_ENV=production

STORE_NAME="$STORE_NAME"
STORE_WHATSAPP=$STORE_WHATSAPP
STORE_PIX_KEY=$STORE_PIX_KEY

SESSION_SECRET=$SESSION_SECRET
DB_PATH=/var/www/$FOLDER_NAME/data/store.db
EOF

chmod 600 "$INSTALL_DIR/.env"

# ============================================================
# 5. NGINX
# ============================================================
echo -e "${GREEN}[5/6] Configurando Nginx...${NC}"
NGINX_CONF="/etc/nginx/sites-available/$FOLDER_NAME.conf"

cp "$INSTALL_DIR/loja.conf" "$NGINX_CONF"
sed -i "s/{{DOMAIN}}/$DOMAIN/g" "$NGINX_CONF"
sed -i "s/{{PORT}}/$PORT/g" "$NGINX_CONF"

# Remover default se existir
[ -f /etc/nginx/sites-enabled/default ] && rm /etc/nginx/sites-enabled/default

ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$FOLDER_NAME.conf"
nginx -t && systemctl reload nginx

# ============================================================
# 6. PM2
# ============================================================
echo -e "${GREEN}[6/6] Iniciando servidor com PM2...${NC}"
cd "$INSTALL_DIR"
pm2 start server.js --name "$FOLDER_NAME" --env production
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

# ============================================================
# CONCLUSÃO
# ============================================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}   ✅ INSTALAÇÃO CONCLUÍDA!                 ${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════╣${NC}"
echo -e "  Loja:    ${BLUE}http://$DOMAIN${NC}"
echo -e "  Admin:   ${BLUE}http://$DOMAIN/admin${NC}"
echo -e "  Usuário: ${YELLOW}admin${NC}  |  Senha: ${YELLOW}admin123${NC}"
echo -e ""
echo -e "  ${RED}⚠ TROQUE A SENHA NO PRIMEIRO ACESSO!${NC}"
echo -e ""
echo -e "  Pasta do projeto: $INSTALL_DIR"
echo -e "  Gerenciar com PM2: pm2 status"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Opcional: SSL com certbot
echo -e "${YELLOW}Para habilitar HTTPS (recomendado):${NC}"
echo "  apt install certbot python3-certbot-nginx -y"
echo "  certbot --nginx -d $DOMAIN"
echo ""
