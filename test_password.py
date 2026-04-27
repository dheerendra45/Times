from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test password truncation
password = "test" * 100  # Very long password
print(f"Original password: {len(password)} chars, {len(password.encode('utf-8'))} bytes")

# Truncate at byte level
password_bytes = password.encode('utf-8')[:72]
truncated = password_bytes.decode('utf-8', errors='ignore')
print(f"Truncated password: {len(truncated)} chars, {len(truncated.encode('utf-8'))} bytes")

# Try to hash it
try:
    hashed = pwd_context.hash(truncated)
    print("SUCCESS! Password hashed successfully")
    print(f"Hash: {hashed[:50]}...")
except Exception as e:
    print(f"ERROR: {e}")
