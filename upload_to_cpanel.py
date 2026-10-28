#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Uploads the İçimizdeki Tamirci Link-in-Bio project to cPanel at shenapp.tr
Target directory: /public_html/icimizdekitamirci
"""

import os
import ftplib

FTP_HOST = "ftp.shenapp.tr"
FTP_USER = "akan-antigravity@shenapp.tr"
FTP_PASS = "H0mImD3Pohwm2dZ"
REMOTE_BASE = "/public_html/icimizdekitamirci"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

IGNORE = {
    ".git",
    ".github",
    ".DS_Store",
    "upload_to_cpanel.py",
    "screencapture-icimizdekitamirci-rabia-alga-php-2026-10-28-15_49_39.png",
    "Rabia Alga.html"
}

def ensure_directory(ftp, full_path):
    """
    Ensure the path exists and change into it.
    """
    parts = [p for p in full_path.strip("/").split("/") if p]
    ftp.cwd("/")
    for part in parts:
        try:
            ftp.cwd(part)
        except ftplib.error_perm:
            try:
                ftp.mkd(part)
                ftp.cwd(part)
            except ftplib.error_perm as e:
                # Might already exist or permission issue, attempt cwd again
                ftp.cwd(part)

def upload_all():
    print(f"🚀 {FTP_HOST} cPanel FTP sunucusuna bağlanılıyor...")
    ftp = ftplib.FTP(timeout=30)
    ftp.connect(FTP_HOST, 21)
    ftp.login(user=FTP_USER, passwd=FTP_PASS)
    ftp.set_pasv(True)
    print("✓ Bağlantı ve giriş başarılı!\n")

    # Clean up test.txt if exists
    try:
        ftp.cwd(REMOTE_BASE)
        try:
            ftp.delete("test.txt")
        except Exception:
            pass
    except Exception:
        pass

    total_files = 0
    uploaded_files = 0

    for root, dirs, files in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE and not d.startswith(".")]
        rel_root = os.path.relpath(root, BASE_DIR)
        
        if rel_root == ".":
            current_remote_dir = REMOTE_BASE
        else:
            current_remote_dir = f"{REMOTE_BASE}/{rel_root.replace(os.sep, '/')}"
        
        ensure_directory(ftp, current_remote_dir)

        for file in files:
            if file in IGNORE or file.endswith(".tmp") or file.startswith("."):
                # Exception: upload .htaccess
                if file != ".htaccess":
                    continue
            
            local_file_path = os.path.join(root, file)
            size_kb = os.path.getsize(local_file_path) / 1024
            total_files += 1
            
            rel_display = os.path.join(rel_root, file) if rel_root != "." else file
            print(f"⬆️  [{total_files}] {rel_display} ({size_kb:.1f} KB)...", end=" ", flush=True)

            try:
                with open(local_file_path, "rb") as f:
                    ftp.storbinary(f"STOR {file}", f)
                print("✓")
                uploaded_files += 1
            except Exception as e:
                print(f"❌ HATA: {e}")

    ftp.quit()
    print(f"\n🎉 İşlem tamamlandı! Toplam {uploaded_files}/{total_files} dosya yüklendi.")

if __name__ == "__main__":
    upload_all()
