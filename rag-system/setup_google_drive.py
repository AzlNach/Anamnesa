#!/usr/bin/env python3
"""
Google Drive API Setup Helper
Script untuk membantu setup credentials Google Drive API
"""

import os
import json
from pathlib import Path
import webbrowser

def check_credentials_file():
    """Check apakah file credentials.json sudah ada"""
    credentials_file = Path(__file__).parent / 'credentials.json'
    
    if credentials_file.exists():
        print("✅ File credentials.json sudah ada")
        
        # Validate the file
        try:
            with open(credentials_file, 'r') as f:
                creds_data = json.load(f)
            
            if 'installed' in creds_data or 'web' in creds_data:
                print("✅ Format file credentials.json valid")
                return True
            else:
                print("❌ Format file credentials.json tidak valid")
                return False
                
        except json.JSONDecodeError:
            print("❌ File credentials.json tidak bisa dibaca (invalid JSON)")
            return False
    else:
        print("❌ File credentials.json tidak ditemukan")
        return False

def setup_instructions():
    """Tampilkan instruksi setup Google Drive API"""
    print("\n🔧 INSTRUKSI SETUP GOOGLE DRIVE API")
    print("=" * 50)
    
    print("\n1. BUAT PROJECT DI GOOGLE CLOUD CONSOLE:")
    print("   - Kunjungi: https://console.cloud.google.com/")
    print("   - Klik 'New Project' atau pilih project yang sudah ada")
    print("   - Beri nama project (misal: 'Anamnesa RAG System')")
    
    print("\n2. ENABLE GOOGLE DRIVE API:")
    print("   - Pergi ke: APIs & Services > Library")
    print("   - Cari 'Google Drive API'")
    print("   - Klik 'Enable'")
    
    print("\n3. SETUP OAUTH CONSENT SCREEN:")
    print("   - Pergi ke: APIs & Services > OAuth consent screen")
    print("   - Pilih 'External' (untuk testing)")
    print("   - Isi form:")
    print("     * App name: 'Anamnesa RAG System'")
    print("     * User support email: email Anda")
    print("     * Developer contact: email Anda")
    print("   - Di tab 'Scopes', tambahkan:")
    print("     * https://www.googleapis.com/auth/drive.readonly")
    print("   - Di tab 'Test users', tambahkan email Anda")
    
    print("\n4. BUAT CREDENTIALS:")
    print("   - Pergi ke: APIs & Services > Credentials")
    print("   - Klik 'Create Credentials' > 'OAuth 2.0 Client IDs'")
    print("   - Application type: 'Desktop application'")
    print("   - Name: 'Anamnesa RAG Desktop Client'")
    print("   - Klik 'Create'")
    
    print("\n5. DOWNLOAD CREDENTIALS:")
    print("   - Klik icon download pada credentials yang baru dibuat")
    print("   - Rename file menjadi 'credentials.json'")
    print(f"   - Simpan file di: {Path(__file__).parent / 'credentials.json'}")
    
    print("\n6. VERIFIKASI:")
    print("   - Jalankan script ini lagi untuk verifikasi")

def open_google_cloud_console():
    """Buka Google Cloud Console di browser"""
    try:
        webbrowser.open('https://console.cloud.google.com/')
        print("🌐 Membuka Google Cloud Console di browser...")
    except Exception as e:
        print(f"❌ Tidak bisa membuka browser: {e}")
        print("Silakan buka manual: https://console.cloud.google.com/")

def main():
    """Main function"""
    print("🚀 Google Drive API Setup Helper")
    print("=" * 40)
    
    # Check if credentials file exists
    if check_credentials_file():
        print("\n🎉 Setup sudah lengkap! Anda bisa melanjutkan ke testing.")
        print("\nUntuk menjalankan test:")
        print("   python test_google_drive.py")
        return
    
    print("\n🔧 Setup diperlukan untuk Google Drive API")
    
    while True:
        print("\nPilihan:")
        print("1. Tampilkan instruksi setup lengkap")
        print("2. Buka Google Cloud Console")
        print("3. Check credentials file lagi")
        print("4. Keluar")
        
        choice = input("\nPilih (1-4): ").strip()
        
        if choice == '1':
            setup_instructions()
        elif choice == '2':
            open_google_cloud_console()
        elif choice == '3':
            if check_credentials_file():
                print("\n🎉 Setup berhasil! Anda bisa melanjutkan ke testing.")
                break
        elif choice == '4':
            print("👋 Sampai jumpa!")
            break
        else:
            print("❌ Pilihan tidak valid")

if __name__ == "__main__":
    main()
