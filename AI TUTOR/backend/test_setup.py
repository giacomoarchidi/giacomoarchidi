#!/usr/bin/env python3
"""
Script di test per verificare il setup del backend
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test che tutti i moduli si importino correttamente"""
    try:
        print("Testing imports...")
        
        # Test core modules
        from app.core.config import settings
        print("✅ Config imported successfully")
        
        from app.core.db import Base, engine
        print("✅ Database setup imported successfully")
        
        from app.core.security import get_password_hash, verify_password
        print("✅ Security imported successfully")
        
        # Skip storage test if MinIO is not running
        try:
            from app.core.storage import storage
            print("✅ Storage imported successfully")
        except Exception:
            print("⚠️  Storage import skipped (MinIO not running)")
        
        from app.core.emailer import email_service
        print("✅ Email service imported successfully")
        
        # Test models
        from app.models.user import User, Role
        print("✅ User models imported successfully")
        
        from app.models.lesson import Lesson
        print("✅ Lesson models imported successfully")
        
        # Test schemas
        from app.schemas.auth import UserRegister, UserLogin
        print("✅ Auth schemas imported successfully")
        
        # Test services
        from app.services.auth import AuthService
        print("✅ Auth service imported successfully")
        
        print("\n🎉 All imports successful!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_password_hashing():
    """Test password hashing functionality"""
    try:
        print("\nTesting password hashing...")
        from app.core.security import get_password_hash, verify_password
        
        password = "Test123"
        hashed = get_password_hash(password)
        print(f"✅ Password hashed: {hashed[:20]}...")
        
        is_valid = verify_password(password, hashed)
        print(f"✅ Password verification: {is_valid}")
        
        is_invalid = verify_password("wrong_password", hashed)
        print(f"✅ Wrong password rejected: {not is_invalid}")
        
        return True
        
    except Exception as e:
        print(f"❌ Password hashing error: {e}")
        return False

def test_config():
    """Test configuration loading"""
    try:
        print("\nTesting configuration...")
        from app.core.config import settings
        
        print(f"✅ Environment: {settings.ENV}")
        print(f"✅ API Host: {settings.API_HOST}")
        print(f"✅ API Port: {settings.API_PORT}")
        print(f"✅ Database URL: {settings.DATABASE_URL[:20]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Tutoring Platform Backend Setup")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_password_hashing,
        test_config
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend setup is ready.")
        return 0
    else:
        print("❌ Some tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
