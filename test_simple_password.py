from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # Bcrypt max is 72 BYTES (not characters)
    # Encode to bytes and truncate
    password_bytes = password.encode('utf-8')[:72]
    # Decode back to string (ignore errors for partial UTF-8 chars)
    password = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    # Bcrypt max is 72 BYTES (not characters)
    password_bytes = plain_password.encode('utf-8')[:72]
    plain_password = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)

# Test with "12345678"
test_password = "12345678"
print(f"Testing password: '{test_password}'")
print(f"Length: {len(test_password)} chars, {len(test_password.encode('utf-8'))} bytes")

try:
    hashed = hash_password(test_password)
    print(f"✓ Hashed successfully: {hashed[:60]}...")
    
    # Test verification
    if verify_password(test_password, hashed):
        print("✓ Password verification SUCCESSFUL!")
    else:
        print("✗ Password verification FAILED!")
        
except Exception as e:
    print(f"✗ ERROR: {e}")
