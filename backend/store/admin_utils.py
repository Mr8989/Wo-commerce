import os
from pathlib import Path

def update_env_file(key, value):
    """Update .env file with new value"""
    env_path = Path(__file__).resolve().parent.parent / '.env'
    
    if not env_path.exists():
        return False
    
    # Read current .env
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    # Update or add the key
    key_found = False
    new_lines = []
    
    for line in lines:
        if line.startswith(f'{key}='):
            new_lines.append(f'{key}={value}\n')
            key_found = True
        else:
            new_lines.append(line)
    
    # If key not found, add it
    if not key_found:
        new_lines.append(f'{key}={value}\n')
    
    # Write back to .env
    with open(env_path, 'w') as f:
        f.writelines(new_lines)
    
    return True