#!/bin/bash
# ============================================================
# Phase 0: Git History Secret Cleanup Script
# ============================================================
# 
# WARNING: This script REWRITES Git history!
# - All team members must re-clone after execution
# - Backup your repositories before running
#
# Prerequisites:
#   - Install BFG Repo Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
#   - Or install git-filter-repo: pip install git-filter-repo
#
# Usage:
#   1. Review this script carefully
#   2. Run in each repository root
#   3. Force push after verification
#   4. Notify all team members to re-clone
#
# ============================================================

set -e

echo "============================================================"
echo " Phase 0: Git History Secret Cleanup"
echo "============================================================"
echo ""
echo "⚠️  WARNING: This will REWRITE Git history!"
echo "⚠️  All team members must RE-CLONE after execution!"
echo ""
read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

REPO_NAME=$(basename "$(pwd)")
echo ""
echo "Processing repository: $REPO_NAME"
echo ""

# ============================================================
# Method 1: Using BFG Repo Cleaner (Recommended)
# ============================================================
# Download BFG: https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

echo "Step 1: Create backup..."
cp -r .git .git.backup

echo "Step 2: Define files to remove..."
cat > /tmp/secrets-to-remove.txt << 'EOF'
private.pem
cert.pem
jwt-keystore.p12
google_client_secret.json
.env
*.p12
*.pem
*.key
*.keystore
EOF

echo "Step 3: Remove secrets from history using BFG..."
# Uncomment the line below after installing BFG
# java -jar /path/to/bfg.jar --delete-files '{private.pem,cert.pem,jwt-keystore.p12,google_client_secret.json,.env}' .

echo "Step 4: Clean up and expire reflog..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Step 5: Verify cleanup..."
echo ""
echo "Running verification..."
FOUND=$(git log --all --diff-filter=A -- "*.pem" "*.p12" "*client_secret*" ".env" 2>/dev/null | wc -l)
if [ "$FOUND" -eq 0 ]; then
    echo "✅ Verification PASSED: No secret files found in Git history"
else
    echo "❌ Verification FAILED: $FOUND secret file references still exist"
    echo "   Please re-run the cleanup or use git-filter-repo"
fi

echo ""
echo "============================================================"
echo " Next Steps:"
echo "============================================================"
echo "1. Review the changes: git log --oneline -20"
echo "2. Force push: git push --force --all"
echo "3. Force push tags: git push --force --tags"
echo "4. Notify ALL team members to delete and re-clone!"
echo "5. Rotate ALL exposed credentials immediately!"
echo "============================================================"
