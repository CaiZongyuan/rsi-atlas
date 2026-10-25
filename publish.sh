#!/usr/bin/env bash
# 一键发布到 GitHub Pages。需要：gh（已登录）、git、网络。
# 用法：  bash publish.sh
set -euo pipefail

REPO_SLUG="${REPO_SLUG:-rsigym-deep-read}"      # 仓库名，可用环境变量覆盖
VISIBILITY="${VISIBILITY:-public}"               # Pages 需要 public（免费账号）

cd "$(dirname "$0")"

echo "▸ 检查 gh 登录状态"
gh auth status >/dev/null 2>&1 || { echo "✗ 未登录：请先运行 gh auth login"; exit 1; }
OWNER="$(gh api user --jq .login)"
FULL="$OWNER/$REPO_SLUG"
echo "  账号：$OWNER"

echo "▸ 检查本地仓库"
if [ ! -d .git ]; then
  git init -b main
  git add -A
  git commit -m "RSIGym 深读：论文 / 源码 / 18 条轨迹三方对照"
fi
git symbolic-ref --short HEAD | grep -qx main || git branch -M main

echo "▸ 创建远端仓库 $FULL（已存在则跳过）"
if gh repo view "$FULL" >/dev/null 2>&1; then
  echo "  已存在"
else
  gh repo create "$REPO_SLUG" "--$VISIBILITY" \
     --description "RSIGym 深读：论文 / 源码 / 18 条轨迹三方对照，含 13 条批判与交互式轨迹浏览器" \
     --source=. --remote=origin --push
fi

git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$FULL.git"
echo "▸ 推送"
git push -u origin main

echo "▸ 开启 GitHub Pages（main 分支根目录）"
gh api -X POST "repos/$FULL/pages" \
  -H "Accept: application/vnd.github+json" \
  -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || gh api -X PUT "repos/$FULL/pages" \
       -H "Accept: application/vnd.github+json" \
       -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || echo "  手动开启：Settings → Pages → Source: Deploy from a branch → main / (root)"

URL="https://$OWNER.github.io/$REPO_SLUG/"
echo
echo "✓ 完成"
echo "  仓库：https://github.com/$FULL"
echo "  页面：$URL   （首次构建约 30–90 秒）"
