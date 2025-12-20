#!/bin/bash
set -e

REPO_URL="git@github.com:lyhxx/photography_station_admin.git"
PROJECT_NAME="photography_station_admin"
BRANCH="master"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/$PROJECT_NAME"
DIST_TARGET="$SCRIPT_DIR/dist"

log_info "========== 开始部署 =========="
log_info "工作目录: $SCRIPT_DIR"
log_info "代码目录: $PROJECT_DIR"
log_info "dist 目标: $DIST_TARGET"

cd "$SCRIPT_DIR"

log_info "正在拉取代码..."

if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    if [ -d "uploads" ]; then
        log_info "备份 uploads 目录..."
        mv uploads "$SCRIPT_DIR/uploads_backup_$$"
    fi
    git fetch origin
    git reset --hard origin/$BRANCH
    git pull origin $BRANCH
    if [ -d "$SCRIPT_DIR/uploads_backup_$$" ]; then
        log_info "恢复 uploads 目录..."
        rm -rf uploads
        mv "$SCRIPT_DIR/uploads_backup_$$" uploads
    fi
else
    log_warn "未检测到仓库，正在克隆..."
    rm -rf "$PROJECT_DIR"
    git clone "$REPO_URL" "$PROJECT_NAME"
    cd "$PROJECT_DIR"
fi

log_info "代码拉取完成"

log_info "正在安装依赖..."
npm install

log_info "正在构建项目..."
npm run build

if [ -d "dist" ]; then
    log_info "正在移动 dist..."
    if [ -d "$DIST_TARGET" ]; then
        log_warn "删除旧的 dist 目录"
        rm -rf "$DIST_TARGET"
    fi
    mv dist "$SCRIPT_DIR/"
    if [ -d "$SCRIPT_DIR/$PROJECT_NAME/uploads" ]; then
        log_info "复制 uploads 到 dist..."
        cp -r "$SCRIPT_DIR/$PROJECT_NAME/uploads" "$DIST_TARGET/"
    fi
    log_info "========== 部署完成 =========="
    log_info "静态文件位置: $DIST_TARGET"
else
    log_error "构建失败，未找到 dist 目录"
    exit 1
fi
